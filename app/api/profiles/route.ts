import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET all profiles (public - for directory)
export async function GET() {
  try {
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

    return NextResponse.json(formattedProfiles);
  } catch (error: any) {
    console.error('Error fetching profiles:', error);
    return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 });
  }
}
