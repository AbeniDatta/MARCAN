import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { websiteUrl } = body;

        if (!websiteUrl || typeof websiteUrl !== 'string') {
            return NextResponse.json({ error: 'Website URL is required' }, { status: 400 });
        }

        // Validate URL format
        let url: URL;
        try {
            url = new URL(websiteUrl);
            if (!url.protocol.startsWith('http')) {
                return NextResponse.json({ error: 'URL must start with http:// or https://' }, { status: 400 });
            }
        } catch {
            return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
        }

        // Fetch website content
        let htmlContent = '';
        try {
            const response = await fetch(url.toString(), {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                },
                signal: AbortSignal.timeout(10000), // 10 second timeout
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            htmlContent = await response.text();

            // Limit content size to avoid token limits (keep first 50k characters)
            if (htmlContent.length > 50000) {
                htmlContent = htmlContent.substring(0, 50000);
            }
        } catch (error: any) {
            console.error('Error fetching website:', error);
            return NextResponse.json(
                { error: `Failed to fetch website: ${error.message}` },
                { status: 400 }
            );
        }

        // Get all capabilities for matching
        const allCapabilities = await prisma.capability.findMany({
            select: {
                id: true,
                type: true,
                name: true,
                slug: true,
            },
        });

        // Use OpenAI to extract structured information
        const extractionResponse = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: `You are extracting company information from a website for a Canadian manufacturing supplier registration form. 
Extract the following information and return it as JSON:
- companyName: Legal company name
- city: City location
- province: Canadian province code (ON, QC, BC, AB, MB, SK, NS, NB, NL, PE, NT, YT, NU)
- provincesServed: Array of province codes the company serves
- companyType: Company type (match to available types)
- website: Website URL
- aboutUs: Company description/about section
- processes: Array of manufacturing processes (match to available PROCESS capabilities)
- materials: Array of materials worked with (match to available MATERIAL capabilities)
- finishes: Array of finishes offered (match to available FINISH capabilities)
- certifications: Array of certifications held (match to available CERTIFICATION capabilities)
- industries: Array of industries served (match to available INDUSTRY capabilities)
- typicalJobSize: PROTOTYPE, LOW_VOLUME, MEDIUM_VOLUME, or HIGH_VOLUME
- leadTimeMinDays: Minimum lead time in days (number)
- leadTimeMaxDays: Maximum lead time in days (number)
- maxPartSizeMmX: Maximum part size X dimension in mm (number, optional)
- maxPartSizeMmY: Maximum part size Y dimension in mm (number, optional)
- maxPartSizeMmZ: Maximum part size Z dimension in mm (number, optional)
- rfqEmail: Email for RFQ inquiries
- preferredContactMethod: EMAIL or PLATFORM_ONLY

Available capabilities:
${JSON.stringify(allCapabilities, null, 2)}

Return ONLY valid JSON matching this structure. Use null for missing values. For arrays, use empty arrays if none found.`,
                },
                {
                    role: 'user',
                    content: `Extract company information from this website HTML:\n\n${htmlContent.substring(0, 40000)}`,
                },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.3,
        });

        const extractedData = JSON.parse(extractionResponse.choices[0]?.message?.content || '{}');

        // Match capability names to IDs
        const matchCapabilities = (names: string[], type: string): string[] => {
            if (!Array.isArray(names)) return [];
            const matched: string[] = [];
            const typeCaps = allCapabilities.filter((c) => c.type === type);

            names.forEach((name) => {
                const lowerName = name.toLowerCase().trim();
                const match = typeCaps.find(
                    (cap) =>
                        cap.name.toLowerCase().includes(lowerName) ||
                        cap.slug.toLowerCase().includes(lowerName) ||
                        lowerName.includes(cap.name.toLowerCase()) ||
                        lowerName.includes(cap.slug.toLowerCase())
                );
                if (match) {
                    matched.push(match.id);
                }
            });

            return Array.from(new Set(matched)); // Remove duplicates
        };

        // Format the response with matched capability IDs
        const formattedData = {
            companyName: extractedData.companyName || '',
            city: extractedData.city || '',
            province: extractedData.province || '',
            provincesServed: Array.isArray(extractedData.provincesServed)
                ? extractedData.provincesServed
                : [],
            companyType: extractedData.companyType || null,
            website: extractedData.website || websiteUrl,
            aboutUs: extractedData.aboutUs || '',
            processes: matchCapabilities(extractedData.processes || [], 'PROCESS'),
            materials: matchCapabilities(extractedData.materials || [], 'MATERIAL'),
            finishes: matchCapabilities(extractedData.finishes || [], 'FINISH'),
            certifications: matchCapabilities(extractedData.certifications || [], 'CERTIFICATION'),
            industries: matchCapabilities(extractedData.industries || [], 'INDUSTRY'),
            typicalJobSize: extractedData.typicalJobSize || null,
            leadTimeMinDays: extractedData.leadTimeMinDays?.toString() || '',
            leadTimeMaxDays: extractedData.leadTimeMaxDays?.toString() || '',
            maxPartSizeMmX: extractedData.maxPartSizeMmX?.toString() || '',
            maxPartSizeMmY: extractedData.maxPartSizeMmY?.toString() || '',
            maxPartSizeMmZ: extractedData.maxPartSizeMmZ?.toString() || '',
            rfqEmail: extractedData.rfqEmail || '',
            preferredContactMethod: extractedData.preferredContactMethod || null,
        };

        return NextResponse.json({
            success: true,
            data: formattedData,
            rawExtraction: extractedData, // Include raw data for debugging
        });
    } catch (error: any) {
        console.error('Error importing website:', error);
        return NextResponse.json(
            {
                error: 'Failed to import website data',
                details: error.message || 'Unknown error',
            },
            { status: 500 }
        );
    }
}
