import Link from 'next/link';
import { ProjectList } from '@/components/project-list';
import { getProtectedData, requireRole, requireServerSession } from '@/lib/server-auth';

export default async function AdminDashboardPage() {
  const session = await requireServerSession();
  requireRole(session.user.role, ['ADMIN']);

  const { projects } = await getProtectedData('/projects', session.accessToken);

  return (
    <div className="grid gap-6">
      <section className="surface-card p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-300">Admin dashboard</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-50">Full system access</h1>
        <p className="mt-3 text-sm text-slate-200">
          Admin routes are the only role namespace with unrestricted access across every department and project.
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-200">
          <Link className="soft-action px-3 py-1.5" href="/executive">
            Open executive namespace
          </Link>
          <Link className="soft-action px-3 py-1.5" href="/manager">
            Open manager namespace
          </Link>
          <Link className="soft-action px-3 py-1.5" href="/contributor">
            Open contributor namespace
          </Link>
          <Link className="soft-action px-3 py-1.5" href="/viewer">
            Open viewer namespace
          </Link>
        </div>
      </section>
      <ProjectList projects={projects} basePath="/admin/projects" />
    </div>
  );
}
