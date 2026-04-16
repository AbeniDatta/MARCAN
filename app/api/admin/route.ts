import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminEmail } from '@/lib/admin';
import { verifyFirebaseIdTokenViaLookup } from '@/lib/firebaseServerAuth';
import { INDUSTRY_HUBS_EN } from '@/lib/industryHubNormalize';
import { getTrustedByWidgetVisible, setTrustedByWidgetVisible } from '@/lib/platformSettings';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const HIDDEN_CAPABILITY_MARKER = '__hidden__';
const ADMIN_CAPABILITY_MARKER = '__admin_capability__';

async function requireAdminFromToken(request: NextRequest): Promise<string> {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) throw new Error('UNAUTHORIZED');

  const { email } = await verifyFirebaseIdTokenViaLookup(token);
  if (!isAdminEmail(email)) throw new Error('FORBIDDEN');
  return email;
}

export async function GET(request: NextRequest) {
  try {
    await requireAdminFromToken(request);

    const [suppliers, buyers, storefronts, requests, listings, capabilities, trustedByWidgetVisible] = await Promise.all([
      prisma.supplierProfile.findMany({ orderBy: { updatedAt: 'desc' } }),
      prisma.buyerProfile.findMany({ orderBy: { updatedAt: 'desc' } }),
      prisma.storefrontProfile.findMany({ orderBy: { updatedAt: 'desc' } }),
      prisma.sourcingRequest.findMany({ orderBy: { updatedAt: 'desc' } }),
      prisma.storefrontListing.findMany({ orderBy: { updatedAt: 'desc' } }),
      prisma.capability.findMany({
        where: {
          type: 'INDUSTRY',
          OR: [
            { name: { in: [...INDUSTRY_HUBS_EN] } },
            { aliases: { has: ADMIN_CAPABILITY_MARKER } },
          ],
        },
        orderBy: { name: 'asc' },
      }),
      getTrustedByWidgetVisible(),
    ]);

    return NextResponse.json({
      suppliers,
      buyers,
      storefronts,
      requests,
      listings,
      capabilities: capabilities.map((c) => ({
        ...c,
        hidden: Array.isArray(c.aliases) && c.aliases.includes(HIDDEN_CAPABILITY_MARKER),
      })),
      settings: {
        trustedByWidgetVisible,
      },
    });
  } catch (error: any) {
    const code = error?.message;
    if (code === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (code === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    return NextResponse.json({ error: 'Failed to load admin data' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireAdminFromToken(request);
    const body = await request.json();
    const { target, id, action, data } = body || {};

    if (target === 'settings' && action === 'set_trusted_by_widget_visible') {
      const visible = data?.visible;
      if (typeof visible !== 'boolean') {
        return NextResponse.json({ error: 'data.visible must be boolean' }, { status: 400 });
      }
      await setTrustedByWidgetVisible(visible);
      return NextResponse.json({ success: true, trustedByWidgetVisible: visible });
    }

    if (!target || !id || !action) {
      return NextResponse.json({ error: 'target, id, action are required' }, { status: 400 });
    }

    if (target === 'supplier') {
      if (action === 'hide' || action === 'unhide') {
        const searchable = action === 'unhide';
        const deactivated = action === 'hide';
        const updated = await prisma.supplierProfile.update({
          where: { id },
          data: { searchable, deactivated },
        });
        return NextResponse.json(updated);
      }
      if (action === 'edit') {
        const updated = await prisma.supplierProfile.update({ where: { id }, data: data || {} });
        return NextResponse.json(updated);
      }
    }

    if (target === 'buyer') {
      if (action === 'hide' || action === 'unhide') {
        const updated = await prisma.buyerProfile.update({
          where: { id },
          data: { deactivated: action === 'hide' },
        });
        return NextResponse.json(updated);
      }
      if (action === 'edit') {
        const updated = await prisma.buyerProfile.update({ where: { id }, data: data || {} });
        return NextResponse.json(updated);
      }
    }

    if (target === 'storefront') {
      if (action === 'hide' || action === 'unhide') {
        const updated = await prisma.storefrontProfile.update({
          where: { id },
          data: { deactivated: action === 'hide' },
        });
        return NextResponse.json(updated);
      }
      if (action === 'edit') {
        const updated = await prisma.storefrontProfile.update({ where: { id }, data: data || {} });
        return NextResponse.json(updated);
      }
    }

    if (target === 'request') {
      if (action === 'hide' || action === 'unhide') {
        const updated = await prisma.sourcingRequest.update({
          where: { id },
          data: { active: action === 'unhide' },
        });
        return NextResponse.json(updated);
      }
      if (action === 'edit') {
        const updated = await prisma.sourcingRequest.update({ where: { id }, data: data || {} });
        return NextResponse.json(updated);
      }
    }

    if (target === 'listing') {
      if (action === 'hide' || action === 'unhide') {
        const updated = await prisma.storefrontListing.update({
          where: { id },
          data: { active: action === 'unhide' },
        });
        return NextResponse.json(updated);
      }
      if (action === 'edit') {
        const updated = await prisma.storefrontListing.update({ where: { id }, data: data || {} });
        return NextResponse.json(updated);
      }
    }

    if (target === 'category' || target === 'capability') {
      if (action === 'hide' || action === 'unhide') {
        const current = await prisma.capability.findUnique({ where: { id } });
        if (!current) return NextResponse.json({ error: 'Capability not found' }, { status: 404 });
        const aliases = Array.isArray(current.aliases) ? current.aliases : [];
        const set = new Set(aliases);
        if (action === 'hide') set.add(HIDDEN_CAPABILITY_MARKER);
        if (action === 'unhide') set.delete(HIDDEN_CAPABILITY_MARKER);
        const updated = await prisma.capability.update({
          where: { id },
          data: { aliases: Array.from(set) },
        });
        return NextResponse.json(updated);
      }
      if (action === 'edit') {
        const updated = await prisma.capability.update({ where: { id }, data: data || {} });
        return NextResponse.json(updated);
      }
    }

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
  } catch (error: any) {
    const code = error?.message;
    if (code === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (code === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    return NextResponse.json({ error: 'Failed to update admin record' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminFromToken(request);
    const body = await request.json();
    const { target, data } = body || {};
    if (target !== 'category' && target !== 'capability') {
      return NextResponse.json({ error: 'Only capability creation is supported' }, { status: 400 });
    }

    const name = String(data?.name || '').trim();
    if (!name) {
      return NextResponse.json({ error: 'Capability name is required' }, { status: 400 });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const created = await prisma.capability.create({
      data: {
        type: 'INDUSTRY',
        name,
        slug,
        aliases: [ADMIN_CAPABILITY_MARKER],
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    const code = error?.message;
    if (code === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (code === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    return NextResponse.json({ error: 'Failed to create capability' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdminFromToken(request);
    const body = await request.json();
    const { target, id } = body || {};
    if (!target || !id) {
      return NextResponse.json({ error: 'target and id are required' }, { status: 400 });
    }

    if (target === 'supplier') {
      await prisma.supplierProfile.delete({ where: { id } });
      return NextResponse.json({ success: true });
    }
    if (target === 'buyer') {
      await prisma.buyerProfile.delete({ where: { id } });
      return NextResponse.json({ success: true });
    }
    if (target === 'storefront') {
      await prisma.storefrontProfile.delete({ where: { id } });
      return NextResponse.json({ success: true });
    }
    if (target === 'request') {
      await prisma.sourcingRequest.delete({ where: { id } });
      return NextResponse.json({ success: true });
    }
    if (target === 'listing') {
      await prisma.storefrontListing.delete({ where: { id } });
      return NextResponse.json({ success: true });
    }
    if (target === 'category' || target === 'capability') {
      await prisma.capability.delete({ where: { id } });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unsupported delete target' }, { status: 400 });
  } catch (error: any) {
    const code = error?.message;
    if (code === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (code === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    return NextResponse.json({ error: 'Failed to delete record' }, { status: 500 });
  }
}
