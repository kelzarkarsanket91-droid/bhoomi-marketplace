import React, { useState } from 'react';
import { ShieldCheck, Download, Trash2, CheckCircle2, Lock, FileText, AlertTriangle } from 'lucide-react';
import { apiFetch } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.js';

export function PrivacyPolicyPage() {
  const { user, openAuthModal } = useAuth();
  const [exportLoading, setExportLoading] = useState(false);
  const [deletionSuccess, setDeletionSuccess] = useState<string | null>(null);
  const [deletionLoading, setDeletionLoading] = useState(false);

  const handleExportData = async () => {
    if (!user) {
      openAuthModal();
      return;
    }

    setExportLoading(true);
    try {
      const data = await apiFetch('/compliance/export');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bhoomi-user-data-${user.id}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      alert('Failed to export data: ' + err.message);
    } finally {
      setExportLoading(false);
    }
  };

  const handleDeleteRequest = async () => {
    if (!user) {
      openAuthModal();
      return;
    }

    if (!confirm('Are you sure you wish to submit an erasure request under DPDP Act 2023? All identifiers and saved properties will be queued for statutory deletion.')) {
      return;
    }

    setDeletionLoading(true);
    try {
      const res = await apiFetch<{ message: string; ticketId: string }>('/compliance/delete-request', {
        method: 'POST',
        body: JSON.stringify({ reason: 'Self-service deletion requested via DPDP portal' }),
      });
      setDeletionSuccess(`${res.message} Ticket ID: ${res.ticketId}`);
    } catch (err: any) {
      alert('Failed to submit deletion request: ' + err.message);
    } finally {
      setDeletionLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold mb-3">
          <ShieldCheck className="w-4 h-4" />
          <span>Statutory Compliance Policy</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold font-serif text-slate-900 dark:text-white">
          Privacy Policy & DPDP Data Subject Rights
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Compliant with the Digital Personal Data Protection Act, 2023 (DPDPA), Information Technology Rules, and Maharashtra RERA standards.
        </p>
      </div>

      {/* SELF-SERVICE DATA SUBJECT RIGHTS BOX */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Lock className="w-5 h-5 text-brand-600" />
          <span>Your Data Rights as a Data Principal</span>
        </h2>

        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Under Section 11, 12, and 13 of the Digital Personal Data Protection Act, 2023, you have the right to access a summary of personal data processed, correct inaccuracies, and nominate or request erasure of your data.
        </p>

        {deletionSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>{deletionSuccess}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-4 pt-2">
          <button
            onClick={handleExportData}
            disabled={exportLoading}
            className="px-5 py-3 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-bold text-xs flex items-center gap-2 shadow-md transition disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{exportLoading ? 'Compiling JSON...' : 'Download My Data (Portability)'}</span>
          </button>

          <button
            onClick={handleDeleteRequest}
            disabled={deletionLoading}
            className="px-5 py-3 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-bold text-xs flex items-center gap-2 transition disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            <span>Request Account & Data Erasure</span>
          </button>
        </div>
      </div>

      {/* POLICY CLAUSES */}
      <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm text-slate-600 dark:text-slate-300 space-y-6 leading-relaxed">
        <section className="space-y-2">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            1. Collection of Personal Data & Purpose Limitation
          </h3>
          <p>
            Bhoomi Marketplace collects information solely for connecting genuine real estate buyers, sellers, brokers, and builders in Nagpur and Wardha. We collect your mobile number, email address, and name with explicit consent.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            2. Aadhaar & PAN Protection (AES-256-GCM)
          </h3>
          <p>
            Sensitive government identity identifiers collected during deal closure (Aadhaar number and PAN) are strictly encrypted at rest using military-grade AES-256-GCM cryptography. Plaintext identity numbers are never exposed in user interfaces and are displayed only in masked format (e.g. XXXX-XXXX-1234). Every decryption event triggers an immutable audit log entry.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            3. Contact Privacy & Gating Controls
          </h3>
          <p>
            Property owners have the absolute right to gate their phone numbers and exclusive interior photographs so that only verified, logged-in buyers can initiate direct contact. Unsolicited marketing or scraping is prohibited.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            4. Data Retention and Grievance Redressal
          </h3>
          <p>
            Data is retained only as long as necessary to fulfill real estate transaction records and legal tax obligations under Maharashtra state laws. For inquiries, reach our Data Protection Officer at: <strong className="text-slate-900 dark:text-white">privacy@bhoomi.in</strong>.
          </p>
        </section>
      </div>
    </div>
  );
}
