const prisma = require('../prismaClient');

// Knowledge base for website features and functionality
const WEBSITE_KNOWLEDGE = {
    features: [
        "User registration and authentication using Firebase",
        "Create and manage product/service listings",
        "Browse listings with advanced search and filtering",
        "Contact suppliers through their profiles",
        "User profile management with company information",
        "Draft and publish listing workflow",
        "Category-based organization of listings",
        "Image upload for listings",
        "Responsive design for mobile and desktop",
        "Real-time search functionality"
    ],
    categories: [
        "Manufacturing", "Technology", "Professional Services",
        "Construction", "Healthcare", "Retail", "Transportation",
        "Education", "Finance", "Entertainment"
    ],
    processes: {
        registration: "Click 'Sign Up' in the header, provide email and password, verify email",
        createListing: "Sign in → Click 'Create Listing' → Fill form with details → Upload images → Publish",
        browseListings: "Visit 'Listings' page → Use search bar or filters → Click on listings to view details",
        contactSupplier: "Click supplier name → View profile page → Use provided contact information",
        manageAccount: "Sign in → Click 'My Account' → Edit profile, change password, view listings"
    }
};

// Function to search listings based on query
const searchListings = async (query) => {
    const searchTerms = query.toLowerCase().split(' ');

    const listings = await prisma.listing.findMany({
        where: {
            OR: [
                { title: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
                { categories: { hasSome: searchTerms } },
                { tags: { hasSome: searchTerms } },
                { companyName: { contains: query, mode: 'insensitive' } }
            ]
        },
        include: {
            user: {
                select: {
                    name: true,
                    companyName: true,
                    city: true,
                    province: true
                }
            }
        },
        take: 5 // Limit to 5 most relevant results
    });

    return listings;
};

// Function to search users/suppliers
const searchSuppliers = async (query) => {
    const users = await prisma.user.findMany({
        where: {
            OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { companyName: { contains: query, mode: 'insensitive' } },
                { city: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } }
            ]
        },
        select: {
            id: true,
            name: true,
            companyName: true,
            city: true,
            province: true,
            description: true,
            website: true
        },
        take: 3
    });

    return users;
};

// Function to get category statistics
const getCategoryStats = async () => {
    const stats = await prisma.listing.groupBy({
        by: ['categories'],
        _count: {
            id: true
        }
    });

    return stats;
};

