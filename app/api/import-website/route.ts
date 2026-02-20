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
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: `You are extracting REAL company information from website text content for a Canadian manufacturing supplier registration form.

IMPORTANT: The text content below includes information from MULTIPLE PAGES of the website (homepage, contact page, about page, services page, etc.). Each page section is marked with "=== PAGE NAME ===" headers. You should extract information from ALL pages.

CRITICAL RULES:
- Extract ONLY actual information found in the provided website text from ALL pages
- You MUST analyze ALL page sections carefully and extract ALL available information
- NEVER use placeholder values, example values, or made-up data
- If information is not found in the text, use null or empty array (never use "example", "placeholder", "N/A", "TBD", etc.)
- Extract all information accurately from the website text content across all pages
- Fill in ALL fields that can be found, including optional ones
- Look for company name in headings, titles, and prominent text (check homepage and about pages)
- Look for location information in addresses, contact sections, or "About" sections (especially check contact page)
- Look for processes, materials, finishes in service descriptions, capabilities lists, or "What We Do" sections (check services/capabilities pages)
- Look for certifications in dedicated sections or footer areas (check certifications/quality pages)
- Look for contact information (email, phone) in contact sections, headers, or footers (especially check contact page - this is where contact info is most likely to be found)

Extract the following information and return it as JSON:
- companyName: Legal company name (extract from website text - look in titles, headings, or company name mentions)
- city: City location (extract actual city name from address or location mentions)
- province: Canadian province code (ON, QC, BC, AB, MB, SK, NS, NB, NL, PE, NT, YT, NU) - extract from address/location info
- provincesServed: Array of province codes the company serves (extract from service area information, "We serve..." text, or coverage areas)
- companyType: Company type - must match one of: Job Shop, Contract Manufacturer, OEM, Distributor (infer from business description, or null if unclear)
- website: Website URL (use: ${websiteUrl})
- aboutUs: Company description/about section (extract actual description from "About Us", "About", or company description sections)
- processes: Array of manufacturing processes found on website (look for: CNC machining, milling, turning, welding, 3D printing, injection molding, sheet metal, etc. - use exact names from website)
- materials: Array of materials found on website (look for: aluminum, steel, titanium, plastic, composites, etc. - use exact names from website)
- finishes: Array of finishes found on website (look for: anodizing, powder coating, plating, painting, etc. - use exact names from website)
- certifications: Array of certifications found on website (look for: ISO 9001, AS9100, ISO 14001, NADCAP, etc. - use exact names from website)
- industries: Array of industries served found on website (look for: aerospace, automotive, medical, defense, etc. - use exact names from website)
- typicalJobSize: PROTOTYPE, LOW_VOLUME, MEDIUM_VOLUME, or HIGH_VOLUME (infer from text mentioning "prototype", "low volume", "high volume", "production runs", etc., or null)
- leadTimeMinDays: Minimum lead time in days (extract actual number if mentioned like "2-3 weeks", "10-15 days", etc., or null)
- leadTimeMaxDays: Maximum lead time in days (extract actual number if mentioned, or null)
- maxPartSizeMmX: Maximum part size X dimension in mm (extract actual number if mentioned, or null)
- maxPartSizeMmY: Maximum part size Y dimension in mm (extract actual number if mentioned, or null)
- maxPartSizeMmZ: Maximum part size Z dimension in mm (extract actual number if mentioned, or null)
- rfqEmail: Email for RFQ inquiries (extract actual email from contact section, "Contact Us", or email mentions, or null)
- phone: Phone number (extract actual phone number from contact section, header, or footer, or null)
- preferredContactMethod: EMAIL or PLATFORM_ONLY (infer from website, or null)

Available capabilities for reference (but include ALL processes/materials/etc found in the text, even if not in this list):
${JSON.stringify(allCapabilities, null, 2)}

Available company types:
${JSON.stringify(companyTypes, null, 2)}

Return ONLY valid JSON matching this structure. Use null for missing values. For arrays, use empty arrays if none found.
IMPORTANT: Carefully read through the website text and extract ALL available information. Never use example or placeholder values.`,
                },
                {
                    role: 'user',
                    content: `Extract company information from this website text content. The website URL is: ${websiteUrl}

The text below contains content from ${pageCount} page(s) of the website. Each page section is marked with "=== PAGE NAME ===" headers. Pay special attention to:
- Contact page for email addresses and phone numbers
- About page for company description and location
- Services/Capabilities pages for processes, materials, and finishes
- Certifications/Quality pages for certifications

Website text content from all pages:\n\n${extractedText}`,
                },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.1, // Lower temperature for more accurate extraction
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
