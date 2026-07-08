import { ProjectList } from '@/components/project-list';
import { getProtectedData, requireRole, requireServerSession } from '@/lib/server-auth';

export default async function ContributorWorkspacePage() {
  const session = await requireServerSession();
  requireRole(session.user.role, ['CONTRIBUTOR']);

  const { projects } = await getProtectedData('/projects', session.accessToken);

  return (
    <div className="grid gap-6">
      <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">Contributor workspace</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Own draft reports and risk logging</h1>
        <p className="mt-3 text-sm text-slate-300">
          Contributor routes are department-scoped at the project level, and report editing stays limited to the contributor&apos;s own draft reports.
        </p>
      </section>
      <ProjectList projects={projects} basePath="/contributor/projects" />
    </div>
  );
}
