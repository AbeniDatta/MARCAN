import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth } from "@/firebase";
import AuthenticatedHeader from "@/components/AuthenticatedHeader";
import ListingForm from "@/components/ListingForm";
import { listingApi, Listing } from "@/services/api";

const UpdateDraft = () => {
    const { draftId } = useParams<{ draftId: string }>();
    const navigate = useNavigate();
    const [draft, setDraft] = useState<Listing | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (draftId) {
            fetchDraft();
        }
    }, [draftId]);

    const fetchDraft = async () => {
        try {
            setLoading(true);
            const data = await listingApi.getListingById(parseInt(draftId!));
            setDraft(data);
        } catch (err) {
            console.error("Failed to fetch draft:", err);
            setError("Failed to load draft");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateDraft = async (updatedDraft: Listing) => {
        try {
            // Update the draft (keep it as draft)
            await listingApi.updateListing(updatedDraft.id, { ...updatedDraft, isDraft: true });
            navigate("/my-account");
        } catch (err) {
            console.error("Failed to update draft:", err);
            throw err;
        }
    };

    const handlePublishDraft = async (updatedDraft: Listing) => {
        try {
            // Publish the draft (set isDraft to false)
            await listingApi.updateListing(updatedDraft.id, { ...updatedDraft, isDraft: false });
            navigate("/my-account");
        } catch (err) {
            console.error("Failed to publish draft:", err);
            throw err;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F9F9F9]">
                <AuthenticatedHeader />
                <div className="flex items-center justify-center min-h-screen">
                    <p className="text-gray-500">Loading draft...</p>
                </div>
            </div>
        );
    }

    if (error || !draft) {
        return (
            <div className="min-h-screen bg-[#F9F9F9]">
                <AuthenticatedHeader />
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <p className="text-red-500 mb-4">{error || "Draft not found"}</p>
                        <button
                            onClick={() => navigate("/my-account")}
                            className="bg-[#DB1233] hover:bg-[#c10e2b] text-white px-4 py-2 rounded"
                        >
                            Back to My Account
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F9F9F9]">
            <AuthenticatedHeader />

            <main className="px-4 lg:px-20 py-8 max-w-screen-xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-[40px] md:text-[50px] font-bold text-black font-inter mb-4">
                        Update Draft
                    </h1>
                    <p className="text-[18px] text-gray-600">
                        Edit your draft listing. You can save changes as a draft or publish when ready.
                    </p>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                    <ListingForm
                        initialData={draft}
                        onSubmit={handlePublishDraft}
                        onSaveDraft={handleUpdateDraft}
                        onCancel={() => navigate("/my-account")}
                    />
                </div>
            </main>
        </div>
    );
};

export default UpdateDraft; 