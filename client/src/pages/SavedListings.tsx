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
      <section className="bg-[#F9F9F9] px-4 lg:px-20 py-12">
        <div className="max-w-screen-xl mx-auto">
          <h1 className="text-[40px] md:text-[50px] font-bold text-black font-inter leading-tight">
            Saved Listings
          </h1>
          <p className="text-[25px] text-[#4A3F3F] font-inria-sans font-normal mb-8">
            Your saved products and services from our suppliers
          </p>
        </div>
      </section>

      <section className="bg-[#F9F9F9] px-4 lg:px-20 pb-16">
        <div className="max-w-screen-xl mx-auto">
          {listings.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 text-lg">No saved listings yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} showHeart={false} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default SavedListings;