import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = (searchParams.get('userId') || '').trim().toLowerCase();
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const profile = await (prisma as any).storefrontProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return NextResponse.json({ error: 'Storefront profile not found' }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (error: any) {
    console.error('Error fetching storefront profile:', error);
    return NextResponse.json({ error: 'Failed to fetch storefront profile' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = String(body.userId || '').trim().toLowerCase();
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const data = {
      firstName: body.firstName || null,
      lastName: body.lastName || null,
      email: body.email || null,
      companyName: body.companyName || 'Unnamed Company',
      role: body.role || null,
      streetAddress: body.streetAddress || '',
      city: body.city || null,
      province: body.province || null,
      businessNumber: body.businessNumber || null,
      website: body.website || null,
      phone: body.phone || null,
      aboutUs: body.aboutUs || null,
    };

    const existing = await (prisma as any).storefrontProfile.findUnique({
      where: { userId },
    });

    const profile = existing
      ? await (prisma as any).storefrontProfile.update({
          where: { userId },
          data,
        })
      : await (prisma as any).storefrontProfile.create({
          data: { userId, ...data },
        });

    return NextResponse.json(profile);
  } catch (error: any) {
    console.error('Error saving storefront profile:', error);
    return NextResponse.json({ error: 'Failed to save storefront profile' }, { status: 500 });
  }
}

