import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { runJsonCompletion } from './openai-client';
import { buildBuyerProfilePrompts } from './prompts';
import { buyerAiOutputSchema } from './schemas';
import { truncateError, tryParseJson } from './utils';

export async function enrichBuyerProfile(buyerProfileId: string): Promise<void> {
  const row = await prisma.buyerProfile.findUnique({
    where: { id: buyerProfileId },
  });
  if (!row) {
    console.warn('[ai-enrichment] buyer profile not found:', buyerProfileId);
    return;
  }

  const payload: Record<string, unknown> = {
    company_name: row.companyName,
    first_name: row.firstName,
    last_name: row.lastName,
    email: row.email,
    job_title: row.jobTitle,
    phone: row.phone,
    city: row.city,
    province: row.province,
  };

  const { system, user } = buildBuyerProfilePrompts(payload);
  const completion = await runJsonCompletion({ system, user });
  if (!completion.ok) {
    await prisma.buyerProfile.update({
      where: { id: buyerProfileId },
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
    await prisma.buyerProfile.update({
      where: { id: buyerProfileId },
      data: {
        aiStatus: 'failed',
        aiError: 'Invalid JSON from model',
        aiEnrichedAt: new Date(),
      },
    });
    return;
  }

  const validated = buyerAiOutputSchema.safeParse(parsedUnknown);
  if (!validated.success) {
    await prisma.buyerProfile.update({
      where: { id: buyerProfileId },
      data: {
        aiStatus: 'failed',
        aiError: truncateError(validated.error.message),
        aiEnrichedAt: new Date(),
      },
    });
    return;
  }

  const data = validated.data;
  await prisma.buyerProfile.update({
    where: { id: buyerProfileId },
    data: {
      aiSchema: data as unknown as Prisma.InputJsonValue,
      aiSummary: data.summary ?? null,
      aiStatus: 'completed',
      aiEnrichedAt: new Date(),
      aiError: null,
    },
  });
}
