import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { openai } from '@/lib/openai';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

function formatPrice(rawPrice: string) {
  const numeric = String(rawPrice ?? '').replace(/[^0-9.]/g, '');
  const parsed = Number.parseFloat(numeric);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  const normalized = Number.isInteger(parsed) ? parsed.toString() : parsed.toFixed(2);
  return `$${normalized}`;
}

export async function POST(req: NextRequest) {
  try {
    const db = prisma as any;
    const body = await req.json();
    const { query } = body;

    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return NextResponse.json(
        { error: 'Query must be at least 2 characters' },
        { status: 400 }
      );
    }

    // Use OpenAI to understand the search intent and extract keywords / location / intent
    const searchResponse = await openai.chat.completions.create({
      model: 'gpt-5-nano',
      messages: [
        {
          role: 'system',
          content: `You convert a user's natural-language query into structured search parameters for a Canadian manufacturing marketplace.

Your primary goal is RETRIEVAL RECALL:
produce structured search data that helps the application find all relevant:
1. companies
2. sourcing requests
3. storefront listings

Stay faithful to the user’s intent, but prefer broader relevant matching over overly narrow matching.

Return EXACTLY ONE valid JSON object with this shape:

{
  "keywords": string[],
  "expanded_keywords": string[],
  "location": string | null,
  "intent": "buy" | "sell" | "both" | null,
  "entity_types": ["companies", "sourcing_requests", "storefront_listings"],
  "materials": string[],
  "processes": string[],
  "search_phrases": string[]
}

Return ONLY valid JSON.
No markdown.
No explanation.
No extra text.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GOAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Interpret the query so the marketplace can retrieve the widest set of relevant results across:
- company profiles
- sourcing requests
- storefront listings

Prefer terms that improve search recall while remaining relevant.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
KEYWORDS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

"keywords":
- Include the most direct manufacturing terms explicitly stated or strongly implied by the query.
- Use short phrases, usually 1–3 words.
- Do not include geographic terms.
- Max 8.

"expanded_keywords":
- Add closely related manufacturing capability terms, buyer-intent variants, and common marketplace phrasing.
- Include synonyms and near-equivalents only when they are genuinely relevant.
- Examples:
  - "laser cutting" → "metal fabrication", "sheet metal fabrication"
  - "CNC machining" → "machining", "precision machining", "milling", "turning"
  - "machine shop" → "machining", "CNC machining", "custom parts"
  - "injection molding" → "plastic molding", "custom plastic parts"
- Do not add unrelated industries or weak associations.
- Max 12.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MATERIALS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Extract material terms if present or clearly implied:
Examples:
- aluminum
- stainless steel
- steel
- plastic
- acrylic
- brass

Return [] if none.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROCESSES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Normalize manufacturing processes from the query into standard marketplace capability labels.

Examples:
- "machine shop" → ["CNC machining"]
- "sheet metal shop" → ["sheet metal fabrication"]
- "waterjet cutting" → ["waterjet cutting"]
- "3d printing" → ["additive manufacturing", "3D printing"]

Return the most useful standardized process terms for matching listings and company capabilities.
Return [] if none.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SEARCH PHRASES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Generate 3–8 concise search phrases that could independently retrieve relevant marketplace results.

Rules:
- Mix exact and broader phrases.
- Include both user wording and marketplace wording.
- Do not include location unless location is essential to the phrase.
- Keep phrases short.

Example:
Query: "aluminum cnc parts toronto"
Possible search_phrases:
[
  "aluminum cnc parts",
  "CNC machining",
  "precision machining",
  "custom machined parts",
  "aluminum machining"
]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LOCATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Extract a Canadian city or province if explicitly present.
Examples:
- "Toronto CNC machining" → "Toronto"
- "machine shop Ontario" → "Ontario"

If none is present, return null.
Do not guess.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INTENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Determine the user’s marketplace intent:

- "buy" → looking for suppliers, manufacturers, shops, or services
- "sell" → offering manufacturing services or promoting a shop/storefront
- "both" → clearly both buying and selling
- null → unclear

Examples:
- "looking for cnc machining" → "buy"
- "need laser cutting" → "buy"
- "we offer machining services" → "sell"
- "our shop does welding and fabrication" → "sell"

If ambiguous, return null.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ENTITY TYPES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Always return exactly:
["companies", "sourcing_requests", "storefront_listings"]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VALIDATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Ensure:
- valid JSON only
- no extra keys
- no geographic terms in keywords or expanded_keywords
- no duplicates across arrays where avoidable
- keep terms relevant to Canadian manufacturing marketplace search
- prefer broader relevant retrieval over narrow exact-match behavior

Now process the user's query.
}`,
        },
        {
          role: 'user',
          content: query,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 1,
    });

    const searchIntent = JSON.parse(searchResponse.choices[0]?.message?.content || '{"keywords": []}');
    const keywords: string[] = searchIntent.keywords || [];
    const location: string = searchIntent.location || '';
    const searchTerms: string[] = keywords.length > 0 ? keywords : query.split(' ').filter((w: string) => w.length > 2);

    // Build search conditions
    const searchConditions = searchTerms.map((term: string) => ({
      OR: [
        { companyName: { contains: term, mode: 'insensitive' as const } },
        { aboutUs: { contains: term, mode: 'insensitive' as const } },
      ],
    }));

    const locationCondition = location
      ? {
        OR: [
          { city: { contains: location, mode: 'insensitive' as const } },
          { province: { contains: location, mode: 'insensitive' as const } },
        ],
      }
      : {};

    // Search Companies (Profiles)
    let companies: any[] = [];
    try {
      companies = await db.supplierProfile.findMany({
        where: {
          AND: [
            { searchable: true },
            ...(searchConditions.length > 0 ? [{ OR: searchConditions }] : []),
            ...(location ? [locationCondition] : []),
          ],
        },
        //take: 20,
        include: {
          profileCapabilities: {
            include: { capability: true },
          },
        },
        orderBy: [
          { profileCompletenessScore: 'desc' },
          { updatedAt: 'desc' },
        ],
      });
    } catch (error: any) {
      // Fallback: query without relations if include fails
      console.warn('Could not load profiles with capabilities, querying without:', error.message);
      companies = await db.supplierProfile.findMany({
        where: {
          AND: [
            { searchable: true },
            ...(searchConditions.length > 0 ? [{ OR: searchConditions }] : []),
            ...(location ? [locationCondition] : []),
          ],
        },
        //take: 20,
        orderBy: [
          { profileCompletenessScore: 'desc' },
          { updatedAt: 'desc' },
        ],
      });
      // Set empty capabilities for all profiles
      companies = companies.map((profile: any) => ({
        ...profile,
        profileCapabilities: [],
      }));
    }

    // Search Supplier Listings
    const listingSearchConditions = searchTerms.map((term: string) => ({
      OR: [
        { title: { contains: term, mode: 'insensitive' as const } },
        { description: { contains: term, mode: 'insensitive' as const } },
        { listingType: { contains: term, mode: 'insensitive' as const } },
      ],
    }));

    const listings = await db.storefrontListing.findMany({
      where: {
        AND: [
          { active: true },
          ...(listingSearchConditions.length > 0 ? [{ OR: listingSearchConditions }] : []),
          ...(location ? [{ location: { contains: location, mode: 'insensitive' as const } }] : []),
        ],
      },
      //take: 20,
      include: {
        supplierProfile: {
          select: {
            companyName: true,
            province: true,
            certifications: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Search Sourcing Requests
    const requestSearchConditions = searchTerms.map((term: string) => ({
      OR: [
        { title: { contains: term, mode: 'insensitive' as const } },
        { description: { contains: term, mode: 'insensitive' as const } },
        { category: { contains: term, mode: 'insensitive' as const } },
      ],
    }));

    const requests = await db.sourcingRequest.findMany({
      where: {
        AND: [
          { active: true },
          ...(requestSearchConditions.length > 0 ? [{ OR: requestSearchConditions }] : []),
        ],
      },
      //take: 20,
      include: {
        buyerProfile: {
          select: {
            companyName: true,
            province: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Format results
    const formattedCompanies = companies.map((p: any) => ({
      id: p.id,
      name: p.companyName,
      location: `${p.city || ''}, ${p.province || ''}`.trim().replace(/^,/, ''),
      description: p.aboutUs || '',
      capabilities: p.profileCapabilities.map((pc: any) => pc.capability.name),
      industriesServed: p.industriesServed || [],
      province: p.province || '',
      city: p.city || '',
      certifications: p.certifications || [],
      website: p.website,
      logoUrl: null,
      selectedIcon: null,
    }));

    const formattedListings = listings.map((l: any) => ({
      id: l.id,
      title: l.title,
      supplier: l.supplierProfile.companyName,
      price: l.price || '',
      listingType: l.listingType || '',
      condition: l.condition || '',
      location: l.location || '',
      description: l.description || '',
      createdAt: l.createdAt.toISOString(),
      logoUrl: null,
      selectedIcon: null,
      supplierProvince: l.supplierProfile.province || '',
      supplierCertifications: l.supplierProfile.certifications || [],
    }));

    const formattedRequests = requests.map((r: any) => ({
      id: r.id,
      title: r.title,
      company: r.companyName,
      province: r.targetProvince || r.buyerProfile?.province || '',
      category: r.category || '',
      description: r.description || '',
      quantity: r.quantity || '',
      targetPrice: r.targetPrice ? formatPrice(r.targetPrice) || r.targetPrice : '',
      deadline: r.deadline ? r.deadline.toISOString() : null,
      createdAt: r.createdAt.toISOString(),
      location: [r.targetCity, r.targetProvince].filter(Boolean).join(', ') || '',
      logoUrl: null,
      selectedIcon: null,
    }));

    return NextResponse.json({
      query,
      companies: formattedCompanies,
      listings: formattedListings,
      requests: formattedRequests,
      counts: {
        companies: formattedCompanies.length,
        listings: formattedListings.length,
        requests: formattedRequests.length,
      },
    });
  } catch (error: any) {
    console.error('Error in search:', error);
    return NextResponse.json(
      {
        error: 'Failed to process search query',
        details: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
