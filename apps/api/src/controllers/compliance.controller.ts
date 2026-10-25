import { Request, Response } from 'express';
import { prisma } from '../services/db.js';

export async function exportUserData(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const userId = req.user.id;

    const [user, properties, inquiries, deals, favorites, auditLogs] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, mobile: true, email: true, role: true, createdAt: true },
      }),
      prisma.property.findMany({
        where: { ownerId: userId },
        include: { media: true, amenities: true },
      }),
      prisma.inquiry.findMany({
        where: { buyerId: userId },
      }),
      prisma.deal.findMany({
        where: { OR: [{ buyerId: userId }, { sellerId: userId }, { brokerId: userId }] },
      }),
      prisma.favorite.findMany({
        where: { userId },
        include: { property: { select: { id: true, title: true } } },
      }),
      prisma.auditLog.findMany({
        where: { actorId: userId },
      }),
    ]);

    // Audit log this data export
    await prisma.auditLog.create({
      data: {
        actorId: userId,
        action: 'DPDP_DATA_EXPORT_REQUESTED',
        targetEntity: 'User',
        targetId: userId,
        ipAddress: req.ip || '',
        userAgent: req.headers['user-agent'] || '',
        details: JSON.stringify({ exportedAt: new Date().toISOString() }),
      },
    });

    return res.status(200).json({
      exportMetadata: {
        standard: 'Digital Personal Data Protection Act, 2023 (DPDPA)',
        exportedAt: new Date().toISOString(),
        subjectId: userId,
      },
      personalProfile: user,
      listedProperties: properties,
      submittedInquiries: inquiries,
      dealsPipelineRecords: deals,
      savedFavorites: favorites,
      systemAuditRecords: auditLogs,
    });
  } catch (error: any) {
    console.error('Data export error:', error);
    return res.status(500).json({ error: 'Failed to generate data export.' });
  }
}

export async function requestDataDeletion(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const userId = req.user.id;

    // Record deletion request in audit log for compliance records
    await prisma.auditLog.create({
      data: {
        actorId: userId,
        action: 'DPDP_DATA_ERASURE_REQUESTED',
        targetEntity: 'User',
        targetId: userId,
        ipAddress: req.ip || '',
        userAgent: req.headers['user-agent'] || '',
        details: JSON.stringify({
          reason: req.body?.reason || 'User self-service deletion request',
          requestedAt: new Date().toISOString(),
        }),
      },
    });

    return res.status(200).json({
      message:
        'Your data erasure request under the DPDP Act 2023 has been logged. Our Data Protection Officer will complete the review and purge eligible identifiers within 30 days as mandated by statutory guidelines.',
      ticketId: `DPDP-DEL-${Date.now()}`,
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to submit data erasure request.' });
  }
}
