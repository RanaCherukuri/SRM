import Link from 'next/link';
import { getProtectedData, requireRole, requireServerSession } from '@/lib/server-auth';
import { HealthBadge } from '@/components/rag-badge';

export default async function ExecutiveDashboardPage() {
  const session = await requireServerSession();
  requireRole(session.user.role, ['EXECUTIVE']);

  const { portfolio } = await getProtectedData('/dashboard/portfolio', session.accessToken);

  return (
    <div className="grid gap-6">
      <section className="surface-card p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-violet-300">Executive dashboard</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-50">Cross-department read-only portfolio</h1>
        <div className="mt-4 grid gap-3 text-sm text-slate-200 md:grid-cols-4">
          <p>Total projects: {portfolio.totals.totalProjects}</p>
          <p>At risk: {portfolio.totals.atRiskProjects}</p>
          <p>Published reports: {portfolio.totals.publishedReports}</p>
          <p>Open risks: {portfolio.totals.openRisks}</p>
        </div>
      </section>
      <section className="surface-card grid gap-4 p-6 lg:grid-cols-2">
        <div>
          <h2 className="text-lg font-semibold text-slate-50">RAG rollup by department</h2>
          <div className="mt-3 grid gap-2 text-sm text-slate-200">
            {portfolio.ragCountsByDepartment?.map((entry) => (
              <p key={entry.department.id}>
                {entry.department.name}: G {entry.green} · A {entry.amber} · R {entry.red} · U {entry.unknown}
              </p>
            ))}
            {!portfolio.ragCountsByDepartment?.length ? <p className="text-slate-300">No department rollup data.</p> : null}
          </div>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-50">Budget variance summary</h2>
          <p className="mt-3 text-sm text-slate-200">
            Portfolio planned: {portfolio.budgetVariance?.plannedTotal.toLocaleString() ?? 0}
          </p>
          <p className="text-sm text-slate-200">
            Portfolio actual: {portfolio.budgetVariance?.actualTotal.toLocaleString() ?? 0}
          </p>
          <p className="text-sm text-slate-200">
            Variance: {portfolio.budgetVariance?.variance.toLocaleString() ?? 0}
          </p>
          <div className="mt-3 grid gap-1 text-xs text-slate-300">
            {portfolio.budgetVariance?.byDepartment.map((entry) => (
              <p key={entry.department.id}>
                {entry.department.code}: {entry.variance.toLocaleString()}
              </p>
            ))}
          </div>
        </div>
      </section>
      <section className="surface-card p-6">
        <h2 className="text-lg font-semibold text-slate-50">Overdue / at-risk projects</h2>
        <div className="mt-3 grid gap-2 text-sm text-slate-200">
          {portfolio.overdueProjects?.map((project) => (
            <p key={project.id}>
              {project.name} ({project.code}) · planned end {project.plannedEndDate ? new Date(project.plannedEndDate).toLocaleDateString() : 'N/A'} · health {project.health}{' '}
              {project.isAtRisk ? '· at risk' : ''}
            </p>
          ))}
          {!portfolio.overdueProjects?.length ? <p className="text-slate-300">No overdue projects right now.</p> : null}
        </div>
      </section>
      <div className="grid gap-4">
        {portfolio.projects.map((project) => (
          <article key={project.id} className="surface-card p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-50">
                  {project.name} <span className="text-slate-300">({project.code})</span>
                </h2>
                <p className="mt-2 text-sm text-slate-200">
                  {project.department.name} · {project.status} · health <HealthBadge value={project.health} />
                  {project.isAtRisk ? ' · at risk' : ''}
                </p>
              </div>
              <Link className="soft-action px-3 py-1.5 text-sm" href={`/executive/projects/${project.id}`}>
                Open read-only project
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
