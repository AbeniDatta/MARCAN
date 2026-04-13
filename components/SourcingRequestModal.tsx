'use client';

import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useI18n } from '@/contexts/I18nContext';

export type SourcingRequestModalListing = {
  title?: string;
  category?: string;
  description?: string;
  specifications?: string;
  quantity?: string;
  targetPrice?: string;
  location?: string | null;
  deadline?: string | null;
  isAsap?: boolean;
  buyerEmail?: string | null;
  company?: string;
  companyName?: string;
};

type Props = {
  open: boolean;
  request: SourcingRequestModalListing | null;
  onClose: () => void;
};

export default function SourcingRequestModal({ open, request, onClose }: Props) {
  const { t } = useI18n();

  if (!open || !request) return null;

  const description = request.description || request.specifications || '';
  const postedCompany = request.company || request.companyName || t('wishlist.companyFallback');
  const showAsap = request.isAsap === true || !request.deadline;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-marcan-dark/90 backdrop-blur-sm"
        onClick={onClose}
        aria-label={t('wishlist.closeRequestDetailsAria')}
      />

      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto glass-card rounded-3xl border border-white/10 shadow-2xl flex flex-col">
        <div className="sticky top-0 z-20 flex justify-between items-center p-6 border-b border-white/10 bg-marcan-dark/95 backdrop-blur-md">
          <div className="flex items-center gap-3 min-w-0">
            {request.category ? (
              <span className="bg-orange-500/20 text-orange-400 border border-orange-500/30 px-3 py-1 rounded text-[10px] font-bold uppercase shrink-0">
                {request.category}
              </span>
            ) : null}
            <h3 className="font-heading font-bold text-xl md:text-2xl text-white truncate">
              {request.title || t('wishlist.sourcingRequestFallback')}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 hover:rotate-90 transition-all border border-white/5"
            aria-label={t('wishlist.closeRequestDetailsAria')}
          >
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <div className="p-6 md:p-8 space-y-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {description ? (
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <i className="fa-solid fa-align-left text-orange-400"></i> {t('wishlist.requestDescription')}
                  </h4>
                  <div className="glass-card p-6 rounded-2xl border border-white/5 text-sm text-slate-300 leading-relaxed">
                    <p>{description}</p>
                  </div>
                </div>
              ) : null}

              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <i className="fa-solid fa-list-check text-orange-400"></i> {t('wishlist.sourcingRequirements')}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="glass-card p-4 rounded-xl border border-white/5 flex flex-col">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">{t('wishlist.targetQuantity')}</span>
                    <span className="text-sm font-semibold text-white">{request.quantity || t('wishlist.notAvailable')}</span>
                  </div>
                  <div className="glass-card p-4 rounded-xl border border-white/5 flex flex-col">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">{t('wishlist.targetLocation')}</span>
                    <span className="text-sm font-semibold text-white">{request.location || t('wishlist.notAvailable')}</span>
                  </div>
                  <div className="glass-card p-4 rounded-xl border border-white/5 flex flex-col">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">{t('wishlist.targetPrice')}</span>
                    <span className="text-sm font-semibold text-white">{request.targetPrice || t('wishlist.noneSpecified')}</span>
                  </div>
                  <div className="glass-card p-4 rounded-xl border border-white/5 flex flex-col">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">{t('wishlist.deadline')}</span>
                    <span className="text-sm font-semibold text-white">
                      {showAsap ? t('wishlist.asap') : new Date(request.deadline as string).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="glass-card p-6 rounded-2xl border border-orange-500/20 bg-gradient-to-b from-orange-500/5 to-transparent shadow-[0_0_30px_rgba(249,115,22,0.05)]">
                <div className="text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-2">{t('wishlist.interestedInRfq')}</div>
                {request.buyerEmail ? (
                  <a
                    href={`mailto:${request.buyerEmail}?subject=${encodeURIComponent(`RFQ: ${request.title || ''}`)}`}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 text-white text-sm font-bold uppercase tracking-wider hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
                  >
                    <i className="fa-solid fa-envelope" aria-hidden></i> {t('wishlist.emailBuyer')}
                  </a>
                ) : (
                  <Link
                    href="/post-request"
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 text-white text-sm font-bold uppercase tracking-wider hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
                  >
                    <i className="fa-solid fa-plus"></i> {t('wishlist.postRequest')}
                  </Link>
                )}
              </div>

              <div className="glass-card p-6 rounded-2xl border border-white/5">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">{t('wishlist.postedBy')}</h4>
                <div className="text-sm font-bold text-white mb-1">{postedCompany}</div>
                <div className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded text-[9px] font-bold uppercase border border-blue-500/20">
                  <i className="fa-solid fa-circle-check"></i> {t('storefront.modal.platformMember')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
