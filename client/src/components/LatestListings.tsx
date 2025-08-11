import { useEffect, useState } from 'react';
import { listingApi, Listing } from '@/services/api';
import ListingCard from './ListingCard';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

interface Filters {
  categories: string[];
  tags: string[];
  location: string[];
  capacity: string[];
  sortBy: string;
}

interface LatestListingsProps {
  filters: Filters;
  onSelectionChange?: (selectedListings: Listing[]) => void;
  selectedListings?: Listing[];
  onSelectionModeChange?: (mode: boolean) => void;
}

const LatestListings = ({ filters, onSelectionChange, selectedListings = [], onSelectionModeChange }: LatestListingsProps) => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Sync with parent component's selected listings
  useEffect(() => {
    const parentSelectedIds = new Set(selectedListings.map(listing => listing.id));
    setSelectedIds(parentSelectedIds);
  }, [selectedListings]);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const data = await listingApi.getAllListings();
        console.log('Fetched listings:', data);
        setListings(data);
        setFilteredListings(data);
      } catch (err) {
        console.error('Failed to fetch listings', err);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, []);

  useEffect(() => {
    const filtered = listings.filter((listing) => {
      const matchCategory =
        filters.categories.length === 0 ||
        filters.categories.some((cat) => listing.categories.includes(cat));

      const matchLocation =
        filters.location.length === 0 ||
        (listing.city && filters.location.some(loc =>
          listing.city?.toLowerCase() === loc.toLowerCase()
        ));

      const matchTags =
        filters.tags.length === 0 ||
        filters.tags.every((tag) => listing.tags.includes(tag));

      return matchCategory && matchLocation && matchTags;
    });
    let sorted = [...filtered];
    switch (filters.sortBy) {
      case "new-to-old":
        sorted.sort((a, b) => {
          const timeA = a.timestamp || new Date(a.createdAt).getTime();
          const timeB = b.timestamp || new Date(b.createdAt).getTime();
          return timeB - timeA;
        });
        break;
      case "old-to-new":
        sorted.sort((a, b) => {
          const timeA = a.timestamp || new Date(a.createdAt).getTime();
          const timeB = b.timestamp || new Date(b.createdAt).getTime();
          return timeA - timeB;
        });
        break;
      default:
        // Default to new-to-old sorting
        sorted.sort((a, b) => {
          const timeA = a.timestamp || new Date(a.createdAt).getTime();
          const timeB = b.timestamp || new Date(b.createdAt).getTime();
          return timeB - timeA;
        });
        break;
    }

    setFilteredListings(sorted);
  }, [filters, listings]);

  const handleToggleSelectionMode = () => {
    const newMode = !isSelectionMode;
    setIsSelectionMode(newMode);
    onSelectionModeChange?.(newMode);
    if (!newMode) {
      setSelectedIds(new Set());
      onSelectionChange?.([]);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredListings.length) {
      // Deselect all
      setSelectedIds(new Set());
      onSelectionChange?.([]);
    } else {
      // Select all
      const allIds = new Set(filteredListings.map(listing => listing.id));
      setSelectedIds(allIds);
      onSelectionChange?.(filteredListings);
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

    const selectedListings = filteredListings.filter(listing => newSelectedIds.has(listing.id));
    onSelectionChange?.(selectedListings);
  };

  const isAllSelected = filteredListings.length > 0 && selectedIds.size === filteredListings.length;
  const isIndeterminate = selectedIds.size > 0 && selectedIds.size < filteredListings.length;

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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-4xl font-medium text-black font-inter">
          Latest Listings
        </h2>

        {filteredListings.length > 0 && (
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
        )}
      </div>

      {loading ? (
        <p className="text-gray-500">Loading listings...</p>
      ) : listings.length === 0 ? (
        <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-100 text-center">
          <p className="text-gray-600 text-lg">
            No listings available yet. We're just getting started. Once businesses
            add listings, they'll appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              isSelectionMode={isSelectionMode}
              isSelected={selectedIds.has(listing.id)}
              onSelect={(selected) => handleSelectListing(listing.id, selected)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default LatestListings;
