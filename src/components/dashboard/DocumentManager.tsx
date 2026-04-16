'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Document as DocType, DocStatus } from '@/types';
import { formatDateTime, cn } from '@/lib/utils';
import {
  Upload, FileText, Eye, Trash2, CheckCircle, XCircle,
  Clock, AlertCircle, Loader2, ExternalLink, Copy
} from 'lucide-react';

const STATUS_CONFIG: Record<DocStatus, { label: string; color: string; icon: typeof CheckCircle }> = {
  pending: { label: 'Pending', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30', icon: Clock },
  received: { label: 'Received', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: FileText },
  under_review: { label: 'Under Review', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: Eye },
  approved: { label: 'Approved', color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle },
  needs_resubmission: { label: 'Needs Resubmission', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: AlertCircle },
};

export function DocumentManager({
  dealId,
  initialDocs,
  uploadToken,
}: {
  dealId: string;
  initialDocs: DocType[];
  uploadToken: string;
}) {
  const router = useRouter();
  const [docs, setDocs] = useState(initialDocs);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    setUploading(true);

    const supabase = createClient();
    for (const file of Array.from(files)) {
      const filePath = `${dealId}/${Date.now()}-${file.name}`;
      const { error: uploadErr } = await supabase.storage.from('deal-documents').upload(filePath, file);
      if (uploadErr) continue;

      const { data } = await supabase
        .from('documents')
        .insert({
          deal_id: dealId,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
          category: 'Internal Upload',
          uploaded_by_borrower: false,
          status: 'received',
        })
        .select()
        .single();

      if (data) setDocs((prev) => [data as DocType, ...prev]);
    }

    setUploading(false);
    e.target.value = '';
  }

  async function updateDocStatus(docId: string, status: DocStatus) {
    const supabase = createClient();
    await supabase.from('documents').update({ status }).eq('id', docId);
    setDocs((prev) => prev.map((d) => (d.id === docId ? { ...d, status } : d)));
  }

  async function deleteDoc(docId: string, filePath: string) {
    if (!confirm('Delete this document?')) return;
    const supabase = createClient();
    await supabase.storage.from('deal-documents').remove([filePath]);
    await supabase.from('documents').delete().eq('id', docId);
    setDocs((prev) => prev.filter((d) => d.id !== docId));
  }

  async function downloadDoc(filePath: string, fileName: string) {
    const supabase = createClient();
    const { data } = await supabase.storage.from('deal-documents').download(filePath);
    if (data) {
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  function copyUploadLink() {
    const link = `${window.location.origin}/upload/${uploadToken}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const borrowerDocs = docs.filter((d) => d.uploaded_by_borrower);
  const internalDocs = docs.filter((d) => !d.uploaded_by_borrower);

  return (
    <div className="space-y-6">
      {/* Upload Link */}
      <div className="card flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-white">Borrower Upload Link</p>
          <p className="text-xs text-slate-500 mt-0.5">Share this link with the borrower to upload documents</p>
        </div>
        <button onClick={copyUploadLink} className="btn-secondary flex items-center gap-2 text-sm py-2">
          {copied ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copied!' : 'Copy Link'}
        </button>
      </div>

      {/* Internal Upload */}
      <div className="card">
        <h3 className="text-lg font-semibold text-white mb-3">Upload Documents (Internal)</h3>
        <label className="block cursor-pointer">
          <div className="border-2 border-dashed border-brand-border rounded-xl p-6 text-center hover:border-brand-gold/50 transition-colors">
            {uploading ? (
              <Loader2 className="w-8 h-8 text-brand-gold animate-spin mx-auto mb-2" />
            ) : (
              <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            )}
            <p className="text-sm text-slate-400">
              {uploading ? 'Uploading...' : 'Click to upload files'}
            </p>
          </div>
          <input
            type="file"
            multiple
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
      </div>

      {/* Borrower Uploads */}
      {borrowerDocs.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">
            Borrower Uploads ({borrowerDocs.length})
          </h3>
          <div className="space-y-2">
            {borrowerDocs.map((doc) => (
              <DocRow
                key={doc.id}
                doc={doc}
                onUpdateStatus={updateDocStatus}
                onDelete={deleteDoc}
                onDownload={downloadDoc}
              />
            ))}
          </div>
        </div>
      )}

      {/* Internal Uploads */}
      {internalDocs.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">
            Internal Documents ({internalDocs.length})
          </h3>
          <div className="space-y-2">
            {internalDocs.map((doc) => (
              <DocRow
                key={doc.id}
                doc={doc}
                onUpdateStatus={updateDocStatus}
                onDelete={deleteDoc}
                onDownload={downloadDoc}
              />
            ))}
          </div>
        </div>
      )}

      {docs.length === 0 && (
        <div className="card text-center py-12 text-slate-500">
          No documents uploaded yet.
        </div>
      )}
    </div>
  );
}

function DocRow({
  doc,
  onUpdateStatus,
  onDelete,
  onDownload,
}: {
  doc: DocType;
  onUpdateStatus: (id: string, status: DocStatus) => void;
  onDelete: (id: string, path: string) => void;
  onDownload: (path: string, name: string) => void;
}) {
  const config = STATUS_CONFIG[doc.status];
  const StatusIcon = config.icon;

  return (
    <div className="flex items-center gap-3 p-3 bg-brand-surface border border-brand-border rounded-lg">
      <FileText className="w-5 h-5 text-brand-gold shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-200 truncate">{doc.file_name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-slate-500">
            {doc.file_size ? `${(doc.file_size / 1024 / 1024).toFixed(1)} MB` : ''}
          </span>
          <span className="text-xs text-slate-600">{formatDateTime(doc.created_at)}</span>
        </div>
      </div>

      {/* Status Badge */}
      <span className={cn('badge text-xs flex items-center gap-1', config.color)}>
        <StatusIcon className="w-3 h-3" />
        {config.label}
      </span>

      {/* Status Actions */}
      <select
        value={doc.status}
        onChange={(e) => onUpdateStatus(doc.id, e.target.value as DocStatus)}
        className="input-base w-auto text-xs py-1 px-2"
      >
        <option value="pending">Pending</option>
        <option value="received">Received</option>
        <option value="under_review">Under Review</option>
        <option value="approved">Approved</option>
        <option value="needs_resubmission">Needs Resubmission</option>
      </select>

      {/* Actions */}
      <button
        onClick={() => onDownload(doc.file_path, doc.file_name)}
        className="p-1.5 text-slate-500 hover:text-slate-300 transition-colors"
        title="Download"
      >
        <ExternalLink className="w-4 h-4" />
      </button>
      <button
        onClick={() => onDelete(doc.id, doc.file_path)}
        className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
        title="Delete"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
