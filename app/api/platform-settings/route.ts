import { NextResponse } from 'next/server';
import { getTrustedByWidgetVisible } from '@/lib/platformSettings';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const trustedByWidgetVisible = await getTrustedByWidgetVisible();
    return NextResponse.json({ trustedByWidgetVisible });
  } catch {
    return NextResponse.json({ trustedByWidgetVisible: true });
  }
}
