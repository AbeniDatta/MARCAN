import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import canadianMapleLeaf from "@/assets/canadian-maple-leaf-red.png";
import { profileApi, UserProfile } from "@/services/api";
import { listingApi, Listing } from "@/services/api";

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
            // Try to parse as number first (user ID), if it fails, treat as Firebase UID
            const userId = parseInt(supplierId);
            if (!isNaN(userId)) {
                // It's a user ID
                const data = await profileApi.getUserProfileById(userId);
                setProfileData(data);
            } else {
                // It's a Firebase UID
                const data = await profileApi.getUserProfile(supplierId);
                setProfileData(data);
            }
        } catch (err: any) {
            console.error("Failed to fetch supplier data", err);
            setError("Failed to load supplier information");
        } finally {
            setLoading(false);
        }
    };

    const fetchSupplierListings = async (supplierId: string) => {
        try {
            // Try to parse as number first (user ID), if it fails, treat as Firebase UID
            const userId = parseInt(supplierId);
            if (!isNaN(userId)) {
                // It's a user ID, get listings by user ID
                const data = await listingApi.getListingsByUser(userId);
                setListings(data);
            } else {
                // It's a Firebase UID, get listings by Firebase UID
                const data = await listingApi.getListingsByFirebaseUid(supplierId);
                setListings(data);
            }
        } catch (err: any) {
            console.error('Failed to fetch supplier listings', err);
            // Don't set error here as listings are optional
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

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F9F9F9]">
                <Header />
                <div className="flex items-center justify-center min-h-screen">
                    <p className="text-gray-500">Loading supplier information...</p>
                </div>
            </div>
        );
    }

    if (error || !profileData) {
        return (
            <div className="min-h-screen bg-[#F9F9F9]">
                <Header />
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <p className="text-red-500 mb-4">{error || "Supplier not found"}</p>
                        <Button onClick={() => navigate('/')} className="bg-[#DB1233] hover:bg-[#c10e2b] text-white">
                            Back to Home
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F9F9F9]">
            <Header />

            {/* Page Content */}
            <main className="px-4 lg:px-20 py-8 max-w-screen-xl mx-auto">
                {/* Page Title */}
                <h1 className="text-[40px] md:text-[50px] font-bold text-black font-inter mb-8">
                    {profileData.companyName || 'Supplier Profile'}
                </h1>

                {/* Profile Section */}
                <div className="flex flex-col lg:flex-row gap-6 mb-8">
                    {/* Profile Image Placeholder */}
                    <div className="w-[235px] h-[163px] bg-[#D9D9D9] rounded-none flex-shrink-0" />

                    {/* Profile Info */}
                    <div className="flex-1 space-y-4">
                        <h2 className="text-[22px] md:text-[26px] font-bold text-black font-inter">
                            {profileData.companyName || 'Company Name Not Set'}
                        </h2>
                        <p className="text-[18px] md:text-[22px]] font-semibold text-black font-inter">
                            {formatAddress()}
                        </p>
                        {profileData.website && (
                            <p className="text-[16px] md:text-[20px] font-semibold text-black font-inter">
                                {profileData.website}
                            </p>
                        )}
                    </div>
                </div>

                {/* Contact Details */}
                <div className="mb-8">
                    <h3 className="text-[28px] md:text-[32px] font-bold text-black font-inter mb-4">
                        Contact Details:
                    </h3>
                    <div className="flex flex-col md:flex-row gap-4">
                        {profileData.phone && (
                            <div className="bg-white rounded-[20px] px-4 py-3 flex-shrink-0">
                                <span className="text-[16px] md:text-[20px] font-semibold text-black font-inter">
                                    {profileData.phone}
                                </span>
                            </div>
                        )}
                        <div className="bg-white rounded-[20px] px-4 py-3 flex-shrink-0">
                            <span className="text-[16px] md:text-[20px] font-semibold text-black font-inter">
                                {profileData.email}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Description */}
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

                {/* Supplier Listings Section */}
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-[28px] md:text-[32px] font-bold text-black font-inter">
                            Products & Services:
                        </h3>
                    </div>

                    {listings.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-600">No listings available from this supplier.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {listings.map((listing) => (
                                <div
                                    key={listing.id}
                                    className="bg-white rounded-lg p-6 shadow-sm border border-gray-100"
                                >
                                    {/* Product Image */}
                                    <div className="w-[69px] h-[49px] bg-gray-200 rounded mb-4 flex items-center justify-center overflow-hidden">
                                        {listing.imageUrl ? (
                                            <img
                                                src={listing.imageUrl}
                                                alt={listing.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-gray-500 text-s">Image</span>
                                        )}
                                    </div>

                                    {/* Product Title */}
                                    <h3 className="text-[16px] font-semibold text-black font-inter mb-2 leading-tight">
                                        {listing.title}
                                    </h3>

                                    {/* Company Name */}
                                    <p className="text-[14px] font-medium text-black font-inter mb-3">
                                        {listing.companyName}
                                    </p>

                                    {/* Description */}
                                    <p className="text-[12px] font-medium text-black font-inter mb-4 leading-tight">
                                        {listing.description}
                                    </p>

                                    {/* Tags */}
                                    <div className="flex gap-2 mb-4">
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
                                    <p className="text-[14px] font-semibold text-[#DB1233] mb-4">
                                        ${listing.price} CAD
                                    </p>

                                    {/* Action Buttons */}
                                    <div className="flex gap-2">
                                        <button className="px-3 py-2 rounded text-[13px] font-medium text-white font-inter bg-[#2545AB] hover:bg-[#1e3a8a] transition-colors">
                                            View Details
                                        </button>
                                        <button className="px-3 py-2 rounded text-[13px] font-medium text-white font-inter bg-[#DB1233] hover:bg-[#c10e2b] transition-colors">
                                            Contact Supplier
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

// Header component for public access
const Header = () => (
    <header className="bg-[#F9F9F9] px-4 lg:px-20 py-4">
        <div className="flex items-center justify-between max-w-screen-xl mx-auto">
            <Link to="/" className="flex items-center gap-3">
                <img
                    src={canadianMapleLeaf}
                    alt="Canadian maple leaf"
                    className="w-[38px] h-[38px]"
                />
                <h1 className="text-[32px] font-bold text-black font-inter">
                    MARCAN
                </h1>
            </Link>
            <div className="flex gap-4">
                <Link to="/login">
                    <Button variant="outline" className="text-[#DB1233] border-[#DB1233] hover:bg-[#DB1233] hover:text-white">
                        Log In
                    </Button>
                </Link>
                <Link to="/signup">
                    <Button className="bg-[#DB1233] hover:bg-[#c10e2b] text-white">
                        Sign Up
                    </Button>
                </Link>
            </div>
        </div>
    </header>
);

export default SupplierProfile; 