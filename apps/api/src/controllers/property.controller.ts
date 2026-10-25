import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../services/db.js';
import { convertToSqFt } from '@bhoomi/finance';

const createPropertySchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  propertyType: z.enum(['PLOT', 'FLAT', 'BUNGALOW', 'VILLA']),
  listingType: z.enum(['SALE', 'RENT']).default('SALE'),
  bhk: z.number().nullable().optional(),
  areaOriginal: z.number().positive('Area must be a positive number'),
  areaUnit: z.enum(['SQFT', 'SQM', 'ACRE', 'GUNTHA']).default('SQFT'),
  priceTotal: z.number().positive('Total price must be positive'),
  city: z.string().min(2),
  locality: z.string().min(2),
  address: z.string().min(5),
  latitude: z.number().default(21.1458), // Default around Nagpur
  longitude: z.number().default(79.0882),
  status: z.enum(['DRAFT', 'PUBLISHED']).default('PUBLISHED'),
  availability: z.enum(['IMMEDIATE', 'WITHIN_30_DAYS', 'UNDER_CONSTRUCTION']).default('IMMEDIATE'),
  furnishing: z.enum(['UNFURNISHED', 'SEMI_FURNISHED', 'FULLY_FURNISHED']).default('UNFURNISHED'),
  contactPhone: z.string().min(10),
  hidePhoneUntilLogin: z.boolean().default(true),
  hideSelectedImagesUntilLogin: z.boolean().default(false),
  notes: z.string().optional(),
  amenities: z.array(z.string()).default([]),
  media: z
    .array(
      z.object({
        url: z.string(),
        mediaType: z.enum(['IMAGE', 'VIDEO', 'FLOORPLAN']).default('IMAGE'),
        isLocked: z.boolean().default(false),
        displayOrder: z.number().default(0),
        caption: z.string().optional(),
      })
    )
    .default([]),
});

/**
 * Searches and lists properties with advanced filtering, sorting, and pagination
 */
export async function getProperties(req: Request, res: Response) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 12));
    const skip = (page - 1) * limit;

    const {
      search,
      propertyType,
      listingType,
      bhk,
      city,
      locality,
      minPrice,
      maxPrice,
      minArea,
      maxArea,
      listedBy, // BROKER | SELLER | BUILDER
      sortBy, // price_asc, price_desc, date_desc, area_asc, area_desc
    } = req.query;

    const where: any = {
      status: 'PUBLISHED',
      moderationStatus: 'APPROVED',
    };

    if (search && typeof search === 'string') {
      const term = search.trim();
      where.OR = [
        { title: { contains: term } },
        { description: { contains: term } },
        { locality: { contains: term } },
        { city: { contains: term } },
        { address: { contains: term } },
      ];
    }

    if (propertyType && typeof propertyType === 'string') {
      const types = propertyType.split(',').map((t) => t.trim().toUpperCase());
      where.propertyType = { in: types };
    }

    if (listingType && typeof listingType === 'string') {
      where.listingType = listingType.trim().toUpperCase();
    }

    if (bhk) {
      const bhkValues = (bhk as string).split(',').map((b) => parseFloat(b.trim()));
      where.bhk = { in: bhkValues };
    }

    if (city && typeof city === 'string') {
      where.city = { contains: city.trim() };
    }

    if (locality && typeof locality === 'string') {
      where.locality = { contains: locality.trim() };
    }

    if (minPrice || maxPrice) {
      where.priceTotal = {};
      if (minPrice) where.priceTotal.gte = parseFloat(minPrice as string);
      if (maxPrice) where.priceTotal.lte = parseFloat(maxPrice as string);
    }

    if (minArea || maxArea) {
      where.areaSqFt = {};
      if (minArea) where.areaSqFt.gte = parseFloat(minArea as string);
      if (maxArea) where.areaSqFt.lte = parseFloat(maxArea as string);
    }

    if (listedBy && typeof listedBy === 'string') {
      where.ownerRole = listedBy.trim().toUpperCase();
    }

    let orderBy: any = { createdAt: 'desc' };
    if (sortBy === 'price_asc') orderBy = { priceTotal: 'asc' };
    if (sortBy === 'price_desc') orderBy = { priceTotal: 'desc' };
    if (sortBy === 'area_asc') orderBy = { areaSqFt: 'asc' };
    if (sortBy === 'area_desc') orderBy = { areaSqFt: 'desc' };
    if (sortBy === 'views_desc') orderBy = { viewsCount: 'desc' };

    const [total, items] = await Promise.all([
      prisma.property.count({ where }),
      prisma.property.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          media: {
            orderBy: { displayOrder: 'asc' },
            take: 4,
          },
          owner: {
            select: { id: true, name: true, role: true },
          },
          amenities: { take: 5 },
        },
      }),
    ]);

    // Check if user is logged in
    const isLoggedIn = !!req.user;

    // Sanitize phone & locked media for guests
    const sanitizedItems = items.map((p) => {
      const shouldHidePhone = !isLoggedIn && p.hidePhoneUntilLogin;
      const media = p.media.map((m) => {
        if (!isLoggedIn && p.hideSelectedImagesUntilLogin && m.isLocked) {
          return {
            ...m,
            url: '/images/placeholders/locked-image-blur.svg',
            isMasked: true,
          };
        }
        return m;
      });

      return {
        ...p,
        contactPhone: shouldHidePhone ? 'Login to unlock contact' : p.contactPhone,
        media,
      };
    });

    return res.status(200).json({
      data: sanitizedItems,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching properties:', error);
    return res.status(500).json({ error: 'Failed to retrieve properties.' });
  }
}

