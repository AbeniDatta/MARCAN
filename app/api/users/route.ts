import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// POST - Create or update buyer user account data
export async function POST(request: NextRequest) {
    try {
        if (!prisma || typeof prisma.profile?.findUnique !== 'function') {
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
        const existingProfile = await prisma.profile.findUnique({
            where: { userId },
        });

        const profileData: any = {
            userId,
            companyName: companyName || `${firstName} ${lastName}`.trim(),
            phone: phone || null,
            city: city || null,
            province: province || null,
            primaryIntent: 'buy',
            // Buyer-specific fields
            primaryProcesses: Array.isArray(primaryProcesses) ? primaryProcesses : [],
            materials: Array.isArray(materials) ? materials : [],
            certifications: Array.isArray(certifications) ? certifications : [],
            industriesServed: Array.isArray(industriesServed) ? industriesServed : [],
            otherComments: otherComments || null,
            searchable: false, // Buyers are not searchable in directory
            profileCompletenessScore: 0,
        };

        let profile;
        if (existingProfile) {
            // Update existing profile
            profile = await prisma.profile.update({
                where: { userId },
                data: profileData,
            });
        } else {
            // Create new profile
            profile = await prisma.profile.create({
                data: profileData,
            });
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
        return NextResponse.json(
            {
                error: 'Failed to create/update user profile',
                details: error.message || 'Unknown error',
            },
            { status: 500 }
        );
    }
}
