import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { runJsonCompletion } from './openai-client';
import { buildStorefrontListingPrompts } from './prompts';
import { storefrontListingAiOutputSchema } from './schemas';
import { truncateError, tryParseJson } from './utils';

export async function enrichStorefrontListing(listingId: string): Promise<void> {
  const row = await prisma.storefrontListing.findUnique({
    where: { id: listingId },
    include: {
      supplierProfile: {
        select: { companyName: true, city: true, province: true },
      },
    },
  });
  if (!row) {
    console.warn('[ai-enrichment] storefront listing not found:', listingId);
    return;
  }

  const payload: Record<string, unknown> = {
    title: row.title,
    description: row.description,
    price: row.price,
    category: row.category,
    listing_type: row.listingType,
    condition: row.condition,
    location: row.location,
    supplier_company: row.supplierProfile?.companyName,
    supplier_city: row.supplierProfile?.city,
    supplier_province: row.supplierProfile?.province,
  };

  const { system, user } = buildStorefrontListingPrompts(payload);
  const completion = await runJsonCompletion({ system, user });
  if (!completion.ok) {
    await prisma.storefrontListing.update({
      where: { id: listingId },
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
    await prisma.storefrontListing.update({
      where: { id: listingId },
      data: {
        aiStatus: 'failed',
        aiError: 'Invalid JSON from model',
        aiEnrichedAt: new Date(),
      },
    });
    return;
  }

  const validated = storefrontListingAiOutputSchema.safeParse(parsedUnknown);
  if (!validated.success) {
    await prisma.storefrontListing.update({
      where: { id: listingId },
      data: {
        aiStatus: 'failed',
        aiError: truncateError(validated.error.message),
        aiEnrichedAt: new Date(),
      },
    });
    return;
  }

  const data = validated.data;
  await prisma.storefrontListing.update({
    where: { id: listingId },
    data: {
      aiSchema: data as unknown as Prisma.InputJsonValue,
      aiSummary: data.summary ?? null,
      aiStatus: 'completed',
      aiEnrichedAt: new Date(),
      aiError: null,
    },
  });
}
