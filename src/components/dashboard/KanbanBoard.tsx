'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Deal, DealStage, User } from '@/types';
import { STAGE_LABELS, STAGE_ORDER, COLLATERAL_LABELS } from '@/types';
import { formatCurrency, getStageBadgeColor, getScoreColor, cn } from '@/lib/utils';
import { ChevronRight, ChevronLeft, User as UserIcon } from 'lucide-react';

const PIPELINE_STAGES: DealStage[] = STAGE_ORDER.filter(
  (s) => s !== 'closed' && s !== 'declined'
);

export function KanbanBoard({
  initialDeals,
  teamMembers,
}: {
  initialDeals: Deal[];
  teamMembers: User[];
}) {
  const router = useRouter();
  const [deals, setDeals] = useState(initialDeals);
  const [filter, setFilter] = useState<'pipeline' | 'closed' | 'declined' | 'all'>('pipeline');

  const filteredDeals = deals.filter((d) => {
    if (filter === 'pipeline') return !['closed', 'declined'].includes(d.stage);
    if (filter === 'closed') return d.stage === 'closed';
    if (filter === 'declined') return d.stage === 'declined';
    return true;
  });

  async function moveStage(dealId: string, newStage: DealStage) {
    const supabase = createClient();
    const { error } = await supabase
      .from('deals')
      .update({ stage: newStage })
      .eq('id', dealId);

    if (!error) {
      setDeals((prev) =>
        prev.map((d) => (d.id === dealId ? { ...d, stage: newStage } : d))
      );
      router.refresh();
    }
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex items-center gap-2 mb-6">
        {(['pipeline', 'closed', 'declined', 'all'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
              filter === f
                ? 'bg-brand-gold/20 text-brand-gold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-brand-surface-light'
            )}
          >
            {f === 'pipeline' ? 'Active Pipeline' : f.charAt(0).toUpperCase() + f.slice(1)}
            <span className="ml-1.5 text-xs opacity-70">
              ({deals.filter((d) => {
                if (f === 'pipeline') return !['closed', 'declined'].includes(d.stage);
                if (f === 'closed') return d.stage === 'closed';
                if (f === 'declined') return d.stage === 'declined';
                return true;
              }).length})
            </span>
          </button>
        ))}
      </div>

      {/* Kanban Columns */}
      {filter === 'pipeline' ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {PIPELINE_STAGES.map((stage) => {
            const stageDeals = filteredDeals.filter((d) => d.stage === stage);
            return (
              <div
                key={stage}
                className="min-w-[280px] w-[280px] flex-shrink-0"
              >
                <div className="flex items-center gap-2 mb-3 px-1">
                  <span className={cn('badge text-xs', getStageBadgeColor(stage))}>
                    {STAGE_LABELS[stage]}
                  </span>
                  <span className="text-xs text-slate-500">{stageDeals.length}</span>
                </div>
                <div className="space-y-3">
                  {stageDeals.map((deal) => (
                    <DealCard
                      key={deal.id}
                      deal={deal}
                      onMoveForward={() => {
                        const idx = STAGE_ORDER.indexOf(deal.stage);
                        if (idx < STAGE_ORDER.length - 2) moveStage(deal.id, STAGE_ORDER[idx + 1]);
                      }}
                      onMoveBack={() => {
                        const idx = STAGE_ORDER.indexOf(deal.stage);
                        if (idx > 0) moveStage(deal.id, STAGE_ORDER[idx - 1]);
                      }}
                    />
                  ))}
                  {stageDeals.length === 0 && (
                    <div className="p-4 border border-dashed border-brand-border rounded-xl text-center text-sm text-slate-600">
                      No deals
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View for closed/declined/all */
        <div className="space-y-3">
          {filteredDeals.map((deal) => (
            <Link
              key={deal.id}
              href={`/dashboard/deals/${deal.id}`}
              className="card flex items-center gap-4 hover:border-brand-gold/30 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-mono text-brand-gold">{deal.reference_number}</span>
                  <span className={cn('badge text-xs', getStageBadgeColor(deal.stage))}>
                    {STAGE_LABELS[deal.stage]}
                  </span>
                </div>
                <p className="text-sm text-slate-200 truncate">
                  {deal.borrower?.company_name || deal.borrower?.contact_name}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-200">{formatCurrency(deal.loan_amount)}</p>
                <p className="text-xs text-slate-500">{COLLATERAL_LABELS[deal.collateral_type]}</p>
              </div>
            </Link>
          ))}
          {filteredDeals.length === 0 && (
            <div className="card text-center py-12 text-slate-500">No deals found.</div>
          )}
        </div>
      )}
    </div>
  );
}

function DealCard({
  deal,
  onMoveForward,
  onMoveBack,
}: {
  deal: Deal;
  onMoveForward: () => void;
  onMoveBack: () => void;
}) {
  const compositeScore = deal.score?.composite_score;

  return (
    <div className="card p-4 hover:border-brand-gold/30 transition-colors group">
      <Link href={`/dashboard/deals/${deal.id}`} className="block mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-mono text-brand-gold">{deal.reference_number}</span>
          {compositeScore != null && (
            <span className={cn('text-xs font-bold', getScoreColor(compositeScore))}>
              {compositeScore.toFixed(1)}
            </span>
          )}
        </div>
        <p className="text-sm font-medium text-slate-200 truncate">
          {deal.borrower?.company_name || deal.borrower?.contact_name || 'Unknown'}
        </p>
        <p className="text-sm font-semibold text-white mt-1">
          {formatCurrency(deal.loan_amount)}
        </p>
        <p className="text-xs text-slate-500 mt-1">
          {COLLATERAL_LABELS[deal.collateral_type]}
        </p>
      </Link>

      {/* Assigned user */}
      {deal.assigned_user && (
        <div className="flex items-center gap-1.5 mb-2">
          <UserIcon className="w-3 h-3 text-slate-500" />
          <span className="text-xs text-slate-500">{deal.assigned_user.full_name}</span>
        </div>
      )}

      {/* Stage controls */}
      <div className="flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.preventDefault(); onMoveBack(); }}
          className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
          title="Move to previous stage"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => { e.preventDefault(); onMoveForward(); }}
          className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
          title="Move to next stage"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
