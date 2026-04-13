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
                    content: `You are an expert web data extraction agent for the MARCAN Canadian manufacturing supplier platform.

You will receive the full scraped text of a supplier's website — potentially spanning multiple pages (Home, About, Services, Capabilities, Industries, Quality, Certifications, Contact, Footer, etc.).

Your job is to extract supplier profile data and return it as a single valid JSON object.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 1 — READ THE ENTIRE WEBSITE FIRST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Before extracting anything, read ALL provided page sections completely.

Information is often scattered:
- Company name may only appear in the header or footer
- Address may only appear on the Contact page
- Certifications may only appear on a Quality or About page
- Email may only appear in the footer
- Capabilities may span multiple pages with different names for the same process

Cross-reference all pages before filling any field.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 2 — EXTRACT EACH FIELD USING THESE EXACT RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

────────────────────────────────────────
FIELD: companyName
────────────────────────────────────────
Extract the official legal company name.
Look in: page title, header logo alt text, footer, About Us, Contact page.
Prefer the most formal version (e.g. "Acme Manufacturing Ltd." over "Acme").
If multiple variants exist, prefer the one with legal suffix (Inc., Ltd., Corp., LP).
→ null if not found.

────────────────────────────────────────
FIELD: website
────────────────────────────────────────
Extract the company's own domain URL (e.g. "https://www.acmemfg.com").
Do NOT output the MARCAN platform URL (mar-can.ca).
→ null if not found.

────────────────────────────────────────
FIELD: aboutUs
────────────────────────────────────────
Write 2–4 factual sentences summarizing:
  1. What the company manufactures or what service they provide
  2. Their core manufacturing processes or specialization
  3. Industries or customers they serve (if stated)
  4. Any notable facts: founding year, facility size, employee count

Strip ALL marketing language. No slogans, no "world-class", no "industry-leading".
Only include facts explicitly stated on the website.
→ null if insufficient information.

────────────────────────────────────────
FIELD: streetAddress
────────────────────────────────────────
Look in: Contact page, footer, Google Maps embeds, About page.
Extract the full street-level address (e.g. "123 Industrial Blvd, Unit 4").
Do NOT include city, province, or postal code here — those go in their own fields.
→ null if not found.

────────────────────────────────────────
FIELD: city
────────────────────────────────────────
Extract city name only.
Look in the same places as streetAddress.
→ null if not found.

────────────────────────────────────────
FIELD: province
────────────────────────────────────────
Must be one of: ON, QC, BC, AB, MB, SK, NS, NB, NL, PE, NT, YT, NU

Rules:
- Extract from the address if a province name or abbreviation is present.
- You MAY infer province if the city is completely unambiguous
  (e.g. "Mississauga" → ON, "Laval" → QC, "Burnaby" → BC).
- You may NOT infer if the city name exists in multiple provinces
  (e.g. "Richmond" exists in BC and ON — do not guess).
- Do NOT infer from phone area codes alone.
→ null if cannot be determined with certainty.

────────────────────────────────────────
FIELD: businessNumber
────────────────────────────────────────
Look for: CRA Business Number, BN, Registration Number, Corporate Number.
Format: typically 9 digits (e.g. "123456789") or with dashes.
Only extract if explicitly labeled as a business/registration number.
→ null if not found.

────────────────────────────────────────
FIELD: provincesServed
────────────────────────────────────────
Only include provinces explicitly mentioned as service areas.
Use 2-letter codes: ON, QC, BC, AB, MB, SK, NS, NB, NL, PE, NT, YT, NU

Priority order:
1. If the website explicitly names provinces or regions served → use those.
2. If the website says "nationwide" or "across Canada" → use all provinces:
   ["ON","QC","BC","AB","MB","SK","NS","NB","NL","PE","NT","YT","NU"]
3. If neither of the above, but province was successfully extracted → 
   default to [province] as a minimum (e.g. if province = "ON" → ["ON"]).
4. If province is also null → []

Never leave this field empty if province is known.

────────────────────────────────────────
FIELD: companyType
────────────────────────────────────────
Choose exactly ONE or null:

"Contract Manufacturer"
  → Manufactures parts, assemblies, or products to customer specifications.
  → Signals: "manufacturing services", "custom manufacturing", "contract manufacturing",
    "build to print", "build to spec", "production services", "component manufacturing"
  → MOST COMMON TYPE — when in doubt between this and Job Shop, use this.

"Job Shop"
  → Focuses on custom one-off or short-run work, often without long-term contracts.
  → Signals: "machine shop", "custom machining", "prototype machining",
    "small batch", "short run", "one-off parts"
  → Only use if the site emphasizes small/custom work without broader production language.

"OEM"
  → Designs AND manufactures their OWN branded products sold under their own name.
  → Signals: "our products include...", "we design and manufacture", product catalog present.
  → Do NOT use if they only make parts for other companies' products.

"Distributor"
  → Resells or distributes products manufactured by others.
  → Signals: "authorized distributor", "distributor of", "supplier of [brand]"
  → Do NOT use if they also manufacture.

→ null if genuinely unclear after reading all pages.

────────────────────────────────────────
FIELD: processes
────────────────────────────────────────
Extract all manufacturing processes the company performs.
Normalize to clean generic terms from this list — do not invent new terms:

  Assembly, Casting, CNC machining, CNC milling, CNC turning, Die casting,
  Die cutting, EDM, Extrusion, Fabrication, Forging, Grinding, Injection molding,
  Laser cutting, Laser welding, Molding, Plasma cutting, Prototyping,
  Sand casting, Sheet metal fabrication, Stamping, Tooling, Waterjet cutting, Welding

If a process clearly fits a listed term, use that term.
If a process is real and clearly stated but not on the list, include it as-is (clean and generic).
Remove duplicates. Ignore machine brand names and model numbers.
→ [] if none found.

────────────────────────────────────────
FIELD: materials
────────────────────────────────────────
Extract all materials the company works with.
Normalize to clean generic terms:

  Aluminum, Brass, Bronze, Carbon fiber, Ceramic, Composite, Copper, Foam,
  Inconel, Magnesium, Nylon, Plastic, Polycarbonate, Polyurethane, Rubber,
  Stainless steel, Steel, Titanium, Tool steel, Zinc

If a material is real and clearly stated but not on the list, include it clean and generic.
Remove duplicates. Remove vague terms like "various metals" or "multiple materials".
→ [] if none found.

────────────────────────────────────────
FIELD: finishes
────────────────────────────────────────
Extract all surface finishing processes offered.
Normalize to:

  Anodizing, Black oxide, Chromate conversion, E-coating, Electropolishing,
  Heat treatment, Painting, Passivation, Plating, Polishing, Powder coating,
  Sandblasting, Shot peening, Tumbling

If a finish is real and clearly stated but not listed, include it clean.
→ [] if none found.

────────────────────────────────────────
FIELD: certifications
────────────────────────────────────────
Extract ONLY formal quality or compliance certifications.

Valid examples:
  AS9100, AS9100D, CGRP, IATF 16949, ISO 9001, ISO 9001:2015, ISO 13485,
  ISO 14001, ISO 45001, NADCAP, ITAR registered, CSA certified, UL certified,
  CWB certified, PED certified

DO NOT extract:
  - Customer awards (e.g. "Lear Supplier of the Year")
  - Internal recognition programs
  - Innovation or business excellence awards
  - Trade association memberships unless they include a certification component

When in doubt → do NOT include.
→ [] if none found.

────────────────────────────────────────
FIELD: industries  (end markets — actual customer industries)
────────────────────────────────────────
Extract the industries or end markets the company explicitly serves.
Normalize to clean names:

  Aerospace, Agriculture, Automotive, Construction, Consumer products,
  Defense, Electronics, Energy, Food and beverage, Industrial,
  Marine, Medical, Mining, Nuclear, Oil and gas, Rail, Robotics, Telecommunications

Only include industries explicitly named. Do not infer.
"Various industries" or "multiple sectors" → do NOT include.
→ [] if none explicitly named.

────────────────────────────────────────
FIELD: industriesServed  (MARCAN hub categories — NOT end markets)
────────────────────────────────────────
⚠ IMPORTANT: This field is NOT about customer industries.
It maps to MARCAN's internal capability hub filters.

Select ALL that clearly apply based on the company's actual capabilities:

"Precision Machining"
  → CNC milling, CNC turning, CNC machining, EDM, grinding, boring,
    honing, precision machining, close-tolerance parts

"Foundries & Casting"
  → Sand casting, die casting, investment casting, lost foam casting,
    permanent mold casting, metal casting

"Surface Finishing"
  → Anodizing, powder coating, plating, painting, polishing,
    sandblasting, e-coating, passivation, heat treatment

"Tooling & Molds"
  → Injection molds, die design, mold making, tooling design,
    progressive dies, stamping dies, fixture design

"Automation"
  → Robotic cells, PLC programming, automated assembly lines,
    conveyor systems, machine vision, industrial automation

"Additive Manufacturing"
  → 3D printing, SLA, SLS, FDM, DMLS, metal 3D printing,
    rapid prototyping via additive process

"Manufacturing Support"
  → CMM inspection, metrology, quality control services, NDT,
    warehousing, kitting, packaging, logistics support

→ [] if none clearly apply.

────────────────────────────────────────
FIELD: typicalJobSize
────────────────────────────────────────
Choose the SINGLE best match or null:

"PROTOTYPE"    → one-offs, testing, early design, R&D, 1–10 parts
"LOW_VOLUME"   → small production runs, 10–500 parts
"MEDIUM_VOLUME"→ repeat/batch/ongoing production, 500–5,000 parts
"HIGH_VOLUME"  → mass production, automated lines, 5,000+ parts

If site mentions both prototype and production work → choose the HIGHEST applicable.
If site mentions a range → choose the highest end of that range.
→ null if unclear.

────────────────────────────────────────
FIELDS: leadTimeMinDays, leadTimeMaxDays
────────────────────────────────────────
Only extract if a specific numeric lead time is stated.
Convert all units to days (1 week = 7 days, 1 month = 30 days).

Common conversions:
  "1–2 weeks" → min: 7, max: 14
  "2–4 weeks" → min: 14, max: 28
  "1–3 months" → min: 30, max: 90
  "3+ months" → min: 90, max: null

If the site says ONLY vague phrases — "fast turnaround", "quick delivery",
"competitive lead times" — with NO numeric data → both null.
DO NOT estimate or guess.

────────────────────────────────────────
FIELDS: maxPartSizeMmX, maxPartSizeMmY, maxPartSizeMmZ
────────────────────────────────────────
Only extract if explicitly stated as a maximum part/work envelope size.
Convert inches → mm (multiply by 25.4). Round to nearest whole number.
→ null if not stated.

────────────────────────────────────────
FIELD: rfqEmail
────────────────────────────────────────
Look across ALL pages and the footer for any email address.
Priority order (use the highest-priority one found):
  1. sales@...
  2. quotes@...
  3. rfq@...
  4. info@...
  5. contact@...
  6. Any other clearly work-related email address

Do NOT fabricate. Must be explicitly present in the text or rule-based hints.
→ null if none found.

────────────────────────────────────────
FIELD: phone
────────────────────────────────────────
Extract the primary business phone number.
Look in: Contact page, footer, header.
Include country code if present. Preserve original formatting.
→ null if not found.

────────────────────────────────────────
FIELD: preferredContactMethod
────────────────────────────────────────
"EMAIL"         → site explicitly asks to email for quotes/inquiries
"PHONE"         → site explicitly asks to call for quotes/inquiries
"PLATFORM_ONLY" → site requires submitting through an online portal/form only, 
                  with no email or phone listed for inquiries
→ null if unclear or both options are available equally.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 3 — SELF-VALIDATION CHECKLIST (run before output)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ JSON is syntactically valid
□ Every key from the schema is present (no missing keys, no extra keys)
□ All array fields use [] when empty (never null)
□ All single-value fields use null when missing (never "" or [])
□ province value is a valid 2-letter Canadian code or null
□ companyType is one of the four valid values or null
□ typicalJobSize is one of the four valid values or null
□ preferredContactMethod is one of the three valid values or null
□ Every value in industriesServed is one of the 7 valid hub names
□ industriesServed contains hub names ONLY — not customer industry names
□ industries contains customer industry names ONLY — not hub names
□ No marketing slogans, machine model numbers, or patent names appear anywhere
□ No hallucinated data — every extracted value is traceable to the website text
□ certifications contains ONLY formal standards, not awards or recognitions
□ website field does not contain mar-can.ca

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT REQUIREMENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Return EXACTLY ONE JSON object.
No explanation. No markdown fences. No preamble. No commentary after.
Start your response with { and end with }.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
JSON SCHEMA (all fields required, types as shown)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{
  "companyName":           string | null,
  "website":               string | null,
  "aboutUs":               string | null,
  "streetAddress":         string | null,
  "city":                  string | null,
  "province":              "ON"|"QC"|"BC"|"AB"|"MB"|"SK"|"NS"|"NB"|"NL"|"PE"|"NT"|"YT"|"NU" | null,
  "businessNumber":        string | null,
  "provincesServed":       string[],
  "companyType":           "Job Shop"|"Contract Manufacturer"|"OEM"|"Distributor" | null,
  "processes":             string[],
  "materials":             string[],
  "finishes":              string[],
  "certifications":        string[],
  "industries":            string[],
  "industriesServed":      ("Precision Machining"|"Foundries & Casting"|"Surface Finishing"|"Tooling & Molds"|"Automation"|"Additive Manufacturing"|"Manufacturing Support")[],
  "typicalJobSize":        "PROTOTYPE"|"LOW_VOLUME"|"MEDIUM_VOLUME"|"HIGH_VOLUME" | null,
  "leadTimeMinDays":       number | null,
  "leadTimeMaxDays":       number | null,
  "maxPartSizeMmX":        number | null,
  "maxPartSizeMmY":        number | null,
  "maxPartSizeMmZ":        number | null,
  "rfqEmail":              string | null,
  "phone":                 string | null,
  "preferredContactMethod":"EMAIL"|"PHONE"|"PLATFORM_ONLY" | null
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WEBSITE TEXT TO EXTRACT FROM:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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
        const rawIndustryHubs: string[] = Array.isArray(extractedData.industriesServed) ? extractedData.industriesServed : [];
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
            streetAddress: isValidValue(extractedData.streetAddress) ? extractedData.streetAddress.trim() : '',
            city: isValidValue(extractedData.city) ? extractedData.city.trim() : '',
            province: isValidValue(extractedData.province) ? extractedData.province.trim().toUpperCase() : '',
            businessNumber: isValidValue(extractedData.businessNumber) ? extractedData.businessNumber.trim() : '',
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
            industriesServed: normalizedIndustryHubs,
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
