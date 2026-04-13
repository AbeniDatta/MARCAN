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

// DELETE wishlist request (authenticated, owner only)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check if prisma is properly initialized
    const db = prisma as any;
    if (!db || typeof db.sourcingRequest?.findUnique !== 'function') {
      console.error('Prisma client not properly initialized');
      return NextResponse.json({ error: 'Database connection not available' }, { status: 503 });
    }

    const { id } = params;
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the request and verify ownership (via buyer profile)
    const wishlistRequest = await db.sourcingRequest.findUnique({
      where: { id },
      include: {
        buyerProfile: true,
      },
    });

    if (!wishlistRequest || !wishlistRequest.buyerProfile) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // Ensure the authenticated user owns the buyer profile for this request
    if (wishlistRequest.buyerProfile.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Delete the request
    await db.sourcingRequest.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting wishlist request:', error);
    return NextResponse.json({ error: 'Failed to delete wishlist request' }, { status: 500 });
  }
}

// PUT update wishlist request (authenticated, owner only)
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = prisma as any;
    if (!db || typeof db.sourcingRequest?.findUnique !== 'function') {
      console.error('Prisma client not properly initialized');
      return NextResponse.json({ error: 'Database connection not available' }, { status: 503 });
    }

    const { id } = params;
    const body = await request.json();
    const {
      userId,
      title,
      category,
      quantity,
      specifications,
      deadline,
      asap,
      targetPrice,
      targetCity,
      targetProvince,
    } = body || {};

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Load request with buyer profile to check ownership
    const existing = await db.sourcingRequest.findUnique({
      where: { id },
      include: { buyerProfile: true },
    });
    if (!existing || !existing.buyerProfile) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }
    if (existing.buyerProfile.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Build update payload
    const data: any = {};
    if (typeof title === 'string') data.title = title;
    if (typeof category === 'string') data.category = category || null;
    if (typeof quantity === 'string' || typeof quantity === 'number') data.quantity = String(quantity);
    if (typeof specifications === 'string') data.description = specifications;
    if (typeof targetCity === 'string') data.targetCity = targetCity || null;
    if (typeof targetProvince === 'string') data.targetProvince = targetProvince || null;
    if (typeof asap === 'boolean') {
      data.isAsap = asap;
      if (asap) {
        data.deadline = null;
      }
    }
    if (deadline === null) {
      data.deadline = null;
      data.isAsap = true;
    } else if (typeof deadline === 'string' && deadline.trim()) {
      data.deadline = new Date(deadline);
      if (typeof asap !== 'boolean') {
        data.isAsap = false;
      }
    }
    if (typeof targetPrice === 'string' && targetPrice.trim()) {
      const normalized = formatPrice(targetPrice);
      if (!normalized) {
        return NextResponse.json({ error: 'Target price must be a valid numeric value' }, { status: 400 });
      }
      data.targetPrice = normalized;
    } else if (targetPrice === '') {
      data.targetPrice = null;
    }

    const updated = await db.sourcingRequest.update({
      where: { id },
      data,
    });

    return NextResponse.json({
      id: updated.id,
      title: updated.title,
      category: updated.category || '',
      quantity: updated.quantity || '',
      specifications: updated.description,
      targetPrice: updated.targetPrice || '',
      deadline: updated.deadline ? updated.deadline.toISOString() : null,
      isAsap: updated.isAsap,
      city: updated.targetCity || null,
      province: updated.targetProvince || null,
      location: [updated.targetCity, updated.targetProvince].filter(Boolean).join(', ') || null,
    });
  } catch (error: any) {
    console.error('Error updating wishlist request:', error);
    return NextResponse.json({ error: 'Failed to update wishlist request' }, { status: 500 });
  }
}
