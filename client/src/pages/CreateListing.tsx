import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { auth } from "@/firebase";
import AuthenticatedHeader from "@/components/AuthenticatedHeader";
import ListingForm from "@/components/ListingForm";
import { Listing, listingApi } from "@/services/api";
import { Button } from "@/components/ui/button";

const CreateListing = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [editListing, setEditListing] = useState<Listing | null>(null);
    const [draftCount, setDraftCount] = useState(0);

    useEffect(() => {
        // Check if user is logged in
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (!user) {
                navigate("/login");
            }
        });

        // Check if we're editing an existing listing
        if (location.state?.editListing) {
            setEditListing(location.state.editListing);
        }

        // Fetch draft count
        fetchDraftCount();

        return () => unsubscribe();
    }, [navigate, location.state]);

    const handleSubmit = (listing: Listing) => {
        console.log('Listing saved:', listing);
        navigate('/my-account');
    };

    const fetchDraftCount = async () => {
        try {
            const drafts = await listingApi.getMyDrafts();
            setDraftCount(drafts.length);
        } catch (err) {
            console.error('Failed to fetch draft count:', err);
        }
    };

    const handleSaveDraft = (listing: Listing) => {
        console.log('Draft saved:', listing);
        navigate('/my-account');
    };

    return (
        <div className="min-h-screen bg-[#F9F9F9]">
            <AuthenticatedHeader />

            <section className="bg-[#F9F9F9] px-4 lg:px-20 py-12">
                <div className="max-w-screen-xl mx-auto">
                    <h1 className="text-[50px] font-bold text-black font-inter leading-tight mb-8">
                        {editListing ? 'Edit Listing' : 'Create New Listing'}
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
                        <ListingForm
                            initialData={editListing || undefined}
                            onSubmit={handleSubmit}
                            onSaveDraft={handleSaveDraft}
                            draftCount={draftCount}
                        />
                    </div>
                </div>
            </section>
        </div>
    );
};

export default CreateListing; 