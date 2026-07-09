import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/login-form';
import { getRoleHomePath } from '@/lib/routes';
import { tryGetServerSession } from '@/lib/server-auth';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await tryGetServerSession();
  if (session) {
    redirect(getRoleHomePath(session.user.role));
  }

  const resolvedSearchParams = await searchParams;
  const nextPath = typeof resolvedSearchParams.next === 'string' ? resolvedSearchParams.next : undefined;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center gap-8 px-6 py-10 lg:flex-row lg:items-center">
      <section className="max-w-xl space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-sky-200">SRM</p>
        <h1 className="text-4xl font-semibold text-slate-50">Secure status reporting frontend</h1>
        <p className="text-base text-slate-200/90">
          There is no unauthenticated business-data route in this frontend. Protected App Router pages refresh the session on the server before rendering, and logged-out requests are redirected here before protected content is sent.
        </p>
      </section>
      <div className="w-full max-w-md">
        <LoginForm nextPath={nextPath} />
      </div>
    </div>
  );
}
