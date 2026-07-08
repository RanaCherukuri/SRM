import Link from 'next/link';
import { getProtectedData, requireRole, requireServerSession } from '@/lib/server-auth';
import { HealthBadge } from '@/components/rag-badge';

export default async function ExecutiveDashboardPage() {
  const session = await requireServerSession();
  requireRole(session.user.role, ['EXECUTIVE']);

  const { portfolio } = await getProtectedData('/dashboard/portfolio', session.accessToken);

  return (
    <div className="grid gap-6">
      <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-violet-300">Executive dashboard</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Cross-department read-only portfolio</h1>
        <div className="mt-4 grid gap-3 text-sm text-slate-300 md:grid-cols-4">
          <p>Total projects: {portfolio.totals.totalProjects}</p>
          <p>At risk: {portfolio.totals.atRiskProjects}</p>
          <p>Published reports: {portfolio.totals.publishedReports}</p>
          <p>Open risks: {portfolio.totals.openRisks}</p>
        </div>
      </section>
      <div className="grid gap-4">
        {portfolio.projects.map((project) => (
          <article key={project.id} className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  {project.name} <span className="text-slate-400">({project.code})</span>
                </h2>
                <p className="mt-2 text-sm text-slate-300">
                  {project.department.name} · {project.status} · health <HealthBadge value={project.health} />
                  {project.isAtRisk ? ' · at risk' : ''}
                </p>
              </div>
              <Link className="rounded-full border border-slate-700 px-3 py-1.5 text-sm" href={`/executive/projects/${project.id}`}>
                Open read-only project
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
