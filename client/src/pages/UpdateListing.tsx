import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { auth } from "@/firebase";
import AuthenticatedHeader from "@/components/AuthenticatedHeader";
import ListingForm from "@/components/ListingForm";
import { listingApi, Listing } from "@/services/api";

const UpdateListing = () => {
    const navigate = useNavigate();
    //const { listingId } = useParams<{ listingId: string }>();
    const { listingId } = useParams();
    const [editListing, setEditListing] = useState<Listing | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (!user) {
                navigate("/login");
            } else if (listingId) {
                try {
                    const listing = await listingApi.getListingById(Number(listingId));
                    if (listing.user?.firebaseUid === user.uid) {
                        setEditListing(listing);
                    } else {
                        navigate("/unauthorized");
                    }
                } catch (err) {
                    console.error("Failed to load listing", err);
                    navigate("/not-found");
                } finally {
                    setLoading(false);
                }
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

    return (
        <div className="min-h-screen bg-[#F9F9F9]">
            <AuthenticatedHeader />

            <section className="bg-[#F9F9F9] px-4 lg:px-20 py-12">
                <div className="max-w-screen-xl mx-auto">
                    <h1 className="text-[50px] font-bold text-black font-inter leading-tight mb-8">
                        Update Listing
                    </h1>
                    <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-100">
                        {editListing && (
                            <ListingForm
                                initialData={editListing}
                                onSubmit={handleSubmit}
                            />
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default UpdateListing;