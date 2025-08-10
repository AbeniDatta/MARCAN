import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { listingApi, Listing } from '@/services/api';
import ListingCard from './ListingCard';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const MyListings = () => {
    const navigate = useNavigate();
    const [listings, setListings] = useState<Listing[]>([]);
    const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        fetchMyListings();
    }, []);

    useEffect(() => {
        // Filter listings based on search query
        if (searchQuery.trim()) {
            const filtered = listings.filter(listing =>
                listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                listing.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (listing.companyName && listing.companyName.toLowerCase().includes(searchQuery.toLowerCase()))
            );
            setFilteredListings(filtered);
        } else {
            setFilteredListings(listings);
        }
    }, [searchQuery, listings]);

    const fetchMyListings = async () => {
        try {
            setLoading(true);
            const data = await listingApi.getMyListings();
            setListings(data);
            setFilteredListings(data);
        } catch (err: any) {
            console.error('Failed to fetch my listings', err);
            setError(err.message || 'Failed to fetch listings');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        // Search is handled by the useEffect above
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const handleDeleteListing = async (listingId: number) => {
        try {
            await listingApi.deleteListing(listingId);
            // Remove the deleted listing from the state
            setListings(prev => prev.filter(listing => listing.id !== listingId));
        } catch (err: any) {
            console.error('Failed to delete listing', err);
            setError(err.message || 'Failed to delete listing');
        }
    };

    const handleEditListing = (listing: Listing) => {
        // Navigate to create listing page with the listing data for editing
        navigate('/create-listing', { state: { editListing: listing } });
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <h2 className="text-4xl font-medium text-black font-inter mb-12">
                    My Listings
                </h2>
                <p className="text-gray-500">Loading your listings...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-12">
                <h2 className="text-4xl font-medium text-black font-inter">
                    My Listings
                </h2>
                <Button
                    onClick={() => navigate('/create-listing')}
                    className="bg-[#DB1233] hover:bg-[#c10e2b] text-white"
                >
                    Create New Listing
                </Button>
            </div>

            {/* Search Bar */}
            <div className="flex items-center gap-0 max-w-2xl mb-8">
                <div className="flex-1 relative">
                    <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Search your listings..."
                        className="h-[60px] !text-[16px] font-medium text-[#7A7777] border border-black rounded-lg rounded-r-none border-r-0 px-6 font-inter placeholder:text-[#7A7777] focus:outline-none focus:ring-0 focus:border-black"
                    />
                </div>
                <Button
                    onClick={handleSearch}
                    className="bg-[#DB1233] hover:bg-[#c10e2b] text-white h-[60px] px-8 rounded-lg rounded-l-none text-lg font-semibold font-inter"
                >
                    <Search className="h-5 w-5" />
                    Search
                </Button>
            </div>

            {error && (
                <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                    {error}
                </div>
            )}

            {filteredListings.length === 0 ? (
                <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-100 text-center">
                    {searchQuery.trim() ? (
                        <p className="text-gray-600 text-lg mb-4">
                            No listings found matching "{searchQuery}".
                        </p>
                    ) : (
                        <p className="text-gray-600 text-lg mb-4">
                            You haven't created any listings yet.
                        </p>
                    )}
                    <Button
                        onClick={() => navigate('/create-listing')}
                        className="bg-[#DB1233] hover:bg-[#c10e2b] text-white"
                    >
                        Create Your First Listing
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {filteredListings.map((listing) => (
                        <div key={listing.id} className="relative group">
                            <ListingCard listing={listing} />

                            {/* Overlay with edit/delete buttons */}
                            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center gap-2">
                                <Button
                                    onClick={() => handleEditListing(listing)}
                                    className="bg-[#2545AB] hover:bg-[#1e3a94] text-white text-xs"
                                >
                                    Edit
                                </Button>

                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button className="bg-[#DB1233] hover:bg-[#c10e2b] text-white text-xs">
                                            Delete
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Delete Listing</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Are you sure you want to delete "{listing.title}"? This action cannot be undone.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={() => handleDeleteListing(listing.id)}
                                                className="bg-[#DB1233] hover:bg-[#c10e2b] text-white"
                                            >
                                                Delete
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyListings; 