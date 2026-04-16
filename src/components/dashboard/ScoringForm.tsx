'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { DealScore } from '@/types';
import {
  SCORING_LABELS,
  SCORING_DESCRIPTIONS,
  SCORING_WEIGHTS,
  calculateCompositeScore,
  getScoreVerdict,
} from '@/lib/scoring';
import { getScoreColor, getScoreBgColor, cn } from '@/lib/utils';
import { Save, Loader2 } from 'lucide-react';

const SCORE_FIELDS = ['collateral_quality', 'ltv_score', 'personal_balance_sheet', 'downside_recovery'] as const;

export function ScoringForm({
  dealId,
  initialScore,
}: {
  dealId: string;
  initialScore: DealScore | null;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    collateral_quality: initialScore?.collateral_quality ?? null,
    collateral_quality_notes: initialScore?.collateral_quality_notes ?? '',
    ltv_score: initialScore?.ltv_score ?? null,
    ltv_score_notes: initialScore?.ltv_score_notes ?? '',
    personal_balance_sheet: initialScore?.personal_balance_sheet ?? null,
    personal_balance_sheet_notes: initialScore?.personal_balance_sheet_notes ?? '',
    downside_recovery: initialScore?.downside_recovery ?? null,
    downside_recovery_notes: initialScore?.downside_recovery_notes ?? '',
    overall_notes: initialScore?.overall_notes ?? '',
  });

  const composite = calculateCompositeScore(form);
  const verdict = getScoreVerdict(composite);

  function setScore(field: string, value: number | null) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function setNotes(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const payload = { ...form, deal_id: dealId, scored_by: user?.id };

    if (initialScore) {
      await supabase.from('deal_scores').update(payload).eq('id', initialScore.id);
    } else {
      await supabase.from('deal_scores').insert(payload);
    }

    setSaving(false);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Composite Score Banner */}
      <div className={cn('card border-2 flex items-center justify-between', getScoreBgColor(composite))}>
        <div>
          <p className="text-sm text-slate-400">Composite Score</p>
          <p className={cn('text-4xl font-bold', getScoreColor(composite))}>
            {composite > 0 ? composite.toFixed(1) : '—'} <span className="text-lg text-slate-500">/ 10</span>
          </p>
        </div>
        <div className="text-right">
          <p className={cn('text-lg font-semibold', verdict.color)}>{verdict.label}</p>
          <p className="text-sm text-slate-400 max-w-xs">{verdict.description}</p>
        </div>
      </div>

      {/* Scoring Factors */}
      {SCORE_FIELDS.map((field) => {
        const weight = SCORING_WEIGHTS[field];
        const value = form[field];
        return (
          <div key={field} className="card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-semibold text-white">
                {SCORING_LABELS[field]}
              </h3>
              <span className="text-xs text-slate-500">Weight: {(weight * 100).toFixed(0)}%</span>
            </div>
            <p className="text-sm text-slate-500 mb-4">{SCORING_DESCRIPTIONS[field]}</p>

            {/* Score Selector */}
            <div className="flex items-center gap-1 mb-3">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setScore(field, n)}
                  className={cn(
                    'w-9 h-9 rounded-lg text-sm font-medium transition-all',
                    value === n
                      ? n >= 7
                        ? 'bg-green-500 text-white'
                        : n >= 5
                        ? 'bg-yellow-500 text-black'
                        : 'bg-red-500 text-white'
                      : 'bg-brand-bg border border-brand-border text-slate-400 hover:border-slate-500'
                  )}
                >
                  {n}
                </button>
              ))}
              {value && (
                <button
                  onClick={() => setScore(field, null)}
                  className="text-xs text-slate-600 hover:text-slate-400 ml-2"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Notes */}
            <textarea
              value={form[`${field}_notes` as keyof typeof form] as string}
              onChange={(e) => setNotes(`${field}_notes`, e.target.value)}
              placeholder={`Notes on ${SCORING_LABELS[field].toLowerCase()}...`}
              className="input-base text-sm min-h-[60px] resize-y"
            />
          </div>
        );
      })}

      {/* Overall Notes */}
      <div className="card">
        <h3 className="text-base font-semibold text-white mb-2">Overall Assessment</h3>
        <textarea
          value={form.overall_notes}
          onChange={(e) => setForm((prev) => ({ ...prev, overall_notes: e.target.value }))}
          placeholder="Overall thoughts on the deal, key risks, mitigants, and recommendation..."
          className="input-base text-sm min-h-[100px] resize-y"
        />
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : 'Save Scoring'}
        </button>
      </div>
    </div>
  );
}
