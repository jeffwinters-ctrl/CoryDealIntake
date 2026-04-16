'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Settings, LogOut, FolderOpen } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@/types';
import { ROLE_LABELS } from '@/types';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Pipeline', icon: LayoutDashboard },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ user }: { user: User | null }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-brand-surface border-r border-brand-border flex flex-col z-50">
      {/* Logo */}
      <div className="p-6 border-b border-brand-border">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-gold rounded-lg flex items-center justify-center">
            <span className="text-brand-bg font-bold text-sm">VC</span>
          </div>
          <div>
            <span className="text-base font-semibold text-white block leading-tight">Visionary Capital</span>
            <span className="text-xs text-slate-500">Deal Management</span>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-gold/10 text-brand-gold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-brand-surface-light'
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}

        {/* Active deal link (shown when on a deal page) */}
        {pathname.includes('/deals/') && (
          <div className="pt-2 mt-2 border-t border-brand-border">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium bg-brand-gold/10 text-brand-gold">
              <FolderOpen className="w-5 h-5" />
              Deal Detail
            </div>
          </div>
        )}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-brand-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-brand-gold/20 rounded-full flex items-center justify-center">
            <span className="text-brand-gold text-xs font-semibold">
              {user?.full_name?.split(' ').map((n) => n[0]).join('') || '?'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">
              {user?.full_name || 'Team Member'}
            </p>
            <p className="text-xs text-slate-500">
              {user?.role ? ROLE_LABELS[user.role] : 'User'}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-red-400 transition-colors w-full px-1"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </aside>
  );
}
