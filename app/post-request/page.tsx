'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';

export default function PostRequestPage() {
    const router = useRouter();
    const { isAuthenticated, isMounted } = useAuth();
    const [formData, setFormData] = useState({
        title: '',
        category: '',
        quantity: '',
        specifications: '',
        deadline: '',
        targetPrice: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Get user info for the request
        const userInfo = localStorage.getItem('marcan_user');
        let user = null;
        if (userInfo) {
            try {
                user = JSON.parse(userInfo);
            } catch (e) {
                console.error('Error parsing user info:', e);
            }
        }

        // Create request object
        const newRequest = {
            id: Date.now().toString(),
            userId: user?.email || '',
            company: user?.companyName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Anonymous',
            initials: user?.companyName
                ? user.companyName.split(' ').map((w: string) => w[0]).join('').substring(0, 2).toUpperCase()
                : `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase() || 'AN',
            title: formData.title,
            category: formData.category,
            quantity: formData.quantity,
            specifications: formData.specifications,
            deadline: formData.deadline,
            targetPrice: formData.targetPrice,
            createdAt: new Date().toISOString(),
            timestamp: Date.now(),
            active: true,
        };

        // Save to localStorage
        const existingRequests = JSON.parse(localStorage.getItem('marcan_wishlist_requests') || '[]');
        existingRequests.push(newRequest);
        localStorage.setItem('marcan_wishlist_requests', JSON.stringify(existingRequests));

        router.push('/wishlist');
    };

    // Redirect if not authenticated
    if (isMounted && !isAuthenticated) {
        router.replace('/login');
        return null;
    }

    if (!isMounted) {
        return null;
    }

    return (
        <main className="flex-1 relative z-10 overflow-hidden flex flex-col">
            <Header breadcrumb="Post Request" />

            <div className="flex-1 overflow-y-auto p-8 relative">
                <div className="max-w-3xl mx-auto py-6">
                    <Link
                        href="/wishlist"
                        className="mb-6 flex items-center text-slate-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider group"
                    >
                        <i className="fa-solid fa-arrow-left mr-2 group-hover:-translate-x-1 transition-transform"></i> Back to Wishlist
                    </Link>

                    <div className="glass-card p-10 rounded-3xl border border-white/5">
                        <div className="mb-8 border-b border-white/10 pb-6">
                            <h2 className="font-heading text-3xl font-black text-white uppercase tracking-widest mb-2">Post New Request</h2>
                            <p className="text-xs text-slate-500">Create an RFQ to source materials or services from the network.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Basic Info */}
                            <div>
                                <label className="text-[10px] font-bold text-marcan-red uppercase mb-2 block">Request Title</label>
                                <input
                                    type="text"
                                    placeholder="e.g. 500 Units of Aluminum Casings"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-marcan-red focus:shadow-neon outline-none placeholder:text-slate-600 transition-all"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Industry Category</label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-marcan-red outline-none"
                                        required
                                    >
                                        <option value="">Select Category...</option>
                                        <option value="Precision Machining">Precision Machining</option>
                                        <option value="Foundry / Casting">Foundry / Casting</option>
                                        <option value="Surface Finishing">Surface Finishing</option>
                                        <option value="Tooling & Molds">Tooling & Molds</option>
                                        <option value="Raw Materials">Raw Materials</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Quantity Required</label>
                                    <input
                                        type="number"
                                        placeholder="e.g. 100"
                                        value={formData.quantity}
                                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-marcan-red outline-none placeholder:text-slate-600"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Details */}
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Detailed Specifications</label>
                                <textarea
                                    rows={5}
                                    placeholder="Describe tolerances, material grades, finishing requirements, and any specific certifications needed (e.g. ISO 9001)..."
                                    value={formData.specifications}
                                    onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-marcan-red outline-none placeholder:text-slate-600"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Deadline</label>
                                    <input
                                        type="date"
                                        value={formData.deadline}
                                        onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-slate-400 focus:border-marcan-red outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Target Price (Optional)</label>
                                    <input
                                        type="text"
                                        placeholder="$ CAD"
                                        value={formData.targetPrice}
                                        onChange={(e) => setFormData({ ...formData, targetPrice: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-marcan-red outline-none placeholder:text-slate-600"
                                    />
                                </div>
                            </div>

                            {/* Attachments */}
                            <div className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center hover:border-marcan-red/50 hover:bg-white/5 transition-all cursor-pointer">
                                <i className="fa-solid fa-cloud-arrow-up text-3xl text-slate-500 mb-3"></i>
                                <p className="text-sm text-white font-bold">Upload Blueprints or CAD Files</p>
                                <p className="text-xs text-slate-500 mt-1">Supported formats: PDF, DWG, STP (Max 25MB)</p>
                            </div>

                            <div className="flex justify-end pt-4">
                                <button
                                    type="submit"
                                    className="bg-marcan-red text-white px-8 py-3 rounded-lg font-bold text-sm uppercase tracking-wider hover:shadow-neon hover:scale-105 transition-all"
                                >
                                    Publish Request
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </main>
    );
}
