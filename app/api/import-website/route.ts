import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

const INDUSTRY_HUB_NAMES = ['Precision Machining', 'Foundries & Casting', 'Surface Finishing', 'Tooling & Molds', 'Automation'];

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

        // Helper function to discover relevant pages from HTML
        const discoverRelevantPages = (html: string, baseUrl: URL): string[] => {
            const relevantPages: Set<string> = new Set();
            const baseDomain = `${baseUrl.protocol}//${baseUrl.host}`;

            // Common page paths to look for
            const commonPaths = [
                '/contact', '/contact-us', '/contactus', '/contact.html',
                '/about', '/about-us', '/aboutus', '/about.html',
                '/services', '/services.html', '/capabilities', '/capabilities.html',
                '/what-we-do', '/whatwedo', '/our-services',
                '/certifications', '/certification', '/quality', '/iso',
                '/industries', '/industries-served', '/markets',
            ];

            // Try common paths
            commonPaths.forEach(path => {
                try {
                    const fullUrl = new URL(path, baseUrl.toString());
                    if (fullUrl.hostname === baseUrl.hostname) {
                        relevantPages.add(fullUrl.toString());
                    }
                } catch (e) {
                    // Invalid URL, skip
                }
            });

            // Extract links from HTML
            const linkMatches = html.match(/<a[^>]+href=["']([^"']+)["'][^>]*>/gi);
            if (linkMatches) {
                linkMatches.forEach(match => {
                    const hrefMatch = match.match(/href=["']([^"']+)["']/i);
                    if (hrefMatch && hrefMatch[1]) {
                        const href = hrefMatch[1];
                        const lowerHref = href.toLowerCase();

                        // Check if it's a relevant page
                        if (lowerHref.includes('contact') ||
                            lowerHref.includes('about') ||
                            lowerHref.includes('service') ||
                            lowerHref.includes('capabilit') ||
                            lowerHref.includes('certif') ||
                            lowerHref.includes('industr') ||
                            lowerHref.includes('market') ||
                            lowerHref.includes('what-we-do')) {

                            try {
                                const fullUrl = new URL(href, baseUrl.toString());
                                // Only include same-domain pages
                                if (fullUrl.hostname === baseUrl.hostname &&
                                    fullUrl.protocol.startsWith('http') &&
                                    !fullUrl.pathname.match(/\.(jpg|jpeg|png|gif|pdf|zip|exe|css|js)$/i)) {
                                    relevantPages.add(fullUrl.toString());
                                }
                            } catch (e) {
                                // Invalid URL, skip
                            }
                        }
                    }
                });
            }

            return Array.from(relevantPages).slice(0, 10); // Limit to 10 pages
        };

        // Helper function to fetch a page
        const fetchPage = async (pageUrl: string): Promise<string> => {
            try {
                const response = await fetch(pageUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                        'Accept-Language': 'en-US,en;q=0.9',
                    },
                    signal: AbortSignal.timeout(10000), // 10 second timeout per page
                });

                if (response.ok) {
                    return await response.text();
                }
            } catch (error) {
                console.warn(`Failed to fetch page ${pageUrl}:`, error);
            }
            return '';
        };

        // Helper function to extract clean text from HTML
        const extractTextFromHTML = (html: string): string => {
            // Remove script and style tags and their content
            let text = html
                .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')
                .replace(/<!--[\s\S]*?-->/g, ''); // Remove comments

            // Extract text from common semantic HTML tags
            const textMatches: string[] = [];

            // Extract from meta tags (description, keywords, etc.)
            const metaMatches = html.match(/<meta[^>]*(?:name|property)=["'](?:description|og:description|keywords|og:title)["'][^>]*content=["']([^"']+)["']/gi);
            if (metaMatches) {
                metaMatches.forEach(match => {
                    const contentMatch = match.match(/content=["']([^"']+)["']/i);
                    if (contentMatch && contentMatch[1]) {
                        textMatches.push(contentMatch[1]);
                    }
                });
            }

            // Extract from title tag
            const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
            if (titleMatch && titleMatch[1]) {
                textMatches.push(titleMatch[1].trim());
            }

            // Extract from heading tags
            const headings = html.match(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/gi);
            if (headings) {
                headings.forEach(h => {
                    const content = h.replace(/<[^>]+>/g, '').trim();
                    if (content) textMatches.push(content);
                });
            }

            // Extract from paragraph tags
            const paragraphs = html.match(/<p[^>]*>([^<]+)<\/p>/gi);
            if (paragraphs) {
                paragraphs.forEach(p => {
                    const content = p.replace(/<[^>]+>/g, '').trim();
                    if (content && content.length > 20) textMatches.push(content);
                });
            }

            // Extract from list items
            const listItems = html.match(/<li[^>]*>([^<]+)<\/li>/gi);
            if (listItems) {
                listItems.forEach(li => {
                    const content = li.replace(/<[^>]+>/g, '').trim();
                    if (content && content.length > 5) textMatches.push(content);
                });
            }

            // Extract from divs with common class names that might contain company info
            const infoDivs = html.match(/<div[^>]*(?:class|id)=["'][^"']*(?:about|company|contact|service|capability|process|material|certification|industry)[^"']*["'][^>]*>([\s\S]{50,500})<\/div>/gi);
            if (infoDivs) {
                infoDivs.forEach(div => {
                    const content = div.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
                    if (content && content.length > 30) textMatches.push(content);
                });
            }

            // Extract visible text by removing all HTML tags
            const visibleText = text
                .replace(/<[^>]+>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();

            if (visibleText.length > 100) {
                textMatches.push(visibleText);
            }

            // Combine all extracted text
            const combinedText = textMatches.join('\n\n');

            // Remove excessive whitespace and limit length
            return combinedText
                .replace(/\n{3,}/g, '\n\n')
                .substring(0, 30000); // Limit to 30k chars for AI processing
        };

        // Fetch website content from multiple pages
        let allExtractedText: string[] = [];
        let pageCount = 0;
        let extractedText = '';
        const maxPages = 8; // Limit to prevent timeout

        try {
            // Fetch homepage first
            const homepageResponse = await fetch(url.toString(), {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9',
                },
                signal: AbortSignal.timeout(15000), // 15 second timeout
            });

            if (!homepageResponse.ok) {
                throw new Error(`HTTP ${homepageResponse.status}: ${homepageResponse.statusText}`);
            }

            const homepageHtml = await homepageResponse.text();
            const homepageText = extractTextFromHTML(homepageHtml);

            if (homepageText && homepageText.trim().length > 50) {
                allExtractedText.push(`=== HOMEPAGE ===\n${homepageText}`);
                pageCount++;
            }

            // Discover and fetch relevant pages
            const relevantPages = discoverRelevantPages(homepageHtml, url);
            console.log(`Discovered ${relevantPages.length} relevant pages to crawl`);

            // Fetch discovered pages in parallel (but limit concurrency)
            const pagePromises = relevantPages.slice(0, maxPages - pageCount).map(async (pageUrl) => {
                const pageHtml = await fetchPage(pageUrl);
                if (pageHtml) {
                    const pageText = extractTextFromHTML(pageHtml);
                    if (pageText && pageText.trim().length > 50) {
                        const pageUrlObj = new URL(pageUrl);
                        let pageName = pageUrlObj.pathname.replace(/^\//, '').replace(/\/$/, '') || 'page';
                        // Clean up page name for display
                        pageName = pageName
                            .split('/')
                            .pop() || 'page';
                        pageName = pageName
                            .replace(/[-_]/g, ' ')
                            .replace(/\.(html|htm|php|aspx)$/i, '')
                            .split(' ')
                            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                            .join(' ');
                        return `=== ${pageName.toUpperCase()} PAGE ===\n${pageText}`;
                    }
                }
                return null;
            });

            const pageTexts = await Promise.all(pagePromises);
            pageTexts.forEach(text => {
                if (text) {
                    allExtractedText.push(text);
                    pageCount++;
                }
            });

            // Combine all extracted text
            extractedText = allExtractedText.join('\n\n');

            // If we still don't have enough text, use fallback
            if (!extractedText || extractedText.trim().length < 100) {
                console.warn('Extracted text is too short, using raw HTML from homepage');
                extractedText = homepageHtml
                    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                    .replace(/<[^>]+>/g, ' ')
                    .replace(/\s+/g, ' ')
                    .substring(0, 30000);
                pageCount = 1; // At least we have the homepage
            } else {
                // Limit total text length to avoid token limits
                extractedText = extractedText.substring(0, 50000);
            }

            console.log(`Successfully crawled ${pageCount} pages from ${url.toString()}`);
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

        // Get company types for matching
        const companyTypes = [
            { slug: 'job-shop', name: 'Job Shop' },
            { slug: 'contract-manufacturer', name: 'Contract Manufacturer' },
            { slug: 'oem', name: 'OEM' },
            { slug: 'distributor', name: 'Distributor' },
        ];

        // Use OpenAI to extract structured information
        const extractionResponse = await openai.chat.completions.create({
            model: 'gpt-5-mini',
            messages: [
                {
                    role: 'system',
                    content: `You will be given plain text extracted from ALL pages of a supplier’s website.

Page sections may be marked with headers like:
=== HOME PAGE ===
=== ABOUT US ===
=== SERVICES ===
=== INDUSTRIES ===
=== CONTACT US ===
=== CAPABILITIES ===
=== QUALITY ===
=== CERTIFICATIONS ===

You may also see extra rule-based hints such as:
Rule-based emails: [...]
Rule-based phones: [...]
Rule-based location candidates: [...]

Your task is to extract supplier signup information for the MARCAN supplier profile system.

Return EXACTLY ONE valid JSON object matching the schema defined below.

You must extract ONLY information relevant to MARCAN supplier signup fields.

Treat the provided website text as the ONLY source of truth.

DO NOT use prior knowledge, assumptions, or external information.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PRIMARY OBJECTIVE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Extract only the information needed to populate these MARCAN supplier signup fields:

• Company identity
• Location
• Contact info
• Core manufacturing capabilities
• Materials
• Finishes
• Certifications
• Industries served
• Production profile indicators (if explicitly stated)

Ignore all irrelevant technical, legal, patent, or marketing information.

Your output must be CLEAN, NORMALIZED, and usable directly in supplier search and matching.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ABSOLUTE RULES (NO EXCEPTIONS)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1) NO HALLUCINATIONS OR GUESSING

Extract ONLY information explicitly present in the website text or rule-based hints.

If information is missing, use:

null → for single-value fields  
[] → for array fields

Never invent or assume.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

2) IGNORE NON-SIGNUP INFORMATION

DO NOT extract:

• Patent titles
• Patent numbers
• Machine model numbers
• Legal boilerplate
• Marketing slogans
• Trademark names
• Internal proprietary system names
• Long descriptive paragraphs of how machines work

Example to IGNORE:

"VACUUM DIE CUTTING APPARATUS FOR FOAM BACKED MATERIALS"

Example to EXTRACT:

Process → "Die cutting"  
Material → "Foam"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

3) NORMALIZE ALL CAPABILITIES TO CLEAN GENERIC TERMS

Convert all website descriptions into clean generic manufacturing capability names.

DO NOT output raw website phrases.

DO NOT output marketing descriptions.

Correct examples:

"CNC machining centers" → "CNC machining"  
"DIEVAC vacuum die cutting system" → "Die cutting"  
"precision sheet metal fabrication" → "Sheet metal fabrication"

Materials normalization:

"laminated materials" → "Composites"  
"foam backed materials" → "Foam"  
"aluminum alloys" → "Aluminum"

Use concise generic industry-standard terms only.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

4) ONLY EXTRACT CAPABILITIES RELEVANT TO SUPPLIER MATCHING

Extract only real manufacturing capabilities such as:

Processes:
CNC machining  
CNC milling  
CNC turning  
Die cutting  
Laser cutting  
Waterjet cutting  
Stamping  
Welding  
Fabrication  
Sheet metal fabrication  
Assembly  
Injection molding  
Tooling  
Prototyping  

Materials:
Aluminum  
Steel  
Stainless steel  
Plastic  
Foam  
Rubber  
Composites  
Copper  
Brass  
Titanium  

Finishes:
Powder coating  
Anodizing  
Painting  
Plating  
Polishing  
Heat treatment  

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

5) REMOVE DUPLICATES AND NOISE

• Deduplicate all arrays
• Exclude vague phrases like:
  - "advanced solutions"
  - "state-of-the-art technology"
  - "high precision manufacturing"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CANADIAN LOCATION RULES (STRICT)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

province must be one of:

ON, QC, BC, AB, MB, SK, NS, NB, NL, PE, NT, YT, NU

Infer province ONLY if city is clearly Canadian and unambiguous.

Otherwise use null.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CONTACT INFORMATION RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

rfqEmail priority order:

1. sales@
2. quotes@
3. rfq@
4. info@
5. contact@

Must appear in text or rule-based hints.

Otherwise null.

phone must appear in text or hints.

Otherwise null.

preferredContactMethod:

EMAIL → if email clearly preferred  
PHONE → if phone clearly preferred  
PLATFORM_ONLY → if website requires portal  

Otherwise null.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COMPANY TYPE RULES (WITH INTERPRETATION)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Use exactly one of:

Job Shop  
Contract Manufacturer  
OEM  
Distributor  

Otherwise null.

Use the following interpretation rules:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Contract Manufacturer

Use if website indicates they manufacture parts, components, or products for customers.

Common signals:

• "manufacturing services"
• "custom manufacturing"
• "build to customer specifications"
• "manufacture parts for customers"
• "contract manufacturing"
• "production services"
• "component manufacturing"

This is the MOST COMMON supplier type.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Job Shop

Use if website emphasizes something like:

• custom machining
• small batch production
• prototype work
• one-off parts
• short-run production

Typical signals:

• "precision machining shop"
• "custom machine shop"
• "prototype machining"
• "small batch production"

If both Contract Manufacturer and Job Shop apply, prefer:

Contract Manufacturer

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OEM (Original Equipment Manufacturer)

Use ONLY if website clearly states they design and manufacture their OWN branded products.

Common signals:

• "we design and manufacture our own products"
• "our products include..."
• "manufacturer of [their own equipment/products]"

DO NOT use OEM if they only manufacture parts for others.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Distributor

Use ONLY if website indicates they sell or distribute products made by other manufacturers.

Common signals:

• "distributor of"
• "supplier of"
• "reseller of"
• "authorized distributor"

DO NOT use Distributor if they manufacture parts.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

If unclear → use null

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CERTIFICATION EXTRACTION RULES (STRICT)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Extract ONLY formal industry certifications.

Examples of valid certifications:

ISO 9001
ISO 13485
AS9100
IATF 16949
ISO 14001
NADCAP
ITAR compliant
CSA certified
UL certified

DO NOT extract:

• Awards
• Supplier awards
• Supplier of the year recognitions
• Innovation awards
• Customer recognitions
• Internal company awards

Examples to IGNORE:

"Lear Corporation Supplier of the Year"
"Business Excellence Award"
"Supplier Hall of Fame"

If unsure whether it is a certification → DO NOT include it.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
JOB SIZE RULES (WITH INTERPRETATION)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

typicalJobSize must be exactly one of:

PROTOTYPE  
LOW_VOLUME  
MEDIUM_VOLUME  
HIGH_VOLUME  

Use these interpretations:

PROTOTYPE
Use if site mentions:
• prototype
• prototyping
• one-off parts
• R&D support
• product development support
• early-stage manufacturing

LOW_VOLUME
Use if site mentions:
• low volume production
• small batch production
• short production runs
• custom parts manufacturing

MEDIUM_VOLUME
Use if site mentions:
• repeat production
• batch production
• ongoing production
• mid-volume production

HIGH_VOLUME
Use if site mentions:
• mass production
• high volume production
• large-scale manufacturing
• production at scale
• automated production lines

If site mentions BOTH prototype and production, choose the HIGHEST applicable category.

If unclear → null

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LEAD TIME RULES (WITH INTERPRETATION)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Extract typical production lead time.

Convert all time units to days.

Examples:

"1 week" → 7  
"2–4 weeks" → 14, 28  
"6–8 weeks" → 42, 56  
"3 months" → 90  

Interpret phrases like:

"rapid turnaround"
"fast turnaround"
"short lead times"

ONLY if numeric ranges are provided nearby.

DO NOT guess numeric values.

If site only says vague phrases like:

"fast turnaround"
"competitive lead times"

Use:

leadTimeMinDays = null  
leadTimeMaxDays = null

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART SIZE RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Convert inches to mm.

1 inch = 25.4 mm

Otherwise null.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INDUSTRIES SERVED RULES (WITH NORMALIZATION)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Normalize to clean industry names.

Examples:

"aerospace and defense" → Aerospace, Defense  
"automotive sector" → Automotive  
"medical device manufacturers" → Medical  
"industrial equipment manufacturers" → Industrial  
"consumer electronics" → Electronics  

Common valid industries:

Aerospace  
Automotive  
Medical  
Defense  
Energy  
Industrial  
Electronics  
Consumer products  
Agriculture  
Construction  
Oil and gas  

DO NOT extract vague phrases like:

"various industries"
"multiple sectors"

If none explicitly mentioned → []

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INDUSTRY HUBS (FOR MARCAN HOMEPAGE FILTERS)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

In addition to industriesServed, you MUST also select zero or more of the following MARCAN industry hubs:

- Precision Machining  
- Foundries & Casting  
- Surface Finishing  
- Tooling & Molds  
- Automation  

Use these ONLY if the website clearly indicates the company is active in that area.

Examples:

"CNC milling, turning, EDM" → Precision Machining  
"sand casting, die casting, investment casting" → Foundries & Casting  
"anodizing, powder coating, plating" → Surface Finishing  
"injection molds, die design, mold making" → Tooling & Molds  
"robotic cells, PLC programming, automated systems" → Automation  

If unsure or not mentioned → use [].

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PROVINCES SERVED RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Extract only explicitly mentioned provinces.

Use 2-letter codes.

Otherwise [].

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ABOUT US RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Extract a concise 1–3 sentence summary describing:

• What the company does
• What they manufacture
• Their core expertise

Remove marketing fluff.

Keep factual.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SELF VALIDATION STEP (MANDATORY)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Before outputting JSON:

• Ensure valid JSON
• Ensure all required keys exist
• Ensure no extra keys exist
• Ensure arrays use []
• Ensure enums valid
• Ensure no hallucinations

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FINAL OUTPUT REQUIREMENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Return EXACTLY ONE JSON object.

No explanation.
No markdown.
No extra text.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

JSON SCHEMA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{
  "companyName": string or null,
  "website": string,
  "aboutUs": string or null,
  "city": string or null,
  "province": string or null,
  "provincesServed": array of strings,
  "companyType": "Job Shop" | "Contract Manufacturer" | "OEM" | "Distributor" | null,
  "processes": array of strings,
  "materials": array of strings,
  "finishes": array of strings,
  "certifications": array of strings,
  "industries": array of strings,
  "industryHubs": array of strings (each MUST be exactly one of: "Precision Machining", "Foundries & Casting", "Surface Finishing", "Tooling & Molds", "Automation"),
  "typicalJobSize": "PROTOTYPE" | "LOW_VOLUME" | "MEDIUM_VOLUME" | "HIGH_VOLUME" | null,
  "leadTimeMinDays": number or null,
  "leadTimeMaxDays": number or null,
  "maxPartSizeMmX": number or null,
  "maxPartSizeMmY": number or null,
  "maxPartSizeMmZ": number or null,
  "rfqEmail": string or null,
  "phone": string or null,
  "preferredContactMethod": "EMAIL" | "PHONE" | "PLATFORM_ONLY" | null
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NOW PERFORM EXTRACTION FROM:

{PASTE_WEBSITE_TEXT_HERE}`,
                },
                {
                    role: 'user',
                    content: `Extract company information from this website text content. The website URL is: ${websiteUrl}

The text below contains content from ${pageCount} page(s) of the website. Sections may be marked with "=== PAGE NAME ===" headers, but you must carefully analyze ALL text regardless of headers.

Website text content from all pages:\n\n${extractedText}`,
                },
            ],
            response_format: { type: 'json_object' },
            temperature: 1, // Lower temperature for more accurate extraction
        });

        const rawResponse = extractionResponse.choices[0]?.message?.content || '{}';
        let extractedData: any = {};

        try {
            extractedData = JSON.parse(rawResponse);
        } catch (parseError) {
            console.error('Failed to parse AI response:', parseError);
            console.error('Raw response:', rawResponse);
            return NextResponse.json(
                { error: 'Failed to parse extracted data from AI' },
                { status: 500 }
            );
        }

        // Log extracted data for debugging
        console.log('Extracted data:', JSON.stringify(extractedData, null, 2));

        // Validate that we got some data
        if (!extractedData || Object.keys(extractedData).length === 0) {
            console.error('No data extracted from website');
            return NextResponse.json(
                { error: 'No information could be extracted from the website. Please try filling the form manually.' },
                { status: 400 }
            );
        }

        // Match capability names to IDs and return unmatched names
        const matchCapabilities = (names: string[], type: string): { matched: string[]; unmatched: string[] } => {
            if (!Array.isArray(names)) return { matched: [], unmatched: [] };
            const matched: string[] = [];
            const unmatched: string[] = [];
            const typeCaps = allCapabilities.filter((c) => c.type === type);

            names.forEach((name) => {
                if (!name || typeof name !== 'string') return;

                const lowerName = name.toLowerCase().trim();
                // Skip if it looks like a placeholder/example
                if (lowerName.includes('example') ||
                    lowerName.includes('placeholder') ||
                    lowerName.includes('n/a') ||
                    lowerName.includes('tbd') ||
                    lowerName.includes('custom') && lowerName.includes('1')) {
                    return;
                }

                const match = typeCaps.find(
                    (cap) =>
                        cap.name.toLowerCase() === lowerName ||
                        cap.slug.toLowerCase() === lowerName ||
                        cap.name.toLowerCase().includes(lowerName) ||
                        cap.slug.toLowerCase().includes(lowerName) ||
                        lowerName.includes(cap.name.toLowerCase()) ||
                        lowerName.includes(cap.slug.toLowerCase())
                );
                if (match) {
                    matched.push(match.id);
                } else {
                    unmatched.push(name.trim());
                }
            });

            return {
                matched: Array.from(new Set(matched)), // Remove duplicates
                unmatched: Array.from(new Set(unmatched.filter(n => n.length > 0))) // Remove duplicates and empty strings
            };
        };

        // Match capabilities and separate matched from unmatched
        const processesMatch = matchCapabilities(extractedData.processes || [], 'PROCESS');
        const materialsMatch = matchCapabilities(extractedData.materials || [], 'MATERIAL');
        const finishesMatch = matchCapabilities(extractedData.finishes || [], 'FINISH');
        const certificationsMatch = matchCapabilities(extractedData.certifications || [], 'CERTIFICATION');
        const industriesMatch = matchCapabilities(extractedData.industries || [], 'INDUSTRY');

        // Helper to filter out placeholder/example values
        const isValidValue = (value: any): boolean => {
            if (!value || typeof value !== 'string') return false;
            const lower = value.toLowerCase().trim();
            return !lower.includes('example') &&
                !lower.includes('placeholder') &&
                !lower.includes('n/a') &&
                !lower.includes('tbd') &&
                lower.length > 0;
        };

        // Normalize industry hubs to the fixed MARCAN list
        const rawIndustryHubs: string[] = Array.isArray(extractedData.industryHubs) ? extractedData.industryHubs : [];
        const normalizedIndustryHubs = Array.from(
            new Set(
                rawIndustryHubs
                    .filter(isValidValue)
                    .map((hub) => hub.toLowerCase().trim())
            )
        )
            .map((lowerHub) =>
                INDUSTRY_HUB_NAMES.find(
                    (name) =>
                        name.toLowerCase() === lowerHub ||
                        lowerHub.includes(name.toLowerCase()) ||
                        name.toLowerCase().includes(lowerHub)
                )
            )
            .filter((name): name is string => !!name);

        // Format the response with matched capability IDs and unmatched in "other" fields
        const formattedData = {
            companyName: isValidValue(extractedData.companyName) ? extractedData.companyName.trim() : '',
            city: isValidValue(extractedData.city) ? extractedData.city.trim() : '',
            province: isValidValue(extractedData.province) ? extractedData.province.trim().toUpperCase() : '',
            provincesServed: Array.isArray(extractedData.provincesServed)
                ? extractedData.provincesServed
                    .filter((p: any) => p && typeof p === 'string' && isValidValue(p))
                    .map((p: string) => p.trim().toUpperCase())
                : [],
            companyType: isValidValue(extractedData.companyType) ? extractedData.companyType.trim() : null,
            website: websiteUrl, // Always use the provided URL
            aboutUs: isValidValue(extractedData.aboutUs) ? extractedData.aboutUs.trim() : '',
            processes: processesMatch.matched,
            otherProcesses: processesMatch.unmatched.filter(isValidValue).join(', '),
            materials: materialsMatch.matched,
            otherMaterials: materialsMatch.unmatched.filter(isValidValue).join(', '),
            finishes: finishesMatch.matched,
            otherFinishes: finishesMatch.unmatched.filter(isValidValue).join(', '),
            certifications: certificationsMatch.matched,
            otherCertifications: certificationsMatch.unmatched.filter(isValidValue).join(', '),
            industries: industriesMatch.matched,
            otherIndustries: industriesMatch.unmatched.filter(isValidValue).join(', '),
            industryHubs: normalizedIndustryHubs,
            typicalJobSize: extractedData.typicalJobSize || null,
            leadTimeMinDays: extractedData.leadTimeMinDays ? extractedData.leadTimeMinDays.toString() : '',
            leadTimeMaxDays: extractedData.leadTimeMaxDays ? extractedData.leadTimeMaxDays.toString() : '',
            maxPartSizeMmX: extractedData.maxPartSizeMmX ? extractedData.maxPartSizeMmX.toString() : '',
            maxPartSizeMmY: extractedData.maxPartSizeMmY ? extractedData.maxPartSizeMmY.toString() : '',
            maxPartSizeMmZ: extractedData.maxPartSizeMmZ ? extractedData.maxPartSizeMmZ.toString() : '',
            rfqEmail: isValidValue(extractedData.rfqEmail) ? extractedData.rfqEmail.trim() : '',
            phone: isValidValue(extractedData.phone) ? extractedData.phone.trim() : '',
            preferredContactMethod: extractedData.preferredContactMethod || null,
        };

        // Validate that we extracted at least some meaningful data (not just the URL)
        const hasMeaningfulData =
            formattedData.companyName ||
            formattedData.city ||
            formattedData.aboutUs ||
            formattedData.processes.length > 0 ||
            formattedData.materials.length > 0 ||
            formattedData.otherProcesses ||
            formattedData.otherMaterials ||
            formattedData.certifications.length > 0 ||
            formattedData.industries.length > 0;

        if (!hasMeaningfulData) {
            console.warn('No meaningful data extracted from website:', websiteUrl);
            console.warn('Extracted text length:', extractedText.length);
            console.warn('Raw extraction:', extractedData);
        }

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
