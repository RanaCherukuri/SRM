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
      <header className="border-b border-slate-700/40 bg-slate-950/55 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link href={getRoleHomePath(user.role)} className="text-xl font-semibold text-slate-50">
              SRM Frontend
            </Link>
            <p className="mt-1 text-sm text-slate-300">
              Signed in as {user.email} · {getRoleLabel(user.role)}
              {user.departmentId ? ` · Department ${user.departmentId}` : ''}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {roleLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="soft-action px-3 py-1.5 text-sm"
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
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10">{children}</main>
    </div>
  );
}
