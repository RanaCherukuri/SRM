import { redirect } from 'next/navigation';
import { ContributorReportEditor } from '@/components/contributor-report-editor';
import { ReportDetailPanel } from '@/components/report-detail';
import { getStatusReportDetail, requireRole, requireServerSession } from '@/lib/server-auth';

export default async function ContributorReportPage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const session = await requireServerSession();
  requireRole(session.user.role, ['CONTRIBUTOR']);

  const reportId = Number((await params).reportId);
  const { report } = await getStatusReportDetail(reportId, session.accessToken);

  if (session.user.role === 'CONTRIBUTOR' && report.createdBy.id !== session.user.id) {
    redirect('/forbidden');
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">Contributor report view</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Own-report draft workflow</h1>
      </section>
      <ReportDetailPanel
        report={report}
        capabilityLabel="Contributors can edit and submit only the reports they authored. This route redirects to /forbidden for someone else’s report."
      />
      <ContributorReportEditor report={report} />
    </div>
  );
}
