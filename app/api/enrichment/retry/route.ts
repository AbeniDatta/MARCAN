import { NextRequest, NextResponse } from 'next/server';
import {
  enrichBuyerProfile,
  enrichSupplierProfile,
  enrichStorefrontListing,
  enrichStorefrontProfile,
  enrichSourcingRequest,
} from '@/services/ai-enrichment';

export const dynamic = 'force-dynamic';

type Entity =
  | 'supplier_profile'
  | 'buyer_profile'
  | 'storefront_profile'
  | 'sourcing_request'
  | 'storefront_listing';

/**
 * Manual / cron re-run of AI enrichment. Protect with `ENRICHMENT_RETRY_SECRET`.
 * POST JSON: `{ "entity": "supplier_profile", "id": "<uuid>" }`
 * Header: `Authorization: Bearer <ENRICHMENT_RETRY_SECRET>`
 */
export async function POST(request: NextRequest) {
  const secret = process.env.ENRICHMENT_RETRY_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      { error: 'ENRICHMENT_RETRY_SECRET is not configured' },
      { status: 503 }
    );
  }

  const auth = request.headers.get('authorization') || '';
  const token = auth.replace(/^Bearer\s+/i, '').trim();
  if (token !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { entity?: string; id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const entity = body.entity as Entity | undefined;
  const id = body.id;
  if (!entity || !id || typeof id !== 'string') {
    return NextResponse.json({ error: 'entity and id are required' }, { status: 400 });
  }

  const runners: Record<Entity, (x: string) => Promise<void>> = {
    supplier_profile: enrichSupplierProfile,
    buyer_profile: enrichBuyerProfile,
    storefront_profile: enrichStorefrontProfile,
    sourcing_request: enrichSourcingRequest,
    storefront_listing: enrichStorefrontListing,
  };

  const run = runners[entity];
  if (!run) {
    return NextResponse.json({ error: 'Unknown entity' }, { status: 400 });
  }

  try {
    await run(id);
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[enrichment/retry]', entity, id, msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
