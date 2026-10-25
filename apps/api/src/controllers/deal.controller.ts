import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../services/db.js';
import { encryptData, decryptData, maskAadhaar, maskPan } from '../services/crypto.service.js';

const updateDealStageSchema = z.object({
  stage: z.enum(['INQUIRY', 'NEGOTIATION', 'AGREEMENT', 'CLOSED', 'CANCELLED']),
  agreedPrice: z.number().positive().optional(),
  notes: z.string().optional(),
});

const submitKycSchema = z.object({
  dealId: z.string().uuid(),
  aadhaarNumber: z.string().regex(/^\d{12}$/, 'Aadhaar must be exactly 12 numerical digits'),
  panNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'PAN must be valid 10-character Indian alphanumeric format (e.g. ABCDE1234F)'),
});

/**
 * Gets all deals in the pipeline
 */
export async function getDeals(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const { stage } = req.query;
    let where: any = {};

    if (req.user.role === 'ADMIN') {
      where = {};
    } else if (req.user.role === 'BROKER') {
      where = {
        OR: [{ brokerId: req.user.id }, { sellerId: req.user.id }],
      };
    } else if (req.user.role === 'SELLER') {
      where = { sellerId: req.user.id };
    } else {
      where = { buyerId: req.user.id };
    }

    if (stage && typeof stage === 'string') {
      where.stage = stage.toUpperCase();
    }

    const deals = await prisma.deal.findMany({
      where,
      include: {
        property: {
          select: { id: true, title: true, priceTotal: true, city: true, locality: true, propertyType: true },
        },
        buyer: {
          select: { id: true, name: true, mobile: true, email: true },
        },
        seller: {
          select: { id: true, name: true, mobile: true, email: true },
        },
        broker: {
          select: { id: true, name: true, mobile: true },
        },
        kycDocuments: {
          select: { id: true, docType: true, maskedNumber: true, createdAt: true, verifiedAt: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return res.status(200).json({ deals });
  } catch (error: any) {
    console.error('Error fetching deals:', error);
    return res.status(500).json({ error: 'Failed to retrieve deals.' });
  }
}

/**
 * Updates deal pipeline stage (e.g. advance to NEGOTIATION, AGREEMENT, CLOSED)
 */
export async function updateDealStage(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const { id } = req.params;
    const parse = updateDealStageSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.errors[0].message });
    }

    const { stage, agreedPrice, notes } = parse.data;

    const existingDeal = await prisma.deal.findUnique({
      where: { id },
      include: { property: true },
    });

    if (!existingDeal) {
      return res.status(404).json({ error: 'Deal not found.' });
    }

    // Check authorization: only admin, broker, or seller can advance deal stage
    const isAuthorized =
      req.user.role === 'ADMIN' ||
      existingDeal.brokerId === req.user.id ||
      existingDeal.sellerId === req.user.id;

    if (!isAuthorized) {
      return res.status(403).json({ error: 'You are not authorized to update this deal stage.' });
    }

    const updateData: any = {
      stage,
      notes: notes !== undefined ? notes : existingDeal.notes,
    };

    if (agreedPrice) {
      updateData.agreedPrice = agreedPrice;
    }

    if (stage === 'CLOSED') {
      updateData.closedAt = new Date();
      // Mark property as SOLD
      await prisma.property.update({
        where: { id: existingDeal.propertyId },
        data: { status: 'SOLD' },
      });
    }

    const updatedDeal = await prisma.deal.update({
      where: { id },
      data: updateData,
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: req.user.id,
        action: `DEAL_STAGE_CHANGE_${stage}`,
        targetEntity: 'Deal',
        targetId: id,
        ipAddress: req.ip || '',
        userAgent: req.headers['user-agent'] || '',
        details: JSON.stringify({ previousStage: existingDeal.stage, newStage: stage, agreedPrice }),
      },
    });

    return res.status(200).json({
      message: `Deal stage updated to ${stage}.`,
      deal: updatedDeal,
      requiresKyc: stage === 'CLOSED',
    });
  } catch (error: any) {
    console.error('Error updating deal stage:', error);
    return res.status(500).json({ error: 'Failed to update deal stage.' });
  }
}

