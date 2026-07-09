import Link from 'next/link';
import { ProjectList } from '@/components/project-list';
import { RagBadge } from '@/components/rag-badge';
import { getProtectedData, getStatusReportsList, requireRole, requireServerSession } from '@/lib/server-auth';

export default async function ContributorWorkspacePage() {
  const session = await requireServerSession();
  requireRole(session.user.role, ['CONTRIBUTOR']);

  const [{ projects }, { reports }] = await Promise.all([
    getProtectedData('/projects', session.accessToken),
    getStatusReportsList(session.accessToken, { mine: true }),
  ]);

  return (
    <div className="grid gap-6">
      <section className="surface-card p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">Contributor workspace</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-50">Own draft reports and risk logging</h1>
        <p className="mt-3 text-sm text-slate-200">
          Contributor routes are department-scoped at the project level, and report editing stays limited to the contributor&apos;s own draft reports.
        </p>
      </section>
      <ProjectList projects={projects} basePath="/contributor/projects" />
      <section className="surface-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-slate-50">My report history</h2>
          <Link
            href="/contributor/reports"
            className="rounded-full border border-cyan-500/50 bg-cyan-500/20 px-3 py-1.5 text-sm font-semibold text-cyan-200"
          >
            Open full history
          </Link>
        </div>
        <div className="mt-4 grid gap-3">
          {reports.slice(0, 5).map((report) => (
            <article key={report.id} className="surface-inset p-4 text-sm text-slate-200">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <p>
                  #{report.id} · {report.project.code} · {report.status} · <RagBadge value={report.rag} />
                </p>
                <Link
                  href={`/contributor/reports/${report.id}`}
                  className="soft-action px-3 py-1.5 text-xs"
                >
                  Open report
                </Link>
              </div>
            </article>
          ))}
          {reports.length === 0 ? <p className="text-sm text-slate-300">No reports yet.</p> : null}
        </div>
      </section>
    </div>
  );
}
