'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/contexts/I18nContext';
import { INDUSTRY_HUBS_EN as INDUSTRY_HUBS } from '@/lib/industryHubNormalize';

export default function PostRequestPage() {
    const router = useRouter();
    const { t } = useI18n();
    const { isAuthenticated, isMounted, user } = useAuth();
    const [isSupplier, setIsSupplier] = useState(false);
    const isBuyer = !isSupplier;
    const [formData, setFormData] = useState({
        title: '',
        categories: [] as string[],
        quantity: '',
        specifications: '',
        deadline: '',
        asap: false,
        targetPrice: '',
        city: '',
        province: '',
    });

    const CANADIAN_PROVINCES = [
        { code: 'ON', name: 'Ontario' },
        { code: 'QC', name: 'Quebec' },
        { code: 'BC', name: 'British Columbia' },
        { code: 'AB', name: 'Alberta' },
        { code: 'MB', name: 'Manitoba' },
        { code: 'SK', name: 'Saskatchewan' },
        { code: 'NS', name: 'Nova Scotia' },
        { code: 'NB', name: 'New Brunswick' },
        { code: 'NL', name: 'Newfoundland and Labrador' },
        { code: 'PE', name: 'Prince Edward Island' },
        { code: 'NT', name: 'Northwest Territories' },
        { code: 'YT', name: 'Yukon' },
        { code: 'NU', name: 'Nunavut' },
    ];

    // Determine role from DB (source of truth): if supplier profile exists -> supplier
    useEffect(() => {
        if (!isMounted || !isAuthenticated || !user?.email) {
            setIsSupplier(false);
            return;
        }

        fetch(`/api/profiles?userId=${encodeURIComponent(user.email)}`)
            .then((res) => {
                if (!res.ok) {
                    if (res.status === 404) return null;
                    throw new Error('Failed to fetch profile');
                }
                return res.json();
            })
            .then((profile) => {
                if (
                    profile &&
                    true
                ) {
                    setIsSupplier(true);
                } else {
                    setIsSupplier(false);
                }
            })
            .catch((err) => {
                console.error('Error checking supplier profile:', err);
                // Fallback to local role snapshot
                setIsSupplier(user?.role === 'supplier');
            });
    }, [isMounted, isAuthenticated, user?.email, user?.role]);

    const handleSubmit = async (e: React.FormEvent) => {
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

        if (!user?.email) {
            alert('Please log in to post a request');
            router.push('/login');
            return;
        }

        try {
            // Create request via API
            const response = await fetch('/api/wishlist', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: formData.title,
                    // Use first selected as primary category for backend compatibility
                    category: formData.categories[0] || '',
                    quantity: formData.quantity,
                    specifications: formData.specifications,
                    deadline: formData.asap ? null : (formData.deadline || null),
                    asap: formData.asap,
                    targetPrice: formData.targetPrice,
                    userId: user.email,
                    companyName: user?.companyName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Anonymous',
                    // Additional hints for future enrichment/search
                    targetCity: formData.city || null,
                    targetProvince: formData.province || null,
                    industries: formData.categories,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create request');
            }

            router.push('/shop?tab=listings&mode=buy');
        } catch (error: any) {
            console.error('Error creating request:', error);
            alert(error.message || 'Failed to create request. Please try again.');
        }
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

            <div className="flex-1 overflow-y-auto page-scroll relative">
                <div className="max-w-3xl mx-auto py-6">
                    <Link
                        href="/shop?tab=listings&mode=buy"
                        className="mb-6 flex items-center text-slate-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider group"
                    >
                        <i className="fa-solid fa-arrow-left mr-2 group-hover:-translate-x-1 transition-transform"></i> Back to Industrial Storefront
                    </Link>

                    <div className="glass-card p-10 rounded-3xl border border-white/5">
                        <div className="mb-8 border-b border-white/10 pb-6">
                            <h2 className="font-heading text-3xl font-black text-white uppercase tracking-widest mb-2">Post New Request</h2>
                            <p className="text-xs text-slate-500">{t('wishlist.postRequestFormSubtitle')}</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Basic Info */}
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Request Title *</label>
                                <input
                                    type="text"
                                    placeholder="e.g. 500 Units of Aluminum Casings"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-marcan-red focus:shadow-neon outline-none placeholder:text-slate-600 transition-all"
                                    required
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Quantity *</label>
                                <input
                                    type="number"
                                    placeholder="e.g. 100"
                                    value={formData.quantity}
                                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-marcan-red outline-none placeholder:text-slate-600"
                                    required
                                />
                            </div>

                            {/* Details */}
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Detailed Specifications *</label>
                                <textarea
                                    rows={5}
                                    placeholder="Describe tolerances, material grades, finishing requirements, and any specific certifications needed (e.g. ISO 9001)..."
                                    value={formData.specifications}
                                    onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-marcan-red outline-none placeholder:text-slate-600"
                                    required
                                />
                            </div>

                            {/* Target Location */}
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Target Location *</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <input
                                        type="text"
                                        placeholder="City (e.g., Waterloo)"
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-marcan-red outline-none placeholder:text-slate-600"
                                        required
                                    />
                                    <select
                                        value={formData.province}
                                        onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-marcan-red outline-none"
                                        required
                                    >
                                        <option value="">Province</option>
                                        {CANADIAN_PROVINCES.map((p) => (
                                            <option key={p.code} value={p.code}>
                                                {p.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Deadline and Target Price */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Deadline</label>
                                        <label className="flex items-center gap-2 text-[11px] text-slate-400">
                                            <input
                                                type="checkbox"
                                                checked={formData.asap}
                                                onChange={(e) => setFormData({ ...formData, asap: e.target.checked, deadline: e.target.checked ? '' : formData.deadline })}
                                                className="rounded border-white/20 bg-black/40 text-marcan-red focus:ring-0 cursor-pointer"
                                            />
                                            ASAP
                                        </label>
                                    </div>
                                    <input
                                        type="date"
                                        value={formData.deadline}
                                        onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                                        disabled={formData.asap}
                                        className={`w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm ${formData.asap ? 'text-slate-600 cursor-not-allowed' : 'text-slate-400'} focus:border-marcan-red outline-none`}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Target Price (Optional)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
                                        <input
                                            type="text"
                                            inputMode="decimal"
                                            placeholder="0.00"
                                            value={formData.targetPrice}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/[^0-9.]/g, '');
                                                if (/^\d*\.?\d{0,2}$/.test(value)) {
                                                    setFormData({ ...formData, targetPrice: value });
                                                }
                                            }}
                                            className="w-full bg-black/40 border border-white/10 rounded-lg pl-8 pr-4 py-3 text-sm text-white focus:border-marcan-red outline-none placeholder:text-slate-600"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Industry categories (multi-select) */}
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">
                                    Industry Categories *
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {INDUSTRY_HUBS.map((hub) => {
                                        const checked = formData.categories.includes(hub);
                                        return (
                                            <label key={hub} className="flex items-center gap-2 bg-black/30 border border-white/10 rounded-lg px-3 py-2 cursor-pointer hover:bg-black/40 transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setFormData({ ...formData, categories: [...formData.categories, hub] });
                                                        } else {
                                                            setFormData({ ...formData, categories: formData.categories.filter((c) => c !== hub) });
                                                        }
                                                    }}
                                                    className="rounded border-white/20 bg-black/40 text-marcan-red focus:ring-0 cursor-pointer"
                                                    required={formData.categories.length === 0}
                                                />
                                                <span className="text-xs text-slate-300 font-semibold">{hub}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                                {formData.categories.length === 0 && (
                                    <div className="mt-2 text-[10px] text-slate-500">Select at least one category.</div>
                                )}
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
