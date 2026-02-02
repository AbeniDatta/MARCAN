'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';

export default function CreateListingPage() {
  const router = useRouter();
  const { isAuthenticated, user, isMounted } = useAuth();
  const isSeller = user && (user.role === 'sell' || user.role === 'both');
  const [formData, setFormData] = useState({
    itemName: '',
    listingType: '',
    condition: '',
    price: '',
    location: '',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Get user info for the listing
    const userInfo = localStorage.getItem('marcan_user');
    let user = null;
    if (userInfo) {
      try {
        user = JSON.parse(userInfo);
      } catch (e) {
        console.error('Error parsing user info:', e);
      }
    }

    if (!user?.email) {
      alert('Please log in to create a listing');
      router.push('/login');
      return;
    }

    try {
      // Create listing via API
      const response = await fetch('/api/listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemName: formData.itemName,
          listingType: formData.listingType,
          condition: formData.condition,
          price: formData.price,
          location: formData.location,
          description: formData.description,
          userId: user.email,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create listing');
      }

      router.push('/marketplace');
    } catch (error: any) {
      console.error('Error creating listing:', error);
      alert(error.message || 'Failed to create listing. Please try again.');
    }
  };

  // Redirect if not authenticated or not a seller
  useEffect(() => {
    if (isMounted && !isAuthenticated) {
      router.replace('/login');
    } else if (isMounted && isAuthenticated && !isSeller) {
      router.replace('/become-seller');
    }
  }, [isMounted, isAuthenticated, isSeller, router]);

  if (!isMounted || !isAuthenticated || !isSeller) {
    return null;
  }

  return (
    <main className="flex-1 relative z-10 overflow-hidden flex flex-col">
      <Header breadcrumb="Create Listing" />

      <div className="flex-1 overflow-y-auto p-8 relative">
        <div className="max-w-3xl mx-auto py-6">
          <Link
            href="/marketplace"
            className="mb-6 flex items-center text-slate-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider group"
          >
            <i className="fa-solid fa-arrow-left mr-2 group-hover:-translate-x-1 transition-transform"></i> Back to Marketplace
          </Link>

          <div className="glass-card p-10 rounded-3xl border border-white/5">
            <div className="mb-8 border-b border-white/10 pb-6">
              <h2 className="font-heading text-3xl font-black text-white uppercase tracking-widest mb-2">Create Listing</h2>
              <p className="text-xs text-slate-500">Sell surplus equipment, materials, or capacity.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div>
                <label className="text-[10px] font-bold text-marcan-red uppercase mb-2 block">Item Name</label>
                <input
                  type="text"
                  placeholder="e.g. Used Haas CNC Mill or Surplus Aluminum Sheet"
                  value={formData.itemName}
                  onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-marcan-red focus:shadow-neon outline-none placeholder:text-slate-600 transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Listing Type</label>
                  <select
                    value={formData.listingType}
                    onChange={(e) => setFormData({ ...formData, listingType: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-marcan-red outline-none"
                    required
                  >
                    <option value="">Select Type...</option>
                    <option value="Equipment / Machinery">Equipment / Machinery</option>
                    <option value="Raw Materials">Raw Materials</option>
                    <option value="Surplus Parts">Surplus Parts</option>
                    <option value="Production Capacity">Production Capacity</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Condition</label>
                  <select
                    value={formData.condition}
                    onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-marcan-red outline-none"
                    required
                  >
                    <option value="">Select Condition...</option>
                    <option value="New">New</option>
                    <option value="Used - Good">Used - Good</option>
                    <option value="Used - Fair">Used - Fair</option>
                    <option value="Refurbished">Refurbished</option>
                    <option value="For Parts">For Parts</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Price ($ CAD)</label>
                  <input
                    type="text"
                    placeholder="0.00"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-marcan-red outline-none placeholder:text-slate-600"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Location</label>
                  <input
                    type="text"
                    placeholder="City, Province"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-marcan-red outline-none placeholder:text-slate-600"
                    required
                  />
                </div>
              </div>

              {/* Details */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Description</label>
                <textarea
                  rows={5}
                  placeholder="Provide details about the item, technical specs, age, and reason for selling..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-marcan-red outline-none placeholder:text-slate-600"
                  required
                />
              </div>

              {/* Images */}
              <div className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center hover:border-marcan-red/50 hover:bg-white/5 transition-all cursor-pointer">
                <i className="fa-solid fa-camera text-3xl text-slate-500 mb-3"></i>
                <p className="text-sm text-white font-bold">Upload Photos</p>
                <p className="text-xs text-slate-500 mt-1">Add up to 5 images (JPG, PNG)</p>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  className="bg-marcan-red text-white px-8 py-3 rounded-lg font-bold text-sm uppercase tracking-wider hover:shadow-neon hover:scale-105 transition-all"
                >
                  Post Listing
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
