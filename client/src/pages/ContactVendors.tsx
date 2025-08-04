import { useEffect, useState } from "react";
import { listingApi } from "@/services/api";
import { Listing } from "@/services/api";
import FlippableProductCard from "@/components/FlippableProductCard";
import AuthenticatedHeader from "@/components/AuthenticatedHeader";

const ContactVendorsPage = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);

  useEffect(() => {
    fetchAllListings();
  }, []);

  const fetchAllListings = async () => {
    try {
      const all = await listingApi.getAllListings(); // adjust this to match your API
      setListings(all);
    } catch (error) {
      console.error("Error fetching listings:", error);
    }
  };

  const handleSelect = (email: string, selected: boolean) => {
    setSelectedEmails((prev) =>
      selected ? [...prev, email] : prev.filter((e) => e !== email)
    );
  };

  return (
    <div className="min-h-screen bg-[#F9F9F9] pb-10">
      <AuthenticatedHeader />

      <main className="px-4 lg:px-20 pt-10 max-w-screen-xl mx-auto">
        <h1 className="text-[36px] font-bold mb-6 text-black font-inter">Contact Vendors</h1>

        {selectedEmails.length > 0 && (
          <a
            href={`mailto:${selectedEmails.join(",")}`}
            className="inline-block mb-6 px-4 py-2 rounded bg-[#DB1233] text-white font-medium hover:bg-[#c10e2b]"
          >
            Contact Selected ({selectedEmails.length})
          </a>
        )}

        {listings.length === 0 ? (
          <p className="text-gray-600 text-lg">No listings found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <div key={listing.id} className="h-[420px]">
                <FlippableProductCard
                  listing={listing}
                  selectMode
                  onSelect={handleSelect}
                />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ContactVendorsPage;