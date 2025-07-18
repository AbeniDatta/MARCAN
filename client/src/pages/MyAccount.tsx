import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "@/firebase";
import AuthenticatedHeader from "@/components/AuthenticatedHeader";
import ProductCard from "@/components/ProductCard";
import AddListingCard from "@/components/AddListingCard";
import ListingCard from "@/components/ListingCard";
import MyListingCard from "@/components/MyListingCard";
import { Button } from "@/components/ui/button";
import { listingApi, Listing } from "@/services/api";
import { profileApi, UserProfile } from "@/services/api";

const MyAccount = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'account' | 'listings'>('account');
  const [listings, setListings] = useState<Listing[]>([]);
  const [drafts, setDrafts] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [draftsLoading, setDraftsLoading] = useState(true);
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        navigate("/login");
      } else {
        // Fetch profile data when user is authenticated
        fetchProfileData(user.uid);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    fetchMyListings();
    fetchMyDrafts();
  }, []);

  const fetchProfileData = async (firebaseUid: string) => {
    try {
      setProfileLoading(true);
      console.log('Fetching profile for Firebase UID:', firebaseUid);
      const data = await profileApi.getUserProfile(firebaseUid);
      console.log('Profile data received:', data);
      setProfileData(data);
    } catch (err: any) {
      console.error("Failed to fetch profile data", err);
      console.error("Error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });

      // If profile doesn't exist, create a default one
      if (err.message.includes('User not found') || err.response?.status === 404) {
        console.log('Creating default profile display');
        const defaultProfile: UserProfile = {
          id: 0,
          name: auth.currentUser?.email?.split('@')[0] || 'User',
          email: auth.currentUser?.email || '',
          firebaseUid: firebaseUid,
          companyName: 'Company Name Not Set',
          address1: 'Address Not Set',
          city: 'City Not Set',
          province: 'Province Not Set',
          postalCode: 'Postal Code Not Set',
          website: '',
          phone: 'Phone Not Set',
          description: 'Description Not Set',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setProfileData(defaultProfile);
      } else {
        // For other errors, still show a default profile but log the error
        console.log('Showing default profile due to error');
        const defaultProfile: UserProfile = {
          id: 0,
          name: auth.currentUser?.email?.split('@')[0] || 'User',
          email: auth.currentUser?.email || '',
          firebaseUid: firebaseUid,
          companyName: 'Error Loading Profile',
          address1: 'Error Loading Profile',
          city: 'Error Loading Profile',
          province: 'Error Loading Profile',
          postalCode: 'Error Loading Profile',
          website: '',
          phone: 'Error Loading Profile',
          description: 'Error Loading Profile',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setProfileData(defaultProfile);
      }
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchMyListings = async () => {
    try {
      setLoading(true);
      const data = await listingApi.getMyListings();
      setListings(data);
    } catch (err: any) {
      console.error("Failed to fetch my listings", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyDrafts = async () => {
    try {
      setDraftsLoading(true);
      const data = await listingApi.getMyDrafts();
      setDrafts(data);
    } catch (err: any) {
      console.error("Failed to fetch my drafts", err);
    } finally {
      setDraftsLoading(false);
    }
  };

  // Format address for display
  const formatAddress = () => {
    if (!profileData) return '';

    const parts = [
      profileData.address1,
      profileData.address2,
      profileData.city,
      profileData.province,
      profileData.postalCode
    ].filter(Boolean);

    return parts.join(', ');
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-[#F9F9F9]">
        <AuthenticatedHeader />
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-gray-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F9F9]">
      <AuthenticatedHeader />

      <main className="px-4 lg:px-20 py-8 max-w-screen-xl mx-auto">
        <h1 className="text-[40px] md:text-[50px] font-bold text-black font-inter mb-8">
          My Account
        </h1>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-white p-1 rounded-lg mb-8 max-w-md">
          <button
            onClick={() => setActiveTab('account')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'account'
              ? 'bg-[#DB1233] text-white'
              : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            Account Info
          </button>
          <button
            onClick={() => setActiveTab('listings')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'listings'
              ? 'bg-[#DB1233] text-white'
              : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            My Listings
          </button>
        </div>

        {/* Account Tab Content */}
        {activeTab === 'account' ? (
          <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-100 w-full">
            <h1 className="text-[36px] font-bold text-black font-inter mb-8">
              My Account
            </h1>

            <div className="space-y-8">
              {/* Profile Section */}
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Profile Image Placeholder */}
                <div className="w-[130px] h-[163px] bg-gray-100 rounded-none flex items-center justify-center overflow-hidden">
                  {profileData?.logoUrl ? (
                    <img
                      src={profileData.logoUrl}
                      alt="Company Logo"
                      className="max-w-full max-h-full object-cover"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <span className="text-gray-400 text-sm">No Logo</span>
                  )}
                </div>

                {/* Profile Info */}
                <div className="flex-1 space-y-4">
                  <h2 className="text-[22px] md:text-[26px] font-bold text-black font-inter">
                    {profileData?.companyName || 'Company Name Not Set'}
                  </h2>
                  <p className="text-[18px] md:text-[22px]] font-semibold text-black font-inter">
                    {formatAddress()}
                  </p>
                  <p className="text-[16px] md:text-[20px] font-semibold text-black font-inter">
                    {profileData?.website || ''}
                  </p>
                </div>
              </div>

              {/* Contact Details */}
              <div>
                <h3 className="text-[28px] md:text-[32px] font-bold text-black font-inter mb-4">
                  Contact Details:
                </h3>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="bg-gray-50 rounded-[20px] px-4 py-3 flex-shrink-0">
                    <span className="text-[16px] md:text-[20px] font-semibold text-black font-inter">
                      {profileData?.phone || 'Phone Not Set'}
                    </span>
                  </div>
                  <div className="bg-gray-50 rounded-[20px] px-4 py-3 flex-shrink-0">
                    <span className="text-[16px] md:text-[20px] font-semibold text-black font-inter">
                      {profileData?.email || auth.currentUser?.email || 'Email Not Set'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-[28px] md:text-[32px] font-bold text-black font-inter mb-4">
                  Description:
                </h3>
                <div className="bg-gray-50 rounded-[20px] px-6 py-4">
                  <p className="text-[16px] md:text-[20px] font-semibold text-black font-inter leading-relaxed">
                    {profileData?.description || 'Description Not Set'}
                  </p>
                </div>
              </div>

              {/* Account Actions */}
              <div className="space-y-4 pt-6 border-t border-gray-200">
                <h2 className="text-[24px] font-semibold text-black font-inter">
                  Account Actions
                </h2>
                <div className="flex flex-col gap-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left h-12 text-base border border-gray-300 hover:bg-gray-50"
                    onClick={() => navigate('/edit-profile')}
                  >
                    Edit Profile Information
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left h-12 text-base border border-gray-300 hover:bg-gray-50"
                    onClick={() => navigate('/change-password')}
                  >
                    Change Password
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left h-12 text-base border border-gray-300 hover:bg-gray-50"
                    onClick={() => navigate('/change-email')}
                  >
                    Change Email
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left h-12 text-base border border-gray-300 hover:bg-gray-50"
                    onClick={() => navigate('/create-listing')}
                  >
                    Create New Listing
                  </Button>
                </div>
              </div>

              {/* Logout */}
              <div className="pt-6 border-t border-gray-200">
                <Button
                  variant="outline"
                  className="w-full justify-start text-left h-12 text-base border border-red-300 text-red-600 hover:bg-red-50"
                  onClick={() => auth.signOut()}
                >
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* Listings Tab Content */
          <div className="space-y-6">
            {/* Published Listings */}
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-[28px] md:text-[32px] font-bold text-black font-inter">
                  Published Listings:
                </h2>
              </div>

              {loading ? (
                <p className="text-gray-500">Loading listings...</p>
              ) : listings.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">No published listings yet.</p>
                  <AddListingCard />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {listings.map((listing) => (
                    <div key={listing.id} className="h-[400px]">
                      <MyListingCard listing={listing} onDelete={fetchMyListings} />
                    </div>
                  ))}
                  <AddListingCard />
                </div>
              )}
            </div>

            {/* Drafts */}
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-[28px] md:text-[32px] font-bold text-black font-inter">
                  Drafts:
                </h2>
                {drafts.length > 0 && (
                  <span className="text-sm text-gray-500">
                    {drafts.length}/10 drafts
                  </span>
                )}
              </div>

              {draftsLoading ? (
                <p className="text-gray-500">Loading drafts...</p>
              ) : drafts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">No drafts yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {drafts.map((draft) => (
                    <div key={draft.id} className="h-[400px]">
                      <MyListingCard listing={draft} onDelete={fetchMyDrafts} isDraft={true} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default MyAccount;

