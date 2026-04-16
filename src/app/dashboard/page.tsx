import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { KanbanBoard } from '@/components/dashboard/KanbanBoard';
import type { Deal } from '@/types';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();

  const { data: deals } = await admin
    .from('deals')
    .select('*, borrower:borrowers(*), score:deal_scores(*)')
    .order('created_at', { ascending: false });

  const { data: users } = await admin
    .from('users')
    .select('*')
    .eq('is_active', true);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Deal Pipeline</h1>
          <p className="text-slate-500 text-sm mt-1">
            {deals?.length || 0} total deals
          </p>
        </div>
      </div>
      <KanbanBoard
        initialDeals={(deals as Deal[]) || []}
        teamMembers={users || []}
      />
    </div>
  );
}
