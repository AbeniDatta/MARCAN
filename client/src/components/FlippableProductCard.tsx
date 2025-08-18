import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Listing, listingApi, profileApi, UserProfile } from '@/services/api';
import { auth } from '@/firebase';
import { HeartIcon as SolidHeart } from '@heroicons/react/24/solid';
import { HeartIcon as OutlineHeart } from '@heroicons/react/24/outline';

interface FlippableProductCardProps {
  listing: Listing;
  readonly?: boolean;
  onSelect?: (email: string, selected: boolean) => void;
  selectMode?: boolean;
  showHeart?: boolean; // New prop to control heart visibility
  isSelected?: boolean;
}

const FlippableProductCard: React.FC<FlippableProductCardProps> = ({ listing, readonly, onSelect, selectMode, showHeart = true, isSelected = false }) => {
  const navigate = useNavigate();
  const [isFlipped, setIsFlipped] = useState(false);
  const [supplierData, setSupplierData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentUserUid, setCurrentUserUid] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  // Debug: Log file URL when component mounts
  useEffect(() => {
    if (listing.fileUrl) {
      console.log('Listing has file URL:', listing.fileUrl);
      console.log('Listing ID:', listing.id);
      console.log('Listing title:', listing.title);
    }
  }, [listing.fileUrl, listing.id, listing.title]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUserUid(user?.uid || null);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (selectMode && listing.user?.firebaseUid) {
      profileApi.getUserProfile(listing.user.firebaseUid)
        .then(setSupplierData)
        .catch(console.error);
    }
  }, [selectMode, listing.user]);

  useEffect(() => {
    const fetchSavedStatus = async () => {
      console.log('Fetching saved status for listing:', listing.id);
      try {
        const saved = await listingApi.getSavedListings();
        console.log('All saved listings:', saved);
        const found = saved.some((l) => l.id === listing.id);
        console.log('Is this listing saved?', found);
        setIsSaved(found);
      } catch (err) {
        console.error('Error fetching saved listings:', err);
      }
    };
    fetchSavedStatus();
  }, [listing.id]);

  const handleToggleSave = async () => {
    console.log('Heart clicked! Current saved status:', isSaved);
    console.log('Listing ID:', listing.id);
    console.log('Current user UID:', currentUserUid);

    try {
      if (isSaved) {
        console.log('Unsaving listing...');
        await listingApi.unsaveListing(listing.id);
        console.log('Listing unsaved successfully');
      } else {
        console.log('Saving listing...');
        await listingApi.saveListing(listing.id);
        console.log('Listing saved successfully');
      }
      setIsSaved(!isSaved);
      console.log('Updated saved status to:', !isSaved);
    } catch (err) {
      console.error('Error toggling save listing:', err);
    }
  };

  const handleViewSupplier = () => {
    // Check if user is logged in
    if (!currentUserUid) {
      // User is not logged in, redirect to login page
      navigate('/login');
      return;
    }

    // Prefer firebaseUid; fall back to id/userId as string
    const supplierKey =
      listing.user?.firebaseUid ??
      (listing.user?.id?.toString() || listing.userId?.toString());

    if (!supplierKey) {
      console.error('No user information available for this listing');
      return;
    }

    navigate(`/supplier/${supplierKey}`);
  };

  const handleContactSupplier = async () => {
    // Check if user is logged in
    if (!currentUserUid) {
      // User is not logged in, redirect to login page
      navigate('/login');
      return;
    }

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
                <h3 className="text-[18px] font-semibold text-black font-inter leading-tight mb-1">
                  {listing.title}
                </h3>
                <p className="text-[14px] font-medium text-black font-inter leading-tight mb-1">
                  {listing.companyName}
                </p>
                <p className="text-[14px] font-semibold text-[#DB1233] mb-1">
                  ${listing.price} CAD
                </p>
                {selectMode && (
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={isSelected}
                    onChange={(e) => onSelect?.(listing.id.toString(), e.target.checked)}
                  />
                )}
              </div>
            </div>

            <p className="text-[14px] font-medium text-black font-inter mb-3 leading-tight flex-1 min-h-[60px]">
              {listing.description}
            </p>

            {listing.fileUrl && (
              <div className="mb-3 flex-shrink-0">
                <button
                  onClick={() => {
                    console.log('Attempting to open file URL:', listing.fileUrl);
                    try {
                      const newWindow = window.open(listing.fileUrl, '_blank');
                      if (!newWindow) {
                        console.error('Failed to open window - popup blocked?');
                        alert('Popup blocked. Please allow popups for this site to view files.');
                      }
                    } catch (error) {
                      console.error('Error opening file:', error);
                      alert('Error opening file. Please try again.');
                    }
                  }}
                  className="flex items-center gap-1 px-2 py-1 bg-blue-100 hover:bg-blue-200 rounded text-[11px] font-medium text-blue-700 transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  View File
                </button>
              </div>
            )}

            <div className="flex flex-wrap gap-2 mb-4 flex-shrink-0">
              {listing.tags?.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-[#E0F2FF] rounded-[10px] text-[13px] font-medium text-black font-inter"
                >
                  {tag}
                </span>
              ))}
            </div>

            {listing.city && (
              <div className="flex items-center gap-1 mb-4 flex-shrink-0">
                <svg className="w-3 h-3 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                <span className="text-[12px] font-medium text-gray-600 font-inter">
                  {listing.city}
                </span>
              </div>
            )}

            <div className="flex gap-2 mt-auto flex-shrink-0">
              {!readonly ? (
                isOwner ? (
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
                )
              ) : null}
            </div>

            {/* Heart Icon - Show on all cards (unless showHeart is false or user owns the listing) */}
            {showHeart && !isOwner && (
              <div className="absolute top-3 right-3 z-10">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Heart button clicked!');
                    handleToggleSave();
                  }}
                  className="focus:outline-none"
                  aria-label={isSaved ? 'Unsave Listing' : 'Save Listing'}
                >
                  {isSaved ? (
                    <SolidHeart className="w-6 h-6 text-red-500 hover:text-red-600 transition" />
                  ) : (
                    <OutlineHeart className="w-6 h-6 text-gray-400 hover:text-red-500 transition" />
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Back side */}
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
            ) : !currentUserUid ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <div className="mb-4">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <p className="text-gray-600 font-medium mb-2">Please log in to view supplier contact information</p>
                </div>
                <button
                  onClick={() => navigate('/login')}
                  className="px-4 py-2 bg-[#DB1233] hover:bg-[#c10e2b] text-white rounded text-sm font-medium transition-colors"
                >
                  Log In
                </button>
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
                    <a
                      href={`mailto:${supplierData.email}`}
                      className="text-[13px] font-medium text-blue-600 underline hover:text-blue-800"
                    >
                      {supplierData.email}
                    </a>
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
                        {[supplierData.address1, supplierData.city, supplierData.province, supplierData.postalCode].filter(Boolean).join(', ')}
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