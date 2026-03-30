import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { runJsonCompletion } from './openai-client';
import { buildSourcingRequestPrompts } from './prompts';
import { sourcingRequestAiOutputSchema } from './schemas';
import { truncateError, tryParseJson } from './utils';

export async function enrichSourcingRequest(sourcingRequestId: string): Promise<void> {
  const row = await prisma.sourcingRequest.findUnique({
    where: { id: sourcingRequestId },
    include: {
      buyerProfile: {
        select: {
          companyName: true,
          city: true,
          province: true,
        },
      },
    },
  });
  if (!row) {
    console.warn('[ai-enrichment] sourcing request not found:', sourcingRequestId);
    return;
  }

  const payload: Record<string, unknown> = {
    title: row.title,
    company_name: row.companyName,
    category: row.category,
    description: row.description,
    quantity: row.quantity,
    target_price: row.targetPrice,
    deadline: row.deadline ? row.deadline.toISOString() : null,
    target_city: row.targetCity,
    target_province: row.targetProvince,
    buyer_company_name: row.buyerProfile?.companyName,
    buyer_city: row.buyerProfile?.city,
    buyer_province: row.buyerProfile?.province,
  };

  const { system, user } = buildSourcingRequestPrompts(payload);
  const completion = await runJsonCompletion({ system, user });
  if (!completion.ok) {
    await prisma.sourcingRequest.update({
      where: { id: sourcingRequestId },
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
    await prisma.sourcingRequest.update({
      where: { id: sourcingRequestId },
      data: {
        aiStatus: 'failed',
        aiError: 'Invalid JSON from model',
        aiEnrichedAt: new Date(),
      },
    });
    return;
  }

  const validated = sourcingRequestAiOutputSchema.safeParse(parsedUnknown);
  if (!validated.success) {
    await prisma.sourcingRequest.update({
      where: { id: sourcingRequestId },
      data: {
        aiStatus: 'failed',
        aiError: truncateError(validated.error.message),
        aiEnrichedAt: new Date(),
      },
    });
    return;
  }

  const data = validated.data;
  await prisma.sourcingRequest.update({
    where: { id: sourcingRequestId },
    data: {
      aiSchema: data as unknown as Prisma.InputJsonValue,
      aiSummary: data.summary ?? null,
      aiStatus: 'completed',
      aiEnrichedAt: new Date(),
      aiError: null,
    },
  });
}
