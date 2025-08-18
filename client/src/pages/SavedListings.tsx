import { useEffect, useState } from 'react';
import { listingApi, Listing } from '@/services/api';
import ListingCard from '@/components/ListingCard';
import AuthenticatedHeader from '@/components/AuthenticatedHeader';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { auth } from '@/firebase';
import { AlertTriangle } from 'lucide-react';

const SavedListings = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [currentUserUid, setCurrentUserUid] = useState<string | null>(null);
  const [showUnlikeConfirm, setShowUnlikeConfirm] = useState(false);

  useEffect(() => {
    const fetchSaved = async () => {
      try {
        const saved = await listingApi.getSavedListings();
        setListings(saved);
      } catch (err) {
        console.error('Error loading saved listings:', err);
      }
    };

    fetchSaved();
  }, []);

  // Authentication listener
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUserUid(user?.uid || null);
    });
    return () => unsubscribe();
  }, []);

  const handleToggleSelectionMode = () => {
    // Check if user is logged in
    if (!currentUserUid) {
      // Show a temporary message bubble
      const messageBubble = document.createElement('div');
      messageBubble.textContent = 'Please login first';
      messageBubble.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm font-medium';
      document.body.appendChild(messageBubble);

      // Remove the message after 3 seconds
      setTimeout(() => {
        if (document.body.contains(messageBubble)) {
          document.body.removeChild(messageBubble);
        }
      }, 3000);

      return;
    }

    const newMode = !isSelectionMode;
    setIsSelectionMode(newMode);
    if (!newMode) {
      setSelectedIds(new Set());
    }
  };

  const handleSelectAll = () => {
    // Check if user is logged in
    if (!currentUserUid) {
      // Show a temporary message bubble
      const messageBubble = document.createElement('div');
      messageBubble.textContent = 'Please login first';
      messageBubble.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm font-medium';
      document.body.appendChild(messageBubble);

      // Remove the message after 3 seconds
      setTimeout(() => {
        if (document.body.contains(messageBubble)) {
          document.body.removeChild(messageBubble);
        }
      }, 3000);

      return;
    }

    if (selectedIds.size === listings.length) {
      // Deselect all
      setSelectedIds(new Set());
    } else {
      // Select all
      const allIds = new Set(listings.map(listing => listing.id));
      setSelectedIds(allIds);
    }
  };

  const handleSelectListing = (listingId: number, selected: boolean) => {
    // Check if user is logged in
    if (!currentUserUid) {
      // Show a temporary message bubble
      const messageBubble = document.createElement('div');
      messageBubble.textContent = 'Please login first';
      messageBubble.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm font-medium';
      document.body.appendChild(messageBubble);

      // Remove the message after 3 seconds
      setTimeout(() => {
        if (document.body.contains(messageBubble)) {
          document.body.removeChild(messageBubble);
        }
      }, 3000);

      return;
    }

    const newSelectedIds = new Set(selectedIds);
    if (selected) {
      newSelectedIds.add(listingId);
    } else {
      newSelectedIds.delete(listingId);
    }
    setSelectedIds(newSelectedIds);
  };

  const handleContactAll = () => {
    // Check if user is logged in
    if (!currentUserUid) {
      // Show a temporary message bubble
      const messageBubble = document.createElement('div');
      messageBubble.textContent = 'Please login first';
      messageBubble.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm font-medium';
      document.body.appendChild(messageBubble);

      // Remove the message after 3 seconds
      setTimeout(() => {
        if (document.body.contains(messageBubble)) {
          document.body.removeChild(messageBubble);
        }
      }, 3000);

      return;
    }

    // Get selected listings and their email addresses
    const selectedListings = listings.filter(listing => selectedIds.has(listing.id));
    const emails = selectedListings
      .map(listing => listing.user?.email)
      .filter(email => email) // Remove undefined emails
      .filter((email, index, arr) => arr.indexOf(email) === index); // Remove duplicates

    if (emails.length > 0) {
      // Create mailto link with selected email addresses
      const mailtoLink = `mailto:${emails.join(",")}`;
      window.location.href = mailtoLink;
    } else {
      alert("No valid email addresses found for selected listings.");
    }
  };

  const handleUnlikeSelected = () => {
    // Check if user is logged in
    if (!currentUserUid) {
      // Show a temporary message bubble
      const messageBubble = document.createElement('div');
      messageBubble.textContent = 'Please login first';
      messageBubble.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm font-medium';
      document.body.appendChild(messageBubble);

      // Remove the message after 3 seconds
      setTimeout(() => {
        if (document.body.contains(messageBubble)) {
          document.body.removeChild(messageBubble);
        }
      }, 3000);

      return;
    }

    if (selectedIds.size === 0) {
      alert("Please select listings to unlike.");
      return;
    }

    // Show confirmation modal instead of browser confirm
    setShowUnlikeConfirm(true);
  };

  const confirmUnlike = async () => {
    try {
      // Unlike all selected listings
      const unlikePromises = Array.from(selectedIds).map(listingId =>
        listingApi.unsaveListing(listingId)
      );

      await Promise.all(unlikePromises);

      // Remove the unliked listings from the local state
      setListings(prevListings => prevListings.filter(listing => !selectedIds.has(listing.id)));

      // Clear selection
      setSelectedIds(new Set());
      setIsSelectionMode(false);

      // Show success message
      const messageBubble = document.createElement('div');
      messageBubble.textContent = `Successfully unliked ${selectedIds.size} listing(s)`;
      messageBubble.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm font-medium';
      document.body.appendChild(messageBubble);

      // Remove the message after 3 seconds
      setTimeout(() => {
        if (document.body.contains(messageBubble)) {
          document.body.removeChild(messageBubble);
        }
      }, 3000);

    } catch (error) {
      console.error('Error unliking listings:', error);
      alert('Failed to unlike listings. Please try again.');
    } finally {
      setShowUnlikeConfirm(false);
    }
  };

  const isAllSelected = listings.length > 0 && selectedIds.size === listings.length;
  const isIndeterminate = selectedIds.size > 0 && selectedIds.size < listings.length;

  return (
    <div className="min-h-screen bg-[#F9F9F9]">
      <AuthenticatedHeader />
      <section className="bg-[#F9F9F9] px-4 lg:px-20 py-12">
        <div className="max-w-screen-xl mx-auto">
          <h1 className="text-[40px] md:text-[50px] font-bold text-black font-inter leading-tight">
            Saved Listings
          </h1>
          <p className="text-[25px] text-[#4A3F3F] font-inria-sans font-normal mb-8">
            Your saved products and services from our suppliers
          </p>
        </div>
      </section>

      <section className="bg-[#F9F9F9] px-4 lg:px-20 pb-16">
        <div className="max-w-screen-xl mx-auto">
          {/* Selection Controls */}
          {listings.length > 0 && (
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                {isSelectionMode && (
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="select-all"
                        checked={isAllSelected}
                        onCheckedChange={handleSelectAll}
                        className="data-[state=checked]:bg-[#DB1233] data-[state=checked]:border-[#DB1233]"
                      />
                      <label
                        htmlFor="select-all"
                        className="text-sm font-medium text-gray-700 cursor-pointer"
                      >
                        Select All
                      </label>
                    </div>

                    {selectedIds.size > 0 && (
                      <>
                        <Button
                          size="sm"
                          onClick={handleContactAll}
                          className="bg-[#DB1233] hover:bg-[#c10e2b] text-white text-sm font-medium"
                        >
                          Contact All ({selectedIds.size})
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleUnlikeSelected}
                          variant="outline"
                          className="border-red-500 text-red-600 hover:bg-red-50 text-sm font-medium"
                        >
                          Unlike ({selectedIds.size})
                        </Button>
                      </>
                    )}
                  </div>
                )}

                <Button
                  variant={isSelectionMode ? "default" : "outline"}
                  size="sm"
                  onClick={handleToggleSelectionMode}
                  className={isSelectionMode ? "bg-[#DB1233] hover:bg-[#c10e2b]" : ""}
                >
                  {isSelectionMode ? 'Cancel Selection' : 'Select Listings'}
                </Button>
              </div>
            </div>
          )}

          {listings.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 text-lg">No saved listings yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  showHeart={false}
                  isSelectionMode={isSelectionMode}
                  isSelected={selectedIds.has(listing.id)}
                  onSelect={(selected) => handleSelectListing(listing.id, selected)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Unlike Confirmation Modal */}
      {showUnlikeConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Unlike Listings</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>

            <p className="text-gray-700 mb-6">
              Are you sure you want to unlike {selectedIds.size} listing{selectedIds.size !== 1 ? 's' : ''}?
              These listings will be removed from your saved items.
            </p>

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowUnlikeConfirm(false)}
                className="text-gray-600 hover:text-gray-800"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmUnlike}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Unlike {selectedIds.size} Listing{selectedIds.size !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavedListings;