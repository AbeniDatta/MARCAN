import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

    // Find user's supplier profile
    const profile = await prisma.supplierProfile.findUnique({
      where: { email: String(userId).toLowerCase() },
    });

    if (!profile) {
      return NextResponse.json([]);
    }

    // Get user's listings
    const listings = await (prisma as any).storefrontListing.findMany({
      where: {
        profileId: profile.id,
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

    // Format the response
    const formattedListings = listings.map((listing: any) => {
      // Determine badge and icon based on listing type
      let badge = 'Available';
      let badgeColor = 'green';
      let icon = 'fa-box';

      if (listing.listingType === 'Equipment / Machinery') {
        icon = 'fa-dolly';
        badge = listing.condition === 'New' ? 'New' : 'Used';
        badgeColor = listing.condition === 'New' ? 'green' : 'blue';
      } else if (listing.listingType === 'Raw Materials') {
        icon = 'fa-shapes';
        badge = 'Surplus';
        badgeColor = 'blue';
      } else if (listing.listingType === 'Surplus Parts') {
        icon = 'fa-cog';
        badge = 'Surplus';
        badgeColor = 'blue';
      } else if (listing.listingType === 'Production Capacity') {
        icon = 'fa-industry';
        badge = 'Capacity';
        badgeColor = 'purple';
      }

      return {
        id: listing.id,
        title: listing.title,
        supplier: listing.supplierProfile.companyName,
        price: formatPrice(listing.price || '') || listing.price || '',
        badge: listing.badge || badge,
        badgeColor,
        icon: listing.imageUrl ? null : icon,
        listingType: listing.listingType || '',
        condition: listing.condition || '',
        location: listing.location || '',
        description: listing.description || '',
        imageUrl: listing.imageUrl,
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
