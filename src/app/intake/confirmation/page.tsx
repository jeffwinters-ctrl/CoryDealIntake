'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Upload, ArrowRight } from 'lucide-react';
import { Suspense } from 'react';

function ConfirmationContent() {
  const params = useSearchParams();
  const ref = params.get('ref');
  const token = params.get('token');

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center px-6">
      <div className="max-w-lg w-full text-center">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-green-400" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-3">Deal Submitted</h1>
        <p className="text-slate-400 mb-8">
          Thank you for your submission. Our team will review your deal and be in touch
          within 24-48 hours.
        </p>

        {ref && (
          <div className="card mb-6">
            <p className="text-sm text-slate-500 mb-1">Your Reference Number</p>
            <p className="text-2xl font-bold text-brand-gold">{ref}</p>
            <p className="text-xs text-slate-500 mt-2">
              Save this number for your records.
            </p>
          </div>
        )}

        {token && (
          <div className="card mb-8">
            <div className="flex items-center gap-3 mb-3">
              <Upload className="w-5 h-5 text-brand-gold" />
              <h3 className="text-lg font-semibold text-white">Upload Documents</h3>
            </div>
            <p className="text-sm text-slate-400 mb-4">
              You can upload supporting documents now or come back later using the link below.
            </p>
            <Link
              href={`/upload/${token}`}
              className="btn-primary inline-flex items-center gap-2 w-full justify-center"
            >
              Upload Documents <ArrowRight className="w-4 h-4" />
            </Link>
            <p className="text-xs text-slate-500 mt-3">
              Bookmark this page or save your upload link. You can upload documents at any time.
            </p>
          </div>
        )}

        <Link href="/" className="text-sm text-slate-400 hover:text-brand-gold transition-colors">
          Return to Visionary Capital
        </Link>
      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-brand-bg" />}>
      <ConfirmationContent />
    </Suspense>
  );
}
