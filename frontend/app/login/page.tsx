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
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center gap-10 px-6 py-10 lg:flex-row lg:items-center">
      <section className="max-w-xl space-y-5">
        <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-sky-200">SRM Platform</p>
        </div>
        <h1 className="text-5xl font-bold leading-tight text-slate-50">
          Status reporting,
          <br />
          <span className="bg-gradient-to-r from-sky-300 via-cyan-300 to-teal-300 bg-clip-text text-transparent">
            secured by role.
          </span>
        </h1>
        <p className="text-base leading-relaxed text-slate-300">
          There is no unauthenticated business-data route in this frontend. Protected App Router pages refresh the session on the server before rendering, and logged-out requests are redirected here before protected content is sent.
        </p>
      </section>
      <div className="w-full max-w-md">
        <LoginForm nextPath={nextPath} />
      </div>
    </div>
  );
}
