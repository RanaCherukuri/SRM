import Link from 'next/link';
import { ProjectList } from '@/components/project-list';
import { getProtectedData, requireRole, requireServerSession } from '@/lib/server-auth';

export default async function AdminDashboardPage() {
  const session = await requireServerSession();
  requireRole(session.user.role, ['ADMIN']);

  const { projects } = await getProtectedData('/projects', session.accessToken);

  return (
    <div className="grid gap-6">
      <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-300">Admin dashboard</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Full system access</h1>
        <p className="mt-3 text-sm text-slate-300">
          Admin routes are the only role namespace with unrestricted access across every department and project.
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-300">
          <Link className="rounded-full border border-slate-700 px-3 py-1.5" href="/executive">
            Open executive namespace
          </Link>
          <Link className="rounded-full border border-slate-700 px-3 py-1.5" href="/manager">
            Open manager namespace
          </Link>
          <Link className="rounded-full border border-slate-700 px-3 py-1.5" href="/contributor">
            Open contributor namespace
          </Link>
          <Link className="rounded-full border border-slate-700 px-3 py-1.5" href="/viewer">
            Open viewer namespace
          </Link>
        </div>
      </section>
      <ProjectList projects={projects} basePath="/admin/projects" />
    </div>
  );
}
