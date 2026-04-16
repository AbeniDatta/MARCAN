import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
const HIDDEN_CAPABILITY_MARKER = '__hidden__';

// GET capabilities by type (for signup forms)
export async function GET(request: NextRequest) {
  try {
    if (!prisma || typeof prisma.capability?.findMany !== 'function') {
      return NextResponse.json([], {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const includeHidden = searchParams.get('includeHidden') === 'true';

    const where: any = {};
    if (type) {
      where.type = type;
    }
    if (!includeHidden) {
      where.NOT = {
        aliases: { has: HIDDEN_CAPABILITY_MARKER },
      };
    }

    const capabilities = await prisma.capability.findMany({
      where,
      orderBy: {
        name: 'asc',
      },
    });

    // Always return an array
    return NextResponse.json(Array.isArray(capabilities) ? capabilities : [], {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error fetching capabilities:', error);
    // Always return an array, even on error
    return NextResponse.json([], {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
