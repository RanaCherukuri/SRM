import { ProjectList } from '@/components/project-list';
import { ManagerWorkspacePanels } from '@/components/manager-workspace-panels';
import { RagBadge } from '@/components/rag-badge';
import { getProtectedData, getRiskList, getStatusReportsList, requireRole, requireServerSession } from '@/lib/server-auth';

export default async function ManagerWorkspacePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireServerSession();
  requireRole(session.user.role, ['MANAGER']);
  const resolvedSearchParams = await searchParams;
  const createdByIdParam = typeof resolvedSearchParams.createdById === 'string' ? Number(resolvedSearchParams.createdById) : undefined;
  const fromDateParam = typeof resolvedSearchParams.fromDate === 'string' ? resolvedSearchParams.fromDate : undefined;
  const toDateParam = typeof resolvedSearchParams.toDate === 'string' ? resolvedSearchParams.toDate : undefined;

  const [{ projects }, { reports }, { risks }, { reports: lookupReports }, { reports: allReportsForUsers }] = await Promise.all([
    getProtectedData('/projects', session.accessToken),
    getStatusReportsList(session.accessToken, { status: 'SUBMITTED' }),
    getRiskList(session.accessToken, { includeResolved: false }),
    getStatusReportsList(session.accessToken, {
      createdById: Number.isFinite(createdByIdParam) ? createdByIdParam : undefined,
      fromDate: fromDateParam,
      toDate: toDateParam,
    }),
    getStatusReportsList(session.accessToken),
  ]);
  const peopleOptions = Array.from(
    new Map(
      allReportsForUsers.map((report) => [
        report.createdBy.id,
        { id: report.createdBy.id, label: `${report.createdBy.fullName} (${report.createdBy.email})` },
      ]),
    ).values(),
  );

  return (
    <div className="grid gap-6">
      <section className="hero-card hero-emerald p-7">
        <p className="eyebrow text-emerald-300">Manager workspace</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-50">Department-scoped project control</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
          This namespace expects manager routes to stay inside the manager&apos;s own department, while still allowing report publish authority inside that scope.
        </p>
      </section>
      <ProjectList projects={projects} basePath="/manager/projects" />
      <ManagerWorkspacePanels submittedReports={reports} risks={risks} />
      <section className="surface-card p-6">
        <h2 className="section-title">Team status lookup</h2>
        <form className="mt-4 grid gap-3 md:grid-cols-4">
          <label className="field-label">
            Person
            <select
              name="createdById"
              defaultValue={createdByIdParam ? String(createdByIdParam) : ''}
              className="field-input"
            >
              <option value="">All team members</option>
              {peopleOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field-label">
            From date
            <input
              type="date"
              name="fromDate"
              defaultValue={fromDateParam ?? ''}
              className="field-input"
            />
          </label>
          <label className="field-label">
            To date
            <input
              type="date"
              name="toDate"
              defaultValue={toDateParam ?? ''}
              className="field-input"
            />
          </label>
          <div className="flex items-end">
            <button type="submit" className="primary-action px-5 py-2.5 text-sm">
              Apply filter
            </button>
          </div>
        </form>
        <div className="mt-4 grid gap-3">
          {lookupReports.length === 0 ? (
            <p className="text-sm text-slate-300">No reports matched this filter.</p>
          ) : (
            lookupReports.slice(0, 50).map((report) => (
              <article key={report.id} className="surface-inset p-4 text-sm text-slate-200">
                <p>
                  #{report.id} · {report.project.name} ({report.project.code}) · {report.createdBy.fullName} ·{' '}
                  {new Date(report.reportingPeriodStart).toLocaleDateString()} · {report.status} · <RagBadge value={report.rag} />
                </p>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
