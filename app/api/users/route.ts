import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { scheduleBuyerProfileEnrichment } from '@/services/ai-enrichment';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// GET - Fetch user profile data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (userId) {
      const buyerProfile = await prisma.buyerProfile.findUnique({
        where: { userId },
        select: {
          id: true,
          userId: true,
          firstName: true,
          lastName: true,
          email: true,
          companyName: true,
          jobTitle: true,
          createdAt: true,
          updatedAt: true,
          aiSchema: true,
          aiSummary: true,
          aiStatus: true,
          aiEnrichedAt: true,
          aiError: true,
        },
      });

      if (!buyerProfile) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
      }

      return NextResponse.json(buyerProfile);
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error: any) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch user profile',
        details: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST - Create or update buyer user account data
export async function POST(request: NextRequest) {
  try {
    if (!prisma || typeof prisma.buyerProfile?.findUnique !== 'function') {
      console.error('Prisma client not properly initialized');
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { userId, firstName, lastName, email, companyName, jobTitle } = body;

    if (!userId || !email) {
      return NextResponse.json(
        { error: 'userId and email are required' },
        { status: 400 }
      );
    }

    // Check if profile exists for this user
    const existingProfile = await prisma.buyerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    const profileData = {
      userId,
      firstName: firstName || null,
      lastName: lastName || null,
      email: email || userId || null,
      companyName:
        (companyName && String(companyName).trim()) ||
        `${firstName || ''} ${lastName || ''}`.trim() ||
        'Organization',
      jobTitle: jobTitle || null,
    };

    let profile;
    if (existingProfile) {
      // Update existing profile
      console.log('Updating existing buyer profile for userId:', userId);
      profile = await prisma.buyerProfile.update({
        where: { userId },
        data: profileData,
        select: {
          id: true,
          userId: true,
          firstName: true,
          lastName: true,
          email: true,
          companyName: true,
          jobTitle: true,
          createdAt: true,
          updatedAt: true,
          aiSchema: true,
          aiSummary: true,
          aiStatus: true,
          aiEnrichedAt: true,
          aiError: true,
        },
      });
      console.log('Buyer profile updated successfully:', profile.id);
    } else {
      // Create new profile
      console.log('Creating new buyer profile for userId:', userId);
      console.log('Profile data:', { userId, firstName, lastName, email, companyName, jobTitle });
      profile = await prisma.buyerProfile.create({
        data: profileData,
        select: {
          id: true,
          userId: true,
          firstName: true,
          lastName: true,
          email: true,
          companyName: true,
          jobTitle: true,
          createdAt: true,
          updatedAt: true,
          aiSchema: true,
          aiSummary: true,
          aiStatus: true,
          aiEnrichedAt: true,
          aiError: true,
        },
      });
      console.log('Buyer profile created successfully:', profile.id);
    }

    scheduleBuyerProfileEnrichment(profile.id);

    return NextResponse.json(
      {
        success: true,
        profile,
      },
      { status: existingProfile ? 200 : 201 }
    );
  } catch (error: any) {
    console.error('Error creating/updating user profile:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
    });
    return NextResponse.json(
      {
        error: 'Failed to create/update user profile',
        details: error.message || 'Unknown error',
        code: error.code || 'UNKNOWN',
      },
      { status: 500 }
    );
  }
}
