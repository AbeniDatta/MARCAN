import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { auth } from "@/firebase";
import AuthenticatedHeader from "@/components/AuthenticatedHeader";
import FiltersSidebar from "@/components/FiltersSidebar";
import FlippableProductCard from "@/components/FlippableProductCard";
import { listingApi, Listing } from "@/services/api";
import Hero from "@/components/Hero";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Search } from "lucide-react";

const Listings = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [listings, setListings] = useState<Listing[]>([]);
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const [activeFilters, setActiveFilters] = useState({
    location: [] as string[],
    tags: [] as string[],
    capacity: [] as string[],
    categories: [] as string[],
    sortBy: "new-to-old",
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

  // Debug: Monitor filteredListings changes
  useEffect(() => {
    console.log('filteredListings state changed:', filteredListings.map(l => ({ id: l.id, title: l.title, timestamp: l.timestamp })));
  }, [filteredListings]);

  const fetchListings = async () => {
    try {
      setLoading(true);
      console.log('Fetching listings from API...');
      const data = await listingApi.getAllListings(activeFilters.sortBy);
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

  const handleLocalSearch = () => {
    if (localSearchQuery.trim()) {
      performSearch(localSearchQuery.trim());
    }
  };

  const handleLocalSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLocalSearch();
    }
  };

  const handleFilterChange = (filters: typeof activeFilters) => {
    console.log('=== FILTER CHANGE HANDLER ===');
    console.log('Filter change detected:', filters);
    console.log('Current searchQuery:', searchQuery);
    console.log('Calling setActiveFilters and applyFiltersAndSearch');
    setActiveFilters(filters);
    applyFiltersAndSearch(filters, searchQuery);
    console.log('=== FILTER CHANGE HANDLER COMPLETED ===');
  };

  const handleToggleSelectionMode = () => {
    const newMode = !isSelectionMode;
    setIsSelectionMode(newMode);
    if (!newMode) {
      setSelectedIds(new Set());
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredListings.length) {
      // Deselect all
      setSelectedIds(new Set());
    } else {
      // Select all
      const allIds = new Set(filteredListings.map(listing => listing.id));
      setSelectedIds(allIds);
    }
  };

  const handleSelectListing = (listingId: number, selected: boolean) => {
    const newSelectedIds = new Set(selectedIds);
    if (selected) {
      newSelectedIds.add(listingId);
    } else {
      newSelectedIds.delete(listingId);
    }
    setSelectedIds(newSelectedIds);
  };

  const handleContactAll = () => {
    // Get selected listings and their email addresses
    const selectedListings = filteredListings.filter(listing => selectedIds.has(listing.id));
    const emails = selectedListings
      .map(listing => listing.user?.email)
      .filter(email => email) // Remove undefined emails
      .filter((email, index, arr) => arr.indexOf(email) === index); // Remove duplicates

    if (emails.length > 0) {
      // Create mailto link with selected email addresses
      const mailtoLink = `mailto:${emails.join(",")}`;
      window.location.href = mailtoLink;
    } else {
      alert("No valid email addresses found for selected listings.");
    }
  };

  const isAllSelected = filteredListings.length > 0 && selectedIds.size === filteredListings.length;
  const isIndeterminate = selectedIds.size > 0 && selectedIds.size < filteredListings.length;

  const applyFiltersAndSearch = (filters: typeof activeFilters, searchQuery: string) => {
    console.log('=== APPLYING FILTERS AND SEARCH ===');
    console.log('Filters:', filters);
    console.log('Search query:', searchQuery);
    console.log('All listings count:', listings.length);

    console.log('Starting to filter', listings.length, 'listings');
    const filtered = listings.filter((listing, index) => {
      console.log(`Checking listing ${index + 1}/${listings.length}: "${listing.title}"`);

      // Apply filters
      const matchCategories =
        filters.categories.length === 0 ||
        (listing.categories &&
          filters.categories.every((cat) =>
            listing.categories.includes(cat)
          ));

      const matchLocation =
        filters.location.length === 0 ||
        (listing.city && filters.location.some(loc =>
          listing.city?.toLowerCase() === loc.toLowerCase()
        ));

      console.log(`Listing ${listing.id} location check:`, {
        listingCity: listing.city,
        filterLocations: filters.location,
        matchLocation
      });

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

      const finalMatch = matchLocation && matchTags && matchCapacity && matchCategories && matchSearch;
      console.log('Final match for listing', listing.id, ':', finalMatch);

      return finalMatch;
    });

    console.log('Filtered results count:', filtered.length);

    // Apply sorting
    let sortedResults = [...filtered];
    console.log('Sorting by:', filters.sortBy);
    console.log('Sample dates:', sortedResults.slice(0, 3).map(l => ({ id: l.id, createdAt: l.createdAt, parsed: new Date(l.createdAt) })));

    // Log the first few results before sorting
    console.log('Before sorting:', sortedResults.slice(0, 3).map(l => ({
      id: l.id,
      title: l.title,
      createdAt: l.createdAt,
      timestamp: l.timestamp,
      dateTime: new Date(l.createdAt).toISOString()
    })));

    // Debug: Log all timestamps
    console.log('All timestamps:', sortedResults.map(l => ({
      id: l.id,
      title: l.title,
      timestamp: l.timestamp,
      createdAt: l.createdAt,
      createdAtTime: new Date(l.createdAt).getTime()
    })));

    switch (filters.sortBy) {
      case "new-to-old":
        console.log('=== SORTING NEW TO OLD ===');
        sortedResults.sort((a, b) => {
          // Use timestamp if available, otherwise fall back to createdAt
          const timeA = a.timestamp || new Date(a.createdAt).getTime();
          const timeB = b.timestamp || new Date(b.createdAt).getTime();
          console.log(`Comparing ${a.id} (timestamp: ${timeA}, type: ${typeof timeA}) vs ${b.id} (timestamp: ${timeB}, type: ${typeof timeB}): ${timeB - timeA}`);
          return timeB - timeA;
        });
        break;
      case "old-to-new":
        console.log('=== SORTING OLD TO NEW ===');
        sortedResults.sort((a, b) => {
          // Use timestamp if available, otherwise fall back to createdAt
          const timeA = a.timestamp || new Date(a.createdAt).getTime();
          const timeB = b.timestamp || new Date(b.createdAt).getTime();
          console.log(`Comparing ${a.id} (timestamp: ${timeA}, type: ${typeof timeA}) vs ${b.id} (timestamp: ${timeB}, type: ${typeof timeB}): ${timeA - timeB}`);
          return timeA - timeB;
        });
        break;
      default:
        // Default to new-to-old sorting
        sortedResults.sort((a, b) => {
          const timeA = a.timestamp || new Date(a.createdAt).getTime();
          const timeB = b.timestamp || new Date(b.createdAt).getTime();
          return timeB - timeA;
        });
        break;
    }

    // Log the first few results after sorting
    console.log('After sorting:', sortedResults.slice(0, 3).map(l => ({
      id: l.id,
      title: l.title,
      createdAt: l.createdAt,
      timestamp: l.timestamp,
      dateTime: new Date(l.createdAt).toISOString()
    })));
    console.log('Setting filtered listings with count:', sortedResults.length);
    console.log('Final sorted order:', sortedResults.map(l => ({ id: l.id, title: l.title, timestamp: l.timestamp })));
    setFilteredListings(sortedResults);
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
                setLocalSearchQuery("");
                setSearchParams({});
                applyFiltersAndSearch(activeFilters, "");
              }}
              className="text-[#DB1233] hover:text-[#c10e2b] font-semibold underline"
            >
              ← Clear search and show all listings
            </button>
          )}

          {/* Search Bar */}
          <div className="flex items-center gap-0 max-w-2xl mt-8">
            <div className="flex-1 relative">
              <Input
                value={localSearchQuery}
                onChange={(e) => setLocalSearchQuery(e.target.value)}
                onKeyPress={handleLocalSearchKeyPress}
                placeholder="Search listings..."
                className="h-[60px] !text-[16px] font-medium text-[#7A7777] border border-black rounded-lg rounded-r-none border-r-0 px-6 font-inter placeholder:text-[#7A7777] focus:outline-none focus:ring-0 focus:border-black"
              />
            </div>
            <Button
              onClick={handleLocalSearch}
              className="bg-[#DB1233] hover:bg-[#c10e2b] text-white h-[60px] px-8 rounded-lg rounded-l-none text-lg font-semibold font-inter"
            >
              <Search className="h-5 w-5" />
              Search
            </Button>
          </div>

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
            {/* Selection Controls */}
            {filteredListings.length > 0 && (
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  {isSelectionMode && (
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="select-all"
                          checked={isAllSelected}
                          onCheckedChange={handleSelectAll}
                          className="data-[state=checked]:bg-[#DB1233] data-[state=checked]:border-[#DB1233]"
                        />
                        <label
                          htmlFor="select-all"
                          className="text-sm font-medium text-gray-700 cursor-pointer"
                        >
                          Select All
                        </label>
                      </div>

                      {selectedIds.size > 0 && (
                        <Button
                          size="sm"
                          onClick={handleContactAll}
                          className="bg-[#DB1233] hover:bg-[#c10e2b] text-white text-sm font-medium"
                        >
                          Contact All ({selectedIds.size})
                        </Button>
                      )}
                    </div>
                  )}

                  <Button
                    variant={isSelectionMode ? "default" : "outline"}
                    size="sm"
                    onClick={handleToggleSelectionMode}
                    className={isSelectionMode ? "bg-[#DB1233] hover:bg-[#c10e2b]" : ""}
                  >
                    {isSelectionMode ? 'Cancel Selection' : 'Select Listings'}
                  </Button>
                </div>
              </div>
            )}

            {filteredListings.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No listings available.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredListings.map((listing) => (
                  <div key={listing.id} className="h-[400px]">
                    <FlippableProductCard
                      listing={listing}
                      selectMode={isSelectionMode}
                      isSelected={selectedIds.has(listing.id)}
                      onSelect={(id, selected) => handleSelectListing(listing.id, selected)}
                    />
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
