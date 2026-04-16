import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminEmail } from '@/lib/admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/account-role?email=...
 * Returns { role: 'admin' | 'supplier' | 'seller' | 'buyer' | null } based on existing profiles.
 */
export async function GET(request: NextRequest) {
  try {
    const email = (request.nextUrl.searchParams.get('email') || '').trim().toLowerCase();
    if (isAdminEmail(email)) {
      return NextResponse.json({ role: 'admin' as const });
    }

    if (!email) {
      return NextResponse.json({ role: null }, { status: 400 });
    }

    if (!prisma || typeof prisma.supplierProfile?.findUnique !== 'function') {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    const supplier = await prisma.supplierProfile.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      select: { id: true },
    });
    if (supplier) {
      return NextResponse.json({ role: 'supplier' as const });
    }

    const storefront = await prisma.storefrontProfile.findFirst({
      where: { userId: { equals: email, mode: 'insensitive' } },
      select: { id: true },
    });
    if (storefront) {
      return NextResponse.json({ role: 'seller' as const });
    }

    const buyer = await prisma.buyerProfile.findFirst({
      where: { userId: { equals: email, mode: 'insensitive' } },
      select: { id: true },
    });
    if (buyer) {
      return NextResponse.json({ role: 'buyer' as const });
    }

    return NextResponse.json({ role: null });
  } catch (e: any) {
    console.error('account-role GET:', e);
    return NextResponse.json(
      { error: 'Failed to resolve role', details: e?.message },
      { status: 500 }
    );
  }
}