/**
 * Gets full property details with gated contact and media
 */
export async function getPropertyById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        media: { orderBy: { displayOrder: 'asc' } },
        amenities: true,
        owner: {
          select: { id: true, name: true, role: true, email: true, mobile: true, avatarUrl: true },
        },
      },
    });

    if (!property) {
      return res.status(404).json({ error: 'Property not found.' });
    }

    // Increment view counter asynchronously
    prisma.property
      .update({
        where: { id },
        data: { viewsCount: { increment: 1 } },
      })
      .catch(() => {});

    const isLoggedIn = !!req.user;
    const shouldHidePhone = !isLoggedIn && property.hidePhoneUntilLogin;

    const media = property.media.map((m) => {
      if (!isLoggedIn && property.hideSelectedImagesUntilLogin && m.isLocked) {
        return {
          ...m,
          url: '/images/placeholders/locked-image-blur.svg',
          isMasked: true,
        };
      }
      return m;
    });

    return res.status(200).json({
      property: {
        ...property,
        contactPhone: shouldHidePhone ? 'Login to unlock contact' : property.contactPhone,
        isPhoneGated: shouldHidePhone,
        media,
      },
      isGuest: !isLoggedIn,
    });
  } catch (error: any) {
    console.error('Error fetching property by ID:', error);
    return res.status(500).json({ error: 'Failed to retrieve property details.' });
  }
}

/**
 * Creates a new property listing with unit conversions and automatic price per sq ft
 */
