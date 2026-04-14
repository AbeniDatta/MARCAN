import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { openai } from '@/lib/openai';
import { normalizeIndustriesServed } from '@/lib/industryHubNormalize';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

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
          content: `You are a query parser for a Canadian manufacturing marketplace.

This marketplace has three types of listings:
- Companies (manufacturers, suppliers, service providers)
- Storefront Listings (seller listings: raw materials, excess parts, equipment/machinery for sale or lease, extra space)
- Sourcing Requests (buyer listings: people looking for specific items, materials, services, or space)

Convert the user query into ONE strict JSON object with exactly these keys:

{
  "keywords": string[],
  "location": string | null,
  "intent": "buy" | "sell" | "both" | null,
  "listing_types": ("company" | "storefront" | "sourcing_request")[]
}

Output requirements:
- Return ONLY valid JSON.
- No markdown, no comments, no extra keys.
- Always include all 4 keys.
- If uncertain, use null (or [] for keywords).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
KEYWORDS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Extract up to 8 relevant terms covering any of:
- Manufacturing capabilities or processes
- Materials (raw or processed)
- Equipment, machinery, or tools
- Parts or components
- Space (warehouse, floor space, storage)
- Industry verticals (automotive, aerospace, food processing, etc.)

Include:
1) Direct terms from the query
2) Closely related terms ONLY when strongly implied

Rules:
- Lowercase all keywords.
- 1–3 words per keyword.
- Remove punctuation and duplicates.
- Remove all geographic words.
- Exclude low-signal filler: "best", "good", "cheap", "company", "service", "near me", "help", "looking", "available", "want", "need", "some", "specs", "test".
- Do not invent unrelated industries or capabilities.
- Prefer canonical phrasing: "cnc machining", "injection molding", "sheet metal", "raw material".
- Normalize singular/plural to the more common form (e.g. "aluminum extrusion" not "aluminum extrusions").
- If no meaningful manufacturing terms can be extracted, return [].

Examples:
  "laser cutting toronto"         → ["laser cutting", "metal fabrication", "sheet metal"]
  "surplus aluminum extrusions"   → ["aluminum extrusion", "surplus material", "aluminum", "raw material"]
  "cnc lathe available for lease" → ["cnc lathe", "lathe", "cnc machining", "machinery lease"]
  "warehouse space mississauga"   → ["warehouse space", "storage space", "floor space"]
  "plastic injection molding"     → ["injection molding", "plastic molding", "plastic"]
  "i want to sell some test specs"→ []

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LOCATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Extract a Canadian city or province if explicitly present.
- If multiple locations appear, use the most specific (city over province).
- If the location is not clearly Canadian, set location = null.
- Do not guess or infer location.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INTENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

"buy"  → user is seeking suppliers, services, materials, equipment, or space
         Cues: "looking for", "need", "seeking", "sourcing", "quote for", "where can I find", "anyone selling"

"sell" → user is offering services, listing materials, equipment, or space
         Cues: "we offer", "for sale", "for lease", "available", "I have", "renting out", "listing", "our shop provides", "i want to sell"

"both" → user explicitly signals both buying and selling

null   → intent is unclear or not stated

Conflict rules:
- If both buy and sell cues are explicit → "both"
- If only weak or ambiguous cues → null
- "need a buyer" → "sell" (user has something, wants to find a buyer)
- "need a supplier" → "buy" (user wants to find someone to buy from)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LISTING TYPES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Return all listing types that are relevant. Must be a non-empty array.

"company"          → user references or seeks a business/service provider
                     Cues: "machine shop", "supplier", "manufacturer", "company", "shop"

"storefront"       → user references items, materials, equipment, or space being offered for sale or lease
                     Cues: "for sale", "for lease", "surplus", "excess", "available", "renting out", "used equipment"

"sourcing_request" → user is posting or searching for a buying/sourcing need
                     Cues: "looking for", "need", "sourcing", "seeking", "anyone who can", "where can I find"

Intent-to-listing-type guidance:
- intent "sell" → prioritize ["sourcing_request", "storefront"] (find buyers, or list items)
- intent "buy"  → prioritize ["company", "storefront", "sourcing_request"]
- intent "both" or null → return all three

Rules:
- Include all types that clearly apply.
- For general or ambiguous queries, default to all three: ["company", "storefront", "sourcing_request"]
- For clearly targeted queries, return only the relevant type(s).

Examples:
  "laser cutting toronto"               → ["company", "storefront", "sourcing_request"]
  "cnc lathe for lease"                 → ["storefront"]
  "looking for aluminum extrusions"     → ["storefront", "sourcing_request"]
  "we offer injection molding services" → ["company"]
  "i want to sell some test specs"      → ["sourcing_request", "storefront"]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HARD FALLBACK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

If the query is too vague, off-topic, or contains no extractable manufacturing signal, return:

{
  "keywords": [],
  "location": null,
  "intent": null,
  "listing_types": ["company", "storefront", "sourcing_request"]
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FINAL CHECK (before output)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- JSON is valid
- Exactly 4 keys present
- keywords contain no locations, no filler words, all lowercase
- location is explicitly Canadian or null
- intent is one of: "buy", "sell", "both", null
- listing_types is a non-empty array of valid values

Now parse this user query:
{USER_QUERY}
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
    const intent: 'buy' | 'sell' | 'both' | null =
      searchIntent.intent === 'buy' ||
        searchIntent.intent === 'sell' ||
        searchIntent.intent === 'both'
        ? searchIntent.intent
        : null;
    const searchTerms: string[] = keywords.length > 0 ? keywords : query.split(' ').filter((w: string) => w.length > 2);

    // Build company search conditions from profile text, taxonomy relations, and legacy arrays.
    const companySearchConditions = searchTerms.map((term: string) => ({
      OR: [
        { firstName: { contains: term, mode: 'insensitive' as const } },
        { lastName: { contains: term, mode: 'insensitive' as const } },
        { email: { contains: term, mode: 'insensitive' as const } },
        { companyName: { contains: term, mode: 'insensitive' as const } },
        { businessNumber: { contains: term, mode: 'insensitive' as const } },
        { website: { contains: term, mode: 'insensitive' as const } },
        { phone: { contains: term, mode: 'insensitive' as const } },
        { streetAddress: { contains: term, mode: 'insensitive' as const } },
        { city: { contains: term, mode: 'insensitive' as const } },
        { province: { contains: term, mode: 'insensitive' as const } },
        { aboutUs: { contains: term, mode: 'insensitive' as const } },
        { jobTitle: { contains: term, mode: 'insensitive' as const } },
        { rfqEmail: { contains: term, mode: 'insensitive' as const } },
        { aiSummary: { contains: term, mode: 'insensitive' as const } },
        { profileCapabilities: { some: { capability: { name: { contains: term, mode: 'insensitive' as const } } } } },
        { certifications: { has: term } },
        { industries: { has: term } },
        { capabilities: { has: term } },
        { primaryProcesses: { has: term } },
        { materials: { has: term } },
        { finishes: { has: term } },
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

    const companyWhere = {
      AND: [
        { searchable: true },
        ...(companySearchConditions.length > 0 ? [{ OR: companySearchConditions }] : []),
        ...(location ? [locationCondition] : []),
      ],
    };

    // Search Companies (Profiles)
    let companies: any[] = [];
    try {
      companies = await db.supplierProfile.findMany({
        where: companyWhere,
        //take: 20,
        include: {
          profileCapabilities: {
            include: { capability: true },
          },
        },
        orderBy: [{ updatedAt: 'desc' }],
      });
    } catch (error: any) {
      // Fallback: query without relations if include fails
      console.warn('Could not load profiles with capabilities, querying without:', error.message);
      companies = await db.supplierProfile.findMany({
        where: companyWhere,
        //take: 20,
        orderBy: [{ updatedAt: 'desc' }],
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
        { price: { contains: term, mode: 'insensitive' as const } },
        { listingType: { contains: term, mode: 'insensitive' as const } },
        { location: { contains: term, mode: 'insensitive' as const } },
        { aiSummary: { contains: term, mode: 'insensitive' as const } },
        {
          supplierProfile: {
            is: {
              OR: [
                { firstName: { contains: term, mode: 'insensitive' as const } },
                { lastName: { contains: term, mode: 'insensitive' as const } },
                { email: { contains: term, mode: 'insensitive' as const } },
                { companyName: { contains: term, mode: 'insensitive' as const } },
                { businessNumber: { contains: term, mode: 'insensitive' as const } },
                { website: { contains: term, mode: 'insensitive' as const } },
                { phone: { contains: term, mode: 'insensitive' as const } },
                { streetAddress: { contains: term, mode: 'insensitive' as const } },
                { city: { contains: term, mode: 'insensitive' as const } },
                { province: { contains: term, mode: 'insensitive' as const } },
                { aboutUs: { contains: term, mode: 'insensitive' as const } },
                { jobTitle: { contains: term, mode: 'insensitive' as const } },
                { rfqEmail: { contains: term, mode: 'insensitive' as const } },
                { aiSummary: { contains: term, mode: 'insensitive' as const } },
                { profileCapabilities: { some: { capability: { name: { contains: term, mode: 'insensitive' as const } } } } },
                { certifications: { has: term } },
                { industries: { has: term } },
                { capabilities: { has: term } },
                { primaryProcesses: { has: term } },
                { materials: { has: term } },
                { finishes: { has: term } },
              ],
            },
          },
        },
      ],
    }));

    const listingLocationCondition = location
      ? {
        OR: [
          { location: { contains: location, mode: 'insensitive' as const } },
          { supplierProfile: { is: { city: { contains: location, mode: 'insensitive' as const } } } },
          { supplierProfile: { is: { province: { contains: location, mode: 'insensitive' as const } } } },
          { supplierProfile: { is: { streetAddress: { contains: location, mode: 'insensitive' as const } } } },
        ],
      }
      : {};

    const listings = await db.storefrontListing.findMany({
      where: {
        AND: [
          { active: true },
          ...(listingSearchConditions.length > 0 ? [{ OR: listingSearchConditions }] : []),
          ...(location ? [listingLocationCondition] : []),
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
        { quantity: { contains: term, mode: 'insensitive' as const } },
        { targetPrice: { contains: term, mode: 'insensitive' as const } },
        { targetCity: { contains: term, mode: 'insensitive' as const } },
        { targetProvince: { contains: term, mode: 'insensitive' as const } },
        { aiSummary: { contains: term, mode: 'insensitive' as const } },
        {
          buyerProfile: {
            is: {
              OR: [
                { firstName: { contains: term, mode: 'insensitive' as const } },
                { lastName: { contains: term, mode: 'insensitive' as const } },
                { email: { contains: term, mode: 'insensitive' as const } },
                { companyName: { contains: term, mode: 'insensitive' as const } },
                { jobTitle: { contains: term, mode: 'insensitive' as const } },
                { aiSummary: { contains: term, mode: 'insensitive' as const } },
              ],
            },
          },
        },
      ],
    }));

    const requestLocationCondition = location
      ? {
        OR: [
          { targetCity: { contains: location, mode: 'insensitive' as const } },
          { targetProvince: { contains: location, mode: 'insensitive' as const } },
        ],
      }
      : {};

    const requests = await db.sourcingRequest.findMany({
      where: {
        AND: [
          { active: true },
          ...(requestSearchConditions.length > 0 ? [{ OR: requestSearchConditions }] : []),
          ...(location ? [requestLocationCondition] : []),
        ],
      },
      //take: 20,
      include: {
        buyerProfile: {
          select: {
            companyName: true,
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
      industriesServed: normalizeIndustriesServed(p.capabilities || []),
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
      company: r.buyerProfile?.companyName || '',
      province: r.targetProvince || '',
      category: r.category || '',
      description: r.description || '',
      quantity: r.quantity || '',
      targetPrice: r.targetPrice || '',
      deadline: r.deadline ? r.deadline.toISOString() : null,
      isAsap: r.isAsap,
      createdAt: r.createdAt.toISOString(),
      logoUrl: null,
      selectedIcon: null,
    }));

    return NextResponse.json({
      query,
      intent,
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
