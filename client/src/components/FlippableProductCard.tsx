import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Listing } from '@/services/api';
import { profileApi, UserProfile, listingApi } from '@/services/api';
import { auth } from '@/firebase';

interface FlippableProductCardProps {
  listing: Listing;
}

const FlippableProductCard: React.FC<FlippableProductCardProps> = ({ listing }) => {
  const navigate = useNavigate();
  const [isFlipped, setIsFlipped] = useState(false);
  const [supplierData, setSupplierData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentUserUid, setCurrentUserUid] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUserUid(user?.uid || null);
    });
    return () => unsubscribe();
  }, []);

  const handleViewSupplier = () => {
    if (listing.user?.id) {
      navigate(`/supplier/${listing.user.id}`);
    } else if (listing.userId) {
      navigate(`/supplier/${listing.userId}`);
    } else {
      console.error('No user information available for this listing');
    }
  };

  const handleContactSupplier = async () => {
    if (!supplierData && !loading) {
      setLoading(true);
      try {
        let firebaseUid = '';

        if (listing.user?.firebaseUid) {
          firebaseUid = listing.user.firebaseUid;
        } else if (listing.user?.id) {
          firebaseUid = listing.user.id.toString();
        } else {
          firebaseUid = listing.userId.toString();
        }

        const data = await profileApi.getUserProfile(firebaseUid);
        setSupplierData(data);
      } catch (err) {
        console.error('Failed to fetch supplier data:', err);
      } finally {
        setLoading(false);
      }
    }
    setIsFlipped(true);
  };

  const handleFlipBack = () => {
    setIsFlipped(false);
  };

  const handleDeleteListing = async () => {
    const confirmDelete = window.confirm("Are you sure you want to delete this listing?");
    if (!confirmDelete) return;

    try {
      await listingApi.deleteListing(listing.id);
      window.location.reload();
    } catch (err) {
      console.error("Failed to delete listing:", err);
      alert("Error deleting listing.");
    }
  };

  const handleUpdateListing = () => {
    navigate(`/update-listing?id=${listing.userId}`);
  };

  const isOwner = listing.user?.firebaseUid === currentUserUid;

  return (
    <div className="relative w-full h-full perspective-1000">
      <div className={`relative w-full h-full transition-transform duration-500 transform-style-preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
        {/* Front side */}
        <div className="absolute w-full h-full backface-hidden">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 h-full flex flex-col">
            <div className="flex items-start gap-4 mb-4 flex-shrink-0">
              <div className="w-[80px] h-[80px] bg-gray-200 rounded flex items-center justify-center overflow-hidden flex-shrink-0">
                {listing.imageUrl ? (
                  <img
                    src={listing.imageUrl}
                    alt={listing.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-gray-500 text-xs">Image</span>
                )}
              </div>

              <div className="flex-1">
                <p className="text-[14px] font-medium text-black font-inter leading-tight">
                  {listing.companyName}
                </p>
              </div>
            </div>

            <h3 className="text-[16px] font-semibold text-black font-inter mb-3 leading-tight flex-shrink-0">
              {listing.title}
            </h3>

            <p className="text-[12px] font-medium text-black font-inter mb-4 leading-tight flex-1 min-h-[60px]">
              {listing.description}
            </p>

            <div className="flex flex-wrap gap-2 mb-4 flex-shrink-0">
              {listing.tags?.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-[#E0F2FF] rounded-[10px] text-[11px] font-medium text-black font-inter"
                >
                  {tag}
                </span>
              ))}
            </div>

            <p className="text-[14px] font-semibold text-[#DB1233] mb-4 flex-shrink-0">
              ${listing.price} CAD
            </p>

            <div className="flex gap-2 mt-auto flex-shrink-0">
              {isOwner ? (
                <>
                  <button
                    onClick={() => navigate(`/update-listing/${listing.id}`)}
                    className="px-3 py-2 rounded text-[13px] font-medium text-white font-inter bg-[#2545AB] hover:bg-[#1e3a8a] transition-colors flex-1"
                  >
                    Update Listing
                  </button>
                  <button
                    onClick={handleDeleteListing}
                    className="px-3 py-2 rounded text-[13px] font-medium text-white font-inter bg-[#DB1233] hover:bg-[#c10e2b] transition-colors flex-1"
                  >
                    Delete Listing
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleViewSupplier}
                    className="px-3 py-2 rounded text-[13px] font-medium text-white font-inter bg-[#2545AB] hover:bg-[#1e3a8a] transition-colors flex-1"
                  >
                    View Supplier
                  </button>
                  <button
                    onClick={handleContactSupplier}
                    className="px-3 py-2 rounded text-[13px] font-medium text-white font-inter bg-[#DB1233] hover:bg-[#c10e2b] transition-colors flex-1"
                  >
                    Contact Supplier
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Back side - Contact Details */}
        <div className="absolute w-full h-full backface-hidden rotate-y-180">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <h3 className="text-[16px] font-semibold text-black font-inter">
                Contact Details
              </h3>
              <button
                onClick={handleFlipBack}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                ✕
              </button>
            </div>

            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-gray-500">Loading contact information...</p>
              </div>
            ) : supplierData ? (
              <div className="flex-1 space-y-4">
                <div>
                  <h4 className="text-[14px] font-semibold text-black font-inter mb-2">
                    {supplierData.companyName || 'Company Name'}
                  </h4>
                  <p className="text-[12px] text-gray-600 font-inter">
                    {supplierData.description || 'No description available'}
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-[12px] font-medium text-gray-600 font-inter">Email</p>
                    <p className="text-[13px] font-medium text-black font-inter">
                      {supplierData.email}
                    </p>
                  </div>

                  {supplierData.phone && (
                    <div>
                      <p className="text-[12px] font-medium text-gray-600 font-inter">Phone</p>
                      <p className="text-[13px] font-medium text-black font-inter">
                        {supplierData.phone}
                      </p>
                    </div>
                  )}

                  {supplierData.website && (
                    <div>
                      <p className="text-[12px] font-medium text-gray-600 font-inter">Website</p>
                      <p className="text-[13px] font-medium text-black font-inter">
                        {supplierData.website}
                      </p>
                    </div>
                  )}

                  {(supplierData.address1 || supplierData.city || supplierData.province) && (
                    <div>
                      <p className="text-[12px] font-medium text-gray-600 font-inter">Address</p>
                      <p className="text-[13px] font-medium text-black font-inter">
                        {[supplierData.address1, supplierData.city, supplierData.province, supplierData.postalCode]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-gray-500 text-center">
                  Contact information not available
                </p>
              </div>
            )}

            <div className="mt-auto flex-shrink-0">
              <button
                onClick={handleFlipBack}
                className="w-full px-3 py-2 rounded text-[13px] font-medium text-white font-inter bg-[#2545AB] hover:bg-[#1e3a8a] transition-colors"
              >
                Back to Listing
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlippableProductCard;
