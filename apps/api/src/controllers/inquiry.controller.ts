import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../services/db.js';

const createInquirySchema = z.object({
  propertyId: z.string().uuid(),
  name: z.string().min(2),
  mobile: z.string().regex(/^(\+91)?\d{10}$/, 'Valid 10-digit mobile number required'),
  email: z.string().email(),
  message: z.string().min(5, 'Message must be at least 5 characters'),
  consentToDpdp: z.literal(true, {
    errorMap: () => ({ message: 'You must provide consent under DPDP Act to submit an inquiry' }),
  }),
});

export async function createInquiry(req: Request, res: Response) {
  try {
    const parse = createInquirySchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.errors[0].message });
    }

    const { propertyId, name, mobile, email, message } = parse.data;

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: { owner: true },
    });

    if (!property) {
      return res.status(404).json({ error: 'Property not found.' });
    }

    const inquiry = await prisma.inquiry.create({
      data: {
        propertyId,
        buyerId: req.user?.id || null,
        name: name.trim(),
        mobile: mobile.replace(/[\s-]/g, ''),
        email: email.trim().toLowerCase(),
        message: message.trim(),
        status: 'PENDING',
      },
    });

    // Increment inquiry counter
    await prisma.property.update({
      where: { id: propertyId },
      data: { inquiriesCount: { increment: 1 } },
    });

    // Automatically initialize a Deal pipeline entry in INQUIRY stage
    let buyerId = req.user?.id;
    if (!buyerId) {
      // Find or create lead user record
      let leadUser = await prisma.user.findFirst({
        where: { OR: [{ mobile }, { email }] },
      });
      if (!leadUser) {
        leadUser = await prisma.user.create({
          data: {
            name,
            mobile,
            email,
            role: 'BUYER',
          },
        });
      }
      buyerId = leadUser.id;
    }

    await prisma.deal.create({
      data: {
        propertyId,
        buyerId,
        sellerId: property.ownerId,
        brokerId: property.ownerRole === 'BROKER' ? property.ownerId : null,
        stage: 'INQUIRY',
        notes: `Inquiry submitted: "${message}"`,
      },
    });

    return res.status(201).json({
      message: 'Callback request received. The seller/broker will reach out to you shortly.',
      inquiry,
    });
  } catch (error: any) {
    console.error('Error creating inquiry:', error);
    return res.status(500).json({ error: 'Failed to submit inquiry.' });
  }
}

export async function getInquiries(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const isAgent = ['ADMIN', 'BROKER'].includes(req.user.role);

    // If agent/admin: see inquiries for properties they manage or all if admin
    // If seller: see inquiries for their properties
    // If buyer: see inquiries they made
    let where: any = {};
    if (req.user.role === 'ADMIN') {
      where = {};
    } else if (req.user.role === 'SELLER' || req.user.role === 'BROKER' || req.user.role === 'BUILDER') {
      where = { property: { ownerId: req.user.id } };
    } else {
      where = { buyerId: req.user.id };
    }

    const inquiries = await prisma.inquiry.findMany({
      where,
      include: {
        property: {
          select: { id: true, title: true, priceTotal: true, city: true, locality: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({ inquiries });
  } catch (error: any) {
    console.error('Error retrieving inquiries:', error);
    return res.status(500).json({ error: 'Failed to retrieve inquiries.' });
  }
}

export async function updateInquiryStatus(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!['PENDING', 'CONTACTED', 'CLOSED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value.' });
    }

    const inquiry = await prisma.inquiry.update({
      where: { id },
      data: { status },
    });

    return res.status(200).json({ message: 'Inquiry status updated.', inquiry });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to update inquiry status.' });
  }
}