/**
 * Submits Aadhaar and PAN documents for a closed deal.
 * Encrypts with AES-256-GCM and stores masked strings for UI.
 */
export async function submitKycForDeal(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const parse = submitKycSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.errors[0].message });
    }

    const { dealId, aadhaarNumber, panNumber } = parse.data;

    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
    });

    if (!deal) {
      return res.status(404).json({ error: 'Deal record not found.' });
    }

    // Only closed or agreement-stage deals accept KYC
    if (!['CLOSED', 'AGREEMENT'].includes(deal.stage)) {
      return res.status(400).json({
        error: 'KYC documents can only be collected once a deal has reached Agreement or Closed stage.',
      });
    }

    // Encrypt with AES-256-GCM
    const encryptedAadhaar = encryptData(aadhaarNumber);
    const maskedAadhaarStr = maskAadhaar(aadhaarNumber);

    const encryptedPan = encryptData(panNumber);
    const maskedPanStr = maskPan(panNumber);

    // Save Aadhaar
    const kycAadhaar = await prisma.kycDocument.create({
      data: {
        dealId,
        userId: req.user.id,
        docType: 'AADHAAR',
        encryptedDocNumber: encryptedAadhaar,
        maskedNumber: maskedAadhaarStr,
      },
    });

    // Save PAN
    const kycPan = await prisma.kycDocument.create({
      data: {
        dealId,
        userId: req.user.id,
        docType: 'PAN',
        encryptedDocNumber: encryptedPan,
        maskedNumber: maskedPanStr,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: req.user.id,
        action: 'KYC_DOCUMENTS_SUBMITTED_ENCRYPTED',
        targetEntity: 'Deal',
        targetId: dealId,
        ipAddress: req.ip || '',
        userAgent: req.headers['user-agent'] || '',
        details: JSON.stringify({
          docTypes: ['AADHAAR', 'PAN'],
          maskedAadhaar: maskedAadhaarStr,
          maskedPan: maskedPanStr,
        }),
      },
    });

    return res.status(201).json({
      message: 'KYC documents securely encrypted and submitted for verification.',
      documents: [
        { id: kycAadhaar.id, docType: 'AADHAAR', maskedNumber: maskedAadhaarStr },
        { id: kycPan.id, docType: 'PAN', maskedNumber: maskedPanStr },
      ],
    });
  } catch (error: any) {
    console.error('Error submitting KYC:', error);
    return res.status(500).json({ error: 'Failed to submit KYC documents.' });
  }
}

/**
 * Accesses and decrypts KYC document - strictly restricted to ADMIN/OWNER with mandatory audit log.
 */
export async function viewDecryptedKyc(req: Request, res: Response) {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access restricted strictly to compliance administrators and business owners.' });
    }

    const { documentId } = req.params;

    const doc = await prisma.kycDocument.findUnique({
      where: { id: documentId },
      include: {
        user: { select: { id: true, name: true, mobile: true, email: true } },
        deal: { select: { id: true, stage: true, agreedPrice: true } },
      },
    });

    if (!doc) {
      return res.status(404).json({ error: 'KYC document not found.' });
    }

    // Decrypt the number
    const decryptedNumber = decryptData(doc.encryptedDocNumber);

    // Mandatory Audit Log entry for access
    await prisma.auditLog.create({
      data: {
        actorId: req.user.id,
        action: 'DECRYPTED_KYC_ACCESSED',
        targetEntity: 'KycDocument',
        targetId: documentId,
        ipAddress: req.ip || '',
        userAgent: req.headers['user-agent'] || '',
        details: JSON.stringify({
          docType: doc.docType,
          subjectUserId: doc.userId,
          dealId: doc.dealId,
          timestamp: new Date().toISOString(),
        }),
      },
    });

    return res.status(200).json({
      id: doc.id,
      docType: doc.docType,
      maskedNumber: doc.maskedNumber,
      decryptedNumber, // only sent to verified admin after logging
      user: doc.user,
      deal: doc.deal,
      createdAt: doc.createdAt,
    });
  } catch (error: any) {
    console.error('Error viewing decrypted KYC:', error);
    return res.status(500).json({ error: 'Failed to decrypt KYC document.' });
  }
}
