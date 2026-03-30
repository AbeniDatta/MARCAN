import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyFirebaseIdTokenViaLookup, deleteFirebaseUserWithIdToken } from '@/lib/firebaseServerAuth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** Resolve uid + email via Identity Toolkit (works with Web API key only; avoids Admin init issues). */
async function resolveUidEmailFromIdToken(idToken: string): Promise<{ uid: string; email: string }> {
  try {
    return await verifyFirebaseIdTokenViaLookup(idToken);
  } catch (e: any) {
    const msg = e?.message || String(e);
    console.error('verifyFirebaseIdTokenViaLookup failed:', msg);
    if (msg === 'NO_EMAIL') {
      throw new Error('NO_EMAIL');
    }
    throw new Error('INVALID_ID_TOKEN');
  }
}

/** Always use Identity Toolkit REST — avoids Firebase Admin when it initializes without a project ID. */
async function deleteFirebaseAuthUser(idToken: string): Promise<void> {
  await deleteFirebaseUserWithIdToken(idToken);
}

export async function POST(request: NextRequest) {
    try {
        if (!prisma) {
            return NextResponse.json(
                { error: 'Database connection not available' },
                { status: 503 }
            );
        }

        const body = await request.json();
        const { userId, action, idToken } = body as {
            userId?: string;
            action?: 'deactivate' | 'reactivate' | 'delete_permanent';
            idToken?: string;
        };

        if (!action) {
            return NextResponse.json({ error: 'action is required' }, { status: 400 });
        }

        if (action === 'delete_permanent') {
            if (!idToken || typeof idToken !== 'string') {
                return NextResponse.json({ error: 'idToken is required' }, { status: 400 });
            }

            let email: string;
            try {
                const resolved = await resolveUidEmailFromIdToken(idToken);
                email = resolved.email;
            } catch (e: any) {
                const code = e?.message;
                if (code === 'NO_EMAIL') {
                    return NextResponse.json(
                        { error: 'Signed-in account has no email address' },
                        { status: 400 }
                    );
                }
                return NextResponse.json(
                    { error: 'Invalid or expired session. Please sign in again.' },
                    { status: 401 }
                );
            }

            try {
                await prisma.$transaction(async (tx) => {
                    await tx.buyerProfile.deleteMany({
                        where: { userId: { equals: email, mode: 'insensitive' } },
                    });
                    await tx.supplierProfile.deleteMany({
                        where: { email: { equals: email, mode: 'insensitive' } },
                    });
                    await tx.storefrontProfile.deleteMany({
                        where: { userId: { equals: email, mode: 'insensitive' } },
                    });
                });
            } catch (dbErr: any) {
                console.error('Account delete DB transaction failed:', dbErr);
                return NextResponse.json(
                    {
                        error: 'Could not remove your data from the database.',
                        details: dbErr?.message || 'Unknown database error',
                    },
                    { status: 500 }
                );
            }

            try {
                await deleteFirebaseAuthUser(idToken);
            } catch (e: any) {
                console.error('Firebase Auth delete failed:', e);
                return NextResponse.json(
                    {
                        error:
                            'Your Marcan data was removed, but Firebase sign-in could not be deleted. You can try again or contact support.',
                        details: e?.message,
                    },
                    { status: 500 }
                );
            }

            return NextResponse.json({ success: true, deleted: true }, { status: 200 });
        }

        if (!userId) {
            return NextResponse.json({ error: 'userId is required' }, { status: 400 });
        }

        const now = new Date();

        if (action === 'deactivate') {
            const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
            const scheduledDeletionAt = new Date(now.getTime() + thirtyDaysMs);

            await prisma.buyerProfile.updateMany({
                where: { userId },
                data: {
                    deactivated: true,
                    deactivatedAt: now,
                    scheduledDeletionAt,
                },
            });

            await prisma.supplierProfile.updateMany({
                where: { email: String(userId).toLowerCase() },
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
            await prisma.buyerProfile.updateMany({
                where: { userId },
                data: {
                    deactivated: false,
                    deactivatedAt: null,
                    scheduledDeletionAt: null,
                },
            });

            await prisma.supplierProfile.updateMany({
                where: { email: String(userId).toLowerCase() },
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

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
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
