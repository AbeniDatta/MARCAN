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
          content: `You convert a user's natural-language search query into structured retrieval data for MARCAN, a Canadian manufacturing marketplace.

Your job is to produce normalized search metadata that helps retrieve the most relevant results across these marketplace entity types:

- supplier_profile
- sourcing_request
- storefront_listing

Return EXACTLY ONE valid JSON object.
Return JSON only.
No markdown.
No explanation.
No extra text.

Use this exact structure:

{
  "query_intent": "find_suppliers" | "find_buyers" | "find_listings" | "sell_inventory" | "browse" | null,
  "target_entity_types": string[],
  "normalized_terms": {
    "materials": string[],
    "processes": string[],
    "industries": string[],
    "certifications": string[],
    "services": string[],
    "company_types": string[],
    "location": string[],
    "location_preference": string[],
    "equipment_types": string[],
    "listing_classes": string[],
    "brands": string[],
    "job_size": string[],
    "keywords": string[]
  },
  "commercial_terms": {
    "urgency": "low" | "medium" | "high" | null,
    "deadline": string | null,
    "quantity": string | null,
    "target_price": string | null
  },
  "raw_search_terms": string[],
  "expanded_search_terms": string[],
  "embedding_query_text": string
}

IMPORTANT RULES:

1. Normalize terminology to canonical marketplace values where possible.
   Examples:
   - "aluminium" -> "aluminum"
   - "AL" -> "aluminum"
   - "CNC machining shop" -> process "cnc_machining"
   - "machine shop" -> company_types may include "machine_shop"
   - "sheet metal shop" -> process "sheet_metal_fabrication"
   - "ISO 9001 certified" -> certification "iso_9001"

2. Optimize for marketplace retrieval usefulness.
   The output should help retrieve relevant supplier profiles, sourcing requests, and storefront listings.

3. Do not invent weakly related terms.
   Only include terms that are explicit or strongly supported by the query.

4. Preserve the user's original wording in raw_search_terms where useful.

5. expanded_search_terms should include only close, high-confidence marketplace synonyms or equivalent phrasing.
   Do not over-expand.

6. target_entity_types:
   - Default to ["supplier_profile", "sourcing_request", "storefront_listing"]
   - If the query is clearly about finding suppliers, prioritize "supplier_profile"
   - If the query is clearly about who needs work / who is buying / open jobs / RFQs, prioritize "sourcing_request"
   - If the query is clearly about used equipment, surplus, extra material, extra capacity, or sale posts, prioritize "storefront_listing"

7. query_intent meanings:
   - "find_suppliers" = user wants a manufacturer, supplier, fabricator, machine shop, or service provider
   - "find_buyers" = user wants to find companies or requests that need something sourced or quoted
   - "find_listings" = user wants equipment, inventory, machine time, space, or other listings
   - "sell_inventory" = user appears to be offering equipment, material, capacity, or assets for sale
   - "browse" = exploratory or broad search
   - null only if truly unclear

8. commercial_terms:
   - Extract urgency only if explicit or strongly implied
   - Extract deadline only if explicit
   - Extract quantity only if explicit
   - Extract target_price only if explicit
   - Otherwise use null

9. location handling:
   - Put explicit location terms in "location"
   - Put preferred service-area or shipping-region style locations in "location_preference"
   - Normalize Canadian provinces where possible

10. Distinguish carefully:
   - processes = manufacturing operations like cnc_machining, welding, laser_cutting
   - services = broader service offerings like design_support, prototyping, assembly
   - company_types = broad business/seller types like machine_shop, foundry, fabricator
   - equipment_types = specific equipment or machine categories
   - listing_classes = one or more of inventory, equipment, machine_time, space, service

11. embedding_query_text:
   Write one short, natural sentence optimized for semantic retrieval across the target entity types.

12. If the query is mixed, include all relevant target_entity_types and the strongest overall intent.

Examples:

Example 1
User query: "looking for aluminum cnc machining suppliers in ontario for aerospace prototypes"

{
  "query_intent": "find_suppliers",
  "target_entity_types": ["supplier_profile", "sourcing_request", "storefront_listing"],
  "normalized_terms": {
    "materials": ["aluminum"],
    "processes": ["cnc_machining"],
    "industries": ["aerospace"],
    "certifications": [],
    "services": ["prototyping"],
    "company_types": ["machine_shop"],
    "location": ["ontario"],
    "location_preference": [],
    "equipment_types": [],
    "listing_classes": [],
    "brands": [],
    "job_size": ["prototype"],
    "keywords": ["aluminum cnc machining", "aerospace prototypes"]
  },
  "commercial_terms": {
    "urgency": null,
    "deadline": null,
    "quantity": null,
    "target_price": null
  },
  "raw_search_terms": ["aluminum cnc machining suppliers", "aerospace prototypes", "ontario"],
  "expanded_search_terms": ["precision machining", "cnc milling", "custom machined parts", "prototype machining"],
  "embedding_query_text": "Find Ontario suppliers for aerospace prototype aluminum CNC machining."
}

Example 2
User query: "who needs stainless welding in alberta"

{
  "query_intent": "find_buyers",
  "target_entity_types": ["sourcing_request", "supplier_profile"],
  "normalized_terms": {
    "materials": ["stainless_steel"],
    "processes": ["welding"],
    "industries": [],
    "certifications": [],
    "services": [],
    "company_types": [],
    "location": ["alberta"],
    "location_preference": [],
    "equipment_types": [],
    "listing_classes": [],
    "brands": [],
    "job_size": [],
    "keywords": ["stainless welding"]
  },
  "commercial_terms": {
    "urgency": null,
    "deadline": null,
    "quantity": null,
    "target_price": null
  },
  "raw_search_terms": ["who needs stainless welding", "alberta"],
  "expanded_search_terms": ["stainless steel welding", "fabrication", "welded assemblies"],
  "embedding_query_text": "Find Alberta sourcing requests or buyers needing stainless steel welding."
}

Example 3
User query: "used haas cnc for sale in quebec"

{
  "query_intent": "find_listings",
  "target_entity_types": ["storefront_listing"],
  "normalized_terms": {
    "materials": [],
    "processes": [],
    "industries": [],
    "certifications": [],
    "services": [],
    "company_types": [],
    "location": ["quebec"],
    "location_preference": [],
    "equipment_types": ["cnc_machine"],
    "listing_classes": ["equipment"],
    "brands": ["haas"],
    "job_size": [],
    "keywords": ["used haas cnc", "for sale"]
  },
  "commercial_terms": {
    "urgency": null,
    "deadline": null,
    "quantity": null,
    "target_price": null
  },
  "raw_search_terms": ["used haas cnc", "for sale", "quebec"],
  "expanded_search_terms": ["used cnc machine", "haas machine", "second-hand cnc equipment"],
  "embedding_query_text": "Find used Haas CNC equipment listings in Quebec."
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
            email: true,
            rfqEmail: true,
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
            email: true,
            userId: true,
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
      profileId: l.profileId,
      storefrontProfileId: l.storefrontProfileId ?? null,
      title: l.title,
      supplier: l.supplierProfile.companyName,
      supplierEmail: l.supplierProfile?.rfqEmail || l.supplierProfile?.email || null,
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
      companyName: r.companyName,
      province: r.targetProvince || r.buyerProfile?.province || '',
      category: r.category || '',
      description: r.description || '',
      quantity: r.quantity || '',
      targetPrice: r.targetPrice ? formatPrice(r.targetPrice) || r.targetPrice : '',
      deadline: r.deadline ? r.deadline.toISOString() : null,
      createdAt: r.createdAt.toISOString(),
      location: [r.targetCity, r.targetProvince].filter(Boolean).join(', ') || '',
      buyerEmail: r.buyerProfile?.email ?? r.buyerProfile?.userId ?? null,
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
