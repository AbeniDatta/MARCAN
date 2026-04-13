import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { storefrontListingPresentation } from '@/lib/storefrontListingPresentation';
import { scheduleStorefrontListingEnrichment } from '@/services/ai-enrichment';

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic';

function formatPrice(rawPrice: string) {
  const numeric = String(rawPrice ?? '').replace(/[^0-9.]/g, '');
  const parsed = Number.parseFloat(numeric);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  const normalized = Number.isInteger(parsed) ? parsed.toString() : parsed.toFixed(2);
  return `$${normalized}`;
}

// GET all listings (public)
export async function GET() {
  try {
    // Check if prisma is properly initialized
    if (!prisma || typeof (prisma as any).storefrontListing?.findMany !== 'function') {
      console.error('Prisma client not properly initialized');
      return NextResponse.json([]);
    }

    const listings = await (prisma as any).storefrontListing.findMany({
      where: {
        active: true,
      },
      include: {
        supplierProfile: {
          select: {
            companyName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Format the response to match the frontend expectations
    const formattedListings = listings.map((listing: any) => {
      const { badge, badgeColor, icon } = storefrontListingPresentation(listing.listingType);

      return {
        id: listing.id,
        profileId: listing.profileId,
        storefrontProfileId: listing.storefrontProfileId || null,
        title: listing.title,
        supplier: listing.supplierProfile?.companyName || 'Unknown',
        price: formatPrice(listing.price || '') || listing.price || '',
        badge,
        badgeColor,
        icon,
        listingType: listing.listingType || '',
        location: listing.location || '',
        description: listing.description || '',
        createdAt: listing.createdAt.toISOString(),
        timestamp: listing.createdAt.getTime(),
        active: listing.active,
      };
    });

    return NextResponse.json(formattedListings);
  } catch (error: any) {
    console.error('Error fetching listings:', error);
    return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 });
  }
}

// POST create new listing (authenticated)
export async function POST(request: NextRequest) {
  try {
    // Check if prisma is properly initialized
    if (
      !prisma ||
      typeof prisma.supplierProfile?.findUnique !== 'function' ||
      typeof (prisma as any).storefrontListing?.create !== 'function'
    ) {
      console.error('Prisma client not properly initialized');
      return NextResponse.json({ error: 'Database connection not available' }, { status: 503 });
    }

    const body = await request.json();
    const { itemName, listingType, price, location, description, userId } = body;
    if (!itemName || !listingType || !price || !location || !description || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const formattedPrice = formatPrice(price);
    if (!formattedPrice) {
      return NextResponse.json({ error: 'Price must be a valid numeric value' }, { status: 400 });
    }

    // Enforce: only suppliers can create supplier listings
    // (We use presence of a supplier profile as the source of truth.)
    const profile = await prisma.supplierProfile.findUnique({
      where: { email: String(userId).toLowerCase() },
    });

    if (!profile) {
      return NextResponse.json(
        { error: 'Only supplier accounts can create supplier listings. Please complete your supplier profile first.' },
        { status: 403 }
      );
    }

    // Create the listing
    const listing = await (prisma as any).storefrontListing.create({
      data: {
        profileId: profile.id,
        title: itemName,
        listingType,
        price: formattedPrice,
        location,
        description,
        active: true,
      },
      include: {
        supplierProfile: {
          select: {
            companyName: true,
          },
        },
      },
    });

    scheduleStorefrontListingEnrichment(listing.id);

    const { badge, badgeColor, icon } = storefrontListingPresentation(listing.listingType);

    const formattedListing = {
      id: listing.id,
      profileId: listing.profileId,
      storefrontProfileId: listing.storefrontProfileId || null,
      title: listing.title,
      supplier: listing.supplierProfile?.companyName || 'Unknown',
      price: formatPrice(listing.price || '') || listing.price || '',
      badge,
      badgeColor,
      icon,
      listingType: listing.listingType || '',
      location: listing.location || '',
      description: listing.description || '',
      createdAt: listing.createdAt.toISOString(),
      timestamp: listing.createdAt.getTime(),
      active: listing.active,
    };

    return NextResponse.json(formattedListing, { status: 201 });
  } catch (error: any) {
    console.error('Error creating listing:', error);
    return NextResponse.json({ error: 'Failed to create listing' }, { status: 500 });
  }
}
