import Link from 'next/link';
import { ProjectList } from '@/components/project-list';
import { getProtectedData, requireRole, requireServerSession } from '@/lib/server-auth';

export default async function AdminDashboardPage() {
  const session = await requireServerSession();
  requireRole(session.user.role, ['ADMIN']);

  const { projects } = await getProtectedData('/projects', session.accessToken);

  return (
    <div className="grid gap-6">
      <section className="hero-card hero-sky p-7">
        <p className="eyebrow text-sky-300">Admin dashboard</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-50">Full system access</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
          Admin routes are the only role namespace with unrestricted access across every department and project.
        </p>
        <div className="mt-5 flex flex-wrap gap-2 text-sm">
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
