import { Request, Response } from 'express';
import { prisma } from '../services/db.js';

export async function getDashboardOverview(req: Request, res: Response) {
  try {
    if (!req.user || !['ADMIN', 'BROKER'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Administrator or Broker role required.' });
    }

    const [
      totalProperties,
      totalUsers,
      totalInquiries,
      totalDeals,
      activeDeals,
      closedDeals,
      recentInquiries,
      recentDeals,
    ] = await Promise.all([
      prisma.property.count(),
      prisma.user.count(),
      prisma.inquiry.count(),
      prisma.deal.count(),
      prisma.deal.count({ where: { stage: { in: ['INQUIRY', 'NEGOTIATION', 'AGREEMENT'] } } }),
      prisma.deal.count({ where: { stage: 'CLOSED' } }),
      prisma.inquiry.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { property: { select: { title: true, priceTotal: true } } },
      }),
      prisma.deal.findMany({
        take: 5,
        orderBy: { updatedAt: 'desc' },
        include: {
          property: { select: { title: true } },
          buyer: { select: { name: true, mobile: true } },
          seller: { select: { name: true, mobile: true } },
        },
      }),
    ]);

    // Conversion rate: closed deals / total inquiries
    const conversionRate = totalInquiries > 0 ? Number(((closedDeals / totalInquiries) * 100).toFixed(1)) : 0;

    return res.status(200).json({
      metrics: {
        totalProperties,
        totalUsers,
        totalInquiries,
        totalDeals,
        activeDeals,
        closedDeals,
        conversionRate,
      },
      recentInquiries,
      recentDeals,
    });
  } catch (error: any) {
    console.error('Dashboard overview error:', error);
    return res.status(500).json({ error: 'Failed to retrieve dashboard overview.' });
  }
}

export async function getContactsDirectory(req: Request, res: Response) {
  try {
    if (!req.user || !['ADMIN', 'BROKER'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Administrator or Broker role required.' });
    }

    const { role, search } = req.query;
    let where: any = {};

    if (role && typeof role === 'string') {
      where.role = role.toUpperCase();
    }

    if (search && typeof search === 'string') {
      const term = search.trim();
      where.OR = [
        { name: { contains: term } },
        { email: { contains: term } },
        { mobile: { contains: term } },
      ];
    }

    const contacts = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        mobile: true,
        email: true,
        role: true,
        isVerified: true,
        createdAt: true,
        _count: {
          select: {
            properties: true,
            inquiries: true,
            buyerDeals: true,
            sellerDeals: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({ contacts });
  } catch (error: any) {
    console.error('Error fetching contacts:', error);
    return res.status(500).json({ error: 'Failed to retrieve contacts directory.' });
  }
}

export async function exportContactsCsv(req: Request, res: Response) {
  try {
    if (!req.user || !['ADMIN', 'BROKER'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Administrator role required for data export.' });
    }

    const contacts = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        role: true,
        mobile: true,
        email: true,
        isVerified: true,
        createdAt: true,
      },
    });

    // Generate CSV string with headers
    const headers = ['User ID', 'Full Name', 'Account Role', 'Mobile Number', 'Email Address', 'Verified Status', 'Registration Date'];
    const rows = contacts.map((u) => [
      `"${u.id}"`,
      `"${u.name.replace(/"/g, '""')}"`,
      `"${u.role}"`,
      `"${u.mobile}"`,
      `"${u.email}"`,
      `"${u.isVerified ? 'VERIFIED' : 'PENDING'}"`,
      `"${u.createdAt.toISOString()}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    // Audit log this export
    await prisma.auditLog.create({
      data: {
        actorId: req.user.id,
        action: 'CONTACTS_DIRECTORY_CSV_EXPORTED',
        targetEntity: 'User',
        ipAddress: req.ip || '',
        userAgent: req.headers['user-agent'] || '',
        details: JSON.stringify({ recordCount: contacts.length }),
      },
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="bhoomi-contacts-${Date.now()}.csv"`);
    return res.status(200).send(csvContent);
  } catch (error: any) {
    console.error('CSV export error:', error);
    return res.status(500).json({ error: 'Failed to export CSV.' });
  }
}
