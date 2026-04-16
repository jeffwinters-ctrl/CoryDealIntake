'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User, UserRole } from '@/types';
import { ROLE_LABELS } from '@/types';
import { cn } from '@/lib/utils';

export function UserManagement({ users }: { users: User[] }) {
  const router = useRouter();

  async function updateRole(userId: string, role: UserRole) {
    const supabase = createClient();
    await supabase.from('users').update({ role }).eq('id', userId);
    router.refresh();
  }

  async function toggleActive(userId: string, isActive: boolean) {
    const supabase = createClient();
    await supabase.from('users').update({ is_active: !isActive }).eq('id', userId);
    router.refresh();
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-white mb-4">Team Members</h3>
      <p className="text-sm text-slate-500 mb-4">
        To add new team members, create their account in Supabase Auth, then add a row to the users table.
      </p>
      <div className="space-y-3">
        {users.map((user) => (
          <div
            key={user.id}
            className={cn(
              'flex items-center gap-4 p-3 rounded-lg border',
              user.is_active
                ? 'bg-brand-bg border-brand-border'
                : 'bg-brand-bg/50 border-brand-border/50 opacity-60'
            )}
          >
            <div className="w-8 h-8 bg-brand-gold/20 rounded-full flex items-center justify-center shrink-0">
              <span className="text-brand-gold text-xs font-semibold">
                {user.full_name.split(' ').map((n) => n[0]).join('')}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200">{user.full_name}</p>
              <p className="text-xs text-slate-500">{user.email}</p>
            </div>
            <select
              value={user.role}
              onChange={(e) => updateRole(user.id, e.target.value as UserRole)}
              className="input-base w-auto text-sm py-1.5 px-3"
            >
              {Object.entries(ROLE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <button
              onClick={() => toggleActive(user.id, user.is_active)}
              className={cn(
                'text-xs px-3 py-1.5 rounded-lg border transition-colors',
                user.is_active
                  ? 'border-red-500/30 text-red-400 hover:bg-red-500/10'
                  : 'border-green-500/30 text-green-400 hover:bg-green-500/10'
              )}
            >
              {user.is_active ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
