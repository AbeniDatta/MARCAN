import { useEffect, useState } from 'react';
import { listingApi, Listing } from '@/services/api';
import ListingCard from '@/components/ListingCard';
import AuthenticatedHeader from '@/components/AuthenticatedHeader';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { auth } from '@/firebase';

const SavedListings = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [currentUserUid, setCurrentUserUid] = useState<string | null>(null);

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
                      <Button
                        size="sm"
                        onClick={handleContactAll}
                        className="bg-[#DB1233] hover:bg-[#c10e2b] text-white text-sm font-medium"
                      >
                        Contact All ({selectedIds.size})
                      </Button>
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
    </div>
  );
};

export default SavedListings;