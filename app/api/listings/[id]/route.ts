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

// PUT update listing (authenticated, owner only)
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (
      !prisma ||
      typeof (prisma as any).storefrontListing?.findUnique !== 'function' ||
      typeof (prisma as any).storefrontListing?.update !== 'function'
    ) {
      console.error('Prisma client not properly initialized');
      return NextResponse.json({ error: 'Database connection not available' }, { status: 503 });
    }

    const { id } = params;
    const body = await request.json();
    const { userId, title, listingType, price, location, description, condition } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!title || !listingType || !price || !location || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const formattedPrice = formatPrice(price);
    if (!formattedPrice) {
      return NextResponse.json({ error: 'Price must be a valid numeric value' }, { status: 400 });
    }

    const existingListing = await (prisma as any).storefrontListing.findUnique({
      where: { id },
      include: {
        supplierProfile: true,
      },
    });

    if (!existingListing || !existingListing.supplierProfile) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    if (String(existingListing.supplierProfile.email || '').toLowerCase() !== String(userId).toLowerCase()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const updatedListing = await (prisma as any).storefrontListing.update({
      where: { id },
      data: {
        title,
        listingType,
        condition: condition ?? null,
        price: formattedPrice,
        location,
        description,
        category: listingType,
      },
      include: {
        supplierProfile: {
          select: {
            companyName: true,
            email: true,
          },
        },
      },
    });

    let badge = 'Available';
    let badgeColor = 'green';
    let icon = 'fa-box';

    if (updatedListing.listingType === 'Equipment / Machinery') {
      icon = 'fa-dolly';
      badge = updatedListing.condition === 'New' ? 'New' : 'Used';
      badgeColor = updatedListing.condition === 'New' ? 'green' : 'blue';
    } else if (updatedListing.listingType === 'Raw Materials') {
      icon = 'fa-shapes';
      badge = 'Surplus';
      badgeColor = 'blue';
    } else if (updatedListing.listingType === 'Surplus Parts') {
      icon = 'fa-cog';
      badge = 'Surplus';
      badgeColor = 'blue';
    } else if (updatedListing.listingType === 'Production Capacity') {
      icon = 'fa-industry';
      badge = 'Capacity';
      badgeColor = 'purple';
    }

    return NextResponse.json({
      id: updatedListing.id,
      title: updatedListing.title,
      supplier: updatedListing.supplierProfile?.companyName || 'Unknown',
      price: formatPrice(updatedListing.price || '') || updatedListing.price || '',
      badge: updatedListing.badge || badge,
      badgeColor,
      icon: updatedListing.imageUrl ? null : icon,
      listingType: updatedListing.listingType || '',
      condition: updatedListing.condition || '',
      location: updatedListing.location || '',
      description: updatedListing.description || '',
      imageUrl: updatedListing.imageUrl,
      createdAt: updatedListing.createdAt.toISOString(),
      timestamp: updatedListing.createdAt.getTime(),
      active: updatedListing.active,
    });
  } catch (error: any) {
    console.error('Error updating listing:', error);
    return NextResponse.json({ error: 'Failed to update listing' }, { status: 500 });
  }
}

// DELETE listing (authenticated, owner only)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check if prisma is properly initialized
    if (
      !prisma ||
      typeof (prisma as any).storefrontListing?.findUnique !== 'function' ||
      typeof (prisma as any).storefrontListing?.delete !== 'function'
    ) {
      console.error('Prisma client not properly initialized');
      return NextResponse.json({ error: 'Database connection not available' }, { status: 503 });
    }

    const { id } = params;
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the listing and verify ownership (via supplier profile)
    const listing = await (prisma as any).storefrontListing.findUnique({
      where: { id },
      include: {
        supplierProfile: true,
      },
    });

    if (!listing || !listing.supplierProfile) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Ensure the authenticated user owns the supplier profile for this listing
    if (String(listing.supplierProfile.email || '').toLowerCase() !== String(userId).toLowerCase()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Delete the listing
    await (prisma as any).storefrontListing.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting listing:', error);
    return NextResponse.json({ error: 'Failed to delete listing' }, { status: 500 });
  }
}
