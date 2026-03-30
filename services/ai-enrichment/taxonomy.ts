import type { CapabilityType } from '@prisma/client';
import { slugify } from './utils';

export type CanonicalEntry = {
  slug: string;
  name: string;
  aliases: string[];
};

/**
 * Curated manufacturing vocabulary. Keys are canonical slugs; aliases include common synonyms.
 * The model is instructed to emit slug-style values; this layer maps free text → canonical slug + display name.
 */
const PROCESS: CanonicalEntry[] = [
  { slug: 'cnc_milling', name: 'CNC Milling', aliases: ['cnc machining', 'cnc mill', 'milling', 'machining', '3 axis milling', '5 axis milling'] },
  { slug: 'cnc_turning', name: 'CNC Turning', aliases: ['cnc lathe', 'turning', 'lathe'] },
  { slug: 'edm', name: 'EDM', aliases: ['wire edm', 'sinker edm', 'electrical discharge'] },
  { slug: 'sheet_metal', name: 'Sheet Metal', aliases: ['sheet metal fabrication', 'forming', 'brake press'] },
  { slug: 'welding', name: 'Welding', aliases: ['mig welding', 'tig welding', 'stick welding'] },
  { slug: 'casting', name: 'Casting', aliases: ['die casting', 'sand casting', 'investment casting'] },
  { slug: 'forging', name: 'Forging', aliases: ['hot forging', 'cold forging'] },
  { slug: 'injection_molding', name: 'Injection Molding', aliases: ['injection moulding', 'plastic injection'] },
  { slug: 'additive_manufacturing', name: 'Additive Manufacturing', aliases: ['3d printing', '3dp', 'sla', 'sls', 'fdm'] },
  { slug: 'grinding', name: 'Grinding', aliases: ['surface grinding', 'centerless grinding'] },
  { slug: 'heat_treating', name: 'Heat Treating', aliases: ['heat treatment', 'annealing', 'hardening'] },
  { slug: 'plating', name: 'Plating', aliases: ['electroplating', 'anodizing'] },
];

const MATERIAL: CanonicalEntry[] = [
  { slug: 'aluminum', name: 'Aluminum', aliases: ['aluminium', 'al', '6061', '7075'] },
  { slug: 'steel', name: 'Steel', aliases: ['carbon steel', 'stainless steel', 'ss304', 'ss316', 'mild steel'] },
  { slug: 'stainless_steel', name: 'Stainless Steel', aliases: ['ss', 'inox'] },
  { slug: 'brass', name: 'Brass', aliases: ['bronze'] },
  { slug: 'copper', name: 'Copper', aliases: ['cu'] },
  { slug: 'titanium', name: 'Titanium', aliases: ['ti'] },
  { slug: 'plastics', name: 'Plastics', aliases: ['plastic', 'nylon', 'peek', 'delrin', 'abs', 'polycarbonate'] },
  { slug: 'composites', name: 'Composites', aliases: ['carbon fiber', 'fiberglass', 'frp'] },
];

const FINISH: CanonicalEntry[] = [
  { slug: 'anodize', name: 'Anodize', aliases: ['anodizing', 'anodized'] },
  { slug: 'powder_coat', name: 'Powder Coat', aliases: ['powder coating', 'powdercoat'] },
  { slug: 'paint', name: 'Paint', aliases: ['wet paint', 'primer'] },
  { slug: 'passivate', name: 'Passivate', aliases: ['passivation'] },
  { slug: 'polish', name: 'Polish', aliases: ['polishing', 'mirror finish'] },
];

const CERTIFICATION: CanonicalEntry[] = [
  { slug: 'iso_9001', name: 'ISO 9001', aliases: ['iso9001', 'iso 9001:2015', 'quality management'] },
  { slug: 'iso_14001', name: 'ISO 14001', aliases: ['iso14001'] },
  { slug: 'as9100', name: 'AS9100', aliases: ['as 9100', 'aerospace quality'] },
  { slug: 'iatf_16949', name: 'IATF 16949', aliases: ['iatf16949', 'ts16949'] },
  { slug: 'cwb', name: 'CWB', aliases: ['canadian welding bureau'] },
];

const INDUSTRY: CanonicalEntry[] = [
  { slug: 'aerospace', name: 'Aerospace', aliases: ['aero', 'aviation'] },
  { slug: 'automotive', name: 'Automotive', aliases: ['auto', 'ev', 'mobility'] },
  { slug: 'medical_devices', name: 'Medical Devices', aliases: ['medical', 'medtech', 'healthcare'] },
  { slug: 'defense', name: 'Defense', aliases: ['defence', 'military'] },
  { slug: 'energy', name: 'Energy', aliases: ['oil and gas', 'power generation', 'renewables'] },
  { slug: 'industrial_machinery', name: 'Industrial Machinery', aliases: ['machinery', 'heavy equipment'] },
  { slug: 'electronics', name: 'Electronics', aliases: ['pcb', 'semiconductor'] },
];

