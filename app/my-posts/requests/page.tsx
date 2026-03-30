'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/contexts/I18nContext';

const INDUSTRY_HUBS = [
  'Precision Machining',
  'Foundries & Casting',
  'Surface Finishing',
  'Tooling & Molds',
  'Automation',
];

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

export default function MyRequestsPage() {
  const { isAuthenticated, user, isMounted } = useAuth();
  const { t } = useI18n();
  const [requests, setRequests] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingRequest, setViewingRequest] = useState<any | null>(null);
  const [editingRequest, setEditingRequest] = useState<any | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDomReady, setIsDomReady] = useState(false);
  const [requestFormData, setRequestFormData] = useState({
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

  useEffect(() => {
    setIsDomReady(true);
  }, []);

  useEffect(() => {
    if (!isMounted || !isAuthenticated || !user?.email) return;

    fetch(`/api/wishlist/my?userId=${encodeURIComponent(user.email)}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setRequests(Array.isArray(data) ? data : []))
      .catch(() => setRequests([]));
  }, [isMounted, isAuthenticated, user?.email]);

  const filteredRequests = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return requests;

    return requests.filter((r) => {
      const searchable = [r.title, r.category, r.specifications, r.description, r.quantity, r.targetPrice]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return searchable.includes(q);
    });
  }, [requests, searchQuery]);

  const handleStartEditRequest = (request: any) => {
    setViewingRequest(null);
    setEditingRequest(request);
    setRequestFormData({
      title: request.title || '',
      categories: request.category ? [request.category] : [],
      quantity: request.quantity || '',
      specifications: request.specifications || request.description || '',
      deadline: request.deadline ? String(request.deadline).slice(0, 10) : '',
      asap: !request.deadline,
      targetPrice: (request.targetPrice || '').replace(/[^0-9.]/g, ''),
      city: request.city || '',
      province: request.province || '',
    });
  };

  const handleSaveRequestEdit = async () => {
    if (!user?.email || !editingRequest) return;
    setIsSaving(true);
    try {
      const response = await fetch(`/api/wishlist/${editingRequest.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.email,
          title: requestFormData.title.trim(),
          category: requestFormData.categories[0] || null,
          quantity: requestFormData.quantity || null,
          specifications: requestFormData.specifications.trim(),
          deadline: requestFormData.asap ? null : requestFormData.deadline || null,
          targetPrice: requestFormData.targetPrice || '',
          targetCity: requestFormData.city || null,
          targetProvince: requestFormData.province || null,
        }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to update request');
      }
      const updated = await response.json();
      setRequests((prev) => prev.map((r) => (r.id === editingRequest.id ? { ...r, ...updated } : r)));
      setEditingRequest(null);
    } catch {
      // keep modal open; optional toast
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    if (!user?.email) return;
    try {
      const response = await fetch(`/api/wishlist/${requestId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.email }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete request');
      }
      setRequests((prev) => prev.filter((req) => req.id !== requestId));
      setViewingRequest((v: any | null) => (v && v.id === requestId ? null : v));
    } catch {
      // noop
    }
  };

  return (
    <main className="flex-1 relative z-10 overflow-hidden flex flex-col">
      <Header breadcrumb="My Posts / Sourcing Requests" />

      <div className="flex-1 overflow-y-auto page-scroll relative">
        <div className="flex justify-between items-end mb-6">
          <div>
            <div className="text-marcan-red text-xs font-bold uppercase tracking-widest mb-1">My Posts</div>
            <h2 className="font-heading text-3xl font-bold text-white uppercase">My Sourcing Requests</h2>
          </div>
          <Link
            href="/my-account"
            className="text-xs text-slate-400 hover:text-white font-bold uppercase tracking-wider transition"
          >
            <i className="fa-solid fa-arrow-left mr-2"></i> Back to My Account
          </Link>
        </div>

        <div className="glass-card p-4 rounded-2xl flex flex-wrap items-center gap-4 mb-8">
          <div className="relative flex-grow min-w-[200px]">
            <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"></i>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your sourcing requests..."
              className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:border-marcan-red outline-none transition-all placeholder:text-slate-500"
            />
          </div>
          <Link
            href="/post-request"
            className="bg-white/5 border border-white/10 text-white px-5 py-2 rounded-lg font-bold uppercase tracking-wider text-xs hover:bg-white/10 transition-all inline-flex items-center"
          >
            <i className="fa-solid fa-plus mr-2"></i> Post New Request
          </Link>
        </div>

        {filteredRequests.length === 0 ? (
          <div className="text-center py-12">
            <i className="fa-solid fa-bullhorn text-4xl text-slate-600 mb-4"></i>
            <p className="text-slate-400 text-sm">No sourcing requests found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRequests.map((request) => (
              <div
                key={request.id}
                className="glass-card rounded-2xl border border-white/5 hover:border-orange-500/50 transition-all duration-300 flex flex-col group overflow-hidden relative"
              >
                <button
                  type="button"
                  onClick={() => setPendingDeleteId(request.id)}
                  className="absolute top-3 right-3 z-20 w-8 h-8 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 flex items-center justify-center text-red-400 hover:text-red-300 transition-all"
                  title="Delete request"
                >
                  <i className="fa-solid fa-trash text-xs"></i>
                </button>

                <div className="p-5 flex flex-col flex-grow">
                  {request.category ? (
                    <div className="mb-3">
                      <span className="inline-flex px-2 py-1 text-[9px] font-bold uppercase bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded">
                        {request.category}
                      </span>
                    </div>
                  ) : null}

                  <h3 className="font-heading font-bold text-white mb-1 line-clamp-1 pr-10">
                    {request.title || 'Untitled request'}
                  </h3>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-3 line-clamp-1">
                    <i className="fa-solid fa-building text-orange-400 mr-1"></i>
                    {request.companyName || request.company || 'Your company'}
                  </p>

                  <p className="text-xs text-slate-400 line-clamp-1 mb-4">
                    {request.specifications || request.description || 'No description provided.'}
                  </p>

                  <div className="mt-auto flex items-end justify-between mb-4 gap-3">
                    <span className="text-xl font-black text-white truncate">
                      {request.targetPrice || t('wishlist.noneSpecified')}
                    </span>
                    <span className="text-xs text-slate-400 shrink-0">
                      <i className="fa-solid fa-location-dot mr-1"></i>
                      {request.location || 'N/A'}
                    </span>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => setViewingRequest(request)}
                      className="w-full py-2.5 rounded-lg bg-white/5 text-white text-xs font-bold uppercase tracking-wider hover:bg-white/10 transition-colors border border-white/5"
                    >
                      View Request
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStartEditRequest(request)}
                      className="w-full py-2.5 rounded-lg bg-white/5 text-white text-xs font-bold uppercase tracking-wider hover:bg-white/10 transition-colors border border-white/5"
                    >
                      Edit Request
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {pendingDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="glass-card p-8 rounded-2xl border border-red-500/30 max-w-md w-full mx-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                <i className="fa-solid fa-exclamation-triangle text-red-400 text-2xl"></i>
              </div>
              <h3 className="font-heading text-xl font-bold text-white mb-2 uppercase">Delete Request?</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                This action cannot be undone. Are you sure you want to permanently delete this sourcing request?
              </p>
            </div>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setPendingDeleteId(null)}
                className="flex-1 bg-white/5 border border-white/10 text-white px-6 py-3 rounded-lg font-bold uppercase tracking-wider text-xs hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const id = pendingDeleteId;
                  setPendingDeleteId(null);
                  if (id) await handleDeleteRequest(id);
                }}
                className="flex-1 bg-red-500 text-white px-6 py-3 rounded-lg font-bold uppercase tracking-wider text-xs hover:bg-red-600 hover:shadow-neon transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {editingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="glass-card p-6 rounded-2xl border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-white font-bold uppercase text-sm tracking-wider">Edit Request</h4>
              <button
                type="button"
                onClick={() => setEditingRequest(null)}
                className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Title</label>
                <input
                  type="text"
                  value={requestFormData.title}
                  onChange={(e) => setRequestFormData({ ...requestFormData, title: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-marcan-red outline-none"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Industry Categories</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {INDUSTRY_HUBS.map((hub) => {
                      const checked = requestFormData.categories.includes(hub);
                      return (
                        <label
                          key={hub}
                          className="flex items-center gap-2 bg-black/30 border border-white/10 rounded-lg px-3 py-2 cursor-pointer hover:bg-black/40 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setRequestFormData({ ...requestFormData, categories: [...requestFormData.categories, hub] });
                              } else {
                                setRequestFormData({
                                  ...requestFormData,
                                  categories: requestFormData.categories.filter((c) => c !== hub),
                                });
                              }
                            }}
                            className="rounded border-white/20 bg-black/40 text-marcan-red focus:ring-0 cursor-pointer"
                          />
                          <span className="text-xs text-slate-300 font-semibold">{hub}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Quantity</label>
                  <input
                    type="text"
                    value={requestFormData.quantity}
                    onChange={(e) => setRequestFormData({ ...requestFormData, quantity: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-marcan-red outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Specifications</label>
                <textarea
                  rows={4}
                  value={requestFormData.specifications}
                  onChange={(e) => setRequestFormData({ ...requestFormData, specifications: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-marcan-red outline-none"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Deadline</label>
                    <label className="flex items-center gap-2 text-[11px] text-slate-400">
                      <input
                        type="checkbox"
                        checked={requestFormData.asap}
                        onChange={(e) =>
                          setRequestFormData({
                            ...requestFormData,
                            asap: e.target.checked,
                            deadline: e.target.checked ? '' : requestFormData.deadline,
                          })
                        }
                        className="rounded border-white/20 bg-black/40 text-marcan-red focus:ring-0 cursor-pointer"
                      />
                      ASAP
                    </label>
                  </div>
                  <input
                    type="date"
                    value={requestFormData.deadline}
                    onChange={(e) => setRequestFormData({ ...requestFormData, deadline: e.target.value })}
                    disabled={requestFormData.asap}
                    className={`w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm ${
                      requestFormData.asap ? 'text-slate-600 cursor-not-allowed' : 'text-slate-400'
                    } focus:border-marcan-red outline-none`}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Target Price</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={requestFormData.targetPrice}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9.]/g, '');
                        if (/^\d*\.?\d{0,2}$/.test(value)) {
                          setRequestFormData({ ...requestFormData, targetPrice: value });
                        }
                      }}
                      className="w-full bg-black/40 border border-white/10 rounded-lg pl-7 pr-3 py-2 text-sm text-white focus:border-marcan-red outline-none"
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">City</label>
                  <input
                    type="text"
                    value={requestFormData.city}
                    onChange={(e) => setRequestFormData({ ...requestFormData, city: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-marcan-red outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Province</label>
                  <select
                    value={requestFormData.province}
                    onChange={(e) => setRequestFormData({ ...requestFormData, province: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-marcan-red outline-none"
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
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingRequest(null)}
                  className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-xs font-bold uppercase tracking-wider hover:bg-white/10 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSaveRequestEdit}
                  className="px-5 py-2 rounded-lg bg-marcan-red text-white text-xs font-bold uppercase tracking-wider hover:shadow-neon transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isDomReady &&
        viewingRequest &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <button
              type="button"
              className="absolute inset-0 bg-marcan-dark/90 backdrop-blur-sm"
              onClick={() => setViewingRequest(null)}
              aria-label={t('wishlist.closeRequestDetailsAria')}
            />
            <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto glass-card rounded-3xl border border-white/10 shadow-2xl flex flex-col">
              <div className="sticky top-0 z-20 flex justify-between items-center p-6 border-b border-white/10 bg-marcan-dark/95 backdrop-blur-md">
                <div className="flex items-center gap-3 min-w-0">
                  {viewingRequest.category ? (
                    <span className="bg-orange-500/20 text-orange-400 border border-orange-500/30 px-3 py-1 rounded text-[10px] font-bold uppercase shrink-0">
                      {viewingRequest.category}
                    </span>
                  ) : null}
                  <h3 className="font-heading font-bold text-xl md:text-2xl text-white truncate">
                    {viewingRequest.title || t('wishlist.sourcingRequestFallback')}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingRequest(null)}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 hover:rotate-90 transition-all border border-white/5"
                  aria-label={t('wishlist.closeRequestDetailsAria')}
                >
                  <i className="fa-solid fa-xmark text-lg"></i>
                </button>
              </div>

              <div className="p-6 md:p-8 space-y-8 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-8">
                    {viewingRequest.description || viewingRequest.specifications ? (
                      <div>
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                          <i className="fa-solid fa-align-left text-orange-400"></i> {t('wishlist.requestDescription')}
                        </h4>
                        <div className="glass-card p-6 rounded-2xl border border-white/5 text-sm text-slate-300 leading-relaxed">
                          <p>{viewingRequest.description || viewingRequest.specifications}</p>
                        </div>
                      </div>
                    ) : null}

                    <div>
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <i className="fa-solid fa-list-check text-orange-400"></i> {t('wishlist.sourcingRequirements')}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="glass-card p-4 rounded-xl border border-white/5 flex flex-col">
                          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">
                            {t('wishlist.targetQuantity')}
                          </span>
                          <span className="text-sm font-semibold text-white">
                            {viewingRequest.quantity || t('wishlist.notAvailable')}
                          </span>
                        </div>
                        <div className="glass-card p-4 rounded-xl border border-white/5 flex flex-col">
                          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">
                            {t('wishlist.targetLocation')}
                          </span>
                          <span className="text-sm font-semibold text-white">
                            {viewingRequest.location || t('wishlist.notAvailable')}
                          </span>
                        </div>
                        <div className="glass-card p-4 rounded-xl border border-white/5 flex flex-col">
                          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">
                            {t('wishlist.targetPrice')}
                          </span>
                          <span className="text-sm font-semibold text-white">
                            {viewingRequest.targetPrice || t('wishlist.noneSpecified')}
                          </span>
                        </div>
                        <div className="glass-card p-4 rounded-xl border border-white/5 flex flex-col">
                          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">
                            {t('wishlist.deadline')}
                          </span>
                          <span className="text-sm font-semibold text-white">
                            {viewingRequest.deadline
                              ? new Date(viewingRequest.deadline).toLocaleDateString()
                              : t('wishlist.asap')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="glass-card p-6 rounded-2xl border border-orange-500/20 bg-gradient-to-b from-orange-500/5 to-transparent shadow-[0_0_30px_rgba(249,115,22,0.05)]">
                      <div className="text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-2">
                        {t('wishlist.targetPrice')}
                      </div>
                      <div className="text-4xl font-black text-white tracking-tight mb-6">
                        {viewingRequest.targetPrice || t('wishlist.noneSpecified')}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleStartEditRequest(viewingRequest)}
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 text-white text-sm font-bold uppercase tracking-wider hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
                      >
                        <i className="fa-solid fa-pen"></i> Edit Request
                      </button>
                    </div>

                    <div className="glass-card p-6 rounded-2xl border border-white/5">
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">
                        {t('wishlist.postedBy')}
                      </h4>
                      <div className="text-sm font-bold text-white mb-1">
                        {viewingRequest.companyName || viewingRequest.company || t('wishlist.companyFallback')}
                      </div>
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
        )}
    </main>
  );
}
