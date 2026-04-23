import { prisma } from '@/lib/prisma';

export const TRUSTED_BY_WIDGET_SETTING_SLUG = 'admin-config-trusted-by-widget';
export const DISCLAIMER_VISIBILITY_SETTING_SLUG = 'admin-config-development-disclaimer-visibility';
export const DISCLAIMER_TEXT_SETTING_SLUG = 'admin-config-development-disclaimer-text';
export const DISCLAIMER_TITLE_SETTING_SLUG = 'admin-config-development-disclaimer-title';

export const DEFAULT_DEVELOPMENT_DISCLAIMER_TEXT =
  'This platform is currently in development preview and some features may change.';
export const DEFAULT_DEVELOPMENT_DISCLAIMER_TITLE = 'Beta release';

export async function getTrustedByWidgetVisible(): Promise<boolean> {
  const row = await prisma.capability.findFirst({
    where: {
      type: 'SERVICE',
      slug: TRUSTED_BY_WIDGET_SETTING_SLUG,
    },
    select: {
      aliases: true,
    },
  });

  if (!row) return true;
  const aliases = Array.isArray(row.aliases) ? row.aliases : [];
  return aliases.includes('hidden') ? false : true;
}

export async function setTrustedByWidgetVisible(visible: boolean): Promise<void> {
  await prisma.capability.upsert({
    where: {
      type_slug: {
        type: 'SERVICE',
        slug: TRUSTED_BY_WIDGET_SETTING_SLUG,
      },
    },
    create: {
      type: 'SERVICE',
      slug: TRUSTED_BY_WIDGET_SETTING_SLUG,
      name: 'Admin setting: trusted by widget',
      aliases: visible ? ['visible'] : ['hidden'],
    },
    update: {
      aliases: visible ? ['visible'] : ['hidden'],
    },
  });
}

export async function getDevelopmentDisclaimerVisible(): Promise<boolean> {
  const row = await prisma.capability.findFirst({
    where: {
      type: 'SERVICE',
      slug: DISCLAIMER_VISIBILITY_SETTING_SLUG,
    },
    select: {
      aliases: true,
    },
  });

  if (!row) return true;
  const aliases = Array.isArray(row.aliases) ? row.aliases : [];
  return aliases.includes('hidden') ? false : true;
}

export async function setDevelopmentDisclaimerVisible(visible: boolean): Promise<void> {
  await prisma.capability.upsert({
    where: {
      type_slug: {
        type: 'SERVICE',
        slug: DISCLAIMER_VISIBILITY_SETTING_SLUG,
      },
    },
    create: {
      type: 'SERVICE',
      slug: DISCLAIMER_VISIBILITY_SETTING_SLUG,
      name: 'Admin setting: development disclaimer visibility',
      aliases: visible ? ['visible'] : ['hidden'],
    },
    update: {
      aliases: visible ? ['visible'] : ['hidden'],
    },
  });
}

export async function getDevelopmentDisclaimerText(): Promise<string> {
  const row = await prisma.capability.findFirst({
    where: {
      type: 'SERVICE',
      slug: DISCLAIMER_TEXT_SETTING_SLUG,
    },
    select: {
      aliases: true,
    },
  });

  const aliases = Array.isArray(row?.aliases) ? row.aliases : [];
  const textAlias = aliases.find((x) => typeof x === 'string' && x.startsWith('text:'));
  if (!textAlias) return DEFAULT_DEVELOPMENT_DISCLAIMER_TEXT;
  const value = textAlias.slice(5).trim();
  return value || DEFAULT_DEVELOPMENT_DISCLAIMER_TEXT;
}

export async function setDevelopmentDisclaimerText(text: string): Promise<void> {
  const normalized = String(text || '').trim() || DEFAULT_DEVELOPMENT_DISCLAIMER_TEXT;
  await prisma.capability.upsert({
    where: {
      type_slug: {
        type: 'SERVICE',
        slug: DISCLAIMER_TEXT_SETTING_SLUG,
      },
    },
    create: {
      type: 'SERVICE',
      slug: DISCLAIMER_TEXT_SETTING_SLUG,
      name: 'Admin setting: development disclaimer text',
      aliases: [`text:${normalized}`],
    },
    update: {
      aliases: [`text:${normalized}`],
    },
  });
}

export async function getDevelopmentDisclaimerTitle(): Promise<string> {
  const row = await prisma.capability.findFirst({
    where: {
      type: 'SERVICE',
      slug: DISCLAIMER_TITLE_SETTING_SLUG,
    },
    select: {
      aliases: true,
    },
  });

  const aliases = Array.isArray(row?.aliases) ? row.aliases : [];
  const titleAlias = aliases.find((x) => typeof x === 'string' && x.startsWith('title:'));
  if (!titleAlias) return DEFAULT_DEVELOPMENT_DISCLAIMER_TITLE;
  const value = titleAlias.slice(6).trim();
  return value || DEFAULT_DEVELOPMENT_DISCLAIMER_TITLE;
}

export async function setDevelopmentDisclaimerTitle(title: string): Promise<void> {
  const normalized = String(title || '').trim() || DEFAULT_DEVELOPMENT_DISCLAIMER_TITLE;
  await prisma.capability.upsert({
    where: {
      type_slug: {
        type: 'SERVICE',
        slug: DISCLAIMER_TITLE_SETTING_SLUG,
      },
    },
    create: {
      type: 'SERVICE',
      slug: DISCLAIMER_TITLE_SETTING_SLUG,
      name: 'Admin setting: development disclaimer title',
      aliases: [`title:${normalized}`],
    },
    update: {
      aliases: [`title:${normalized}`],
    },
  });
}