// Main RAG function
const generateResponse = async (userQuery) => {
    const query = userQuery.toLowerCase();
    console.log('Processing query:', query);

    // Check for greeting patterns
    if (query.match(/^(hi|hello|hey|good morning|good afternoon|good evening)$/)) {
        return {
            type: 'greeting',
            response: "Hello! I'm your AI assistant. I can help you find products, suppliers, or answer questions about this marketplace. What would you like to know?",
            data: null
        };
    }

    // Check for product/search queries
    if (query.match(/\b(find|search|look for|browse|show me)\b.*\b(product|service|item|listing)\b/) ||
        query.match(/\b(what|which)\b.*\b(available|offered|listed)\b/)) {

        const searchTerm = query.replace(/\b(find|search|look for|browse|show me|what|which|available|offered|listed|products?|services?|items?|listings?)\b/g, '').trim();

        if (searchTerm) {
            const listings = await searchListings(searchTerm);
            if (listings.length > 0) {
                const listingInfo = listings.map(listing =>
                    `• ${listing.title} by ${listing.companyName || listing.user.companyName} - $${listing.price}`
                ).join('\n');

                return {
                    type: 'search_results',
                    response: `I found ${listings.length} listings matching "${searchTerm}":\n\n${listingInfo}\n\nYou can click on any listing to view more details or contact the supplier.`,
                    data: listings
                };
            } else {
                return {
                    type: 'no_results',
                    response: `I couldn't find any listings matching "${searchTerm}". Try searching with different keywords or browse all categories to discover what's available.`,
                    data: null
                };
            }
        }
    }

    // Check for supplier queries
    if (query.match(/\b(find|search|look for)\b.*\b(supplier|vendor|company|business)\b/) ||
        query.match(/\b(who|which)\b.*\b(supplier|vendor|company)\b/)) {

        const searchTerm = query.replace(/\b(find|search|look for|who|which|supplier|vendor|company|business)\b/g, '').trim();

        if (searchTerm) {
            const suppliers = await searchSuppliers(searchTerm);
            if (suppliers.length > 0) {
                const supplierInfo = suppliers.map(supplier =>
                    `• ${supplier.companyName || supplier.name}${supplier.city ? ` (${supplier.city})` : ''}`
                ).join('\n');

                return {
                    type: 'supplier_results',
                    response: `I found ${suppliers.length} suppliers matching "${searchTerm}":\n\n${supplierInfo}\n\nClick on their name to view their profile and contact information.`,
                    data: suppliers
                };
            }
        }
    }

    // Check for category queries
    if (query.match(/\b(what|which|tell me about)\b.*\b(categories?|types?)\b/)) {
        const stats = await getCategoryStats();
        const categoryList = WEBSITE_KNOWLEDGE.categories.join(', ');

        return {
            type: 'categories',
            response: `The marketplace features these categories: ${categoryList}. You can browse by category using the filters on the listings page, or search for specific products within categories.`,
            data: stats
        };
    }

    // Check for pricing queries
    if (query.match(/\b(how much|price|cost|expensive|cheap)\b/)) {
        const avgPrice = await prisma.listing.aggregate({
            _avg: {
                price: true
            }
        });

        const priceRange = await prisma.listing.findMany({
            select: {
                price: true
            },
            orderBy: {
                price: 'asc'
            },
            take: 1
        });

        const maxPrice = await prisma.listing.findMany({
            select: {
                price: true
            },
            orderBy: {
                price: 'desc'
            },
            take: 1
        });

        return {
            type: 'pricing',
            response: `Pricing varies widely across listings. The average price is $${Math.round(avgPrice._avg.price || 0)}, with prices ranging from $${priceRange[0]?.price || 0} to $${maxPrice[0]?.price || 0}. Each supplier sets their own pricing based on their products and services.`,
            data: { average: avgPrice._avg.price, min: priceRange[0]?.price, max: maxPrice[0]?.price }
        };
    }

    // Check for registration/account questions
    if (query.match(/\b(how|what|where)\b.*\b(sign|register|signup|sign up|create account|join)\b/)) {
        return {
            type: 'registration',
            response: `To create an account: ${WEBSITE_KNOWLEDGE.processes.registration}. Once registered, you can browse listings, create your own listings, and contact suppliers.`,
            data: null
        };
    }

    // Check for listing creation questions
    console.log('Checking for listing creation patterns...');
    if (query.match(/\b(where|how|what)\b.*\b(create|make|add|post|list|publish)\b/) ||
        query.match(/\b(create|make|add|post|list|publish)\b.*\b(listing|product|service)\b/) ||
        query.match(/\b(listing|product|service)\b.*\b(create|make|add|post|list|publish)\b/)) {
        console.log('Found listing creation pattern!');
        return {
            type: 'create_listing',
            response: `To create a listing: ${WEBSITE_KNOWLEDGE.processes.createListing}. Make sure to provide detailed descriptions and high-quality images to attract potential buyers.`,
            data: null
        };
    }

    // Check for browsing questions
    if (query.match(/\b(how|what|where)\b.*\b(browse|search|find|look|discover)\b/)) {
        return {
            type: 'browsing',
            response: `To browse listings: ${WEBSITE_KNOWLEDGE.processes.browseListings}. You can also use the search bar on the homepage or explore featured categories.`,
            data: null
        };
    }

    // Check for contact questions
    if (query.match(/\b(how|what|where)\b.*\b(contact|reach|get in touch|message)\b.*\b(supplier|vendor|seller)\b/)) {
        return {
            type: 'contact',
            response: `To contact suppliers: ${WEBSITE_KNOWLEDGE.processes.contactSupplier}. Each supplier's profile contains their contact information and business details.`,
            data: null
        };
    }

    // Check for account management
    if (query.match(/\b(how|what|where)\b.*\b(account|profile|settings|manage)\b/)) {
        return {
            type: 'account_management',
            response: `To manage your account: ${WEBSITE_KNOWLEDGE.processes.manageAccount}. You can update your profile, change settings, and view your activity.`,
            data: null
        };
    }

    // Check for feature questions
    if (query.match(/\b(what|which|tell me about)\b.*\b(features?|functions?|capabilities?)\b/)) {
        const featureList = WEBSITE_KNOWLEDGE.features.join(', ');
        return {
            type: 'features',
            response: `The platform offers these features: ${featureList}. Everything is designed to facilitate smooth B2B connections and transactions.`,
            data: null
        };
    }

    // Check for thank you/goodbye
    if (query.match(/\b(thanks|thank you|bye|goodbye|see you)\b/)) {
        return {
            type: 'farewell',
            response: "You're welcome! Feel free to come back anytime if you have more questions. I'm here to help make your marketplace experience smooth and successful.",
            data: null
        };
    }

    // Default response with suggestions
    const suggestions = [
        "Find products or services",
        "Search for suppliers",
        "Learn about categories",
        "Check pricing information",
        "How to create an account",
        "How to create a listing"
    ];

    return {
        type: 'default',
        response: `I understand you're asking about "${userQuery}". While I might not have a specific answer, I can help you with: ${suggestions.join(', ')}. Could you rephrase your question or ask about one of these topics?`,
        data: null
    };
};

// Controller function
const chatController = {
    // Handle chat queries
    async handleQuery(req, res) {
        try {
            const { query } = req.body;

            if (!query || typeof query !== 'string') {
                return res.status(400).json({
                    error: 'Query is required and must be a string'
                });
            }

            const result = await generateResponse(query);

            res.json({
                success: true,
                response: result.response,
                type: result.type,
                data: result.data
            });

        } catch (error) {
            console.error('Chat controller error:', error);
            res.status(500).json({
                error: 'Failed to process chat query',
                details: error.message
            });
        }
    },

    // Get chat suggestions
    async getSuggestions(req, res) {
        try {
            const suggestions = [
                "Find manufacturing suppliers",
                "Search for technology services",
                "How to create a listing",
                "Browse by category",
                "Contact suppliers",
                "Manage my account"
            ];

            res.json({
                success: true,
                suggestions
            });

        } catch (error) {
            console.error('Error getting suggestions:', error);
            res.status(500).json({
                error: 'Failed to get suggestions'
            });
        }
    }
};

module.exports = chatController; 