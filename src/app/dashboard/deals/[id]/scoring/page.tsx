import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { ArrowLeft } from 'lucide-react';
import { STAGE_LABELS } from '@/types';
import { getStageBadgeColor, cn } from '@/lib/utils';
import { ScoringForm } from '@/components/dashboard/ScoringForm';
import type { Deal, DealScore } from '@/types';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ScoringPage({ params }: Props) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: deal } = await supabase
    .from('deals')
    .select('*, borrower:borrowers(*)')
    .eq('id', id)
    .single();

  if (!deal) notFound();

  const { data: score } = await supabase
    .from('deal_scores')
    .select('*')
    .eq('deal_id', id)
    .single();

  return (
    <div>
      <Link
        href={`/dashboard/deals/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-brand-gold transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Deal
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <h1 className="text-2xl font-bold text-white">Deal Scoring</h1>
        <span className="text-sm font-mono text-brand-gold">{(deal as Deal).reference_number}</span>
        <span className={cn('badge text-xs', getStageBadgeColor((deal as Deal).stage))}>
          {STAGE_LABELS[(deal as Deal).stage]}
        </span>
      </div>

      <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3 mb-6">
        <p className="text-xs text-red-400 font-medium">
          INTERNAL ONLY -- This scoring is visible only to the Visionary Capital team.
        </p>
      </div>

      <ScoringForm dealId={id} initialScore={score as DealScore | null} />
    </div>
  );
}
