import type { StatusReportDetail } from '@/lib/types';

export function ReportDetailPanel({
  report,
  capabilityLabel,
}: {
  report: StatusReportDetail;
  capabilityLabel: string;
}) {
  return (
    <div className="grid gap-6">
      <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
        <h2 className="text-2xl font-semibold text-white">
          Report #{report.id} · {report.status}
        </h2>
        <p className="mt-3 text-sm text-slate-300">
          Project {report.project.name} ({report.project.code}) · {report.project.department.name}
        </p>
        <p className="mt-1 text-sm text-slate-400">Author: {report.createdBy.fullName}</p>
        <p className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm text-slate-300">
          {capabilityLabel}
        </p>
      </section>
      <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 text-sm text-slate-300">
        <div className="grid gap-2 md:grid-cols-2">
          <p>RAG: {report.rag}</p>
          <p>Progress: {report.progressPercentage}%</p>
          <p>Due: {new Date(report.dueDate).toLocaleDateString()}</p>
          <p>Submitted: {report.submittedAt ? new Date(report.submittedAt).toLocaleString() : 'Not yet'}</p>
          <p>Published: {report.publishedAt ? new Date(report.publishedAt).toLocaleString() : 'Not yet'}</p>
        </div>
        <div className="mt-4 grid gap-3">
          <p className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
            Summary: {report.summary ?? 'No summary provided.'}
          </p>
          <p className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
            Blockers: {report.blockers ?? 'No blockers recorded.'}
          </p>
        </div>
      </section>
    </div>
  );
}
