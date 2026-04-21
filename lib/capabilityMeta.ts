const CAPABILITY_DESC_PREFIX = '__desc__:';
const CAPABILITY_ICON_PREFIX = '__icon__:';
const CAPABILITY_COLOR_PREFIX = '__color__:';

const CAPABILITY_ICON_POOL = [
  'fa-microchip',
  'fa-fire',
  'fa-spray-can-sparkles',
  'fa-screwdriver-wrench',
  'fa-robot',
  'fa-cubes',
  'fa-life-ring',
  'fa-industry',
  'fa-gears',
  'fa-bolt',
  'fa-wrench',
  'fa-compass-drafting',
];

const CAPABILITY_COLOR_POOL = [
  { key: 'blue', bgClass: 'bg-blue-500/10', iconClass: 'text-blue-400', ctaClass: 'text-blue-400' },
  { key: 'orange', bgClass: 'bg-orange-500/10', iconClass: 'text-orange-400', ctaClass: 'text-orange-400' },
  { key: 'purple', bgClass: 'bg-purple-500/10', iconClass: 'text-purple-400', ctaClass: 'text-purple-400' },
  { key: 'green', bgClass: 'bg-green-500/10', iconClass: 'text-green-400', ctaClass: 'text-green-400' },
  { key: 'cyan', bgClass: 'bg-cyan-500/10', iconClass: 'text-cyan-400', ctaClass: 'text-cyan-400' },
  { key: 'fuchsia', bgClass: 'bg-fuchsia-500/10', iconClass: 'text-fuchsia-400', ctaClass: 'text-fuchsia-400' },
  { key: 'amber', bgClass: 'bg-amber-500/10', iconClass: 'text-amber-400', ctaClass: 'text-amber-400' },
  { key: 'rose', bgClass: 'bg-rose-500/10', iconClass: 'text-rose-400', ctaClass: 'text-rose-400' },
  { key: 'teal', bgClass: 'bg-teal-500/10', iconClass: 'text-teal-400', ctaClass: 'text-teal-400' },
  { key: 'indigo', bgClass: 'bg-indigo-500/10', iconClass: 'text-indigo-400', ctaClass: 'text-indigo-400' },
];

export function sanitizeCapabilityDescription(raw: string, maxLength: number): string {
  const cleaned = String(raw || '').replace(/\s+/g, ' ').trim();
  return cleaned.slice(0, maxLength);
}

export function chooseRandomCapabilityIcon(): string {
  const idx = Math.floor(Math.random() * CAPABILITY_ICON_POOL.length);
  return CAPABILITY_ICON_POOL[idx] || 'fa-industry';
}

export function chooseCapabilityColorKey(usedColorKeys: string[]): string {
  const used = new Set((usedColorKeys || []).map((key) => String(key || '').trim()).filter(Boolean));
  const available = CAPABILITY_COLOR_POOL.filter((color) => !used.has(color.key));
  const source = available.length > 0 ? available : CAPABILITY_COLOR_POOL;
  const idx = Math.floor(Math.random() * source.length);
  return source[idx]?.key || 'blue';
}

export function getCapabilityColorClasses(colorKey: string | null | undefined): {
  bgClass: string;
  iconClass: string;
  ctaClass: string;
} {
  const key = String(colorKey || '').trim();
  const found = CAPABILITY_COLOR_POOL.find((color) => color.key === key);
  return found || { bgClass: 'bg-slate-500/10', iconClass: 'text-slate-300', ctaClass: 'text-slate-300' };
}

export function readCapabilityMetaFromAliases(aliases: string[] | null | undefined): {
  description: string | null;
  icon: string | null;
  color: string | null;
} {
  const safe = Array.isArray(aliases) ? aliases : [];
  const descEntry = safe.find((value) => value.startsWith(CAPABILITY_DESC_PREFIX));
  const iconEntry = safe.find((value) => value.startsWith(CAPABILITY_ICON_PREFIX));
  const colorEntry = safe.find((value) => value.startsWith(CAPABILITY_COLOR_PREFIX));
  const description = descEntry ? descEntry.slice(CAPABILITY_DESC_PREFIX.length).trim() : null;
  const icon = iconEntry ? iconEntry.slice(CAPABILITY_ICON_PREFIX.length).trim() : null;
  const color = colorEntry ? colorEntry.slice(CAPABILITY_COLOR_PREFIX.length).trim() : null;
  return {
    description: description || null,
    icon: icon || null,
    color: color || null,
  };
}

export function withCapabilityMetaAliases(
  aliases: string[] | null | undefined,
  meta: { description?: string | null; icon?: string | null; color?: string | null },
): string[] {
  const safe = Array.isArray(aliases) ? aliases : [];
  const next = safe.filter(
    (value) =>
      !value.startsWith(CAPABILITY_DESC_PREFIX) &&
      !value.startsWith(CAPABILITY_ICON_PREFIX) &&
      !value.startsWith(CAPABILITY_COLOR_PREFIX),
  );
  if (meta.description) next.push(`${CAPABILITY_DESC_PREFIX}${meta.description}`);
  if (meta.icon) next.push(`${CAPABILITY_ICON_PREFIX}${meta.icon}`);
  if (meta.color) next.push(`${CAPABILITY_COLOR_PREFIX}${meta.color}`);
  return next;
}
