import Link from 'next/link';
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

export function AppShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: SessionUser;
}) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link href={getRoleHomePath(user.role)} className="text-lg font-semibold text-white">
              SRM Frontend
            </Link>
            <p className="text-sm text-slate-400">
              Signed in as {user.email} · {getRoleLabel(user.role)}
              {user.departmentId ? ` · Department ${user.departmentId}` : ''}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {roleLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full border border-slate-800 px-3 py-1.5 text-sm text-slate-300 transition hover:border-slate-600 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
            <NotificationMenu />
            <SessionStatus />
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8">{children}</main>
    </div>
  );
}
