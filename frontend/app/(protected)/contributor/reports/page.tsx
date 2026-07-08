import Link from 'next/link';
import { RagBadge } from '@/components/rag-badge';
import { getStatusReportsList, requireRole, requireServerSession } from '@/lib/server-auth';

export default async function ContributorReportHistoryPage() {
  const session = await requireServerSession();
  requireRole(session.user.role, ['CONTRIBUTOR']);

  const { reports } = await getStatusReportsList(session.accessToken, { mine: true });

  return (
    <div className="grid gap-6">
      <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">Contributor reports</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">My report history</h1>
      </section>
      <div className="grid gap-3">
        {reports.map((report) => (
          <article key={report.id} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-300">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <p>
                #{report.id} · {report.project.name} ({report.project.code}) · {report.status} · <RagBadge value={report.rag} />
              </p>
              <Link
                href={`/contributor/reports/${report.id}`}
                className="rounded-full border border-slate-700 px-3 py-1.5 text-xs hover:border-slate-500"
              >
                Open
              </Link>
            </div>
          </article>
        ))}
        {reports.length === 0 ? <p className="text-sm text-slate-400">No reports found.</p> : null}
      </div>
    </div>
  );
}