export async function createProperty(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    // Allowed roles: SELLER, BROKER, BUILDER, ADMIN
    if (!['SELLER', 'BROKER', 'BUILDER', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({
        error: 'Only registered Sellers, Brokers, or Builders can publish listings. Please switch to Seller role.',
      });
    }

    const parse = createPropertySchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.errors[0].message });
    }

    const data = parse.data;
    const areaSqFt = convertToSqFt(data.areaOriginal, data.areaUnit);
    const pricePerSqFt = areaSqFt > 0 ? Math.round(data.priceTotal / areaSqFt) : 0;

    const property = await prisma.property.create({
      data: {
        title: data.title,
        description: data.description,
        propertyType: data.propertyType,
        listingType: data.listingType,
        bhk: data.bhk,
        areaOriginal: data.areaOriginal,
        areaUnit: data.areaUnit,
        areaSqFt,
        priceTotal: data.priceTotal,
        pricePerSqFt,
        city: data.city,
        locality: data.locality,
        address: data.address,
        latitude: data.latitude,
        longitude: data.longitude,
        status: data.status,
        availability: data.availability,
        furnishing: data.furnishing,
        contactPhone: data.contactPhone,
        hidePhoneUntilLogin: data.hidePhoneUntilLogin,
        hideSelectedImagesUntilLogin: data.hideSelectedImagesUntilLogin,
        notes: data.notes,
        ownerId: req.user.id,
        ownerRole: req.user.role,
        amenities: {
          create: data.amenities.map((name) => ({ name })),
        },
        media: {
          create: data.media.map((m, idx) => ({
            url: m.url,
            mediaType: m.mediaType,
            isLocked: m.isLocked,
            displayOrder: m.displayOrder || idx,
            caption: m.caption,
          })),
        },
      },
      include: {
        media: true,
        amenities: true,
      },
    });

    return res.status(201).json({
      message: 'Property listing created successfully.',
      property,
    });
  } catch (error: any) {
    console.error('Error creating property:', error);
    return res.status(500).json({ error: 'Failed to create property listing.' });
  }
}

/**
 * Updates an existing property listing
 */
export async function updateProperty(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const { id } = req.params;
    const existing = await prisma.property.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({ error: 'Property not found.' });
    }

    if (existing.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'You are not authorized to edit this listing.' });
    }

    const parse = createPropertySchema.partial().safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.errors[0].message });
    }

    const data = parse.data;
    let areaSqFt = existing.areaSqFt;
    let pricePerSqFt = existing.pricePerSqFt;

    if (data.areaOriginal !== undefined || data.areaUnit !== undefined) {
      const original = data.areaOriginal ?? existing.areaOriginal;
      const unit = data.areaUnit ?? existing.areaUnit;
      areaSqFt = convertToSqFt(original, unit);
    }

    const priceTotal = data.priceTotal ?? existing.priceTotal;
    if (areaSqFt > 0) {
      pricePerSqFt = Math.round(priceTotal / areaSqFt);
    }

    const updated = await prisma.property.update({
      where: { id },
      data: {
        ...data,
        areaSqFt,
        pricePerSqFt,
        priceTotal,
        amenities: undefined,
        media: undefined,
      },
      include: {
        media: true,
        amenities: true,
      },
    });

    return res.status(200).json({
      message: 'Property updated successfully.',
      property: updated,
    });
  } catch (error: any) {
    console.error('Error updating property:', error);
    return res.status(500).json({ error: 'Failed to update property.' });
  }
}

/**
 * Deletes a property listing
 */
export async function deleteProperty(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const { id } = req.params;
    const existing = await prisma.property.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({ error: 'Property not found.' });
    }

    if (existing.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'You are not authorized to delete this listing.' });
    }

    await prisma.property.delete({ where: { id } });

    return res.status(200).json({ message: 'Property deleted successfully.' });
  } catch (error: any) {
    console.error('Error deleting property:', error);
    return res.status(500).json({ error: 'Failed to delete property.' });
  }
}

/**
 * Toggles a property in user's favorites
 */
export async function toggleFavorite(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const { id: propertyId } = req.params;

    const existingFav = await prisma.favorite.findUnique({
      where: {
        userId_propertyId: {
          userId: req.user.id,
          propertyId,
        },
      },
    });

    if (existingFav) {
      await prisma.favorite.delete({
        where: { id: existingFav.id },
      });
      return res.status(200).json({ favorited: false, message: 'Removed from favorites.' });
    }

    await prisma.favorite.create({
      data: {
        userId: req.user.id,
        propertyId,
      },
    });

    return res.status(200).json({ favorited: true, message: 'Added to favorites.' });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to toggle favorite.' });
  }
}

/**
 * Gets user's favorite properties
 */
export async function getFavorites(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const favorites = await prisma.favorite.findMany({
      where: { userId: req.user.id },
      include: {
        property: {
          include: {
            media: { take: 1 },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      favorites: favorites.map((f) => f.property),
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to retrieve favorites.' });
  }
}
