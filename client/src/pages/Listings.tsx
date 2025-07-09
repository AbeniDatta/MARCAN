import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { auth } from "@/firebase";
import AuthenticatedHeader from "@/components/AuthenticatedHeader";
import FiltersSidebar from "@/components/FiltersSidebar";
import FlippableProductCard from "@/components/FlippableProductCard";
import { listingApi, Listing } from "@/services/api";

const Listings = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [listings, setListings] = useState<Listing[]>([]);
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [activeFilters, setActiveFilters] = useState({
    location: "",
    tags: [] as string[],
    capacity: [] as string[],
  });

  useEffect(() => {
    // Check if user is logged in
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        navigate("/login");
      } else {
        fetchListings();
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // Handle search and category query from URL
  useEffect(() => {
    const searchFromUrl = searchParams.get('search');
    const categoryFromUrl = searchParams.get('category');
    console.log('Search params changed:', { search: searchFromUrl, category: categoryFromUrl });

    if (listings.length > 0) {
      if (searchFromUrl) {
        setSearchQuery(searchFromUrl);
        performSearch(searchFromUrl);
      }
      if (categoryFromUrl) {
        setSearchQuery(categoryFromUrl);
        performSearch(categoryFromUrl);
      }
    }
  }, [searchParams, listings]);

  // Handle search/category when listings are loaded
  useEffect(() => {
    const searchFromUrl = searchParams.get('search');
    const categoryFromUrl = searchParams.get('category');

    if (listings.length > 0) {
      if (searchFromUrl) {
        console.log('Listings loaded, performing search for:', searchFromUrl);
        setSearchQuery(searchFromUrl);
        performSearch(searchFromUrl);
      }
      if (categoryFromUrl) {
        console.log('Listings loaded, performing category search for:', categoryFromUrl);
        setSearchQuery(categoryFromUrl);
        performSearch(categoryFromUrl);
      }
    }
  }, [listings]);

  const fetchListings = async () => {
    try {
      setLoading(true);
      console.log('Fetching listings from API...');
      const data = await listingApi.getAllListings();
      console.log('API returned listings:', data);
      console.log('Listings count:', data.length);
      setListings(data);
      setFilteredListings(data);
    } catch (err) {
      console.error("Failed to fetch listings:", err);
      setError("Failed to load listings");
    } finally {
      setLoading(false);
    }
  };

  const performSearch = (query: string) => {
    console.log('=== PERFORMING SEARCH ===');
    console.log('Search query:', query);
    console.log('Available listings count:', listings.length);
    console.log('Active filters:', activeFilters);
    setSearchQuery(query);
    applyFiltersAndSearch(activeFilters, query);
  };

  const handleFilterChange = (filters: typeof activeFilters) => {
    setActiveFilters(filters);
    applyFiltersAndSearch(filters, searchQuery);
  };

  const applyFiltersAndSearch = (filters: typeof activeFilters, searchQuery: string) => {
    console.log('Applying filters and search:', { filters, searchQuery });
    console.log('All listings:', listings);

    console.log('Starting to filter', listings.length, 'listings');
    const filtered = listings.filter((listing, index) => {
      console.log(`Checking listing ${index + 1}/${listings.length}: "${listing.title}"`);

      // Apply filters
      const matchLocation =
        !filters.location ||
        listing.city?.toLowerCase().includes(filters.location.toLowerCase());

      const matchTags =
        filters.tags.length === 0 ||
        filters.tags.every((tag) => listing.tags?.includes(tag));

      const matchCapacity =
        filters.capacity.length === 0 ||
        (listing.capacity && filters.capacity.includes(listing.capacity));

      // Apply search
      let matchSearch = true;
      if (searchQuery) {
        const searchTerm = searchQuery.toLowerCase();
        console.log('Searching for term:', searchTerm);
        console.log('Listing being checked:', {
          id: listing.id,
          title: listing.title,
          description: listing.description,
          companyName: listing.companyName,
          categories: listing.categories,
          tags: listing.tags
        });

        const matchTitle = listing.title?.toLowerCase().includes(searchTerm);
        const matchDescription = listing.description?.toLowerCase().includes(searchTerm);
        const matchCompanyName = listing.companyName?.toLowerCase().includes(searchTerm);
        const matchCategories = listing.categories?.some(cat =>
          cat.toLowerCase().includes(searchTerm)
        );
        const matchTags = listing.tags?.some(tag =>
          tag.toLowerCase().includes(searchTerm)
        );

        // More detailed debugging
        console.log(`Checking listing "${listing.title}" for term "${searchTerm}":`);
        console.log(`  Title match: "${listing.title?.toLowerCase()}" includes "${searchTerm}" = ${matchTitle}`);
        console.log(`  Description match: "${listing.description?.toLowerCase()}" includes "${searchTerm}" = ${matchDescription}`);
        console.log(`  Company match: "${listing.companyName?.toLowerCase()}" includes "${searchTerm}" = ${matchCompanyName}`);
        console.log(`  Categories match: ${listing.categories?.map(cat => cat.toLowerCase()).join(', ')} includes "${searchTerm}" = ${matchCategories}`);
        console.log(`  Tags match: ${listing.tags?.map(tag => tag.toLowerCase()).join(', ')} includes "${searchTerm}" = ${matchTags}`);

        console.log('Match results:', {
          matchTitle,
          matchDescription,
          matchCompanyName,
          matchCategories,
          matchTags
        });

        matchSearch = matchTitle || matchDescription || matchCompanyName || matchCategories || matchTags;
      }

      const finalMatch = matchLocation && matchTags && matchCapacity && matchSearch;
      console.log('Final match for listing', listing.id, ':', finalMatch);

      return finalMatch;
    });

    console.log('Filtered results:', filtered);
    setFilteredListings(filtered);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F9F9]">
        <AuthenticatedHeader />
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-gray-500">Loading listings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F9F9F9]">
        <AuthenticatedHeader />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={fetchListings}
              className="bg-[#DB1233] hover:bg-[#c10e2b] text-white px-4 py-2 rounded"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F9F9]">
      {/* Authenticated Header */}
      <AuthenticatedHeader />

      {/* Page Header */}
      <section className="bg-[#F9F9F9] px-4 lg:px-20 py-12">
        <div className="max-w-screen-xl mx-auto">
          <h1 className="text-[40px] md:text-[50px] font-bold text-black font-inter leading-tight">
            {searchQuery ? `Results for "${searchQuery}"` : "All Listings"}
          </h1>
          <p className="text-[25px] text-[#4A3F3F] font-inria-sans font-normal mb-8">
            {searchQuery
              ? `Found ${filteredListings.length} result${filteredListings.length !== 1 ? 's' : ''} for "${searchQuery}"`
              : "Browse all available products and services from our suppliers"
            }
          </p>
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSearchParams({});
                applyFiltersAndSearch(activeFilters, "");
              }}
              className="text-[#DB1233] hover:text-[#c10e2b] font-semibold underline"
            >
              ← Clear search and show all listings
            </button>
          )}


        </div>
      </section>

      <section className="bg-[#F9F9F9] px-4 lg:px-20 pb-16">
        <div className="max-w-screen-xl mx-auto flex flex-col lg:flex-row gap-8">
          <div className="flex-shrink-0 w-full lg:w-auto">
            <FiltersSidebar
              filters={activeFilters}
              onFilterChange={handleFilterChange}
            />
          </div>

          <div className="flex-1">
            {filteredListings.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No listings available.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredListings.map((listing) => (
                  <div key={listing.id} className="h-[400px]">
                    <FlippableProductCard listing={listing} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Listings;

{/* Listings with Sidebar */ }
{/* <section className="bg-[#F9F9F9] px-4 lg:px-20 pb-16">
        <div className="max-w-screen-xl mx-auto flex gap-8"> */}
{/* Main Content - Listings Grid */ }
{/* <div className="flex-1">
            {listings.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No listings available.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map((listing) => (
                  <div key={listing.id} className="h-[400px]">
                    <FlippableProductCard listing={listing} />
                  </div>
                ))}
              </div>
            )}
          </div> */}

{/* Filters Sidebar */ }
{/* <div className="flex-shrink-0">
            <FiltersSidebar />
          </div>
        </div>
      </section>
    </div>
  );
}; */}

// export default Listings;
