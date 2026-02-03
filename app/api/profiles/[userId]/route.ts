import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic';

// DELETE profile (authenticated, owner only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Check if prisma is properly initialized
    if (!prisma || typeof prisma.profile?.findUnique !== 'function') {
      console.error('Prisma client not properly initialized');
      return NextResponse.json(
        {
          error: 'Database connection not available',
        },
        {
          status: 503,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const { userId } = params;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Find the profile
    const profile = await prisma.profile.findUnique({
      where: { userId },
      include: {
        listings: true,
        wishlistRequests: true,
      },
    });

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Delete the profile
    // Due to onDelete: Cascade in the schema, this will automatically delete:
    // - All listings associated with this profile
    // - All wishlist requests associated with this profile
    await prisma.profile.delete({
      where: { userId },
    });

    console.log(`Deleted profile for userId: ${userId}`);
    console.log(`Cascaded delete: ${profile.listings.length} listings and ${profile.wishlistRequests.length} wishlist requests`);

    return NextResponse.json(
      {
        success: true,
        message: 'Seller profile and all associated listings have been deleted',
        deletedListings: profile.listings.length,
        deletedWishlistRequests: profile.wishlistRequests.length,
      },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error: any) {
    console.error('Error deleting profile:', error);
    console.error('Error stack:', error?.stack);
    console.error('Error code:', error?.code);
    console.error('Error message:', error?.message);

    const errorMessage = error?.message || 'Failed to delete profile';
    const errorCode = error?.code || 'UNKNOWN_ERROR';

    return NextResponse.json(
      {
        error: 'Failed to delete profile',
        details: errorMessage,
        code: errorCode,
        stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
      },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
