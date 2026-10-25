import { Request, Response } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { prisma } from '../services/db.js';
import { otpService } from '../services/otp.service.js';
import { generateTokens } from '../middleware/auth.middleware.js';
import { config } from '../config/env.js';

const requestOtpSchema = z.object({
  target: z.string().min(3).refine(
    (val) => {
      // Must be either a valid 10-digit mobile number (with optional +91) or valid email
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
      const isMobile = /^(\+91)?\d{10}$/.test(val.replace(/[\s-]/g, ''));
      return isEmail || isMobile;
    },
    { message: 'Target must be a valid 10-digit mobile number or email address' }
  ),
});

const verifyOtpSchema = z.object({
  target: z.string().min(3),
  code: z.string().length(6, 'OTP must be exactly 6 digits'),
});

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  mobile: z.string().regex(/^(\+91)?\d{10}$/, 'Valid 10-digit Indian mobile number required'),
  email: z.string().email('Valid email address required'),
  role: z.enum(['BUYER', 'SELLER', 'BROKER', 'BUILDER'], {
    errorMap: () => ({ message: 'Role must be BUYER, SELLER, BROKER, or BUILDER' }),
  }),
  consentToDpdp: z.literal(true, {
    errorMap: () => ({ message: 'You must provide consent under DPDP Act to register' }),
  }),
});

const switchRoleSchema = z.object({
  targetRole: z.enum(['BUYER', 'SELLER'], {
    errorMap: () => ({ message: 'Role switching is only allowed between BUYER and SELLER' }),
  }),
});

export async function sendOtp(req: Request, res: Response) {
  try {
    const parse = requestOtpSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.errors[0].message });
    }

    const cleanTarget = parse.data.target.replace(/[\s-]/g, '');
    const result = await otpService.requestOtp(cleanTarget);

    if (!result.success) {
      return res.status(429).json({ error: result.message, cooldownSeconds: result.cooldownSeconds });
    }

    return res.status(200).json({
      message: result.message,
      cooldownSeconds: result.cooldownSeconds,
      devOtp: result.devOtp, // available for testing convenience in dev
    });
  } catch (error: any) {
    console.error('Error sending OTP:', error);
    return res.status(500).json({ error: 'Failed to dispatch OTP. Please try again later.' });
  }
}

export async function verifyOtpAndLogin(req: Request, res: Response) {
  try {
    const parse = verifyOtpSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.errors[0].message });
    }

    const { target, code } = parse.data;
    const cleanTarget = target.replace(/[\s-]/g, '');

    const otpValidation = await otpService.verifyOtp(cleanTarget, code);
    if (!otpValidation.valid) {
      return res.status(400).json({ error: otpValidation.message });
    }

    // Find user by either mobile or email
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ mobile: cleanTarget }, { email: cleanTarget.toLowerCase() }],
      },
    });

    if (!user) {
      // User is verified by OTP but not yet registered; return verification token so frontend can redirect to complete registration
      return res.status(200).json({
        verified: true,
        isNewUser: true,
        target: cleanTarget,
        message: 'OTP verified. Please complete your registration details.',
      });
    }

    // Existing user: mark verified if needed and issue JWT tokens
    if (!user.isVerified) {
      await prisma.user.update({
        where: { id: user.id },
        data: { isVerified: true },
      });
    }

    const tokens = generateTokens(user);

    return res.status(200).json({
      verified: true,
      isNewUser: false,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
      },
      tokens,
    });
  } catch (error: any) {
    console.error('Error verifying OTP:', error);
    return res.status(500).json({ error: 'Internal error verifying OTP.' });
  }
}

export async function register(req: Request, res: Response) {
  try {
    const parse = registerSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.errors[0].message });
    }

    const { name, mobile, email, role } = parse.data;
    const cleanMobile = mobile.replace(/[\s-]/g, '');
    const cleanEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ mobile: cleanMobile }, { email: cleanEmail }],
      },
    });

    if (existing) {
      return res.status(409).json({
        error: 'A user with this mobile number or email address is already registered. Please log in.',
      });
    }

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        mobile: cleanMobile,
        email: cleanEmail,
        role,
        isVerified: true,
      },
    });

    // Create audit log for user consent and registration
    await prisma.auditLog.create({
      data: {
        actorId: newUser.id,
        action: 'USER_REGISTERED_WITH_DPDP_CONSENT',
        targetEntity: 'User',
        targetId: newUser.id,
        ipAddress: req.ip || '',
        userAgent: req.headers['user-agent'] || '',
        details: JSON.stringify({ role, registeredAt: new Date().toISOString() }),
      },
    });

    const tokens = generateTokens(newUser);

    return res.status(201).json({
      message: 'Registration successful.',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        mobile: newUser.mobile,
        role: newUser.role,
      },
      tokens,
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Failed to complete registration.' });
  }
}

export async function switchRole(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const parse = switchRoleSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.errors[0].message });
    }

    const { targetRole } = parse.data;
    const currentUser = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Role Rule Enforcement:
    // "Buyer and Seller are interchangeable: one account can switch between them anytime.
    // Broker/Dealer/Builder role is permanent once registered (cannot be switched)."
    if (['BROKER', 'BUILDER', 'ADMIN'].includes(currentUser.role)) {
      return res.status(403).json({
        error: `Accounts registered as ${currentUser.role} are permanent commercial accounts and cannot switch roles.`,
      });
    }

    if (currentUser.role === targetRole) {
      return res.status(200).json({
        message: `Already in ${targetRole} mode.`,
        user: currentUser,
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: currentUser.id },
      data: { role: targetRole },
    });

    // Log the switch
    await prisma.auditLog.create({
      data: {
        actorId: updatedUser.id,
        action: 'ROLE_SWITCH',
        targetEntity: 'User',
        targetId: updatedUser.id,
        ipAddress: req.ip || '',
        userAgent: req.headers['user-agent'] || '',
        details: JSON.stringify({ previousRole: currentUser.role, newRole: targetRole }),
      },
    });

    const tokens = generateTokens(updatedUser);

    return res.status(200).json({
      message: `Role switched successfully to ${targetRole}.`,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        mobile: updatedUser.mobile,
        role: updatedUser.role,
      },
      tokens,
    });
  } catch (error: any) {
    console.error('Role switch error:', error);
    return res.status(500).json({ error: 'Failed to switch role.' });
  }
}

export async function refreshToken(req: Request, res: Response) {
  try {
    const { refreshToken: incomingToken } = req.body;
    if (!incomingToken) {
      return res.status(400).json({ error: 'Refresh token is required.' });
    }

    const decoded = jwt.verify(incomingToken, config.jwtRefreshSecret) as { id: string };
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });

    if (!user) {
      return res.status(401).json({ error: 'Invalid refresh token.' });
    }

    const tokens = generateTokens(user);
    return res.status(200).json({ tokens });
  } catch (error: any) {
    return res.status(401).json({ error: 'Invalid or expired refresh token.' });
  }
}

export async function getMe(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        role: true,
        isVerified: true,
        createdAt: true,
      },
    });

    return res.status(200).json({ user });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch user profile.' });
  }
}
