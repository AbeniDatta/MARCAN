'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import { auth as firebaseAuth } from '@/lib/firebase';
import { isAdminEmail } from '@/lib/admin';

type AdminTab =
  | 'suppliers'
  | 'buyers'
  | 'storefronts'
  | 'requests'
  | 'listings'
  | 'capabilities'
  | 'company-profile-page';

type AdminData = {
  suppliers: any[];
  buyers: any[];
  storefronts: any[];
  requests: any[];
  listings: any[];
  capabilities: any[];
  settings?: {
    trustedByWidgetVisible?: boolean;
  };
};

const TAB_LABELS: Record<AdminTab, string> = {
  suppliers: 'Supplier Accounts',
  buyers: 'Buyer Accounts',
  storefronts: 'Storefront Accounts',
  requests: 'Sourcing Requests',
  listings: 'Storefront Listings',
  capabilities: 'Manage Capabilities',
  'company-profile-page': 'Manage Company Profile Page',
};

export default function AdminPage() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading, isMounted } = useAuth();

  const [activeTab, setActiveTab] = useState<AdminTab>('suppliers');
  const [searchTerm, setSearchTerm] = useState('');
  const [data, setData] = useState<AdminData>({
    suppliers: [],
    buyers: [],
    storefronts: [],
    requests: [],
    listings: [],
    capabilities: [],
    settings: {
      trustedByWidgetVisible: true,
    },
  });
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [newCapabilityName, setNewCapabilityName] = useState('');
  const [viewingRecord, setViewingRecord] = useState<any | null>(null);
  const [viewingTarget, setViewingTarget] = useState<string | null>(null);
  const [isEditingViewJson, setIsEditingViewJson] = useState(false);
  const [viewJsonDraft, setViewJsonDraft] = useState('');

  const sanitizeRecordForView = (target: string, row: any) => {
    if (!row || typeof row !== 'object') return row;
    if (
      target !== 'supplier' &&
      target !== 'buyer' &&
      target !== 'storefront' &&
      target !== 'request' &&
      target !== 'listing'
    ) {
      return row;
    }

    const sanitized = { ...row };
    delete (sanitized as any).aiSchema;
    delete (sanitized as any).aiSummary;
    delete (sanitized as any).aiStatus;
    delete (sanitized as any).aiEnrichedAt;
    delete (sanitized as any).aiError;
    return sanitized;
  };

  const openRecordViewer = (target: string, row: any) => {
    const sanitized = sanitizeRecordForView(target, row);
    setViewingTarget(target);
    setViewingRecord(sanitized);
    setViewJsonDraft(JSON.stringify(sanitized, null, 2));
    setIsEditingViewJson(false);
  };

  const closeRecordViewer = () => {
    setViewingRecord(null);
    setViewingTarget(null);
    setIsEditingViewJson(false);
    setViewJsonDraft('');
  };

  const saveEditedJson = async () => {
    if (!viewingRecord?.id || !viewingTarget) {
      setMessage('Cannot save: missing target record context.');
      return;
    }

    let parsed: any;
    try {
      parsed = JSON.parse(viewJsonDraft);
    } catch {
      setMessage('Invalid JSON format. Please fix and try again.');
      return;
    }

    const { id: _ignoreId, createdAt: _ignoreCreatedAt, updatedAt: _ignoreUpdatedAt, ...updateData } = parsed || {};

    setIsBusy(true);
    setMessage('');
    try {
      const token = await getToken();
      const res = await fetch('/api/admin', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          target: viewingTarget,
          id: viewingRecord.id,
          action: 'edit',
          data: updateData,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || 'Failed to save JSON changes');
      await loadAdminData();
      setMessage('Changes saved.');
      setViewingRecord({ ...viewingRecord, ...updateData });
      setViewJsonDraft(JSON.stringify({ ...viewingRecord, ...updateData }, null, 2));
      setIsEditingViewJson(false);
    } catch (e: any) {
      setMessage(e?.message || 'Failed to save JSON changes.');
    } finally {
      setIsBusy(false);
    }
  };

  const isAdminUser = !!user && (user.role === 'admin' || isAdminEmail(user.email));

  const getToken = async () => {
    const token = await firebaseAuth.currentUser?.getIdToken();
    if (!token) throw new Error('No active Firebase session token');
    return token;
  };

  const loadAdminData = async () => {
    setIsBusy(true);
    setMessage('');
    try {
      const token = await getToken();
      const res = await fetch('/api/admin', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load admin data');
      const json = (await res.json()) as AdminData;
      setData(json);
    } catch (e: any) {
      setMessage(e?.message || 'Failed to load admin data');
    } finally {
      setIsBusy(false);
    }
  };

  useEffect(() => {
    if (!isMounted || isLoading) return;
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (!isAdminUser) {
      router.replace('/my-account');
      return;
    }
    void loadAdminData();
  }, [isMounted, isLoading, isAuthenticated, isAdminUser, router]);

  const filteredRows = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const rows = Array.isArray((data as any)[activeTab]) ? (data as any)[activeTab] : [];
    if (!query) return rows;
    return rows.filter((row: any) => JSON.stringify(row).toLowerCase().includes(query));
  }, [activeTab, data, searchTerm]);

  const runAction = async (method: 'PATCH' | 'DELETE' | 'POST', body: any) => {
    setIsBusy(true);
    setMessage('');
    try {
      const token = await getToken();
      const res = await fetch('/api/admin', {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || 'Admin action failed');
      await loadAdminData();
      setMessage('Action completed.');
    } catch (e: any) {
      setMessage(e?.message || 'Action failed.');
    } finally {
      setIsBusy(false);
    }
  };

  const onCreateCapability = async () => {
    const name = newCapabilityName.trim();
    if (!name) {
      setMessage('Capability name is required.');
      return;
    }
    await runAction('POST', {
      target: 'capability',
      data: { name },
    });
    setNewCapabilityName('');
  };

  if (!isMounted || isLoading || !isAuthenticated || !isAdminUser) {
    return (
      <main className="flex-1 relative z-10 overflow-hidden flex flex-col">
        <Header breadcrumb="Admin" />
      </main>
    );
  }

  return (
    <main className="flex-1 relative z-10 overflow-hidden flex flex-col">
      <Header breadcrumb="Admin" />
      <div className="flex-1 overflow-y-auto page-scroll relative">
        <div className="max-w-6xl mx-auto py-6 px-3 sm:px-0">
          <div className="glass-card rounded-2xl p-6 mb-6 border border-white/5">
            <h1 className="font-heading text-3xl font-black text-white tracking-wide">Admin</h1>
            <p className="text-slate-400 text-sm mt-2">
              Manage accounts, sourcing requests, storefront listings, and homepage capabilities.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-3 space-y-2">
              {(Object.keys(TAB_LABELS) as AdminTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider border-l-4 transition-all ${activeTab === tab
                      ? 'bg-marcan-red/10 text-white border-marcan-red'
                      : 'text-slate-400 hover:text-white hover:bg-white/5 border-transparent'
                    }`}
                >
                  {TAB_LABELS[tab]}
                </button>
              ))}
            </div>

            <div className="lg:col-span-9">
              <div className="glass-card rounded-2xl p-5 border border-white/5">
                <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mb-4">
                  <h2 className="text-white font-bold uppercase tracking-wider text-sm">{TAB_LABELS[activeTab]}</h2>
                  <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search / filter"
                    className="w-full sm:w-72 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-marcan-red outline-none"
                  />
                </div>

                {activeTab === 'capabilities' && (
                  <div className="mb-4 grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <input
                      value={newCapabilityName}
                      onChange={(e) => setNewCapabilityName(e.target.value)}
                      placeholder="New capability name"
                      className="sm:col-span-3 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-marcan-red outline-none"
                    />
                    <button
                      onClick={onCreateCapability}
                      disabled={isBusy}
                      className="bg-marcan-red border border-marcan-red text-white rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                    >
                      Create
                    </button>
                  </div>
                )}
                {activeTab === 'company-profile-page' && (
                  <div className="mb-4 rounded-xl border border-white/10 bg-black/20 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-white text-sm font-semibold">Trusted By Widget</h3>
                        <p className="text-xs text-slate-400 mt-1">
                          Toggle visibility of the Trusted By section on company profile pages.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          runAction('PATCH', {
                            target: 'settings',
                            id: 'trusted_by_widget',
                            action: 'set_trusted_by_widget_visible',
                            data: { visible: !(data.settings?.trustedByWidgetVisible ?? true) },
                          })
                        }
                        disabled={isBusy}
                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all disabled:opacity-50 ${
                          data.settings?.trustedByWidgetVisible
                            ? 'bg-green-600/20 border-green-500/40 text-green-300'
                            : 'bg-red-600/20 border-red-500/40 text-red-300'
                        }`}
                      >
                        {data.settings?.trustedByWidgetVisible ? 'Visible' : 'Hidden'}
                      </button>
                    </div>
                  </div>
                )}
                {activeTab === 'capabilities' && (
                  <p className="mb-3 text-xs text-slate-400">
                    Showing only homepage capabilities plus any capabilities added here.
                  </p>
                )}

                {message && <div className="mb-3 text-xs text-slate-300">{message}</div>}

                <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
                  {activeTab === 'company-profile-page' && (
                    <div className="text-slate-500 text-sm border border-dashed border-white/10 rounded-xl p-4">
                      Use the toggle above to control the Trusted By widget visibility.
                    </div>
                  )}
                  {filteredRows.map((row: any) => {
                    const name =
                      row.companyName ||
                      row.name ||
                      row.title ||
                      row.email ||
                      row.userId ||
                      row.id;
                    const targetMap: Record<AdminTab, string> = {
                      suppliers: 'supplier',
                      buyers: 'buyer',
                      storefronts: 'storefront',
                      requests: 'request',
                      listings: 'listing',
                      capabilities: 'capability',
                      'company-profile-page': 'settings',
                    };
                    const target = targetMap[activeTab];
                    const isHidden =
                      row.hidden === true ||
                      row.deactivated === true ||
                      row.active === false ||
                      row.searchable === false;
                    const viewLabelByTarget: Record<string, string> = {
                      supplier: 'View Company',
                      buyer: 'View Company',
                      storefront: 'View Company',
                      request: 'View Request',
                      listing: 'View Listing',
                      capability: 'View Capability',
                    };
                    const viewLabel = viewLabelByTarget[target] || 'View';

                    return (
                      <div key={row.id} className="border border-white/10 rounded-xl p-3 bg-black/20">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div>
                            <div className="text-white text-sm font-semibold">{String(name)}</div>
                            <div className="text-slate-400 text-xs">{row.email || row.userId || row.id}</div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => openRecordViewer(target, row)}
                              disabled={isBusy}
                              className="px-2 py-1 rounded border border-white/20 text-xs text-white hover:border-marcan-red disabled:opacity-50"
                            >
                              {viewLabel}
                            </button>
                            <button
                              onClick={() =>
                                runAction('PATCH', {
                                  target,
                                  id: row.id,
                                  action: isHidden ? 'unhide' : 'hide',
                                })
                              }
                              disabled={isBusy}
                              className="px-2 py-1 rounded border border-white/20 text-xs text-white hover:border-marcan-red disabled:opacity-50"
                            >
                              {isHidden ? 'Unhide' : 'Hide'}
                            </button>
                            <button
                              onClick={() =>
                                runAction('DELETE', {
                                  target,
                                  id: row.id,
                                })
                              }
                              disabled={isBusy}
                              className="px-2 py-1 rounded border border-red-500/40 text-xs text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {viewingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-[#0f1117] p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-white text-sm font-bold uppercase tracking-wider">Record Details</h3>
              <button
                type="button"
                onClick={closeRecordViewer}
                className="text-slate-400 hover:text-white text-xs"
              >
                Close
              </button>
            </div>
            <div className="mb-3 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  if (isEditingViewJson) {
                    setIsEditingViewJson(false);
                    setViewJsonDraft(JSON.stringify(viewingRecord, null, 2));
                    return;
                  }
                  setIsEditingViewJson(true);
                }}
                disabled={isBusy}
                className="px-3 py-1.5 rounded border border-white/20 text-xs text-white hover:border-marcan-red disabled:opacity-50"
              >
                {isEditingViewJson ? 'Cancel' : 'Edit'}
              </button>
              {isEditingViewJson && (
                <button
                  type="button"
                  onClick={saveEditedJson}
                  disabled={isBusy}
                  className="px-3 py-1.5 rounded border border-marcan-red bg-marcan-red/20 text-xs text-white hover:bg-marcan-red/30 disabled:opacity-50"
                >
                  Save
                </button>
              )}
            </div>
            {isEditingViewJson ? (
              <textarea
                value={viewJsonDraft}
                onChange={(e) => setViewJsonDraft(e.target.value)}
                className="h-[60vh] w-full resize-none rounded-lg border border-white/10 bg-black/40 p-3 font-mono text-xs text-slate-200 outline-none focus:border-marcan-red"
              />
            ) : (
              <pre className="max-h-[60vh] overflow-auto rounded-lg border border-white/10 bg-black/40 p-3 text-xs text-slate-200">
                {JSON.stringify(viewingRecord, null, 2)}
              </pre>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