const SERVICE: CanonicalEntry[] = [
  { slug: 'prototyping', name: 'Prototyping', aliases: ['prototype', 'rapid prototyping'] },
  { slug: 'production_runs', name: 'Production Runs', aliases: ['production', 'serial production'] },
  { slug: 'assembly', name: 'Assembly', aliases: ['mechanical assembly', 'kitting'] },
  { slug: 'design_support', name: 'Design Support', aliases: ['dfm', 'engineering support'] },
  { slug: 'inspection', name: 'Inspection', aliases: ['cmm', 'quality inspection'] },
];

const COMPANY_TYPE: CanonicalEntry[] = [
  { slug: 'oem', name: 'OEM', aliases: ['original equipment manufacturer'] },
  { slug: 'job_shop', name: 'Job Shop', aliases: ['machine shop', 'contract manufacturer'] },
  { slug: 'tier_supplier', name: 'Tier Supplier', aliases: ['tier 1', 'tier 2'] },
  { slug: 'distributor', name: 'Distributor', aliases: ['distribution'] },
];

const BY_TYPE: Record<CapabilityType, CanonicalEntry[]> = {
  PROCESS,
  MATERIAL,
  FINISH,
  CERTIFICATION,
  INDUSTRY,
  SERVICE,
  COMPANY_TYPE,
};

type SynonymIndex = Map<string, { type: CapabilityType; slug: string; name: string }>;

function buildIndex(): SynonymIndex {
  const m = new Map<string, { type: CapabilityType; slug: string; name: string }>();
  for (const [type, entries] of Object.entries(BY_TYPE) as [CapabilityType, CanonicalEntry[]][]) {
    for (const e of entries) {
      const keys = [e.slug, e.name, ...e.aliases].map((s) => slugify(s)).filter(Boolean);
      for (const k of keys) {
        if (!m.has(k)) {
          m.set(k, { type, slug: e.slug, name: e.name });
        }
      }
    }
  }
  return m;
}

const INDEX = buildIndex();

/**
 * Resolve a raw phrase to a canonical slug + display name for a given capability type.
 * Returns null if nothing matches (caller should skip rather than inventing rows).
 */
export function resolveCanonical(type: CapabilityType, raw: string): { slug: string; name: string } | null {
  const term = String(raw ?? '').trim();
  if (!term) return null;
  const key = slugify(term);
  if (!key) return null;

  // Exact slug match within type
  for (const e of BY_TYPE[type]) {
    if (slugify(e.slug) === key || slugify(e.name) === key) {
      return { slug: e.slug, name: e.name };
    }
    for (const a of e.aliases) {
      if (slugify(a) === key) {
        return { slug: e.slug, name: e.name };
      }
    }
  }

  const hit = INDEX.get(key);
  if (hit && hit.type === type) {
    return { slug: hit.slug, name: hit.name };
  }

  // Soft contains (e.g. "cnc machining services" → cnc_milling)
  const lower = term.toLowerCase();
  for (const e of BY_TYPE[type]) {
    for (const a of [e.slug, e.name, ...e.aliases]) {
      if (lower.includes(a.toLowerCase()) || a.toLowerCase().includes(lower)) {
        return { slug: e.slug, name: e.name };
      }
    }
  }

  return null;
}

/**
 * Export a short taxonomy summary for prompts (not the full table — keeps tokens down).
 */
export function getTaxonomyPromptSnippet(): string {
  const lines: string[] = [
    'Canonical vocabulary examples (prefer these slug-style values when they apply):',
    `- Processes: ${PROCESS.map((p) => p.slug).join(', ')}`,
    `- Materials: ${MATERIAL.map((p) => p.slug).join(', ')}`,
    `- Finishes: ${FINISH.map((p) => p.slug).join(', ')}`,
    `- Certifications: ${CERTIFICATION.map((p) => p.slug).join(', ')}`,
    `- Industries: ${INDUSTRY.map((p) => p.slug).join(', ')}`,
    `- Services: ${SERVICE.map((p) => p.slug).join(', ')}`,
    `- Company types: ${COMPANY_TYPE.map((p) => p.slug).join(', ')}`,
  ];
  return lines.join('\n');
}
