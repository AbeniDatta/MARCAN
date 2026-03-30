'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/contexts/I18nContext';

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

export default function CreateListingPage() {
  const router = useRouter();
  const { isAuthenticated, user, isMounted } = useAuth();
  const { t } = useI18n();
  const [isSupplier, setIsSupplier] = useState(false);
  const [isCheckingSupplier, setIsCheckingSupplier] = useState(true);
  const [formData, setFormData] = useState({
    itemName: '',
    listingType: '',
    price: '',
    city: '',
    province: '',
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
      alert(t('storefrontCreateListing.alerts.loginRequired'));
      router.push('/login');
      return;
    }

    const location = `${formData.city.trim()}, ${formData.province}`.trim();

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
          price: formData.price,
          location,
          description: formData.description,
          userId: user.email,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || t('storefrontCreateListing.alerts.failedToCreate'));
      }

      // Keep the user on the Sell (storefront listings) view after creating a listing.
      router.push('/shop?tab=listings&mode=sell');
    } catch (error: any) {
      console.error('Error creating listing:', error);
      alert(error.message || t('storefrontCreateListing.alerts.failedToCreateTryAgain'));
    }
  };

  // Check if user has a supplier profile
  useEffect(() => {
    if (isMounted && !isAuthenticated) {
      router.replace('/login');
      return;
    }

    if (isMounted && isAuthenticated && user?.email) {
      setIsCheckingSupplier(true);
      fetch(`/api/profiles?userId=${encodeURIComponent(user.email)}`)
        .then((res) => {
          if (!res.ok) {
            if (res.status === 404) {
              return null;
            }
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
            // Redirect to my-account if not a supplier
            router.replace('/my-account');
          }
        })
        .catch((err) => {
          console.error('Error checking supplier profile:', err);
          // Fallback to localStorage role check
          const hasSupplierRole = user?.role === 'supplier';
          setIsSupplier(hasSupplierRole);
          if (!hasSupplierRole) {
            router.replace('/my-account');
          }
        })
        .finally(() => {
          setIsCheckingSupplier(false);
        });
    } else {
      setIsCheckingSupplier(false);
    }
  }, [isMounted, isAuthenticated, user?.email, user?.role, router]);

  if (!isMounted || !isAuthenticated || isCheckingSupplier || !isSupplier) {
    return null;
  }

  return (
    <main className="flex-1 relative z-10 overflow-hidden flex flex-col">
      <Header breadcrumb="Create Listing" />

      <div className="flex-1 overflow-y-auto page-scroll relative">
        <div className="max-w-3xl mx-auto py-6">
          <Link
            href="/shop"
            className="mb-6 flex items-center text-slate-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider group"
          >
            <i className="fa-solid fa-arrow-left mr-2 group-hover:-translate-x-1 transition-transform"></i> {t('storefrontCreateListing.backToIndustrialStorefront')}
          </Link>

          <div className="glass-card p-10 rounded-3xl border border-white/5">
            <div className="mb-8 border-b border-white/10 pb-6">
              <h2 className="font-heading text-3xl font-black text-white uppercase tracking-widest mb-2">{t('storefrontCreateListing.title')}</h2>
              <p className="text-xs text-slate-500">{t('storefrontCreateListing.description')}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">{t('storefrontCreateListing.itemNameLabel')}</label>
                <input
                  type="text"
                  placeholder={t('storefrontCreateListing.itemNamePlaceholder')}
                  value={formData.itemName}
                  onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-marcan-red focus:shadow-neon outline-none placeholder:text-slate-600 transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">{t('storefrontCreateListing.listingTypeLabel')}</label>
                  <select
                    value={formData.listingType}
                    onChange={(e) => setFormData({ ...formData, listingType: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-marcan-red outline-none"
                    required
                  >
                    <option value="">{t('storefrontCreateListing.selectTypePlaceholder')}</option>
                    <option value="Equipment / Machinery">{t('storefrontCreateListing.listingTypes.equipmentMachinery')}</option>
                    <option value="Raw Materials">{t('storefrontCreateListing.listingTypes.rawMaterials')}</option>
                    <option value="Surplus Parts">{t('storefrontCreateListing.listingTypes.surplusParts')}</option>
                    <option value="Extra Space">{t('storefrontCreateListing.listingTypes.extraSpace')}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">{t('storefrontCreateListing.priceLabel')}</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder={t('storefrontCreateListing.pricePlaceholder')}
                    value={formData.price}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9.]/g, '');
                      if (/^\d*\.?\d{0,2}$/.test(value)) {
                        setFormData({ ...formData, price: value });
                      }
                    }}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-marcan-red outline-none placeholder:text-slate-600"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">{t('storefrontCreateListing.cityLabel')}</label>
                  <input
                    type="text"
                    placeholder={t('storefrontCreateListing.cityPlaceholder')}
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-marcan-red outline-none placeholder:text-slate-600"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">{t('storefrontCreateListing.provinceLabel')}</label>
                <select
                  value={formData.province}
                  onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-marcan-red outline-none"
                  required
                >
                  <option value="">{t('storefrontCreateListing.selectProvincePlaceholder')}</option>
                  {CANADIAN_PROVINCES.map((province) => (
                    <option key={province.code} value={province.code}>
                      {province.name} ({province.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Details */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">{t('storefrontCreateListing.descriptionLabel')}</label>
                <textarea
                  rows={5}
                  placeholder={t('storefrontCreateListing.descriptionPlaceholder')}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-marcan-red outline-none placeholder:text-slate-600"
                  required
                />
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  className="bg-orange-500 text-white px-8 py-3 rounded-lg font-bold text-sm uppercase tracking-wider hover:shadow-neon hover:scale-105 transition-all"
                >
                  {t('storefrontCreateListing.postListingButton')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
