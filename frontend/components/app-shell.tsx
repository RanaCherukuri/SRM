'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getRoleHomePath, getRoleLabel } from '@/lib/routes';
import type { SessionUser } from '@/lib/types';
import { LogoutButton } from './logout-button';
import { NotificationMenu } from './notification-menu';
import { SessionStatus } from './session-status';

const roleLinks = [
  { href: '/admin', label: 'Admin' },
  { href: '/executive', label: 'Executive' },
  { href: '/manager', label: 'Manager' },
  { href: '/contributor', label: 'Contributor' },
  { href: '/viewer', label: 'Viewer' },
];

const roleAccent: Record<string, string> = {
  ADMIN: 'from-sky-400 to-blue-500',
  EXECUTIVE: 'from-violet-400 to-purple-500',
  MANAGER: 'from-emerald-400 to-teal-500',
  CONTRIBUTOR: 'from-cyan-400 to-sky-500',
  VIEWER: 'from-amber-400 to-orange-500',
};

export function AppShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: SessionUser;
}) {
  const pathname = usePathname();
  const initials = user.email.slice(0, 2).toUpperCase();
  const accent = roleAccent[user.role] ?? roleAccent.VIEWER;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-slate-700/30 bg-[#070b14]/70 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${accent} text-sm font-bold text-slate-950 shadow-lg`}
            >
              {initials}
            </div>
            <div>
              <Link
                href={getRoleHomePath(user.role)}
                className="text-lg font-bold tracking-tight text-slate-50 transition hover:text-sky-300"
              >
                SRM<span className="text-sky-400">.</span>
              </Link>
              <p className="text-xs text-slate-400">
                {user.email} · <span className="font-semibold text-slate-300">{getRoleLabel(user.role)}</span>
                {user.departmentId ? ` · Dept ${user.departmentId}` : ''}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <nav className="flex flex-wrap items-center gap-1 rounded-full border border-slate-700/40 bg-slate-900/50 p-1">
              {roleLinks.map((link) => {
                const active = pathname?.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                      active
                        ? 'bg-sky-400/15 text-sky-200 shadow-[0_0_12px_rgba(56,189,248,0.15)]'
                        : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
            <NotificationMenu />
            <SessionStatus />
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10">{children}</main>
    </div>
  );
}
