import { AppShell } from '@/components/app-shell';
import { SessionProvider } from '@/components/session-provider';
import { requireServerSession } from '@/lib/server-auth';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireServerSession();

  return (
    <SessionProvider initialUser={session.user}>
      <AppShell user={session.user}>{children}</AppShell>
    </SessionProvider>
  );
}
