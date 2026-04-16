'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, X } from 'lucide-react';
import { COLLATERAL_LABELS } from '@/types';
import type { CollateralType } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface DealInfo {
  id: string;
  reference_number: string;
  loan_amount: number;
  collateral_type: CollateralType;
  secondary_collateral_type: CollateralType | null;
  upload_token: string;
}

interface DocInfo {
  id: string;
  file_name: string;
  file_size: number | null;
  created_at: string;
}

export default function UploadPage() {
  const params = useParams();
  const token = params.token as string;
  const [deal, setDeal] = useState<DealInfo | null>(null);
  const [docs, setDocs] = useState<DocInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadDeal = useCallback(async () => {
    try {
      const res = await fetch(`/api/deal-by-token?token=${encodeURIComponent(token)}`);
      if (res.ok) {
        const data = await res.json();
        setDeal(data.deal);
        setDocs(data.documents || []);
      }
    } catch {
      // deal stays null
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    loadDeal();
  }, [loadDeal]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || !deal) return;

    setUploading(true);
    setError('');
    setSuccess('');

    let hadError = false;
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append('token', token);
      formData.append('file', file);

      const res = await fetch('/api/upload-doc', { method: 'POST', body: formData });
      if (!res.ok) {
        const data = await res.json();
        setError(`Failed to upload ${file.name}: ${data.error || 'Unknown error'}`);
        hadError = true;
        continue;
      }
    }

    if (!hadError) {
      setSuccess('Documents uploaded successfully.');
    }
    await loadDeal();
    setUploading(false);
    e.target.value = '';
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-gold animate-spin" />
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center px-6">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Invalid Upload Link</h1>
          <p className="text-slate-400">This upload link is not valid or has expired.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg">
      <header className="border-b border-brand-border">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-gold rounded-lg flex items-center justify-center">
            <span className="text-brand-bg font-bold text-sm">VC</span>
          </div>
          <span className="text-lg font-semibold text-white">Visionary Capital</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-white mb-2">Upload Documents</h1>
        <p className="text-slate-400 mb-6">
          Reference: <span className="text-brand-gold font-mono">{deal.reference_number}</span>
        </p>

        <div className="card mb-8">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-500">Loan Amount</span>
              <p className="text-slate-200 font-semibold">{formatCurrency(deal.loan_amount)}</p>
            </div>
            <div>
              <span className="text-slate-500">Primary Collateral</span>
              <p className="text-slate-200">{COLLATERAL_LABELS[deal.collateral_type]}</p>
            </div>
            {deal.secondary_collateral_type && (
              <div>
                <span className="text-slate-500">Secondary Collateral</span>
                <p className="text-slate-200">{COLLATERAL_LABELS[deal.secondary_collateral_type]}</p>
              </div>
            )}
          </div>
        </div>

        {/* Upload Zone */}
        <div className="card mb-6">
          <label className="block cursor-pointer">
            <div className="border-2 border-dashed border-brand-border rounded-xl p-10 text-center hover:border-brand-gold/50 transition-colors">
              {uploading ? (
                <Loader2 className="w-10 h-10 text-brand-gold animate-spin mx-auto mb-3" />
              ) : (
                <Upload className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              )}
              <p className="text-slate-300 font-medium mb-1">
                {uploading ? 'Uploading...' : 'Click to upload or drag files here'}
              </p>
              <p className="text-slate-500 text-sm">
                PDF, DOC, XLS, JPG, PNG up to 50MB each
              </p>
            </div>
            <input
              type="file"
              multiple
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.csv"
            />
          </label>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-center gap-2">
            <X className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" /> {success}
          </div>
        )}

        {/* Uploaded Documents */}
        {docs.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Uploaded Documents</h3>
            <div className="space-y-2">
              {docs.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center gap-3 p-3 bg-brand-surface border border-brand-border rounded-lg"
                >
                  <FileText className="w-5 h-5 text-brand-gold shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 truncate">{doc.file_name}</p>
                    <p className="text-xs text-slate-500">
                      {doc.file_size ? `${(doc.file_size / 1024 / 1024).toFixed(1)} MB` : ''}
                    </p>
                  </div>
                  <span className="badge bg-green-500/20 text-green-400 border-green-500/30">
                    Uploaded
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Helpful Docs List */}
        <div className="mt-8 card">
          <h3 className="text-lg font-semibold text-white mb-3">Documents We May Request</h3>
          <ul className="space-y-2 text-sm text-slate-400">
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-brand-gold rounded-full" />
              Business Financial Statements (P&L, Balance Sheet)
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-brand-gold rounded-full" />
              Personal Financial Statement
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-brand-gold rounded-full" />
              Entity Documents (Articles / Operating Agreement)
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-brand-gold rounded-full" />
              Bank Statements (3-6 months)
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-brand-gold rounded-full" />
              Collateral Documentation (varies by type)
            </li>
          </ul>
        </div>

        {/* Done Section */}
        <div className="mt-10 pt-8 border-t border-brand-border text-center">
          <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-white mb-2">
            {docs.length > 0 ? "You're All Set!" : 'Upload Complete?'}
          </h3>
          <p className="text-slate-400 text-sm mb-6">
            {docs.length > 0
              ? `You've uploaded ${docs.length} document${docs.length > 1 ? 's' : ''}. Our team will review your submission and be in touch within 24-48 hours.`
              : 'You can upload documents now or come back later using this same link.'}
          </p>
          <p className="text-slate-500 text-xs mb-6">
            Bookmark this page — you can return anytime to upload additional documents.
          </p>
          <a
            href="/"
            className="btn-primary inline-flex items-center gap-2 px-8 py-3"
          >
            Done — Return to Visionary Capital
          </a>
        </div>
      </main>
    </div>
  );
}
