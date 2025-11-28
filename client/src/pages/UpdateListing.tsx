import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { auth } from "@/firebase";
import AuthenticatedHeader from "@/components/AuthenticatedHeader";
import ListingForm from "@/components/ListingForm";
import { listingApi, Listing } from "@/services/api";
import { Button } from "@/components/ui/button";

const UpdateListing = () => {
    const navigate = useNavigate();
    //const { listingId } = useParams<{ listingId: string }>();
    const { listingId } = useParams();
    const [editListing, setEditListing] = useState<Listing | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>("");

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (!user) {
                navigate("/login");
            } else if (listingId) {
                try {
                    const listing = await listingApi.getListingById(Number(listingId));
                    console.log("Fetched listing:", listing);
                    console.log("Listing user:", listing.user);
                    console.log("Current user UID:", user.uid);
                    
                    // Check if user owns the listing
                    if (listing.user?.firebaseUid === user.uid) {
                        setEditListing(listing);
                    } else {
                        console.error("Unauthorized: Listing user UID doesn't match current user UID");
                        console.error("Listing user firebaseUid:", listing.user?.firebaseUid);
                        console.error("Current user uid:", user.uid);
                        navigate("/unauthorized");
                    }
                } catch (err: any) {
                    console.error("Failed to load listing", err);
                    console.error("Error details:", err?.response?.data);
                    // If it's a 404, go to not-found, otherwise show error
                    if (err?.response?.status === 404) {
                        navigate("/not-found");
                    } else {
                        setError(err?.response?.data?.error || "Failed to load listing");
                        setLoading(false);
                    }
                } finally {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [navigate, listingId]);

    const handleSubmit = (updatedListing: Listing) => {
        console.log("Listing updated:", updatedListing);
        navigate("/my-account");
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#F9F9F9]">
                <AuthenticatedHeader />
                <section className="bg-[#F9F9F9] px-4 lg:px-20 py-12">
                    <div className="max-w-screen-xl mx-auto">
                        <div className="bg-white rounded-lg p-8 shadow-sm border border-red-200">
                            <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
                            <p className="text-gray-700 mb-4">{error}</p>
                            <Button onClick={() => navigate("/my-account")}>Go Back</Button>
                        </div>
                    </div>
                </section>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F9F9F9]">
            <AuthenticatedHeader />

            <section className="bg-[#F9F9F9] px-4 lg:px-20 py-12">
                <div className="max-w-screen-xl mx-auto">
                    <h1 className="text-[50px] font-bold text-black font-inter leading-tight mb-8">
                        Update Listing
                    </h1>
                    <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-8">
                            <div></div>
                            <Button
                                variant="outline"
                                onClick={() => navigate("/my-account")}
                                className="text-gray-600 hover:text-gray-900"
                            >
                                Cancel
                            </Button>
                        </div>
                        {editListing ? (
                            <ListingForm
                                initialData={editListing}
                                onSubmit={handleSubmit}
                            />
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-gray-600 mb-4">Loading listing data...</p>
                                <Button onClick={() => navigate("/my-account")}>Go Back to My Account</Button>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default UpdateListing;