import { prisma } from '@/lib/prisma';

export const TRUSTED_BY_WIDGET_SETTING_SLUG = 'admin-config-trusted-by-widget';

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
