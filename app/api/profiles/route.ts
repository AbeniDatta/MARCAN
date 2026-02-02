import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic';

// POST create or update profile (authenticated)
export async function POST(request: NextRequest) {
  try {
    // Check if prisma is properly initialized
    if (!prisma || typeof prisma.profile?.findUnique !== 'function') {
      console.error('Prisma client not properly initialized');
      return NextResponse.json({ 
        error: 'Database connection not available',
        details: 'Prisma client is not properly initialized. Make sure the database schema has been pushed.'
      }, { 
        status: 503,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return NextResponse.json({ 
        error: 'Invalid JSON in request body' 
      }, { 
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    const {
      userId,
      companyName,
      jobTitle,
      businessNumber,
      website,
      city,
      province,
      aboutUs,
      capabilities,
      certifications,
      selectedIcon,
      logoUrl,
      primaryIntent,
    } = body;

    if (!userId || !companyName) {
      return NextResponse.json({ 
        error: 'userId and companyName are required' 
      }, { 
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // Check if profile already exists
    const existingProfile = await prisma.profile.findUnique({
      where: { userId },
    });

    let profile;
    if (existingProfile) {
      // Update existing profile
      profile = await prisma.profile.update({
        where: { userId },
        data: {
          companyName,
          jobTitle: jobTitle || null,
          businessNumber: businessNumber || null,
          website: website || null,
          city: city || null,
          province: province || null,
          aboutUs: aboutUs || null,
          capabilities: capabilities || [],
          certifications: certifications || [],
          selectedIcon: selectedIcon || null,
          logoUrl: logoUrl || null,
          primaryIntent: primaryIntent || 'both',
        },
      });
    } else {
      // Create new profile
      profile = await prisma.profile.create({
        data: {
          userId,
          companyName,
          jobTitle: jobTitle || null,
          businessNumber: businessNumber || null,
          website: website || null,
          city: city || null,
          province: province || null,
          aboutUs: aboutUs || null,
          capabilities: capabilities || [],
          certifications: certifications || [],
          selectedIcon: selectedIcon || null,
          logoUrl: logoUrl || null,
          primaryIntent: primaryIntent || 'both',
        },
      });
    }

    return NextResponse.json(profile, { 
      status: existingProfile ? 200 : 201,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    console.error('Error creating/updating profile:', error);
    console.error('Error stack:', error?.stack);
    console.error('Error code:', error?.code);
    console.error('Error message:', error?.message);
    
    // Return more detailed error information
    const errorMessage = error?.message || 'Failed to create/update profile';
    const errorCode = error?.code || 'UNKNOWN_ERROR';
    
    // Check for common Prisma errors
    let userFriendlyMessage = errorMessage;
    if (error?.code === 'P2002') {
      userFriendlyMessage = 'A profile with this information already exists';
    } else if (error?.code === 'P2025') {
      userFriendlyMessage = 'Profile not found';
    } else if (error?.message?.includes('connect') || error?.message?.includes('connection')) {
      userFriendlyMessage = 'Database connection failed. Please check your database configuration.';
    }
    
    // Always return JSON, never HTML - this prevents the "<!DOCTYPE" error
    return NextResponse.json(
      { 
        error: 'Failed to create/update profile',
        details: userFriendlyMessage,
        code: errorCode,
        originalMessage: errorMessage,
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

// GET all profiles (public - for directory)
export async function GET() {
  try {
    // Check if prisma is properly initialized
    if (!prisma || typeof prisma.profile?.findMany !== 'function') {
      console.error('Prisma client not properly initialized');
      return NextResponse.json({ 
        error: 'Database connection not available', 
        profiles: [] 
      }, { 
        status: 503,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    const profiles = await prisma.profile.findMany({
      where: {
        primaryIntent: {
          in: ['sell', 'both'],
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Format the response to match the frontend expectations
    const formattedProfiles = profiles.map((profile) => {
      // Create tags from capabilities
      const tags = profile.capabilities.slice(0, 3);

      // Build location string
      const locationParts = [];
      if (profile.city) locationParts.push(profile.city);
      if (profile.province) locationParts.push(profile.province);
      const location = locationParts.length > 0 ? locationParts.join(', ') : 'Location not specified';

      return {
        id: profile.id,
        name: profile.companyName,
        location,
        description: profile.aboutUs || 'No description available.',
        icon: profile.selectedIcon || 'fa-industry',
        logoUrl: profile.logoUrl,
        tags,
        capabilities: profile.capabilities,
        certifications: profile.certifications,
        materials: profile.materials,
        website: profile.website,
        phone: profile.phone,
        city: profile.city,
        province: profile.province,
        streetAddress: profile.streetAddress,
        businessNumber: profile.businessNumber,
        jobTitle: profile.jobTitle,
      };
    });

    return NextResponse.json(formattedProfiles, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    console.error('Error fetching profiles:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch profiles' 
    }, { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
