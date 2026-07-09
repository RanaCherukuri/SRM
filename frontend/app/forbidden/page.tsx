import Link from 'next/link';

export default function ForbiddenPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center gap-5 px-6 py-10 text-center">
      <div className="hero-card hero-amber flex flex-col items-center gap-4 p-10">
        <p className="eyebrow text-amber-300">403 · Forbidden</p>
        <h1 className="text-4xl font-bold text-slate-50">Access denied</h1>
        <p className="max-w-md text-base leading-relaxed text-slate-300">
          The session is authenticated, but this route is outside the allowed role or scope for the current user.
        </p>
        <Link href="/" className="primary-action px-5 py-2.5 text-sm">
          Back to your workspace
        </Link>
      </div>
    </main>
  );
}
