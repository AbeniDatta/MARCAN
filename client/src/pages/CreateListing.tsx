import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { auth } from "@/firebase";
import AuthenticatedHeader from "@/components/AuthenticatedHeader";
import ListingForm from "@/components/ListingForm";
import { Listing } from "@/services/api";

const CreateListing = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [editListing, setEditListing] = useState<Listing | null>(null);

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

        return () => unsubscribe();
    }, [navigate, location.state]);

    const handleSubmit = (listing: Listing) => {
        console.log('Listing saved:', listing);
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
                        <ListingForm
                            initialData={editListing || undefined}
                            onSubmit={handleSubmit}
                        />
                    </div>
                </div>
            </section>
        </div>
    );
};

export default CreateListing; 