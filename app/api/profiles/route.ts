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
      console.log('Received profile data:', { userId: body.userId, companyName: body.companyName });
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
      // New wizard fields
      onboardingMethod,
      provincesServed,
      companyType,
      processes,
      materials,
      finishes,
      typicalJobSize,
      leadTimeMinDays,
      leadTimeMaxDays,
      maxPartSizeMmX,
      maxPartSizeMmY,
      maxPartSizeMmZ,
      industries,
      rfqEmail,
      preferredContactMethod,
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
      include: { profileCapabilities: true },
    });

    // Calculate eligibility: ≥1 PROCESS, ≥1 MATERIAL, ≥1 provincesServed
    const hasProcess = Array.isArray(processes) && processes.length > 0;
    const hasMaterial = Array.isArray(materials) && materials.length > 0;
    const hasProvinceServed = Array.isArray(provincesServed) && provincesServed.length > 0;
    const isEligible = hasProcess && hasMaterial && hasProvinceServed;

    // Calculate profile completeness score (simple heuristic)
    let completenessScore = 0;
    if (companyName) completenessScore += 10;
    if (city && province) completenessScore += 10;
    if (hasProvinceServed) completenessScore += 10;
    if (hasProcess) completenessScore += 15;
    if (hasMaterial) completenessScore += 15;
    if (typicalJobSize) completenessScore += 10;
    if (rfqEmail) completenessScore += 10;
    if (aboutUs) completenessScore += 5;
    if (Array.isArray(finishes) && finishes.length > 0) completenessScore += 5;
    if (Array.isArray(certifications) && certifications.length > 0) completenessScore += 5;
    if (Array.isArray(industries) && industries.length > 0) completenessScore += 5;
    if (website) completenessScore += 5;

    // Prepare profile data
    const profileData: any = {
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
      primaryIntent: primaryIntent || 'sell', // Default to 'sell' for seller signup
      // New fields
      onboardingMethod: onboardingMethod || null,
      provincesServed: provincesServed || [],
      typicalJobSize: typicalJobSize || null,
      leadTimeMinDays: leadTimeMinDays || null,
      leadTimeMaxDays: leadTimeMaxDays || null,
      maxPartSizeMmX: maxPartSizeMmX || null,
      maxPartSizeMmY: maxPartSizeMmY || null,
      maxPartSizeMmZ: maxPartSizeMmZ || null,
      rfqEmail: rfqEmail || null,
      preferredContactMethod: preferredContactMethod || null,
      // Eligibility and enrichment
      searchable: isEligible,
      profileCompletenessScore: completenessScore,
      taxonomyVersion: 'v1',
      lastVerifiedAt: isEligible ? new Date() : null,
    };

    let profile;
    if (existingProfile) {
      // Delete existing profile capabilities before recreating
      if (existingProfile.profileCapabilities.length > 0) {
        await prisma.profileCapability.deleteMany({
          where: { profileId: existingProfile.id },
        });
      }

      // Update existing profile
      profile = await prisma.profile.update({
        where: { userId },
        data: profileData,
      });
    } else {
      // Create new profile - userId is required for creation
      profile = await prisma.profile.create({
        data: {
          ...profileData,
          userId, // userId must be included in the data object for create
        },
      });
    }

    // Create ProfileCapability records for all selected capabilities
    const capabilityIds: string[] = [];
    
    // Core capabilities (isCore = true, source = "signup")
    if (Array.isArray(processes)) capabilityIds.push(...processes);
    if (Array.isArray(materials)) capabilityIds.push(...materials);
    if (Array.isArray(finishes)) capabilityIds.push(...finishes);
    
    // Non-core capabilities (isCore = false, source = "signup")
    if (companyType) capabilityIds.push(companyType);
    if (Array.isArray(certifications)) capabilityIds.push(...certifications);
    if (Array.isArray(industries)) capabilityIds.push(...industries);

    // Create ProfileCapability records
    if (capabilityIds.length > 0) {
      const coreCapabilityIds = new Set([
        ...(processes || []),
        ...(materials || []),
        ...(finishes || []),
      ]);

      await prisma.profileCapability.createMany({
        data: capabilityIds.map((capabilityId) => ({
          profileId: profile.id,
          capabilityId,
          isCore: coreCapabilityIds.has(capabilityId),
          source: 'signup',
        })),
        skipDuplicates: true,
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
        OR: [
          { primaryIntent: { in: ['sell', 'both'] } },
          { searchable: true }, // Also include searchable profiles (eligible sellers)
        ],
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
        userId: profile.userId, // Include userId for matching user profiles
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
        primaryIntent: profile.primaryIntent, // Include primaryIntent
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
