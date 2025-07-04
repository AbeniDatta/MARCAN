import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "@/firebase";
import AuthenticatedHeader from "@/components/AuthenticatedHeader";
import FiltersSidebar from "@/components/FiltersSidebar";
import FlippableProductCard from "@/components/FlippableProductCard";
import { listingApi, Listing } from "@/services/api";

const Listings = () => {
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  const fetchListings = async () => {
    try {
      setLoading(true);
      const data = await listingApi.getAllListings();
      setListings(data);
    } catch (err) {
      console.error("Failed to fetch listings:", err);
      setError("Failed to load listings");
    } finally {
      setLoading(false);
    }
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
            All Listings
          </h1>
          <p className="text-[25px] text-[#4A3F3F] font-inria-sans font-normal mb-8">
            Browse all available products and services from our suppliers
          </p>
        </div>
      </section>

      {/* Listings with Sidebar */}
      <section className="bg-[#F9F9F9] px-4 lg:px-20 pb-16">
        <div className="max-w-screen-xl mx-auto flex gap-8">
          {/* Main Content - Listings Grid */}
          <div className="flex-1">
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
          </div>

          {/* Filters Sidebar */}
          <div className="flex-shrink-0">
            <FiltersSidebar />
          </div>
        </div>
      </section>
    </div>
  );
};

export default Listings;
