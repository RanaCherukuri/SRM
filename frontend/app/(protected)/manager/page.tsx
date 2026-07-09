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
      <section className="surface-card p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">Manager workspace</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-50">Department-scoped project control</h1>
        <p className="mt-3 text-sm text-slate-200">
          This namespace expects manager routes to stay inside the manager&apos;s own department, while still allowing report publish authority inside that scope.
        </p>
      </section>
      <ProjectList projects={projects} basePath="/manager/projects" />
      <ManagerWorkspacePanels submittedReports={reports} risks={risks} />
      <section className="surface-card p-6">
        <h2 className="text-xl font-semibold text-slate-50">Team status lookup</h2>
        <form className="mt-4 grid gap-3 md:grid-cols-4">
          <label className="grid gap-2 text-sm text-slate-200">
            Person
            <select
              name="createdById"
              defaultValue={createdByIdParam ? String(createdByIdParam) : ''}
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
            >
              <option value="">All team members</option>
              {peopleOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm text-slate-200">
            From date
            <input
              type="date"
              name="fromDate"
              defaultValue={fromDateParam ?? ''}
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
            />
          </label>
          <label className="grid gap-2 text-sm text-slate-200">
            To date
            <input
              type="date"
              name="toDate"
              defaultValue={toDateParam ?? ''}
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
            />
          </label>
          <div className="flex items-end">
            <button
              type="submit"
              className="rounded-full border border-indigo-500/50 bg-indigo-500/20 px-4 py-2 text-sm font-semibold text-indigo-200"
            >
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
