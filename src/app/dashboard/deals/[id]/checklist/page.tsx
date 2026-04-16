import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { ArrowLeft } from 'lucide-react';
import { ChecklistPanel } from '@/components/dashboard/ChecklistPanel';
import type { Deal, ChecklistItem, User } from '@/types';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ChecklistPage({ params }: Props) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: deal } = await supabase
    .from('deals')
    .select('*')
    .eq('id', id)
    .single();

  if (!deal) notFound();

  const { data: items } = await supabase
    .from('checklist_items')
    .select('*, assigned_user:users(*)')
    .eq('deal_id', id)
    .order('sort_order');

  const { data: users } = await supabase
    .from('users')
    .select('*')
    .eq('is_active', true);

  return (
    <div>
      <Link
        href={`/dashboard/deals/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-brand-gold transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Deal
      </Link>

      <h1 className="text-2xl font-bold text-white mb-2">Diligence Checklist</h1>
      <p className="text-slate-500 text-sm mb-8">
        {(deal as Deal).reference_number} -- Track due diligence progress
      </p>

      <ChecklistPanel
        dealId={id}
        initialItems={(items as ChecklistItem[]) || []}
        users={(users as User[]) || []}
      />
    </div>
  );
}
