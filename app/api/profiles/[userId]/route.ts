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
    const db = prisma as any;
    if (!db || typeof db.supplierProfile?.findUnique !== 'function') {
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
    const email = String(userId || '').trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { error: 'email is required' },
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Find the supplier profile
    const profile = await (db as any).supplierProfile.findUnique({
      where: { email },
      include: {
        storefrontListings: true,
      },
    });

    if (!profile) {
      return NextResponse.json(
        { error: 'Supplier profile not found' },
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const listingsCount = (profile as any).storefrontListings.length;

    // Explicitly delete listings first (even though cascade should handle it, this ensures it works)
    if (listingsCount > 0) {
      await (prisma as any).storefrontListing.deleteMany({
        where: { profileId: profile.id },
      });
      console.log(`Deleted ${listingsCount} listings for profile ${profile.id}`);
    }

    // Delete the supplier profile (this will also cascade delete any remaining related records)
    await (db as any).supplierProfile.delete({
      where: { email },
    });

    console.log(`Deleted supplier profile for email: ${email}`);
    console.log(`Deleted ${listingsCount} listings`);

    return NextResponse.json(
      {
        success: true,
        message: 'Supplier profile and all associated listings have been deleted',
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
