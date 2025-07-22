import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { auth } from "@/firebase";
import AuthenticatedHeader from "@/components/AuthenticatedHeader";
import ListingForm from "@/components/ListingForm";
import { Listing, listingApi } from "@/services/api";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

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
                            <h2 className="text-[36px] font-bold text-black font-inter">
                                {editListing ? 'Edit Listing' : 'Create New Listing'}
                            </h2>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => navigate("/my-account")}
                                className="h-8 w-8 text-gray-600 hover:text-gray-900"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        <ListingForm
                            initialData={editListing || undefined}
                            onSubmit={handleSubmit}
                            onSaveDraft={handleSaveDraft}
                            onCancel={() => navigate("/my-account")}
                            draftCount={draftCount}
                        />
                    </div>
                </div>
            </section>
        </div>
    );
};

export default CreateListing; 