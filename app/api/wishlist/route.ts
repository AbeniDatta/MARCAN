import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic';

function formatPrice(rawPrice: string) {
  const numeric = String(rawPrice ?? '').replace(/[^0-9.]/g, '');
  const parsed = Number.parseFloat(numeric);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  const normalized = Number.isInteger(parsed) ? parsed.toString() : parsed.toFixed(2);
  return `$${normalized}`;
}

// GET all wishlist requests (public)
export async function GET() {
  try {
    // Check if prisma is properly initialized
    if (!prisma || typeof prisma.sourcingRequest?.findMany !== 'function') {
      console.error('Prisma client not properly initialized');
      return NextResponse.json([]);
    }

    const requests = await prisma.sourcingRequest.findMany({
      where: {
        active: true,
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

    // Format the response to match the frontend expectations
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
      targetPrice: req.targetPrice ? (formatPrice(req.targetPrice) || req.targetPrice) : '',
      deadline: req.deadline ? req.deadline.toISOString() : null,
      active: req.active,
      createdAt: req.createdAt.toISOString(),
      timestamp: req.createdAt.getTime(),
      logoUrl: null,
      selectedIcon: null,
    }));

    return NextResponse.json(formattedRequests);
  } catch (error: any) {
    console.error('Error fetching wishlist requests:', error);
    return NextResponse.json({ error: 'Failed to fetch wishlist requests' }, { status: 500 });
  }
}

// POST create new wishlist request (authenticated)
export async function POST(request: NextRequest) {
  try {
    // Check if prisma is properly initialized
    if (!prisma || typeof prisma.buyerProfile?.findUnique !== 'function') {
      console.error('Prisma client not properly initialized');
      return NextResponse.json({ error: 'Database connection not available' }, { status: 503 });
    }

    const body = await request.json();
    const { title, category, quantity, specifications, deadline, targetPrice, userId } = body;
    const normalizedTargetPrice = targetPrice
      ? formatPrice(targetPrice)
      : null;

    if (targetPrice && !normalizedTargetPrice) {
      return NextResponse.json({ error: 'Target price must be a valid numeric value' }, { status: 400 });
    }


    if (!title || !specifications || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Find or create buyer profile for the user
    let profile = await prisma.buyerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      // Create a basic buyer profile if it doesn't exist
      profile = await prisma.buyerProfile.create({
        data: {
          userId,
          companyName: body.companyName || 'Anonymous',
        },
      });
    }

    // Create the wishlist request
    const wishlistRequest = await prisma.sourcingRequest.create({
      data: {
        buyerProfileId: profile.id,
        title,
        companyName: profile.companyName,
        category: category || null,
        description: specifications,
        quantity: quantity || null,
        targetPrice: normalizedTargetPrice,
        deadline: deadline ? new Date(deadline) : null,
        active: true,
      },
      include: {
        buyerProfile: {
          select: {
            companyName: true,
          },
        },
      },
    });

    // Format the response
    const formattedRequest = {
      id: wishlistRequest.id,
      title: wishlistRequest.title,
      company: wishlistRequest.companyName,
      companyName: wishlistRequest.companyName,
      initials: wishlistRequest.companyName
        .split(' ')
        .map((w) => w[0])
        .join('')
        .substring(0, 2)
        .toUpperCase(),
      category: wishlistRequest.category || '',
      description: wishlistRequest.description,
      specifications: wishlistRequest.description,
      quantity: wishlistRequest.quantity || '',
      targetPrice: wishlistRequest.targetPrice ? (formatPrice(wishlistRequest.targetPrice) || wishlistRequest.targetPrice) : '',
      deadline: wishlistRequest.deadline ? wishlistRequest.deadline.toISOString() : null,
      active: wishlistRequest.active,
      createdAt: wishlistRequest.createdAt.toISOString(),
      timestamp: wishlistRequest.createdAt.getTime(),
      logoUrl: null,
      selectedIcon: null,
    };

    return NextResponse.json(formattedRequest, { status: 201 });
  } catch (error: any) {
    console.error('Error creating wishlist request:', error);
    return NextResponse.json({ error: 'Failed to create wishlist request' }, { status: 500 });
  }
}
