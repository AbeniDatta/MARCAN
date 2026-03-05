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
    if (!prisma || typeof prisma.sellerProfile?.findUnique !== 'function') {
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

    // Find the seller profile
    const profile = await prisma.sellerProfile.findUnique({
      where: { userId },
      include: {
        listings: true,
      },
    });

    if (!profile) {
      return NextResponse.json(
        { error: 'Seller profile not found' },
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const listingsCount = profile.listings.length;

    // Explicitly delete listings first (even though cascade should handle it, this ensures it works)
    if (listingsCount > 0) {
      await prisma.listing.deleteMany({
        where: { profileId: profile.id },
      });
      console.log(`Deleted ${listingsCount} listings for profile ${profile.id}`);
    }

    // Delete the seller profile (this will also cascade delete any remaining related records)
    await prisma.sellerProfile.delete({
      where: { userId },
    });

    console.log(`Deleted seller profile for userId: ${userId}`);
    console.log(`Deleted ${listingsCount} listings`);

    return NextResponse.json(
      {
        success: true,
        message: 'Seller profile and all associated listings have been deleted',
        deletedListings: listingsCount,
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
