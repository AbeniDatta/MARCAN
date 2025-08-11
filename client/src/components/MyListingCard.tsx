import { useNavigate } from 'react-router-dom';
import { Listing } from '@/services/api';
import { listingApi } from '@/services/api';
import { Button } from '@/components/ui/button';

interface MyListingCardProps {
    listing: Listing;
    onDelete?: () => void;
    isDraft?: boolean;
}

const MyListingCard: React.FC<MyListingCardProps> = ({ listing, onDelete, isDraft = false }) => {
    const navigate = useNavigate();

    const handleDeleteListing = async () => {
        const confirmDelete = window.confirm("Are you sure you want to delete this listing?");
        if (!confirmDelete) return;

        try {
            await listingApi.deleteListing(listing.id);
            if (onDelete) {
                onDelete();
            } else {
                window.location.reload();
            }
        } catch (err) {
            console.error("Failed to delete listing:", err);
            alert("Error deleting listing.");
        }
    };

    const handleUpdateListing = () => {
        if (isDraft) {
            navigate(`/update-draft/${listing.id}`);
        } else {
            navigate(`/update-listing/${listing.id}`);
        }
    };

    const handlePublishDraft = async () => {
        try {
            await listingApi.publishDraft(listing.id);
            window.location.reload();
        } catch (err) {
            console.error("Failed to publish draft:", err);
            alert("Error publishing draft.");
        }
    };

    return (
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
                    <p className="text-[14px] font-medium text-black font-inter leading-tight">
                        {listing.companyName}
                    </p>
                    {isDraft && (
                        <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full mt-1">
                            Draft
                        </span>
                    )}
                </div>
            </div>

            <h3 className="text-[16px] font-semibold text-black font-inter mb-3 leading-tight flex-shrink-0">
                {listing.title}
            </h3>

            <p className="text-[12px] font-medium text-black font-inter mb-4 leading-tight flex-1 min-h-[60px]">
                {listing.description}
            </p>

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

            <p className="text-[14px] font-semibold text-[#DB1233] mb-4 flex-shrink-0">
                ${listing.price} CAD
            </p>

            <div className="flex gap-2 mt-auto flex-shrink-0">
                {isDraft ? (
                    <>
                        <Button
                            onClick={handleUpdateListing}
                            className="px-3 py-2 rounded text-[13px] font-medium text-white font-inter bg-[#2545AB] hover:bg-[#1e3a8a] transition-colors flex-1"
                        >
                            Edit Draft
                        </Button>
                        <Button
                            onClick={handleDeleteListing}
                            className="px-3 py-2 rounded text-[13px] font-medium text-white font-inter bg-[#DB1233] hover:bg-[#c10e2b] transition-colors flex-1"
                        >
                            Delete
                        </Button>
                    </>
                ) : (
                    <>
                        <Button
                            onClick={handleUpdateListing}
                            className="px-3 py-2 rounded text-[13px] font-medium text-white font-inter bg-[#2545AB] hover:bg-[#1e3a8a] transition-colors flex-1"
                        >
                            Update Listing
                        </Button>
                        <Button
                            onClick={handleDeleteListing}
                            className="px-3 py-2 rounded text-[13px] font-medium text-white font-inter bg-[#DB1233] hover:bg-[#c10e2b] transition-colors flex-1"
                        >
                            Delete Listing
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
};

export default MyListingCard; 