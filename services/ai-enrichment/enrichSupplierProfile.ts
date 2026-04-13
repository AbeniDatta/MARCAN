import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { runJsonCompletion } from './openai-client';
import { buildSupplierProfilePrompts } from './prompts';
import { supplierAiOutputSchema, type SupplierAiOutput } from './schemas';
import { mapSupplierCapabilitiesFromAi } from './mapSupplierCapabilities';
import { formatZodError, truncateError, tryParseJson } from './utils';

function supplierPayload(row: {
  companyName: string;
  city: string | null;
  province: string | null;
  aboutUs: string | null;
  website: string | null;
  phone: string | null;
  streetAddress: string;
  primaryProcesses?: string[];
  materials: string[];
  certifications: string[];
  provincesServed: string[];
  capabilities: string[];
  typicalJobSize: string | null;
  leadTimeMinDays: number | null;
  leadTimeMaxDays: number | null;
}): Record<string, unknown> {
  const legacyPrimary = (row.primaryProcesses ?? (row as any).capabilities ?? []) as string[];
  return {
    company_name: row.companyName,
    city: row.city,
    province: row.province,
    street_address: row.streetAddress,
    about_us: row.aboutUs,
    website: row.website,
    phone: row.phone,
    legacy_capabilities: legacyPrimary,
    legacy_materials: row.materials,
    legacy_certifications: row.certifications,
    provinces_served: row.provincesServed,
    industries_served: row.capabilities,
    typical_job_size: row.typicalJobSize,
    lead_time_min_days: row.leadTimeMinDays,
    lead_time_max_days: row.leadTimeMaxDays,
  };
}

/**
 * Fetches the supplier profile, calls OpenAI, validates JSON, persists `ai_*` fields,
 * and appends AI-derived `ProfileCapability` links (preserves existing rows).
 */
export async function enrichSupplierProfile(supplierProfileId: string): Promise<void> {
  const row = await prisma.supplierProfile.findUnique({
    where: { id: supplierProfileId },
  });
  if (!row) {
    console.warn('[ai-enrichment] supplier profile not found:', supplierProfileId);
    return;
  }

  const { system, user } = buildSupplierProfilePrompts(supplierPayload(row as any));
  const completion = await runJsonCompletion({ system, user });
  if (!completion.ok) {
    await prisma.supplierProfile.update({
      where: { id: supplierProfileId },
      data: {
        aiStatus: 'failed',
        aiError: truncateError(completion.error),
        aiEnrichedAt: new Date(),
      },
    });
    return;
  }

  const parsedUnknown = tryParseJson(completion.raw);
  if (parsedUnknown === undefined) {
    await prisma.supplierProfile.update({
      where: { id: supplierProfileId },
      data: {
        aiStatus: 'failed',
        aiError: 'Invalid JSON from model',
        aiEnrichedAt: new Date(),
      },
    });
    return;
  }

  const validated = supplierAiOutputSchema.safeParse(parsedUnknown);
  if (!validated.success) {
    const detail = formatZodError(validated.error);
    console.warn('[ai-enrichment] supplier zod failed:', supplierProfileId, detail);
    await prisma.supplierProfile.update({
      where: { id: supplierProfileId },
      data: {
        aiStatus: 'failed',
        aiError: truncateError(detail || validated.error.message),
        aiEnrichedAt: new Date(),
      },
    });
    return;
  }

  const data: SupplierAiOutput = validated.data;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.supplierProfile.update({
        where: { id: supplierProfileId },
        data: {
          aiSchema: data as unknown as Prisma.InputJsonValue,
          aiSummary: data.summary ?? null,
          aiStatus: 'completed',
          aiEnrichedAt: new Date(),
          aiError: null,
        },
      });
      await mapSupplierCapabilitiesFromAi(tx, supplierProfileId, data);
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[ai-enrichment] supplier persist failed:', supplierProfileId, msg);
    await prisma.supplierProfile.update({
      where: { id: supplierProfileId },
      data: {
        aiStatus: 'failed',
        aiError: truncateError(msg),
        aiEnrichedAt: new Date(),
      },
    });
  }
}
