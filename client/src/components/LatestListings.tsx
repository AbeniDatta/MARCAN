import { useEffect, useState } from 'react';
import api from '@/api';

const LatestListings = () => {
  const [listings, setListings] = useState<Array<{ id: number; title: string; description: string; price: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const res = await api.get('/listings');
        setListings(res.data);
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {listings.map((listing) => (
            <div
              key={listing.id}
              className="bg-white p-6 rounded-lg border shadow hover:shadow-md transition"
            >
              <h3 className="text-xl font-semibold mb-2">{listing.title}</h3>
              <p className="text-gray-700 mb-1">{listing.description}</p>
              <p className="text-gray-500 text-sm">${listing.price}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LatestListings;
