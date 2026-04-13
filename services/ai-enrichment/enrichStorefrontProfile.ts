import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { runJsonCompletion } from './openai-client';
import { buildStorefrontProfilePrompts } from './prompts';
import { storefrontProfileAiOutputSchema } from './schemas';
import { truncateError, tryParseJson } from './utils';

export async function enrichStorefrontProfile(storefrontProfileId: string): Promise<void> {
  const row = await prisma.storefrontProfile.findUnique({
    where: { id: storefrontProfileId },
  });
  if (!row) {
    console.warn('[ai-enrichment] storefront profile not found:', storefrontProfileId);
    return;
  }

  const payload: Record<string, unknown> = {
    company_name: row.companyName,
    first_name: row.firstName,
    last_name: row.lastName,
    email: row.email,
    role: row.role,
    street_address: row.streetAddress,
    city: row.city,
    province: row.province,
    website: row.website,
  };

  const { system, user } = buildStorefrontProfilePrompts(payload);
  const completion = await runJsonCompletion({ system, user });
  if (!completion.ok) {
    await prisma.storefrontProfile.update({
      where: { id: storefrontProfileId },
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
    await prisma.storefrontProfile.update({
      where: { id: storefrontProfileId },
      data: {
        aiStatus: 'failed',
        aiError: 'Invalid JSON from model',
        aiEnrichedAt: new Date(),
      },
    });
    return;
  }

  const validated = storefrontProfileAiOutputSchema.safeParse(parsedUnknown);
  if (!validated.success) {
    await prisma.storefrontProfile.update({
      where: { id: storefrontProfileId },
      data: {
        aiStatus: 'failed',
        aiError: truncateError(validated.error.message),
        aiEnrichedAt: new Date(),
      },
    });
    return;
  }

  const data = validated.data;
  await prisma.storefrontProfile.update({
    where: { id: storefrontProfileId },
    data: {
      aiSchema: data as unknown as Prisma.InputJsonValue,
      aiSummary: data.summary ?? null,
      aiStatus: 'completed',
      aiEnrichedAt: new Date(),
      aiError: null,
    },
  });
}
