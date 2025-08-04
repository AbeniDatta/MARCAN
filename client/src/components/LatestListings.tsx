import { useEffect, useState } from 'react';
import { listingApi, Listing } from '@/services/api';
import ListingCard from './ListingCard';

interface Filters {
  categories: string[];
  tags: string[];
  location: string[];
  capacity: string[];
  sortBy: string;
}

interface LatestListingsProps {
  filters: Filters;
}

const LatestListings = ({ filters }: LatestListingsProps) => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

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
            // Leave as-is for now; "most-relevant" is optional
            break;
        }

    setFilteredListings(sorted);
  }, [filters, listings]);

  return (
    <div>
      <h2 className="text-4xl font-medium text-black font-inter mb-12">
        Latest Listings
      </h2>

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
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
};

export default LatestListings;
