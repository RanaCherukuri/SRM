import { ProjectList } from '@/components/project-list';
import { ManagerWorkspacePanels } from '@/components/manager-workspace-panels';
import { getProtectedData, getRiskList, getStatusReportsList, requireRole, requireServerSession } from '@/lib/server-auth';

export default async function ManagerWorkspacePage() {
  const session = await requireServerSession();
  requireRole(session.user.role, ['MANAGER']);

  const [{ projects }, { reports }, { risks }] = await Promise.all([
    getProtectedData('/projects', session.accessToken),
    getStatusReportsList(session.accessToken, { status: 'SUBMITTED' }),
    getRiskList(session.accessToken, { includeResolved: false }),
  ]);

  return (
    <div className="grid gap-6">
      <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">Manager workspace</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Department-scoped project control</h1>
        <p className="mt-3 text-sm text-slate-300">
          This namespace expects manager routes to stay inside the manager&apos;s own department, while still allowing report publish authority inside that scope.
        </p>
      </section>
      <ProjectList projects={projects} basePath="/manager/projects" />
      <ManagerWorkspacePanels submittedReports={reports} risks={risks} />
    </div>
  );
}
