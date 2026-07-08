import { ContributorReportCreateForm } from '@/components/contributor-report-create-form';
import { getProjectDetail, requireRole, requireServerSession } from '@/lib/server-auth';

export default async function ContributorNewReportPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const session = await requireServerSession();
  requireRole(session.user.role, ['CONTRIBUTOR']);

  const projectId = Number((await params).projectId);
  const { project } = await getProjectDetail(projectId, session.accessToken);

  return (
    <div className="grid gap-6">
      <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">Contributor report create</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">
          New report for {project.name} ({project.code})
        </h1>
      </section>
      <ContributorReportCreateForm projectId={projectId} />
    </div>
  );
}
