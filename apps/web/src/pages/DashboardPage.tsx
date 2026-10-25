import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Building,
  TrendingUp,
  FileSpreadsheet,
  Download,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldAlert,
  ChevronRight,
  FileCheck,
} from 'lucide-react';
import { apiFetch } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.js';

export function DashboardPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Active tab: 'PIPELINE' | 'CONTACTS' | 'ANALYTICS'
  const [activeTab, setActiveTab] = useState<'PIPELINE' | 'CONTACTS' | 'ANALYTICS'>('PIPELINE');

  // Contacts search & role filter
  const [contactSearch, setContactSearch] = useState('');
  const [contactRoleFilter, setContactRoleFilter] = useState('');

  // KYC submission modal state
  const [selectedDealForKyc, setSelectedDealForKyc] = useState<any | null>(null);
  const [aadhaarInput, setAadhaarInput] = useState('');
  const [panInput, setPanInput] = useState('');
  const [kycSubmitting, setKycSubmitting] = useState(false);
  const [kycError, setKycError] = useState<string | null>(null);

  // Decrypted KYC viewer modal state (Admin only)
  const [viewingKycDoc, setViewingKycDoc] = useState<any | null>(null);
  const [decryptedValue, setDecryptedValue] = useState<string | null>(null);
  const [decryptLoading, setDecryptLoading] = useState(false);

  // Fetch Dashboard Overview Metrics
  const { data: overviewData } = useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: () => apiFetch<{ metrics: any; recentInquiries: any[]; recentDeals: any[] }>('/dashboard/overview'),
  });

  // Fetch Deals Pipeline
  const { data: dealsData } = useQuery({
    queryKey: ['dashboard-deals'],
    queryFn: () => apiFetch<{ deals: any[] }>('/deals'),
  });

  // Fetch Contacts Directory
  const { data: contactsData } = useQuery({
    queryKey: ['dashboard-contacts', contactRoleFilter, contactSearch],
    queryFn: () => {
      const params = new URLSearchParams();
      if (contactRoleFilter) params.set('role', contactRoleFilter);
      if (contactSearch) params.set('search', contactSearch);
      return apiFetch<{ contacts: any[] }>(`/dashboard/contacts?${params.toString()}`);
    },
  });

  // Advance deal stage mutation
  const updateDealStageMutation = useMutation({
    mutationFn: async ({ dealId, stage }: { dealId: string; stage: string }) => {
      return apiFetch(`/deals/${dealId}/stage`, {
        method: 'PATCH',
        body: JSON.stringify({ stage }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-deals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
    },
  });

  const handleKycSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDealForKyc) return;

    setKycError(null);
    setKycSubmitting(true);

    try {
      await apiFetch(`/deals/${selectedDealForKyc.id}/kyc`, {
        method: 'POST',
        body: JSON.stringify({
          dealId: selectedDealForKyc.id,
          aadhaarNumber: aadhaarInput.trim(),
          panNumber: panInput.trim().toUpperCase(),
        }),
      });

      setSelectedDealForKyc(null);
      setAadhaarInput('');
      setPanInput('');
      queryClient.invalidateQueries({ queryKey: ['dashboard-deals'] });
    } catch (err: any) {
      setKycError(err.message || 'Failed to submit encrypted KYC.');
    } finally {
      setKycSubmitting(false);
    }
  };

  const handleViewDecryptedKyc = async (docId: string) => {
    setDecryptLoading(true);
    setDecryptedValue(null);
    try {
      const res = await apiFetch<{ decryptedNumber: string; maskedNumber: string; docType: string }>(
        `/deals/kyc/${docId}/decrypt`
      );
      setViewingKycDoc(res);
      setDecryptedValue(res.decryptedNumber);
    } catch (err: any) {
      alert(err.message || 'Access denied or decryption error.');
    } finally {
      setDecryptLoading(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      const blob = await apiFetch<Blob>('/dashboard/export/contacts.csv');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bhoomi-directory-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      alert('Failed to export CSV: ' + err.message);
    }
  };

  const stages = [
    { id: 'INQUIRY', title: 'Inquiry', desc: 'Initial contact' },
    { id: 'NEGOTIATION', title: 'Negotiation', desc: 'Price & terms' },
    { id: 'AGREEMENT', title: 'Agreement', desc: 'Token advance' },
    { id: 'CLOSED', title: 'Closed (Collect KYC)', desc: 'Completed deal' },
  ];

  const metrics = overviewData?.metrics || {
    totalProperties: 32,
    totalUsers: 14,
    totalInquiries: 8,
    activeDeals: 3,
    closedDeals: 1,
    conversionRate: 12.5,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
              {user?.role} PORTAL
            </span>
            <span className="text-xs text-slate-500">Vidarbha Command Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-serif text-slate-900 dark:text-white">
            Real Estate Operations & Deals Pipeline
          </h1>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 self-start sm:self-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab('PIPELINE')}
            className={`px-4 py-2 rounded-xl transition ${
              activeTab === 'PIPELINE' ? 'bg-brand-700 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            Deals Pipeline
          </button>
          <button
            onClick={() => setActiveTab('CONTACTS')}
            className={`px-4 py-2 rounded-xl transition ${
              activeTab === 'CONTACTS' ? 'bg-brand-700 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            Buyers & Sellers Directory
          </button>
        </div>
      </div>

      {/* KPI METRICS OVERVIEW */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] text-slate-500 font-semibold block">Total Properties</span>
          <span className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white mt-1 block">
            {metrics.totalProperties}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] text-slate-500 font-semibold block">Registered Users</span>
          <span className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white mt-1 block">
            {metrics.totalUsers}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] text-slate-500 font-semibold block">Total Inquiries</span>
          <span className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white mt-1 block">
            {metrics.totalInquiries}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] text-brand-700 dark:text-brand-400 font-semibold block">Active Deals</span>
          <span className="text-2xl font-extrabold font-mono text-brand-700 dark:text-brand-400 mt-1 block">
            {metrics.activeDeals}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] text-emerald-600 font-semibold block">Closed Deals</span>
          <span className="text-2xl font-extrabold font-mono text-emerald-600 mt-1 block">
            {metrics.closedDeals}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] text-slate-500 font-semibold block">Conversion Rate</span>
          <span className="text-2xl font-extrabold font-mono text-purple-600 mt-1 block">
            {metrics.conversionRate}%
          </span>
        </div>
      </div>

      {/* TAB 1: DEALS PIPELINE (KANBAN COLUMNS) */}
      {activeTab === 'PIPELINE' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold font-serif text-slate-900 dark:text-white">
                Interactive Deals Pipeline
              </h2>
              <p className="text-xs text-slate-500">
                Advance leads from Inquiry $\to$ Negotiation $\to$ Agreement $\to$ Closed. Closed deals collect AES-256-GCM encrypted Aadhaar and PAN.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
            {stages.map((stage) => {
              const stageDeals = dealsData?.deals?.filter((d) => d.stage === stage.id) || [];

              return (
                <div
                  key={stage.id}
                  className="rounded-3xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-4 space-y-3 min-h-[420px]"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                    <div>
                      <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white">
                        {stage.title}
                      </h3>
                      <span className="text-[10px] text-slate-400">{stage.desc}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                      {stageDeals.length}
                    </span>
                  </div>

                  {/* Deals in this stage */}
                  <div className="space-y-3">
                    {stageDeals.map((deal: any) => (
                      <div
                        key={deal.id}
                        className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-2.5 text-xs"
                      >
                        <div className="font-bold text-slate-900 dark:text-white line-clamp-1">
                          {deal.property.title}
                        </div>

                        <div className="text-[11px] text-slate-500 space-y-0.5">
                          <div>
                            <strong>Buyer:</strong> {deal.buyer.name} ({deal.buyer.mobile})
                          </div>
                          <div>
                            <strong>Seller:</strong> {deal.seller.name}
                          </div>
                        </div>

                        {/* KYC status tag if Closed */}
                        {deal.stage === 'CLOSED' && (
                          <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                            {deal.kycDocuments && deal.kycDocuments.length > 0 ? (
                              <div className="space-y-1">
                                <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                  <span>KYC Encrypted (AES-256)</span>
                                </div>
                                <div className="space-y-1">
                                  {deal.kycDocuments.map((doc: any) => (
                                    <div
                                      key={doc.id}
                                      className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 font-mono text-[10px]"
                                    >
                                      <span>
                                        {doc.docType}: {doc.maskedNumber}
                                      </span>
                                      {user?.role === 'ADMIN' && (
                                        <button
                                          onClick={() => handleViewDecryptedKyc(doc.id)}
                                          className="text-brand-600 hover:underline flex items-center gap-0.5"
                                        >
                                          <Eye className="w-3 h-3" />
                                          <span>Decrypt</span>
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => setSelectedDealForKyc(deal)}
                                className="w-full py-1.5 px-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] shadow transition flex items-center justify-center gap-1"
                              >
                                <Lock className="w-3 h-3" />
                                <span>Collect Aadhaar / PAN</span>
                              </button>
                            )}
                          </div>
                        )}

                        {/* Stage Progression Buttons */}
                        <div className="pt-2 flex items-center justify-between gap-1">
                          {stage.id === 'INQUIRY' && (
                            <button
                              onClick={() =>
                                updateDealStageMutation.mutate({ dealId: deal.id, stage: 'NEGOTIATION' })
                              }
                              className="w-full py-1 rounded-lg bg-slate-100 hover:bg-brand-50 text-brand-700 font-semibold text-[11px] transition"
                            >
                              Start Negotiation →
                            </button>
                          )}
                          {stage.id === 'NEGOTIATION' && (
                            <button
                              onClick={() =>
                                updateDealStageMutation.mutate({ dealId: deal.id, stage: 'AGREEMENT' })
                              }
                              className="w-full py-1 rounded-lg bg-slate-100 hover:bg-brand-50 text-brand-700 font-semibold text-[11px] transition"
                            >
                              Sign Agreement →
                            </button>
                          )}
                          {stage.id === 'AGREEMENT' && (
                            <button
                              onClick={() =>
                                updateDealStageMutation.mutate({ dealId: deal.id, stage: 'CLOSED' })
                              }
                              className="w-full py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition"
                            >
                              Close Deal & Collect KYC 🎉
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: BUYERS & SELLERS DIRECTORY */}
      {activeTab === 'CONTACTS' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold font-serif text-slate-900 dark:text-white">
                Central Contact Directory
              </h2>
              <p className="text-xs text-slate-500">
                All buyers, sellers, brokers, and builders registered on Bhoomi.
              </p>
            </div>

            <button
              onClick={handleExportCsv}
              className="px-4 py-2.5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-bold text-xs flex items-center gap-2 shadow-md transition self-start sm:self-auto"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV (Contacts Directory)</span>
            </button>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                placeholder="Search by name, mobile, or email..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <select
              value={contactRoleFilter}
              onChange={(e) => setContactRoleFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold focus:ring-2 focus:ring-brand-500"
            >
              <option value="">All Account Roles</option>
              <option value="BUYER">Buyers</option>
              <option value="SELLER">Sellers</option>
              <option value="BROKER">Brokers</option>
              <option value="BUILDER">Builders</option>
              <option value="ADMIN">Admins</option>
            </select>
          </div>

          {/* Contacts Table */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-4">Name</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Mobile</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Properties</th>
                    <th className="p-4">Inquiries</th>
                    <th className="p-4">Registration Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {contactsData?.contacts?.map((c: any) => (
                    <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-4 font-semibold text-slate-900 dark:text-white">
                        {c.name}
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800">
                          {c.role}
                        </span>
                      </td>
                      <td className="p-4 font-mono">{c.mobile}</td>
                      <td className="p-4">{c.email}</td>
                      <td className="p-4 font-mono">{c._count?.properties || 0}</td>
                      <td className="p-4 font-mono">{c._count?.inquiries || 0}</td>
                      <td className="p-4 text-slate-400">{new Date(c.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* KYC SUBMISSION MODAL */}
      {selectedDealForKyc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Collect Closed Deal KYC
                </h3>
                <span className="text-xs text-slate-500">AES-256-GCM Encrypted at Rest</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              In accordance with property closing procedures in Maharashtra, collect the buyer's Aadhaar and PAN. These are encrypted using AES-256-GCM and only masked values will be displayed.
            </p>

            {kycError && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs">
                ⚠️ {kycError}
              </div>
            )}

            <form onSubmit={handleKycSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">12-Digit Aadhaar Number</label>
                <input
                  type="text"
                  maxLength={12}
                  value={aadhaarInput}
                  onChange={(e) => setAadhaarInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="548291038472"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-sm"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">10-Digit Indian PAN Number</label>
                <input
                  type="text"
                  maxLength={10}
                  value={panInput}
                  onChange={(e) => setPanInput(e.target.value.toUpperCase())}
                  placeholder="ABCDE1234F"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-sm uppercase"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedDealForKyc(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={kycSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-bold"
                >
                  {kycSubmitting ? 'Encrypting...' : 'Secure & Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DECRYPTED KYC VIEWER MODAL (ADMIN ONLY) */}
      {viewingKycDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 mx-auto flex items-center justify-center">
              <Eye className="w-6 h-6" />
            </div>

            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Decrypted KYC Document
            </h3>
            <span className="text-xs text-rose-600 block">
              Audit Log Entry Recorded for this Read Action
            </span>

            <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 font-mono text-base font-bold text-slate-900 dark:text-white">
              {decryptedValue}
            </div>

            <button
              onClick={() => setViewingKycDoc(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
