import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// GET - Check if username is available
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');
    const checkType = searchParams.get('type'); // 'check-username' or null

    if (checkType === 'check-username' && username) {
      // Check if username is already taken
      // For now, we'll check if it matches any userId (which should be emails)
      // Once username field is added to schema, we can check that field

      // Check buyer profiles
      const buyerProfile = await prisma.buyerProfile.findFirst({
        where: {
          userId: username,
        },
      });

      // Check seller profiles
      const sellerProfile = await prisma.sellerProfile.findFirst({
        where: {
          userId: username,
        },
      });

      // Username is taken if it matches any userId (though it shouldn't since username can't be email)
      // This is a temporary check until we add username field to schema
      const taken = !!buyerProfile || !!sellerProfile;

      return NextResponse.json({ taken, available: !taken });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error: any) {
    console.error('Error checking username:', error);
    return NextResponse.json(
      {
        error: 'Failed to check username',
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
    const {
      userId,
      firstName,
      lastName,
      email,
      companyName,
      jobTitle,
      phone,
      city,
      province,
      primaryProcesses,
      materials,
      certifications,
      industriesServed,
      otherComments,
    } = body;

    if (!userId || !email) {
      return NextResponse.json(
        { error: 'userId and email are required' },
        { status: 400 }
      );
    }

    // Check if profile exists for this user
    const existingProfile = await prisma.buyerProfile.findUnique({
      where: { userId },
    });

    const profileData: any = {
      userId,
      firstName: firstName || null,
      lastName: lastName || null,
      email: email || userId || null,
      companyName: companyName || `${firstName} ${lastName}`.trim(),
      jobTitle: jobTitle || null,
      phone: phone || null,
      city: city || null,
      province: province || null,
      // Buyer-specific fields
      primaryProcesses: Array.isArray(primaryProcesses) ? primaryProcesses : [],
      materials: Array.isArray(materials) ? materials : [],
      certifications: Array.isArray(certifications) ? certifications : [],
      industriesServed: Array.isArray(industriesServed) ? industriesServed : [],
      otherComments: otherComments || null,
    };

    let profile;
    if (existingProfile) {
      // Update existing profile
      console.log('Updating existing buyer profile for userId:', userId);
      profile = await prisma.buyerProfile.update({
        where: { userId },
        data: profileData,
      });
      console.log('Buyer profile updated successfully:', profile.id);
    } else {
      // Create new profile
      console.log('Creating new buyer profile for userId:', userId);
      console.log('Profile data:', { userId, firstName, lastName, email, companyName, jobTitle, phone, city, province });
      profile = await prisma.buyerProfile.create({
        data: profileData,
      });
      console.log('Buyer profile created successfully:', profile.id);
    }

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
