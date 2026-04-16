'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { ChecklistItem, ChecklistStatus, User } from '@/types';
import { cn } from '@/lib/utils';
import {
  CheckCircle, Circle, Loader2 as InProgress, Minus,
  Plus, Trash2, User as UserIcon
} from 'lucide-react';

const STATUS_CONFIG: Record<ChecklistStatus, { label: string; icon: typeof CheckCircle; color: string }> = {
  pending: { label: 'Pending', icon: Circle, color: 'text-slate-500' },
  in_progress: { label: 'In Progress', icon: InProgress, color: 'text-orange-400' },
  completed: { label: 'Completed', icon: CheckCircle, color: 'text-green-400' },
  not_applicable: { label: 'N/A', icon: Minus, color: 'text-slate-600' },
};

export function ChecklistPanel({
  dealId,
  initialItems,
  users,
}: {
  dealId: string;
  initialItems: ChecklistItem[];
  users: User[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('general');

  const categories = [...new Set(items.map((i) => i.category))];
  const completed = items.filter((i) => i.status === 'completed').length;
  const applicable = items.filter((i) => i.status !== 'not_applicable').length;
  const pct = applicable > 0 ? Math.round((completed / applicable) * 100) : 0;

  async function updateStatus(itemId: string, status: ChecklistStatus) {
    const supabase = createClient();
    const updates: Record<string, unknown> = { status };
    if (status === 'completed') updates.completed_at = new Date().toISOString();
    else updates.completed_at = null;

    await supabase.from('checklist_items').update(updates).eq('id', itemId);
    setItems((prev) =>
      prev.map((i) =>
        i.id === itemId ? { ...i, status, completed_at: status === 'completed' ? new Date().toISOString() : null } : i
      )
    );
    router.refresh();
  }

  async function assignItem(itemId: string, userId: string | null) {
    const supabase = createClient();
    await supabase.from('checklist_items').update({ assigned_to: userId }).eq('id', itemId);
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, assigned_to: userId } : i))
    );
  }

  async function addItem() {
    if (!newItemTitle.trim()) return;
    const supabase = createClient();
    const maxOrder = Math.max(...items.map((i) => i.sort_order), 0);

    const { data } = await supabase
      .from('checklist_items')
      .insert({
        deal_id: dealId,
        title: newItemTitle.trim(),
        category: newItemCategory,
        sort_order: maxOrder + 1,
      })
      .select()
      .single();

    if (data) {
      setItems([...items, data as ChecklistItem]);
      setNewItemTitle('');
    }
  }

  async function deleteItem(itemId: string) {
    const supabase = createClient();
    await supabase.from('checklist_items').delete().eq('id', itemId);
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  }

  function cycleStatus(current: ChecklistStatus): ChecklistStatus {
    const order: ChecklistStatus[] = ['pending', 'in_progress', 'completed', 'not_applicable'];
    const idx = order.indexOf(current);
    return order[(idx + 1) % order.length];
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="card flex items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-white">Overall Progress</span>
            <span className="text-sm font-bold text-brand-gold">{pct}%</span>
          </div>
          <div className="w-full h-2.5 bg-brand-border rounded-full">
            <div
              className="h-full bg-brand-gold rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-white">{completed}/{applicable}</p>
          <p className="text-xs text-slate-500">items complete</p>
        </div>
      </div>

      {/* Checklist by Category */}
      {categories.map((cat) => {
        const catItems = items.filter((i) => i.category === cat);
        return (
          <div key={cat} className="card">
            <h3 className="text-base font-semibold text-white mb-3 capitalize">{cat}</h3>
            <div className="space-y-1">
              {catItems.map((item) => {
                const config = STATUS_CONFIG[item.status];
                const StatusIcon = config.icon;
                return (
                  <div
                    key={item.id}
                    className={cn(
                      'flex items-center gap-3 p-2.5 rounded-lg transition-colors hover:bg-brand-bg group',
                      item.status === 'completed' && 'opacity-60'
                    )}
                  >
                    <button
                      onClick={() => updateStatus(item.id, cycleStatus(item.status))}
                      className={cn('shrink-0 transition-colors', config.color)}
                      title={`Status: ${config.label}. Click to change.`}
                    >
                      <StatusIcon className="w-5 h-5" />
                    </button>
                    <span
                      className={cn(
                        'flex-1 text-sm',
                        item.status === 'completed' ? 'text-slate-500 line-through' : 'text-slate-200'
                      )}
                    >
                      {item.title}
                    </span>

                    {/* Assign */}
                    <select
                      value={item.assigned_to || ''}
                      onChange={(e) => assignItem(item.id, e.target.value || null)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity input-base w-auto text-xs py-1 px-2"
                    >
                      <option value="">Unassigned</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>{u.full_name}</option>
                      ))}
                    </select>

                    <button
                      onClick={() => deleteItem(item.id)}
                      className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Add Item */}
      <div className="card">
        <h3 className="text-base font-semibold text-white mb-3">Add Checklist Item</h3>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newItemTitle}
            onChange={(e) => setNewItemTitle(e.target.value)}
            placeholder="New checklist item..."
            className="input-base text-sm"
            onKeyDown={(e) => { if (e.key === 'Enter') addItem(); }}
          />
          <select
            value={newItemCategory}
            onChange={(e) => setNewItemCategory(e.target.value)}
            className="input-base w-auto text-sm"
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
            <option value="custom">Custom</option>
          </select>
          <button onClick={addItem} className="btn-primary px-3 py-3">
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
