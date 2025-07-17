import { useEffect, useState } from 'react';
import { listingApi, Listing } from '@/services/api';
import ListingCard from './ListingCard';

interface Filters {
  categories: string[];
  tags: string[];
  location: string;
  capacity: string[]; // Optional if you don't use it in this component
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
        !filters.location ||
        listing.city
          ?.toLowerCase()
          .includes(filters.location.toLowerCase());

      const matchTags =
        filters.tags.length === 0 ||
        filters.tags.every((tag) => listing.tags.includes(tag));

      return matchCategory && matchLocation && matchTags;
    });

    setFilteredListings(filtered);
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
