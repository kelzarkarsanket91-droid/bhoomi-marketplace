import crypto from 'crypto';
import { prisma } from './db.js';
import { hashOtpCode, verifyOtpCode } from './crypto.service.js';
import { config } from '../config/env.js';

export interface OtpSendResult {
  success: boolean;
  message: string;
  cooldownSeconds: number;
  devOtp?: string; // only present in dev/console mode for testing convenience
}

export interface OtpProvider {
  name: string;
  send(target: string, code: string, type: 'SMS' | 'EMAIL'): Promise<{ success: boolean; id?: string }>;
}

export class ConsoleDevOtpProvider implements OtpProvider {
  name = 'Console/Dev Provider';
  async send(target: string, code: string, type: 'SMS' | 'EMAIL'): Promise<{ success: boolean; id?: string }> {
    // In production we never log raw OTPs or full PII, but in dev console we show masked target
    const masked = target.includes('@')
      ? target.replace(/^(.)(.*)(@.*)$/, (_, a, b, c) => `${a}${'*'.repeat(b.length)}${c}`)
      : target.replace(/(\d{2})\d+(\d{2})/, '$1******$2');
    
    if (config.env === 'development' || config.env === 'test') {
      console.log(`[DEV OTP PROVIDER] [${type}] To: ${masked} | Code: [${code}] (Valid for 60s)`);
    }
    return { success: true, id: `dev-${Date.now()}` };
  }
}

export class TwilioOtpProvider implements OtpProvider {
  name = 'Twilio SMS Provider';
  async send(target: string, code: string): Promise<{ success: boolean; id?: string }> {
    // Stub implementation for Twilio REST API
    return { success: true, id: `tw-${Date.now()}` };
  }
}

export class Msg91OtpProvider implements OtpProvider {
  name = 'MSG91 Indian SMS Provider';
  async send(target: string, code: string): Promise<{ success: boolean; id?: string }> {
    // Stub implementation for MSG91 DLT compliant flow
    return { success: true, id: `msg91-${Date.now()}` };
  }
}

export class SmtpEmailOtpProvider implements OtpProvider {
  name = 'SMTP Email Provider';
  async send(target: string, code: string): Promise<{ success: boolean; id?: string }> {
    // Stub implementation for SMTP Email
    return { success: true, id: `smtp-${Date.now()}` };
  }
}

export class OtpService {
  private provider: OtpProvider;

  constructor() {
    switch (config.otpProvider.toLowerCase()) {
      case 'twilio':
        this.provider = new TwilioOtpProvider();
        break;
      case 'msg91':
        this.provider = new Msg91OtpProvider();
        break;
      case 'smtp':
        this.provider = new SmtpEmailOtpProvider();
        break;
      default:
        this.provider = new ConsoleDevOtpProvider();
    }
  }

  /**
   * Generates a secure 6-digit numerical OTP.
   */
  private generateSixDigitCode(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * Sends or resends an OTP with cooldown and rate-limit verification.
   */
  async requestOtp(target: string): Promise<OtpSendResult> {
    const cleanTarget = target.trim().toLowerCase();

    // Check for active token to enforce 60-second cooldown on resends
    const existing = await prisma.otpToken.findFirst({
      where: {
        target: cleanTarget,
        verifiedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();
    if (existing) {
      const elapsedSeconds = (now.getTime() - existing.createdAt.getTime()) / 1000;
      if (elapsedSeconds < config.otpExpirySeconds) {
        const remainingCooldown = Math.ceil(config.otpExpirySeconds - elapsedSeconds);
        return {
          success: false,
          message: `Please wait ${remainingCooldown} seconds before requesting a new OTP.`,
          cooldownSeconds: remainingCooldown,
        };
      }
    }

    const code = this.generateSixDigitCode();
    const codeHash = hashOtpCode(code);
    const expiresAt = new Date(now.getTime() + config.otpExpirySeconds * 1000);

    // Save token in DB
    await prisma.otpToken.create({
      data: {
        target: cleanTarget,
        codeHash,
        attempts: 0,
        expiresAt,
      },
    });

    const isEmail = cleanTarget.includes('@');
    await this.provider.send(cleanTarget, code, isEmail ? 'EMAIL' : 'SMS');

    return {
      success: true,
      message: `OTP sent successfully to ${isEmail ? 'email' : 'mobile number'}.`,
      cooldownSeconds: config.otpExpirySeconds,
      devOtp: config.env !== 'production' ? code : undefined,
    };
  }

  /**
   * Verifies an OTP against DB hash, enforces 60s expiration and 3 max attempts.
   */
  async verifyOtp(target: string, code: string): Promise<{ valid: boolean; message: string }> {
    const cleanTarget = target.trim().toLowerCase();

    const tokenRecord = await prisma.otpToken.findFirst({
      where: {
        target: cleanTarget,
        verifiedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!tokenRecord) {
      return { valid: false, message: 'No active OTP found. Please request a new one.' };
    }

    const now = new Date();

    // Check expiry (60 seconds)
    if (now > tokenRecord.expiresAt) {
      return { valid: false, message: 'OTP has expired. Please request a fresh OTP.' };
    }

    // Check max attempts (3 attempts)
    if (tokenRecord.attempts >= config.otpMaxAttempts) {
      return { valid: false, message: 'Maximum verification attempts exceeded. Please request a new OTP.' };
    }

    // Verify hash
    const isValid = verifyOtpCode(code, tokenRecord.codeHash);

    if (!isValid) {
      const updatedAttempts = tokenRecord.attempts + 1;
      await prisma.otpToken.update({
        where: { id: tokenRecord.id },
        data: { attempts: updatedAttempts },
      });

      const remainingAttempts = Math.max(0, config.otpMaxAttempts - updatedAttempts);
      return {
        valid: false,
        message:
          remainingAttempts > 0
            ? `Invalid OTP. ${remainingAttempts} attempt(s) remaining.`
            : 'Maximum attempts exceeded. This OTP is now locked.',
      };
    }

    // Mark as verified
    await prisma.otpToken.update({
      where: { id: tokenRecord.id },
      data: { verifiedAt: now },
    });

    return { valid: true, message: 'OTP verified successfully.' };
  }
}

export const otpService = new OtpService();
