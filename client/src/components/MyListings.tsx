import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { listingApi, Listing } from '@/services/api';
import ProductCard from './ProductCard';
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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        fetchMyListings();
    }, []);

    const fetchMyListings = async () => {
        try {
            setLoading(true);
            const data = await listingApi.getMyListings();
            setListings(data);
        } catch (err: any) {
            console.error('Failed to fetch my listings', err);
            setError(err.message || 'Failed to fetch listings');
        } finally {
            setLoading(false);
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

            {error && (
                <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                    {error}
                </div>
            )}

            {listings.length === 0 ? (
                <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-100 text-center">
                    <p className="text-gray-600 text-lg mb-4">
                        You haven't created any listings yet.
                    </p>
                    <Button
                        onClick={() => navigate('/create-listing')}
                        className="bg-[#DB1233] hover:bg-[#c10e2b] text-white"
                    >
                        Create Your First Listing
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {listings.map((listing) => (
                        <div key={listing.id} className="relative group">
                            <ProductCard
                                title={listing.title}
                                company={listing.companyName}
                                description={listing.description}
                                image={listing.imageUrl || ""}
                                inStock={listing.tags?.includes('In Stock')}
                                exportReady={listing.tags?.includes('Export Ready')}
                            />

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