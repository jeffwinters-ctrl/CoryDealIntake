import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { User } from '@/types';
import { ROLE_LABELS } from '@/types';
import { UserManagement } from '@/components/dashboard/UserManagement';

export default async function SettingsPage() {
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: currentUser } = await supabase.auth.getUser();
  const { data: profile } = await admin
    .from('users')
    .select('*')
    .eq('id', currentUser?.user?.id)
    .single();

  const { data: allUsers } = await admin
    .from('users')
    .select('*')
    .order('created_at');

  const isPartner = (profile as User)?.role === 'partner';

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-8">Settings</h1>

      {/* Current User */}
      <div className="card mb-8">
        <h3 className="text-lg font-semibold text-white mb-4">Your Profile</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-slate-500">Name</span>
            <p className="text-slate-200">{(profile as User)?.full_name}</p>
          </div>
          <div>
            <span className="text-slate-500">Email</span>
            <p className="text-slate-200">{(profile as User)?.email}</p>
          </div>
          <div>
            <span className="text-slate-500">Role</span>
            <p className="text-slate-200">{ROLE_LABELS[(profile as User)?.role]}</p>
          </div>
        </div>
      </div>

      {/* Team Management (partner only) */}
      {isPartner && (
        <UserManagement users={(allUsers as User[]) || []} />
      )}

      {!isPartner && (
        <div className="card text-center py-8 text-slate-500">
          Team management is available to Partners only.
        </div>
      )}
    </div>
  );
}
