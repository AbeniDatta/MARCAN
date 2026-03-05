import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic';

// DELETE listing (authenticated, owner only)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check if prisma is properly initialized
    if (!prisma || typeof prisma.listing?.findUnique !== 'function') {
      console.error('Prisma client not properly initialized');
      return NextResponse.json({ error: 'Database connection not available' }, { status: 503 });
    }

    const { id } = params;
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the listing and verify ownership (via seller profile)
    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        sellerProfile: true,
      },
    });

    if (!listing || !listing.sellerProfile) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Ensure the authenticated user owns the seller profile for this listing
    if (listing.sellerProfile.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Delete the listing
    await prisma.listing.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting listing:', error);
    return NextResponse.json({ error: 'Failed to delete listing' }, { status: 500 });
  }
}
