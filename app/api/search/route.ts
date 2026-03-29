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
          content: `You convert a user's natural-language marketplace query into structured retrieval data for a Canadian manufacturing marketplace.

Your goal is to maximize relevant search recall across:
- company_profile
- sourcing_request
- surplus_listing

Return EXACTLY ONE valid JSON object in this format:

{
  "query_intent": "find_suppliers" | "post_requirement" | "sell_inventory" | "browse" | null,
  "target_entity_types": string[],
  "normalized_terms": {
    "materials": string[],
    "processes": string[],
    "industries": string[],
    "capabilities": string[],
    "certifications": string[],
    "location": string[],
    "location_preference": string[],
    "asset_category": string[],
    "brand": string[],
    "volume": string[]
  },
  "commercial_terms": {
    "urgency": "low" | "medium" | "high" | null,
    "deadline": string | null
  },
  "raw_search_terms": string[],
  "expanded_search_terms": string[],
  "embedding_query_text": ""
}

Return ONLY valid JSON.
No markdown.
No explanation.
No extra text.

IMPORTANT RULES:

1. Use normalized taxonomy-style values where possible.
   Examples:
   - "aluminium" -> "aluminum"
   - "CNC milling" -> "cnc_machining" and possibly "milling"
   - "machine shop" -> "cnc_machining"
   - "sheet metal shop" -> "sheet_metal_fabrication"

2. Prefer marketplace retrieval usefulness over literal phrasing.
   The output should help retrieve all relevant company profiles, sourcing requests, and listings.

3. Do not invent weakly related terms.
   Only include terms clearly stated or strongly implied.

4. Preserve the user's original wording in raw_search_terms.

5. expanded_search_terms should include close marketplace synonyms and related buyer/seller phrasing.

6. target_entity_types:
   - Default to ["company_profile", "sourcing_request", "surplus_listing"]
   - But if the query is clearly about equipment or used inventory, prioritize ["surplus_listing"]
   - If clearly about finding suppliers, include at least ["company_profile", "sourcing_request"]
   - If clearly about selling services, include at least ["company_profile"]

7. query_intent:
   - "find_suppliers" = user wants a manufacturer, supplier, shop, or service provider
   - "post_requirement" = user describes a job/request they need quoted or sourced
   - "sell_inventory" = user wants to sell equipment, materials, or surplus
   - "browse" = exploratory or unclear
   - null if truly unclear

8. commercial_terms:
   - Extract urgency if explicit or strongly implied
   - Extract deadline only if explicitly provided
   - Otherwise null

9. embedding_query_text:
   Write one short natural sentence optimized for semantic retrieval across all entity types.

Examples:

User query: "looking for aluminum cnc machining suppliers in ontario for aerospace prototypes"
Output should resemble:
{
  "query_intent": "find_suppliers",
  "target_entity_types": ["company_profile", "sourcing_request", "surplus_listing"],
  "normalized_terms": {
    "materials": ["aluminum"],
    "processes": ["cnc_machining"],
    "industries": ["aerospace"],
    "capabilities": ["prototype"],
    "certifications": [],
    "location": ["ontario"],
    "location_preference": [],
    "asset_category": [],
    "brand": [],
    "volume": []
  },
  "commercial_terms": {
    "urgency": null,
    "deadline": null
  },
  "raw_search_terms": ["aluminum cnc machining", "aerospace prototypes"],
  "expanded_search_terms": ["machining", "precision machining", "milling", "custom machined parts"],
  "embedding_query_text": "Find Ontario aerospace prototype suppliers for aluminum CNC machining."
}

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
