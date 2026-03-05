import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic';

// DELETE wishlist request (authenticated, owner only)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check if prisma is properly initialized
    if (!prisma || typeof prisma.wishlistRequest?.findUnique !== 'function') {
      console.error('Prisma client not properly initialized');
      return NextResponse.json({ error: 'Database connection not available' }, { status: 503 });
    }

    const { id } = params;
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the request and verify ownership (via buyer profile)
    const wishlistRequest = await prisma.wishlistRequest.findUnique({
      where: { id },
      include: {
        buyerProfile: true,
      },
    });

    if (!wishlistRequest || !wishlistRequest.buyerProfile) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // Ensure the authenticated user owns the buyer profile for this request
    if (wishlistRequest.buyerProfile.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Delete the request
    await prisma.wishlistRequest.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting wishlist request:', error);
    return NextResponse.json({ error: 'Failed to delete wishlist request' }, { status: 500 });
  }
}
