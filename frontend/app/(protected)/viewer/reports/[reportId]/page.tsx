import { ReportDetailPanel } from '@/components/report-detail';
import { getStatusReportDetail, requireRole, requireServerSession } from '@/lib/server-auth';

export default async function ViewerReportPage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const session = await requireServerSession();
  requireRole(session.user.role, ['VIEWER']);

  const reportId = Number((await params).reportId);
  const { report } = await getStatusReportDetail(reportId, session.accessToken);

  return (
    <div className="grid gap-6">
      <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-300">Viewer report view</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Granted-project report detail</h1>
      </section>
      <ReportDetailPanel report={report} capabilityLabel="Viewers are read-only and restricted to explicitly granted projects only." />
    </div>
  );
}
