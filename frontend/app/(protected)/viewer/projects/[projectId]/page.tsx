import { ProjectDetailPanel } from '@/components/project-detail';
import { getProjectDetail, requireRole, requireServerSession } from '@/lib/server-auth';

export default async function ViewerProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const session = await requireServerSession();
  requireRole(session.user.role, ['VIEWER']);

  const projectId = Number((await params).projectId);
  const { project } = await getProjectDetail(projectId, session.accessToken);

  return (
    <div className="grid gap-6">
      <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-300">Viewer project view</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Granted-project read-only detail</h1>
      </section>
      <ProjectDetailPanel project={project} reportBasePath="/viewer/reports" />
    </div>
  );
}
