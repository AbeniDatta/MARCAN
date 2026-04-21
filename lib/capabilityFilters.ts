import { INDUSTRY_HUBS_EN } from '@/lib/industryHubNormalize';

export const ADMIN_CAPABILITY_MARKER = '__admin_capability__';

type CapabilityLike = {
  name?: string | null;
  aliases?: string[] | null;
};

export function selectCoreAndAdminIndustryNames(rows: CapabilityLike[]): string[] {
  const base = Array.from(INDUSTRY_HUBS_EN) as string[];
  const baseSet = new Set<string>(base);
  const adminNames = (Array.isArray(rows) ? rows : [])
    .filter((row) => {
      const aliases = Array.isArray(row?.aliases) ? row.aliases : [];
      return aliases.includes(ADMIN_CAPABILITY_MARKER);
    })
    .map((row) => String(row?.name || '').trim())
    .filter((name) => name.length > 0 && !baseSet.has(name));

  return [...base, ...adminNames];
}

export function isCoreOrAdminIndustryCapability(row: CapabilityLike): boolean {
  const name = String(row?.name || '').trim();
  if (INDUSTRY_HUBS_EN.includes(name as (typeof INDUSTRY_HUBS_EN)[number])) return true;
  const aliases = Array.isArray(row?.aliases) ? row.aliases : [];
  return aliases.includes(ADMIN_CAPABILITY_MARKER);
}
