'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Deal, DealStage, User } from '@/types';
import { STAGE_LABELS, STAGE_ORDER } from '@/types';
import { ChevronDown } from 'lucide-react';

export function DealActions({ deal, users }: { deal: Deal; users: User[] }) {
  const router = useRouter();
  const [showStageMenu, setShowStageMenu] = useState(false);
  const [showAssignMenu, setShowAssignMenu] = useState(false);
  const [updating, setUpdating] = useState(false);

  async function changeStage(stage: DealStage) {
    setUpdating(true);
    const supabase = createClient();
    await supabase.from('deals').update({ stage }).eq('id', deal.id);
    setShowStageMenu(false);
    setUpdating(false);
    router.refresh();
  }

  async function assignUser(userId: string | null) {
    setUpdating(true);
    const supabase = createClient();
    await supabase.from('deals').update({ assigned_to: userId }).eq('id', deal.id);
    setShowAssignMenu(false);
    setUpdating(false);
    router.refresh();
  }

  async function updateDealField(field: string, value: string) {
    const supabase = createClient();
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;
    await supabase.from('deals').update({ [field]: numValue }).eq('id', deal.id);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3">
      {/* Stage Changer */}
      <div className="relative">
        <button
          onClick={() => { setShowStageMenu(!showStageMenu); setShowAssignMenu(false); }}
          disabled={updating}
          className="btn-secondary flex items-center gap-2 text-sm py-2"
        >
          Move Stage <ChevronDown className="w-4 h-4" />
        </button>
        {showStageMenu && (
          <div className="absolute right-0 top-full mt-1 w-48 bg-brand-surface border border-brand-border rounded-lg shadow-xl z-10 py-1">
            {STAGE_ORDER.map((stage) => (
              <button
                key={stage}
                onClick={() => changeStage(stage)}
                className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                  stage === deal.stage
                    ? 'text-brand-gold bg-brand-gold/10'
                    : 'text-slate-300 hover:bg-brand-surface-light'
                }`}
              >
                {STAGE_LABELS[stage]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Assign */}
      <div className="relative">
        <button
          onClick={() => { setShowAssignMenu(!showAssignMenu); setShowStageMenu(false); }}
          disabled={updating}
          className="btn-secondary flex items-center gap-2 text-sm py-2"
        >
          Assign <ChevronDown className="w-4 h-4" />
        </button>
        {showAssignMenu && (
          <div className="absolute right-0 top-full mt-1 w-48 bg-brand-surface border border-brand-border rounded-lg shadow-xl z-10 py-1">
            <button
              onClick={() => assignUser(null)}
              className="w-full text-left px-3 py-2 text-sm text-slate-400 hover:bg-brand-surface-light"
            >
              Unassigned
            </button>
            {users.map((u) => (
              <button
                key={u.id}
                onClick={() => assignUser(u.id)}
                className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                  u.id === deal.assigned_to
                    ? 'text-brand-gold bg-brand-gold/10'
                    : 'text-slate-300 hover:bg-brand-surface-light'
                }`}
              >
                {u.full_name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quick edit loan terms */}
      <div className="flex items-center gap-2">
        <input
          type="number"
          placeholder="Rate %"
          defaultValue={deal.interest_rate || ''}
          onBlur={(e) => updateDealField('interest_rate', e.target.value)}
          className="input-base w-20 text-sm py-2"
          step="0.25"
        />
        <input
          type="number"
          placeholder="Months"
          defaultValue={deal.term_months || ''}
          onBlur={(e) => updateDealField('term_months', e.target.value)}
          className="input-base w-20 text-sm py-2"
        />
        <input
          type="number"
          placeholder="Orig %"
          defaultValue={deal.origination_fee || ''}
          onBlur={(e) => updateDealField('origination_fee', e.target.value)}
          className="input-base w-20 text-sm py-2"
          step="0.25"
        />
      </div>
    </div>
  );
}
