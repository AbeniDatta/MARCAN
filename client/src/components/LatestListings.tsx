import { useEffect, useState } from 'react';
import { listingApi, Listing } from '@/services/api';
import ListingCard from './ListingCard';

const LatestListings = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const data = await listingApi.getAllListings();
        console.log('Fetched listings:', data);
        setListings(data);
      } catch (err) {
        console.error('Failed to fetch listings', err);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, []);

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
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
};

export default LatestListings;
