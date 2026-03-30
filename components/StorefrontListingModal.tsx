'use client';

import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useI18n } from '@/contexts/I18nContext';

export type StorefrontListingModalData = {
  profileId: string;
  listingType?: string;
  title?: string;
  description?: string;
  price?: string;
  location?: string;
  supplierEmail?: string | null;
  supplierName?: string;
  supplierLogoUrl?: string | null;
  supplierIcon?: string | null;
};

type Props = {
  listing: StorefrontListingModalData | null;
  open: boolean;
  onClose: () => void;
};

export default function StorefrontListingModal({ listing, open, onClose }: Props) {
  const { t } = useI18n();

  if (!open || !listing || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-marcan-dark/90 backdrop-blur-sm"
        onClick={onClose}
        aria-label={t('storefront.modal.closeListingAria')}
      />

      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto glass-card rounded-3xl border border-white/10 shadow-2xl flex flex-col">
        <div className="sticky top-0 z-20 flex justify-between items-center p-6 border-b border-white/10 bg-marcan-dark/95 backdrop-blur-md">
          <div className="flex items-center gap-3 min-w-0">
            <span className="bg-orange-500/20 text-orange-400 border border-orange-500/30 px-3 py-1 rounded text-[10px] font-bold uppercase shrink-0">
              {listing.listingType || t('storefront.modal.notSpecified')}
            </span>
            <h3 className="font-heading font-bold text-xl md:text-2xl text-white truncate">
              {listing.title || t('storefront.listingCard.untitledListing')}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 hover:rotate-90 transition-all border border-white/5"
            aria-label={t('storefront.modal.closeListingAria')}
          >
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <div className="p-6 md:p-8 space-y-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <i className="fa-solid fa-align-left text-orange-400"></i> {t('storefront.modal.descriptionLabel')}
                </h4>
                <div className="glass-card p-6 rounded-2xl border border-white/5 text-sm text-slate-300 leading-relaxed">
                  <p>{listing.description || t('storefront.modal.descriptionFallback')}</p>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <i className="fa-solid fa-list-check text-orange-400"></i> {t('storefront.modal.listingDetailsLabel')}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="glass-card p-4 rounded-xl border border-white/5 flex flex-col">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">{t('storefront.modal.type')}</span>
                    <span className="text-sm font-semibold text-white">{listing.listingType || t('storefront.modal.notSpecified')}</span>
                  </div>
                  <div className="glass-card p-4 rounded-xl border border-white/5 flex flex-col">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">{t('storefront.modal.price')}</span>
                    <span className="text-sm font-semibold text-white">{listing.price || t('storefront.listingCard.negotiable')}</span>
                  </div>
                  <div className="glass-card p-4 rounded-xl border border-white/5 flex flex-col">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">{t('storefront.modal.location')}</span>
                    <span className="text-sm font-semibold text-white">{listing.location || t('storefront.modal.notSpecified')}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="glass-card p-6 rounded-2xl border border-orange-500/20 bg-gradient-to-b from-orange-500/5 to-transparent shadow-[0_0_30px_rgba(249,115,22,0.05)]">
                <div className="text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-2">{t('storefront.modal.askingPrice')}</div>
                <div className="text-4xl font-black text-white tracking-tight mb-6">
                  {listing.price || t('storefront.listingCard.negotiable')}
                </div>

                {listing.supplierEmail ? (
                  <a
                    href={`mailto:${listing.supplierEmail}?subject=${encodeURIComponent(
                      t('storefront.modal.emailSubjectPrefix') +
                        (listing.title || t('storefront.listingCard.untitledListing'))
                    )}`}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 text-white text-sm font-bold uppercase tracking-wider hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] hover:scale-[1.02] transition-all flex items-center justify-center gap-3 mb-3"
                  >
                    <i className="fa-solid fa-envelope"></i> {t('storefront.modal.emailSupplier')}
                  </a>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="w-full py-4 rounded-xl bg-white/5 border border-white/10 text-slate-500 text-sm font-bold uppercase tracking-wider mb-3 cursor-not-allowed"
                  >
                    {t('storefront.modal.emailSupplier')}
                  </button>
                )}
              </div>

              <div className="glass-card p-6 rounded-2xl border border-white/5">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">{t('storefront.modal.listedBy')}</h4>

                <div className="flex items-center gap-4 mb-5">
                  {listing.supplierLogoUrl ? (
                    <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center overflow-hidden border border-white/10 shadow-inner">
                      <img
                        src={listing.supplierLogoUrl}
                        alt={listing.supplierName || ''}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-orange-400 border border-white/10 shadow-inner">
                      <i className={`fa-solid ${listing.supplierIcon || 'fa-industry'} text-xl`}></i>
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-bold text-white mb-1">
                      {listing.supplierName || t('storefront.modal.unknownCompany')}
                    </div>
                    <div className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded text-[9px] font-bold uppercase border border-blue-500/20">
                      <i className="fa-solid fa-circle-check"></i> {t('storefront.modal.platformMember')}
                    </div>
                  </div>
                </div>

                <Link
                  href={`/profile?id=${encodeURIComponent(listing.profileId)}`}
                  className="w-full py-2.5 rounded-lg border border-white/10 text-slate-300 text-xs font-bold uppercase tracking-wider hover:bg-white/5 hover:text-white transition-all text-center block"
                >
                  {t('storefront.modal.viewFullProfile')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
