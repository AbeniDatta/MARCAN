import { NextResponse } from 'next/server';
import {
  DEFAULT_DEVELOPMENT_DISCLAIMER_TEXT,
  DEFAULT_DEVELOPMENT_DISCLAIMER_TITLE,
  getDevelopmentDisclaimerTitle,
  getDevelopmentDisclaimerText,
  getDevelopmentDisclaimerVisible,
  getTrustedByWidgetVisible,
} from '@/lib/platformSettings';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const trustedByWidgetVisible = await getTrustedByWidgetVisible();
    const developmentDisclaimerVisible = await getDevelopmentDisclaimerVisible();
    const developmentDisclaimerText = await getDevelopmentDisclaimerText();
    const developmentDisclaimerTitle = await getDevelopmentDisclaimerTitle();
    return NextResponse.json({
      trustedByWidgetVisible,
      developmentDisclaimerVisible,
      developmentDisclaimerText,
      developmentDisclaimerTitle,
    });
  } catch {
    return NextResponse.json({
      trustedByWidgetVisible: true,
      developmentDisclaimerVisible: true,
      developmentDisclaimerText: DEFAULT_DEVELOPMENT_DISCLAIMER_TEXT,
      developmentDisclaimerTitle: DEFAULT_DEVELOPMENT_DISCLAIMER_TITLE,
    });
  }
}
