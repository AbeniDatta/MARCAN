import type { CapabilityType, Prisma } from '@prisma/client';
import type { SupplierAiOutput } from './schemas';
import { resolveCanonical } from './taxonomy';
import { slugify } from './utils';

type Db = Prisma.TransactionClient;

async function ensureCapability(
  tx: Db,
  type: CapabilityType,
  slug: string,
  name: string
): Promise<{ id: string }> {
  const existing = await tx.capability.findFirst({
    where: { type, slug },
    select: { id: true },
  });
  if (existing) return existing;
  return tx.capability.create({
    data: {
      type,
      slug,
      name,
      aliases: [],
    },
    select: { id: true },
  });
}

function coreFlags(parsed: SupplierAiOutput): Set<string> {
  const s = new Set<string>();
  for (const c of parsed.core_capabilities ?? []) {
    const k = slugify(c);
    if (k) s.add(k);
  }
  return s;
}

function isCoreTerm(core: Set<string>, raw: string, resolvedSlug: string): boolean {
  const r = slugify(raw);
  const s = slugify(resolvedSlug);
  if (core.has(r) || core.has(s)) return true;
  return Array.from(core).some((k) => k === r || k === s);
}

/**
 * Maps AI-normalized supplier capabilities into `Capability` + `ProfileCapability` rows.
 * Does not remove existing signup/manual links. Skips unknown terms (no Capability row invented here).
 */
export async function mapSupplierCapabilitiesFromAi(
  tx: Db,
  supplierProfileId: string,
  parsed: SupplierAiOutput
): Promise<void> {
  const core = coreFlags(parsed);
  type Row = { type: CapabilityType; slug: string; name: string; isCore: boolean };
  const byKey = new Map<string, Row>();

  const add = (type: CapabilityType, raw: string) => {
    const term = String(raw ?? '').trim();
    if (!term) return;
    const resolved = resolveCanonical(type, term);
    if (!resolved) return;
    const key = `${type}:${resolved.slug}`;
    const isCore = isCoreTerm(core, term, resolved.slug);
    const prev = byKey.get(key);
    if (!prev) {
      byKey.set(key, { type, slug: resolved.slug, name: resolved.name, isCore });
    } else if (isCore && !prev.isCore) {
      byKey.set(key, { ...prev, isCore: true });
    }
  };

  const nc = parsed.normalized_capabilities;
  for (const x of nc.processes) add('PROCESS', x);
  for (const x of nc.materials) add('MATERIAL', x);
  for (const x of nc.finishes) add('FINISH', x);
  for (const x of nc.certifications) add('CERTIFICATION', x);
  for (const x of nc.industries) add('INDUSTRY', x);
  for (const x of nc.services) add('SERVICE', x);
  for (const x of nc.company_types) add('COMPANY_TYPE', x);

  // Core-only mentions: try resolve on core_capabilities across types
  const order: CapabilityType[] = [
    'PROCESS',
    'MATERIAL',
    'FINISH',
    'CERTIFICATION',
    'INDUSTRY',
    'SERVICE',
    'COMPANY_TYPE',
  ];
  for (const raw of parsed.core_capabilities ?? []) {
    const term = String(raw ?? '').trim();
    if (!term) continue;
    let hit: { type: CapabilityType; slug: string; name: string } | null = null;
    for (const t of order) {
      const r = resolveCanonical(t, term);
      if (r) {
        hit = { type: t, ...r };
        break;
      }
    }
    if (!hit) continue;
    const key = `${hit.type}:${hit.slug}`;
    const prev = byKey.get(key);
    if (!prev) {
      byKey.set(key, { type: hit.type, slug: hit.slug, name: hit.name, isCore: true });
    } else if (!prev.isCore) {
      byKey.set(key, { ...prev, isCore: true });
    }
  }

  const existingLinks = await tx.profileCapability.findMany({
    where: { supplierProfileId },
    select: { capabilityId: true },
  });
  const existingIds = new Set(existingLinks.map((l) => l.capabilityId));

  for (const row of Array.from(byKey.values())) {
    const cap = await ensureCapability(tx, row.type, row.slug, row.name);
    if (existingIds.has(cap.id)) continue;
    await tx.profileCapability.create({
      data: {
        supplierProfileId,
        capabilityId: cap.id,
        source: 'ai',
        isCore: row.isCore,
        verified: false,
      },
    });
    existingIds.add(cap.id);
  }
}
