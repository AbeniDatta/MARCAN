import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET all listings (public)
export async function GET() {
  try {
    const listings = await prisma.listing.findMany({
      where: {
        active: true,
      },
      include: {
        profile: {
          select: {
            companyName: true,
            logoUrl: true,
            selectedIcon: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Format the response to match the frontend expectations
    const formattedListings = listings.map((listing) => {
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
        seller: listing.profile.companyName,
        price: listing.price || '',
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
    console.error('Error fetching listings:', error);
    return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 });
  }
}

// POST create new listing (authenticated)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { itemName, listingType, condition, price, location, description, userId } = body;

    if (!itemName || !listingType || !condition || !price || !location || !description || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Find profile for the user (must be a seller)
    const profile = await prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found. Please complete your seller profile first.' }, { status: 404 });
    }

    // Create the listing
    const listing = await prisma.listing.create({
      data: {
        profileId: profile.id,
        title: itemName,
        listingType,
        condition,
        price,
        location,
        description,
        category: listingType,
        active: true,
      },
      include: {
        profile: {
          select: {
            companyName: true,
            logoUrl: true,
            selectedIcon: true,
          },
        },
      },
    });

    // Determine badge and icon
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

    // Format the response
    const formattedListing = {
      id: listing.id,
      title: listing.title,
      seller: listing.profile.companyName,
      price: listing.price || '',
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

    return NextResponse.json(formattedListing, { status: 201 });
  } catch (error: any) {
    console.error('Error creating listing:', error);
    return NextResponse.json({ error: 'Failed to create listing' }, { status: 500 });
  }
}
