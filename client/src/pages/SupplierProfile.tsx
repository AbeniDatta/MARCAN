import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { auth } from "@/firebase";
import { profileApi, UserProfile } from "@/services/api";
import { listingApi, Listing } from "@/services/api";
import AuthenticatedHeader from "@/components/AuthenticatedHeader";
import FlippableProductCard from "@/components/FlippableProductCard";

const SupplierProfile = () => {
  const { supplierId } = useParams<{ supplierId: string }>();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (supplierId) {
      fetchSupplierData(supplierId);
      fetchSupplierListings(supplierId);
    }
  }, [supplierId]);

  const fetchSupplierData = async (supplierId: string) => {
    try {
      setLoading(true);
      const userId = parseInt(supplierId);
      const data = isNaN(userId)
        ? await profileApi.getUserProfile(supplierId)
        : await profileApi.getUserProfileById(userId);
      setProfileData(data);
    } catch (err: any) {
      console.error("Failed to fetch supplier data", err);
      setError("Failed to load supplier information");
    } finally {
      setLoading(false);
    }
  };

  const fetchSupplierListings = async (supplierId: string) => {
    try {
      const userId = parseInt(supplierId);
      const data = isNaN(userId)
        ? await listingApi.getListingsByFirebaseUid(supplierId)
        : await listingApi.getListingsByUser(userId);
      setListings(data);
    } catch (err: any) {
      console.error("Failed to fetch supplier listings", err);
    }
  };

  const formatAddress = () => {
    if (!profileData) return "";
    const parts = [
      profileData.address1,
      profileData.address2,
      profileData.city,
      profileData.province,
      profileData.postalCode,
    ].filter(Boolean);
    return parts.join(", ");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F9F9]">
        <AuthenticatedHeader />
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-gray-500">Loading supplier information...</p>
        </div>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="min-h-screen bg-[#F9F9F9]">
        <AuthenticatedHeader />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error || "Supplier not found"}</p>
            <Button
              onClick={() => navigate("/")}
              className="bg-[#DB1233] hover:bg-[#c10e2b] text-white"
            >
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F9F9]">
      <AuthenticatedHeader />

      <main className="px-4 lg:px-20 py-8 max-w-screen-xl mx-auto">
        <h1 className="text-[40px] md:text-[50px] font-bold text-black font-inter mb-8">
          {profileData.companyName || "Supplier Profile"}
        </h1>

        <div className="flex flex-col lg:flex-row gap-6 mb-8">
          {profileData.logoUrl ? (
          <img
          src={profileData.logoUrl}
          alt={`${profileData.companyName} Logo`}
          className="w-[235px] h-[163px] object-cover bg-white rounded-md border border-gray-200"
          />
          ) : (
          <div className="w-[235px] h-[163px] bg-[#D9D9D9] rounded-md flex items-center justify-center text-gray-500 text-sm">
          No Logo
          </div>
          )}
          <div className="flex-1 space-y-4">
            <h2 className="text-[22px] md:text-[26px] font-bold text-black font-inter">
              {profileData.companyName || "Company Name Not Set"}
            </h2>
            <p className="text-[18px] md:text-[22px] font-semibold text-black font-inter">
              {formatAddress()}
            </p>
            {profileData.website && (
              <p className="text-[16px] md:text-[20px] font-semibold text-black font-inter">
                {profileData.website}
              </p>
            )}
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-[28px] md:text-[32px] font-bold text-black font-inter mb-4">
            Contact Details:
          </h3>
          <div className="flex flex-col md:flex-row gap-4">
            {profileData.phone && (
              <div className="bg-white rounded-[20px] px-4 py-3">
                <span className="text-[16px] md:text-[20px] font-semibold text-black font-inter">
                  {profileData.phone}
                </span>
              </div>
            )}
            <div className="bg-white rounded-[20px] px-4 py-3">
                <a
                  href={`mailto:${profileData.email}`}
                  className="text-[16px] md:text-[20px] font-semibold text-blue-600 underline hover:text-blue-800 font-inter"
                >
                  {profileData.email}
                </a>
            </div>
          </div>
        </div>

        {profileData.description && (
          <div className="mb-8">
            <h3 className="text-[28px] md:text-[32px] font-bold text-black font-inter mb-4">
              About:
            </h3>
            <div className="bg-white rounded-[20px] px-6 py-4">
              <p className="text-[16px] md:text-[20px] font-semibold text-black font-inter leading-relaxed">
                {profileData.description}
              </p>
            </div>
          </div>
        )}

        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[28px] md:text-[32px] font-bold text-black font-inter">
              Products & Services:
            </h3>
          </div>

          {listings.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">
                No listings available from this supplier.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((listing) => (
               <div key={listing.id} className="h-[400px]">
               <FlippableProductCard listing={listing} readonly />
               </div>
             ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default SupplierProfile;