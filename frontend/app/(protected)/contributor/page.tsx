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
      <section className="hero-card hero-cyan p-7">
        <p className="eyebrow text-cyan-300">Contributor workspace</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-50">Own draft reports and risk logging</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
          Contributor routes are department-scoped at the project level, and report editing stays limited to the contributor&apos;s own draft reports.
        </p>
      </section>
      <ProjectList projects={projects} basePath="/contributor/projects" />
      <section className="surface-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="section-title">My report history</h2>
          <Link href="/contributor/reports" className="primary-action px-4 py-2 text-sm">
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
