import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { openai } from '@/lib/openai';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query } = body;

    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return NextResponse.json(
        { error: 'Query must be at least 2 characters' },
        { status: 400 }
      );
    }

    // Use OpenAI to understand the search intent and extract keywords
    const searchResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You help users search for Canadian manufacturing companies, supplier listings, and sourcing requests. Extract relevant keywords, location hints, and intent from the user query. Return JSON with: {"keywords": ["keyword1", "keyword2"], "location": "city or province (optional)", "intent": "buy|sell|both (optional)"}',
        },
        {
          role: 'user',
          content: query,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
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
    const companies = await prisma.profile.findMany({
      where: {
        AND: [
          { searchable: true },
          ...(searchConditions.length > 0 ? [{ OR: searchConditions }] : []),
          ...(location ? [locationCondition] : []),
        ],
      },
      take: 20,
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

    // Search Supplier Listings
    const listingSearchConditions = searchTerms.map((term: string) => ({
      OR: [
        { title: { contains: term, mode: 'insensitive' as const } },
        { description: { contains: term, mode: 'insensitive' as const } },
        { listingType: { contains: term, mode: 'insensitive' as const } },
      ],
    }));

    const listings = await prisma.listing.findMany({
      where: {
        AND: [
          { active: true },
          ...(listingSearchConditions.length > 0 ? [{ OR: listingSearchConditions }] : []),
          ...(location ? [{ location: { contains: location, mode: 'insensitive' as const } }] : []),
        ],
      },
      take: 20,
      include: {
        profile: {
          select: {
            companyName: true,
            logoUrl: true,
            selectedIcon: true,
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

    const requests = await prisma.wishlistRequest.findMany({
      where: {
        AND: [
          { active: true },
          ...(requestSearchConditions.length > 0 ? [{ OR: requestSearchConditions }] : []),
        ],
      },
      take: 20,
      include: {
        profile: {
          select: {
            companyName: true,
            logoUrl: true,
            selectedIcon: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Format results
    const formattedCompanies = companies.map((p) => ({
      id: p.id,
      name: p.companyName,
      location: `${p.city || ''}, ${p.province || ''}`.trim().replace(/^,/, ''),
      description: p.aboutUs || '',
      capabilities: p.profileCapabilities.map((pc) => pc.capability.name),
      website: p.website,
      logoUrl: p.logoUrl,
      selectedIcon: p.selectedIcon,
    }));

    const formattedListings = listings.map((l) => ({
      id: l.id,
      title: l.title,
      seller: l.profile.companyName,
      price: l.price || '',
      listingType: l.listingType || '',
      condition: l.condition || '',
      location: l.location || '',
      description: l.description || '',
      createdAt: l.createdAt.toISOString(),
      logoUrl: l.profile.logoUrl,
      selectedIcon: l.profile.selectedIcon,
    }));

    const formattedRequests = requests.map((r) => ({
      id: r.id,
      title: r.title,
      company: r.companyName,
      category: r.category || '',
      description: r.description || '',
      quantity: r.quantity || '',
      targetPrice: r.targetPrice || '',
      deadline: r.deadline ? r.deadline.toISOString() : null,
      createdAt: r.createdAt.toISOString(),
      logoUrl: r.profile.logoUrl,
      selectedIcon: r.profile.selectedIcon,
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
