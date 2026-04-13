import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic';

function companyDisplayName(companyName: string | null | undefined): string {
  return (companyName && String(companyName).trim()) || 'Anonymous';
}

function companyInitials(companyName: string): string {
  return companyName
    .split(/\s+/)
    .filter(Boolean)
    .map((w: string) => w[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
}

function formatPrice(rawPrice: string) {
  const numeric = String(rawPrice ?? '').replace(/[^0-9.]/g, '');
  const parsed = Number.parseFloat(numeric);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  const normalized = Number.isInteger(parsed) ? parsed.toString() : parsed.toFixed(2);
  return `$${normalized}`;
}

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
      select: { id: true },
    });

    if (!profile) {
      return NextResponse.json([]);
    }

    // Get user's wishlist requests
    const requests = await prisma.sourcingRequest.findMany({
      where: {
        buyerProfileId: profile.id,
      },
      include: {
        buyerProfile: {
          select: { companyName: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Format the response
    const formattedRequests = requests.map((req: any) => {
      const name = companyDisplayName(req.buyerProfile?.companyName);
      return {
      id: req.id,
      title: req.title,
      company: name,
      companyName: name,
      initials: companyInitials(name),
      category: req.category || '',
      description: req.description,
      specifications: req.description,
      quantity: req.quantity || '',
      targetPrice: req.targetPrice ? (formatPrice(req.targetPrice) || req.targetPrice) : '',
      deadline: req.deadline ? req.deadline.toISOString() : null,
      isAsap: req.isAsap,
      active: req.active,
      createdAt: req.createdAt.toISOString(),
      timestamp: req.createdAt.getTime(),
      city: req.targetCity || null,
      province: req.targetProvince || null,
      location: [req.targetCity, req.targetProvince].filter(Boolean).join(', ') || null,
      logoUrl: null,
      selectedIcon: null,
    };
    });

    return NextResponse.json(formattedRequests);
  } catch (error: any) {
    console.error('Error fetching user wishlist requests:', error);
    return NextResponse.json({ error: 'Failed to fetch wishlist requests' }, { status: 500 });
  }
}
