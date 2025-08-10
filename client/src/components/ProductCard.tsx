import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from 'react';
import { auth } from '@/firebase';
import { listingApi, Listing } from '@/services/api';
import { HeartIcon as SolidHeart } from '@heroicons/react/24/solid';
import { HeartIcon as OutlineHeart } from '@heroicons/react/24/outline';

interface ProductCardProps {
  title: string;
  company: string;
  description: string;
  image: string;
  inStock?: boolean;
  exportReady?: boolean;
  listing?: Listing; // Add listing prop for heart functionality
}

const ProductCard = ({
  title,
  company,
  description,
  image,
  inStock = false,
  exportReady = false,
  listing,
}: ProductCardProps) => {
  const [isSaved, setIsSaved] = useState(false);
  const [currentUserUid, setCurrentUserUid] = useState<string | null>(null);

  // Fallback image if no image is provided
  const imageUrl = image || "https://via.placeholder.com/69x49?text=No+Image";

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUserUid(user?.uid || null);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchSavedStatus = async () => {
      if (!listing) return;
      try {
        const saved = await listingApi.getSavedListings();
        const found = saved.some((l) => l.id === listing.id);
        setIsSaved(found);
      } catch (err) {
        console.error('Error fetching saved listings:', err);
      }
    };
    fetchSavedStatus();
  }, [listing?.id]);

  const handleToggleSave = async () => {
    if (!listing) return;
    try {
      if (isSaved) {
        await listingApi.unsaveListing(listing.id);
      } else {
        await listingApi.saveListing(listing.id);
      }
      setIsSaved(!isSaved);
    } catch (err) {
      console.error('Error toggling save listing:', err);
    }
  };

  const isOwner = listing?.user?.firebaseUid === currentUserUid;

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 w-[242px] h-[225px] flex flex-col relative">
      {/* Heart Icon - Only show if listing is provided and user is not the owner */}
      {listing && !isOwner && (
        <div className="absolute top-2 right-2 z-10">
          <button
            onClick={handleToggleSave}
            className="focus:outline-none"
            aria-label={isSaved ? 'Unsave Listing' : 'Save Listing'}
          >
            {isSaved ? (
              <SolidHeart className="w-5 h-5 text-red-500 hover:text-red-600 transition" />
            ) : (
              <OutlineHeart className="w-5 h-5 text-gray-400 hover:text-red-500 transition" />
            )}
          </button>
        </div>
      )}

      {/* Product Image */}
      <div className="w-[69px] h-[49px] mb-4">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover bg-gray-200 rounded"
          onError={(e) => {
            // Fallback to placeholder if image fails to load
            e.currentTarget.src = "https://via.placeholder.com/69x49?text=No+Image";
          }}
        />
      </div>

      {/* Product Info */}
      <div className="flex-1 flex flex-col">
        <h3 className="text-base font-semibold text-black font-inter leading-tight mb-2 line-clamp-2">
          {title}
        </h3>

        <p className="text-xs font-medium text-black font-inter mb-2">
          {company}
        </p>

        <p className="text-xs font-medium text-black font-inter leading-tight mb-4 flex-1 line-clamp-3">
          {description}
        </p>

        {/* Status Badges */}
        <div className="flex gap-2 mb-3">
          {exportReady && (
            <Badge className="bg-[#E0F2FF] text-black text-xs font-medium px-2 py-1 rounded-xl border-0">
              Export Ready
            </Badge>
          )}
          {inStock && (
            <Badge className="bg-[#E0F2FF] text-black text-xs font-medium px-2 py-1 rounded-xl border-0">
              In Stock
            </Badge>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button className="bg-[#2545AB] hover:bg-[#1e3a94] text-white text-xs font-medium px-3 py-1.5 h-auto rounded font-inter flex-1">
            View Supplier
          </Button>
          <Button className="bg-[#DB1233] hover:bg-[#c10e2b] text-white text-xs font-medium px-3 py-1.5 h-auto rounded font-inter flex-1">
            Contact Supplier
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;