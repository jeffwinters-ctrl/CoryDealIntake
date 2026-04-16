import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import type { Deal, DealNote, DealStageHistory, ChecklistItem, Document as DocType } from '@/types';
import { STAGE_LABELS, COLLATERAL_LABELS, STAGE_ORDER } from '@/types';
import { formatCurrency, formatDate, formatDateTime, getStageBadgeColor, getScoreColor, cn } from '@/lib/utils';
import { DealActions } from '@/components/dashboard/DealActions';
import { NotesPanel } from '@/components/dashboard/NotesPanel';
import {
  ArrowLeft, FileText, ClipboardCheck, BarChart3, FileOutput,
  Clock, User as UserIcon, Copy
} from 'lucide-react';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DealDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: deal } = await supabase
    .from('deals')
    .select('*, borrower:borrowers(*), score:deal_scores(*), assigned_user:users!deals_assigned_to_fkey(*)')
    .eq('id', id)
    .single();

  if (!deal) notFound();

  const [
    { data: notes },
    { data: history },
    { data: checklist },
    { data: docs },
    { data: users },
  ] = await Promise.all([
    supabase.from('deal_notes').select('*, user:users(*)').eq('deal_id', id).order('created_at', { ascending: false }),
    supabase.from('deal_stage_history').select('*, user:users(*)').eq('deal_id', id).order('created_at', { ascending: false }),
    supabase.from('checklist_items').select('*').eq('deal_id', id).order('sort_order'),
    supabase.from('documents').select('*').eq('deal_id', id).order('created_at', { ascending: false }),
    supabase.from('users').select('*').eq('is_active', true),
  ]);

  const typedDeal = deal as Deal;
  const checklistItems = (checklist as ChecklistItem[]) || [];
  const completedChecklist = checklistItems.filter((c) => c.status === 'completed').length;
  const checklistTotal = checklistItems.filter((c) => c.status !== 'not_applicable').length;
  const checklistPct = checklistTotal > 0 ? Math.round((completedChecklist / checklistTotal) * 100) : 0;

  return (
    <div>
      {/* Back + Header */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-brand-gold transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Pipeline
      </Link>

      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-white">{typedDeal.reference_number}</h1>
            <span className={cn('badge', getStageBadgeColor(typedDeal.stage))}>
              {STAGE_LABELS[typedDeal.stage]}
            </span>
          </div>
          <p className="text-slate-400">
            {typedDeal.borrower?.company_name || typedDeal.borrower?.contact_name}
            {typedDeal.borrower?.company_name && typedDeal.borrower?.contact_name && (
              <span className="text-slate-600"> ({typedDeal.borrower.contact_name})</span>
            )}
          </p>
        </div>
        <DealActions deal={typedDeal} users={users || []} />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="card p-4">
          <p className="text-xs text-slate-500 mb-1">Loan Amount</p>
          <p className="text-xl font-bold text-white">{formatCurrency(typedDeal.loan_amount)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-500 mb-1">Collateral</p>
          <p className="text-lg font-semibold text-slate-200">{COLLATERAL_LABELS[typedDeal.collateral_type]}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-500 mb-1">Deal Score</p>
          {typedDeal.score?.composite_score != null ? (
            <p className={cn('text-xl font-bold', getScoreColor(typedDeal.score.composite_score))}>
              {typedDeal.score.composite_score.toFixed(1)}/10
            </p>
          ) : (
            <p className="text-lg text-slate-600">Not scored</p>
          )}
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-500 mb-1">Diligence</p>
          <p className="text-xl font-bold text-white">{checklistPct}%</p>
          <div className="w-full h-1.5 bg-brand-border rounded-full mt-1">
            <div
              className="h-full bg-brand-gold rounded-full transition-all"
              style={{ width: `${checklistPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tab Links */}
      <div className="flex items-center gap-1 mb-8 border-b border-brand-border pb-0">
        {[
          { href: `/dashboard/deals/${id}`, label: 'Overview', icon: FileText },
          { href: `/dashboard/deals/${id}/documents`, label: 'Documents', icon: FileText, count: docs?.length },
          { href: `/dashboard/deals/${id}/checklist`, label: 'Checklist', icon: ClipboardCheck, count: `${checklistPct}%` },
          { href: `/dashboard/deals/${id}/scoring`, label: 'Scoring', icon: BarChart3 },
          { href: `/dashboard/deals/${id}/term-sheet`, label: 'Term Sheet', icon: FileOutput },
        ].map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors border-brand-gold text-brand-gold first:border-brand-gold [&:not(:first-child)]:border-transparent [&:not(:first-child)]:text-slate-400 [&:not(:first-child)]:hover:text-slate-200"
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.count != null && (
              <span className="text-xs opacity-60 ml-1">({tab.count})</span>
            )}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Deal Info */}
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-4">Deal Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500">Loan Purpose</span>
                <p className="text-slate-200 mt-0.5">{typedDeal.loan_purpose}</p>
              </div>
              <div>
                <span className="text-slate-500">Interest Rate</span>
                <p className="text-slate-200 mt-0.5">
                  {typedDeal.interest_rate ? `${typedDeal.interest_rate}%` : 'TBD'}
                </p>
              </div>
              <div>
                <span className="text-slate-500">Term</span>
                <p className="text-slate-200 mt-0.5">
                  {typedDeal.term_months ? `${typedDeal.term_months} months` : 'TBD'}
                </p>
              </div>
              <div>
                <span className="text-slate-500">Origination Fee</span>
                <p className="text-slate-200 mt-0.5">
                  {typedDeal.origination_fee ? `${typedDeal.origination_fee}%` : 'TBD'}
                </p>
              </div>
              {typedDeal.collateral_description && (
                <div className="col-span-2">
                  <span className="text-slate-500">Collateral Description</span>
                  <p className="text-slate-200 mt-0.5">{typedDeal.collateral_description}</p>
                </div>
              )}
              {typedDeal.deal_description && (
                <div className="col-span-2">
                  <span className="text-slate-500">Deal Description</span>
                  <p className="text-slate-200 mt-0.5">{typedDeal.deal_description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Borrower Info */}
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-4">Borrower Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500">Contact Name</span>
                <p className="text-slate-200 mt-0.5">{typedDeal.borrower?.contact_name}</p>
              </div>
              <div>
                <span className="text-slate-500">Company</span>
                <p className="text-slate-200 mt-0.5">{typedDeal.borrower?.company_name || '—'}</p>
              </div>
              <div>
                <span className="text-slate-500">Email</span>
                <p className="text-slate-200 mt-0.5">{typedDeal.borrower?.email}</p>
              </div>
              <div>
                <span className="text-slate-500">Phone</span>
                <p className="text-slate-200 mt-0.5">{typedDeal.borrower?.phone || '—'}</p>
              </div>
              <div>
                <span className="text-slate-500">State</span>
                <p className="text-slate-200 mt-0.5">{typedDeal.borrower?.state || '—'}</p>
              </div>
              <div>
                <span className="text-slate-500">Upload Link</span>
                <p className="text-brand-gold text-xs font-mono mt-0.5 flex items-center gap-1">
                  /upload/{typedDeal.upload_token?.substring(0, 12)}...
                  <Copy className="w-3 h-3 cursor-pointer" />
                </p>
              </div>
            </div>
          </div>

          {/* Notes */}
          <NotesPanel dealId={id} initialNotes={(notes as DealNote[]) || []} />
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Assignment */}
          <div className="card">
            <h3 className="text-sm font-semibold text-white mb-3">Assigned To</h3>
            {typedDeal.assigned_user ? (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-brand-gold/20 rounded-full flex items-center justify-center">
                  <UserIcon className="w-4 h-4 text-brand-gold" />
                </div>
                <div>
                  <p className="text-sm text-slate-200">{typedDeal.assigned_user.full_name}</p>
                  <p className="text-xs text-slate-500">{typedDeal.assigned_user.email}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Unassigned</p>
            )}
          </div>

          {/* Timeline */}
          <div className="card">
            <h3 className="text-sm font-semibold text-white mb-3">Activity</h3>
            <div className="space-y-3">
              {(history as DealStageHistory[])?.slice(0, 10).map((h) => (
                <div key={h.id} className="flex items-start gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-300">
                      {h.from_stage
                        ? `${STAGE_LABELS[h.from_stage]} → ${STAGE_LABELS[h.to_stage]}`
                        : `Created as ${STAGE_LABELS[h.to_stage]}`}
                    </p>
                    <p className="text-xs text-slate-500">{formatDateTime(h.created_at)}</p>
                  </div>
                </div>
              ))}
              <div className="flex items-start gap-2">
                <Clock className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-slate-300">Deal submitted</p>
                  <p className="text-xs text-slate-500">{formatDateTime(typedDeal.created_at)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="card">
            <h3 className="text-sm font-semibold text-white mb-3">Dates</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Submitted</span>
                <span className="text-slate-300">{formatDate(typedDeal.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Last Updated</span>
                <span className="text-slate-300">{formatDate(typedDeal.updated_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
