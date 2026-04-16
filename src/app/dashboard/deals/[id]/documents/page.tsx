import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ArrowLeft } from 'lucide-react';
import { DocumentManager } from '@/components/dashboard/DocumentManager';
import type { Deal, Document as DocType } from '@/types';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DocumentsPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: deal } = await supabase
    .from('deals')
    .select('*, borrower:borrowers(*)')
    .eq('id', id)
    .single();

  if (!deal) notFound();

  const { data: docs } = await supabase
    .from('documents')
    .select('*')
    .eq('deal_id', id)
    .order('created_at', { ascending: false });

  return (
    <div>
      <Link
        href={`/dashboard/deals/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-brand-gold transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Deal
      </Link>

      <h1 className="text-2xl font-bold text-white mb-2">Documents</h1>
      <p className="text-slate-500 text-sm mb-8">
        {(deal as Deal).reference_number} -- Manage and review uploaded documents
      </p>

      <DocumentManager
        dealId={id}
        initialDocs={(docs as DocType[]) || []}
        uploadToken={(deal as Deal).upload_token}
      />
    </div>
  );
}
