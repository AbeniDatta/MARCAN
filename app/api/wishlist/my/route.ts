import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic';

// GET user's own wishlist requests (authenticated)
export async function GET(request: NextRequest) {
  try {
    // Check if prisma is properly initialized
    if (!prisma || typeof prisma.buyerProfile?.findUnique !== 'function') {
      console.error('Prisma client not properly initialized');
      return NextResponse.json([]);
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Find user's buyer profile
    const profile = await prisma.buyerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return NextResponse.json([]);
    }

    // Get user's wishlist requests
    const requests = await prisma.wishlistRequest.findMany({
      where: {
        buyerProfileId: profile.id,
      },
      include: {
        buyerProfile: {
          select: {
            companyName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Format the response
    const formattedRequests = requests.map((req) => ({
      id: req.id,
      title: req.title,
      company: req.companyName,
      companyName: req.companyName,
      initials: req.companyName
        .split(' ')
        .map((w) => w[0])
        .join('')
        .substring(0, 2)
        .toUpperCase(),
      category: req.category || '',
      description: req.description,
      specifications: req.description,
      quantity: req.quantity || '',
      targetPrice: req.targetPrice || '',
      deadline: req.deadline ? req.deadline.toISOString() : null,
      active: req.active,
      createdAt: req.createdAt.toISOString(),
      timestamp: req.createdAt.getTime(),
      logoUrl: null,
      selectedIcon: null,
    }));

    return NextResponse.json(formattedRequests);
  } catch (error: any) {
    console.error('Error fetching user wishlist requests:', error);
    return NextResponse.json({ error: 'Failed to fetch wishlist requests' }, { status: 500 });
  }
}
