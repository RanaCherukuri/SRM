export default function ForbiddenPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center gap-4 px-6 py-10">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-300">403</p>
      <h1 className="text-4xl font-semibold text-white">Access denied</h1>
      <p className="text-base text-slate-300">
        The session is authenticated, but this route is outside the allowed role or scope for the current user.
      </p>
    </main>
  );
}
