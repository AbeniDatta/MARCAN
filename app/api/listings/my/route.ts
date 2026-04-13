import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { storefrontListingPresentation } from '@/lib/storefrontListingPresentation';

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

// GET user's own listings (authenticated)
export async function GET(request: NextRequest) {
  try {
    // Check if prisma is properly initialized
    if (
      !prisma ||
      typeof prisma.supplierProfile?.findUnique !== 'function' ||
      typeof (prisma as any).storefrontListing?.findMany !== 'function'
    ) {
      console.error('Prisma client not properly initialized');
      return NextResponse.json([]);
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Prefer supplier profile for legacy supplier listings
    const profile = await prisma.supplierProfile.findUnique({
      where: { email: String(userId).toLowerCase() },
    });

    // If no supplier profile, fallback to storefront profile listings
    const storefrontProfile = !profile
      ? await (prisma as any).storefrontProfile.findUnique({ where: { userId } })
      : null;

    if (!profile && !storefrontProfile) {
      return NextResponse.json([]);
    }

    const where = profile
      ? { profileId: profile.id }
      : { storefrontProfileId: storefrontProfile.id };

    // Get user's listings
    const listings = await (prisma as any).storefrontListing.findMany({
      where,
      include: {
        supplierProfile: {
          select: {
            companyName: true,
          },
        },
        storefrontProfile: {
          select: {
            companyName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Format the response
    const formattedListings = listings.map((listing: any) => {
      const { badge, badgeColor, icon } = storefrontListingPresentation(listing.listingType);

      return {
        id: listing.id,
        title: listing.title,
        supplier: listing.supplierProfile?.companyName || listing.storefrontProfile?.companyName || 'Unknown',
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
    console.error('Error fetching user listings:', error);
    return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 });
  }
}
