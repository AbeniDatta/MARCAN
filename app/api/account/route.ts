import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        if (!prisma) {
            return NextResponse.json(
                { error: 'Database connection not available' },
                { status: 503 }
            );
        }

        const body = await request.json();
        const { userId, action } = body as { userId?: string; action?: 'deactivate' | 'reactivate' };

        if (!userId || !action) {
            return NextResponse.json(
                { error: 'userId and action are required' },
                { status: 400 }
            );
        }

        const now = new Date();

        if (action === 'deactivate') {
            const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
            const scheduledDeletionAt = new Date(now.getTime() + thirtyDaysMs);

            // Mark buyer profile (if any) as deactivated
            await prisma.buyerProfile.updateMany({
                where: { userId },
                data: {
                    deactivated: true,
                    deactivatedAt: now,
                    scheduledDeletionAt,
                },
            });

            // Mark seller profile (if any) as deactivated
            await prisma.sellerProfile.updateMany({
                where: { userId },
                data: {
                    deactivated: true,
                    deactivatedAt: now,
                    scheduledDeletionAt,
                },
            });

            return NextResponse.json(
                {
                    success: true,
                    status: 'deactivated',
                    scheduledDeletionAt,
                },
                { status: 200 }
            );
        }

        if (action === 'reactivate') {
            // Clear deactivation flags on both profile types
            await prisma.buyerProfile.updateMany({
                where: { userId },
                data: {
                    deactivated: false,
                    deactivatedAt: null,
                    scheduledDeletionAt: null,
                },
            });

            await prisma.sellerProfile.updateMany({
                where: { userId },
                data: {
                    deactivated: false,
                    deactivatedAt: null,
                    scheduledDeletionAt: null,
                },
            });

            return NextResponse.json(
                {
                    success: true,
                    status: 'reactivated',
                },
                { status: 200 }
            );
        }

        return NextResponse.json(
            { error: 'Invalid action' },
            { status: 400 }
        );
    } catch (error: any) {
        console.error('Error handling account action:', error);
        return NextResponse.json(
            {
                error: 'Failed to update account status',
                details: error?.message || 'Unknown error',
            },
            { status: 500 }
        );
    }
}

