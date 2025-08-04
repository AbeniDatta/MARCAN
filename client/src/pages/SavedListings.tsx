import { useEffect, useState } from 'react';
import { listingApi, Listing } from '@/services/api';
import ListingCard from '@/components/ListingCard';
import AuthenticatedHeader from '@/components/AuthenticatedHeader';

const SavedListings = () => {
  const [listings, setListings] = useState<Listing[]>([]);

  useEffect(() => {
    const fetchSaved = async () => {
      try {
        const saved = await listingApi.getSavedListings();
        setListings(saved);
      } catch (err) {
        console.error('Error loading saved listings:', err);
      }
    };

    fetchSaved();
  }, []);

  return (
    <div className="min-h-screen bg-[#F9F9F9]">
      <AuthenticatedHeader />
      <div className="px-4 lg:px-20 py-12">
        <h1 className="text-3xl font-bold mb-6">Saved Listings</h1>
        {listings.length === 0 ? (
          <p>No saved listings yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedListings;