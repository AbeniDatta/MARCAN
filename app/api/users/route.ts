import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

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
