import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { openai } from '@/lib/openai';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  query: z.string().min(2),
});

// What we want the model to return (stable JSON)
const IntentSchema = z.object({
  province: z.string().optional(),   // "ON", "Ontario", etc.
  city: z.string().optional(),
  intent: z.enum(['buy', 'sell']).optional(), // maps to Profile.primaryIntent
  capabilityHints: z.array(z.object({
    type: z.enum(['PROCESS', 'MATERIAL', 'FINISH', 'CERTIFICATION', 'INDUSTRY', 'SERVICE', 'COMPANY_TYPE']),
    keywords: z.array(z.string()).min(1),
  })).default([]),
});

function normalizeProvince(p?: string): string | undefined {
  if (!p) return undefined;
  const s = p.trim().toLowerCase();
  const map: Record<string, string> = {
    'ontario': 'ON', 'on': 'ON',
    'quebec': 'QC', 'qc': 'QC',
    'british columbia': 'BC', 'bc': 'BC',
    'alberta': 'AB', 'ab': 'AB',
    'manitoba': 'MB', 'mb': 'MB',
    'saskatchewan': 'SK', 'sk': 'SK',
    'nova scotia': 'NS', 'ns': 'NS',
    'new brunswick': 'NB', 'nb': 'NB',
    'newfoundland': 'NL', 'nl': 'NL', 'newfoundland and labrador': 'NL',
    'pei': 'PE', 'pe': 'PE', 'prince edward island': 'PE',
    'northwest territories': 'NT', 'nt': 'NT',
    'nunavut': 'NU', 'nu': 'NU',
    'yukon': 'YT', 'yt': 'YT',
  };
  return map[s] ?? p.toUpperCase();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query } = BodySchema.parse(body);

    // 1) NL -> structured intent using OpenAI
    let intent;
    try {
      // Try structured outputs first (if supported by model)
      const intentResponse = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You convert user searches for Canadian manufacturers into structured filters. Return ONLY valid JSON matching this exact schema: {"province": "string (optional)", "city": "string (optional)", "intent": "buy|sell (optional)", "capabilityHints": [{"type": "PROCESS|MATERIAL|FINISH|CERTIFICATION|INDUSTRY|SERVICE|COMPANY_TYPE", "keywords": ["string"]}]}. The capabilityHints array is required.',
          },
          { role: 'user', content: query },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'profile_search_intent',
            schema: {
              type: 'object',
              properties: {
                province: { type: 'string' },
                city: { type: 'string' },
                intent: { type: 'string', enum: ['buy', 'sell'] },
                capabilityHints: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      type: {
                        type: 'string',
                        enum: ['PROCESS', 'MATERIAL', 'FINISH', 'CERTIFICATION', 'INDUSTRY', 'SERVICE', 'COMPANY_TYPE'],
                      },
                      keywords: {
                        type: 'array',
                        items: { type: 'string' },
                        minItems: 1,
                      },
                    },
                    required: ['type', 'keywords'],
                    additionalProperties: false,
                  },
                },
              },
              required: ['capabilityHints'],
              additionalProperties: false,
            },
          },
        },
        temperature: 0.3,
      });

      const intentText = intentResponse.choices[0]?.message?.content;
      if (!intentText) {
        throw new Error('No response from OpenAI');
      }

      intent = IntentSchema.parse(JSON.parse(intentText));
    } catch (error: any) {
      // Fallback to JSON mode if structured outputs aren't supported
      console.warn('Structured outputs failed, falling back to JSON mode:', error.message);
      const intentResponse = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You convert user searches for Canadian manufacturers into structured filters. Return ONLY valid JSON with this exact structure: {"province": "string (optional)", "city": "string (optional)", "intent": "buy|sell (optional)", "capabilityHints": [{"type": "PROCESS|MATERIAL|FINISH|CERTIFICATION|INDUSTRY|SERVICE|COMPANY_TYPE", "keywords": ["string"]}]}. The capabilityHints array is required and must have at least one item.',
          },
          { role: 'user', content: query },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      });

      const intentText = intentResponse.choices[0]?.message?.content;
      if (!intentText) {
        throw new Error('No response from OpenAI');
      }

      intent = IntentSchema.parse(JSON.parse(intentText));
    }
    const province = normalizeProvince(intent.province);

    // 2) Resolve capability keywords -> Capability IDs (match name/slug/aliases)
    const allKeywords = intent.capabilityHints.flatMap(h =>
      h.keywords.map(k => k.trim()).filter(Boolean)
    );
    const uniqueKeywords = Array.from(new Set(allKeywords.map(k => k.toLowerCase())));

    // If no keywords, we still allow location-only searches.
    const matchedCapabilities = uniqueKeywords.length
      ? await prisma.capability.findMany({
        where: {
          OR: uniqueKeywords.flatMap((k) => [
            { name: { contains: k, mode: 'insensitive' } },
            { slug: { contains: k, mode: 'insensitive' } },
            { aliases: { has: k } }, // exact alias match
          ]),
        },
        take: 50,
      })
      : [];

    // Group matched capability IDs by type (so we can filter more precisely)
    const capIdsByType = new Map<string, string[]>();
    for (const cap of matchedCapabilities) {
      const arr = capIdsByType.get(cap.type) ?? [];
      arr.push(cap.id);
      capIdsByType.set(cap.type, arr);
    }

    // 3) Build Prisma where clause
    const where: any = {
      searchable: true,
    };

    if (province) {
      where.province = { equals: province, mode: 'insensitive' };
    }
    if (intent.city) {
      where.city = { equals: intent.city, mode: 'insensitive' };
    }
    if (intent.intent) {
      where.primaryIntent = intent.intent;
    }

    // Capability filtering:
    // For each requested type, require profile has at least one capability in that type group.
    // (AND across types, OR within a type)
    const requestedTypes = Array.from(new Set(intent.capabilityHints.map(h => h.type)));
    const typeClauses = requestedTypes
      .map((t) => {
        const ids = capIdsByType.get(t) ?? [];
        if (!ids.length) return null;
        return {
          profileCapabilities: {
            some: {
              capabilityId: { in: ids },
            },
          },
        };
      })
      .filter((clause): clause is NonNullable<typeof clause> => clause !== null);

    if (typeClauses.length) {
      where.AND = [...(where.AND ?? []), ...typeClauses];
    }

    // 4) Query profiles + taxonomy relations
    let profiles: any[] = [];
    try {
      profiles = await prisma.sellerProfile.findMany({
        where,
        take: 25,
        orderBy: [
          { profileCompletenessScore: 'desc' },
          { updatedAt: 'desc' },
        ],
        include: {
          profileCapabilities: {
            include: { capability: true },
          },
        },
      });
    } catch (error: any) {
      // Fallback: query without relations if include fails
      console.warn('Could not load profiles with capabilities, querying without:', error.message);
      profiles = await prisma.sellerProfile.findMany({
        where,
        take: 25,
        orderBy: [
          { profileCompletenessScore: 'desc' },
          { updatedAt: 'desc' },
        ],
      });
      // Set empty capabilities for all profiles
      profiles = profiles.map((profile: any) => ({
        ...profile,
        profileCapabilities: [],
      }));
    }

    // 5) Ask OpenAI to format a grounded answer (no extra facts)
    const answerResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You help users find Canadian manufacturers. Only use the provided profiles. If there are zero or weak matches, ask ONE short follow-up question. Be concise and helpful.',
        },
        {
          role: 'user',
          content: `User query: "${query}"

Interpreted filters:
- Province: ${province || 'any'}
- City: ${intent.city || 'any'}
- Intent: ${intent.intent || 'any'}
- Matched ${matchedCapabilities.length} capabilities

Found ${profiles.length} matching profiles:

${JSON.stringify(
            profiles.map((p) => ({
              id: p.id,
              companyName: p.companyName,
              website: p.website,
              city: p.city,
              province: p.province,
              aboutUs: p.aboutUs,
              provincesServed: p.provincesServed,
              shippingCapability: p.shippingCapability,
              typicalJobSize: p.typicalJobSize,
              minOrderQty: p.minOrderQty,
              leadTimeMinDays: p.leadTimeMinDays,
              leadTimeMaxDays: p.leadTimeMaxDays,
              capabilities: p.profileCapabilities.map((pc) => ({
                type: pc.capability.type,
                name: pc.capability.name,
                isCore: pc.isCore,
                verified: pc.verified,
                mode: pc.mode,
              })),
            })),
            null,
            2
          )}

Provide a helpful response to the user's query based on these results.`,
        },
      ],
      temperature: 0.7,
    });

    const answer = answerResponse.choices[0]?.message?.content || 'No results found.';

    return NextResponse.json({
      interpreted: { ...intent, province },
      matchedCapabilities: matchedCapabilities.map((c) => ({
        id: c.id,
        type: c.type,
        name: c.name,
        slug: c.slug,
      })),
      profiles: profiles.map((p) => ({
        id: p.id,
        companyName: p.companyName,
        website: p.website,
        city: p.city,
        province: p.province,
        aboutUs: p.aboutUs,
        provincesServed: p.provincesServed,
        shippingCapability: p.shippingCapability,
        typicalJobSize: p.typicalJobSize,
        minOrderQty: p.minOrderQty,
        leadTimeMinDays: p.leadTimeMinDays,
        leadTimeMaxDays: p.leadTimeMaxDays,
        capabilities: p.profileCapabilities.map((pc) => ({
          type: pc.capability.type,
          name: pc.capability.name,
          isCore: pc.isCore,
          verified: pc.verified,
          mode: pc.mode,
        })),
      })),
      answer,
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    console.error('Error in AI profile search:', error);
    return NextResponse.json(
      {
        error: 'Failed to process search query',
        details: error.message || 'Unknown error',
      },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
