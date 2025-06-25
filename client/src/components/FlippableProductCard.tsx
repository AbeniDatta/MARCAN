import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Listing } from '@/services/api';
import { profileApi, UserProfile } from '@/services/api';

interface FlippableProductCardProps {
    listing: Listing;
}

const FlippableProductCard: React.FC<FlippableProductCardProps> = ({ listing }) => {
    const navigate = useNavigate();
    const [isFlipped, setIsFlipped] = useState(false);
    const [supplierData, setSupplierData] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(false);

    const handleViewSupplier = () => {
        // Navigate to supplier profile page using the listing's user ID
        if (listing.user?.id) {
            navigate(`/supplier/${listing.user.id}`);
        } else if (listing.userId) {
            // Fallback to userId if user object is not available
            navigate(`/supplier/${listing.userId}`);
        } else {
            // If no user information is available, show an error or navigate to a fallback
            console.error('No user information available for this listing');
            // You could show a toast notification here
        }
    };

    const handleContactSupplier = async () => {
        if (!supplierData && !loading) {
            setLoading(true);
            try {
                // Try to get supplier data using the listing's user information
                let firebaseUid = '';

                if (listing.user?.firebaseUid) {
                    firebaseUid = listing.user.firebaseUid;
                } else if (listing.user?.id) {
                    // If we have user ID but not Firebase UID, we'll need to fetch the user profile first
                    // For now, we'll use the user ID as a fallback
                    firebaseUid = listing.user.id.toString();
                } else {
                    // Fallback to userId
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
        setIsFlipped(!isFlipped);
    };

    const handleFlipBack = () => {
        setIsFlipped(false);
    };

    return (
        <div className="relative w-full h-full perspective-1000">
            <div
                className={`relative w-full h-full transition-transform duration-500 transform-style-preserve-3d ${isFlipped ? 'rotate-y-180' : ''
                    }`}
            >
                {/* Front of card */}
                <div className="absolute w-full h-full backface-hidden">
                    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 h-full flex flex-col">
                        {/* Image and Company Name Row */}
                        <div className="flex items-start gap-4 mb-4 flex-shrink-0">
                            {/* Product Image - Square */}
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

                            {/* Company Name */}
                            <div className="flex-1">
                                <p className="text-[14px] font-medium text-black font-inter leading-tight">
                                    {listing.companyName}
                                </p>
                            </div>
                        </div>

                        {/* Product Title */}
                        <h3 className="text-[16px] font-semibold text-black font-inter mb-3 leading-tight flex-shrink-0">
                            {listing.title}
                        </h3>

                        {/* Description */}
                        <p className="text-[12px] font-medium text-black font-inter mb-4 leading-tight flex-1 min-h-[60px]">
                            {listing.description}
                        </p>

                        {/* Tags */}
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

                        {/* Price */}
                        <p className="text-[14px] font-semibold text-[#DB1233] mb-4 flex-shrink-0">
                            ${listing.price} CAD
                        </p>

                        {/* Action Buttons */}
                        <div className="flex gap-2 mt-auto flex-shrink-0">
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
                        </div>
                    </div>
                </div>

                {/* Back of card */}
                <div className="absolute w-full h-full backface-hidden rotate-y-180">
                    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 h-full flex flex-col">
                        {/* Header */}
                        <div className="flex justify-between items-center mb-6 flex-shrink-0">
                            <h3 className="text-[20px] font-bold text-black font-inter">
                                Contact Information
                            </h3>
                            <button
                                onClick={handleFlipBack}
                                className="text-gray-500 hover:text-gray-700 text-xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                            >
                                ×
                            </button>
                        </div>

                        {/* Contact Details */}
                        <div className="flex-1 space-y-6">
                            {loading ? (
                                <div className="flex items-center justify-center h-full">
                                    <p className="text-gray-500">Loading contact information...</p>
                                </div>
                            ) : supplierData ? (
                                <>
                                    {/* Email */}
                                    <div className="space-y-2">
                                        <label className="text-[16px] font-semibold text-gray-600">Email:</label>
                                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                            <p className="text-[16px] font-medium text-black font-inter break-all">
                                                {supplierData.email}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Phone */}
                                    {supplierData.phone && (
                                        <div className="space-y-2">
                                            <label className="text-[16px] font-semibold text-gray-600">Phone:</label>
                                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                                <p className="text-[16px] font-medium text-black font-inter">
                                                    {supplierData.phone}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Website */}
                                    {supplierData.website && (
                                        <div className="space-y-2">
                                            <label className="text-[16px] font-semibold text-gray-600">Website:</label>
                                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                                <a
                                                    href={supplierData.website.startsWith('http') ? supplierData.website : `https://${supplierData.website}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-[16px] font-medium text-[#2545AB] font-inter hover:underline break-all"
                                                >
                                                    {supplierData.website}
                                                </a>
                                            </div>
                                        </div>
                                    )}

                                    {/* Company Name */}
                                    <div className="space-y-2">
                                        <label className="text-[16px] font-semibold text-gray-600">Company:</label>
                                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                            <p className="text-[16px] font-medium text-black font-inter">
                                                {supplierData.companyName || 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    <p className="text-gray-500">Contact information not available</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FlippableProductCard; 