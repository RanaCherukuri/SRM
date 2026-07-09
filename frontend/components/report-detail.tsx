import type { StatusReportDetail } from '@/lib/types';
import { RagBadge } from './rag-badge';

function parseDailySummary(summary: string | null) {
  if (!summary) {
    return null;
  }
  const match = summary.match(
    /^Yesterday:\s*([\s\S]*?)\n\nToday:\s*([\s\S]*?)\n\nTomorrow:\s*([\s\S]*)$/m,
  );
  if (!match) {
    return null;
  }
  return {
    yesterdayWork: match[1].trim(),
    todayWork: match[2].trim(),
    tomorrowWork: match[3].trim(),
  };
}

export function ReportDetailPanel({
  report,
  capabilityLabel,
}: {
  report: StatusReportDetail;
  capabilityLabel: string;
}) {
  const daily = parseDailySummary(report.summary);
  return (
    <div className="grid gap-6">
      <section className="surface-card p-6">
        <h2 className="text-2xl font-semibold text-slate-50">
          Report #{report.id} · {report.status}
        </h2>
        <p className="mt-3 text-sm text-slate-200">
          Project {report.project.name} ({report.project.code}) · {report.project.department.name}
        </p>
        <p className="mt-1 text-sm text-slate-300">Author: {report.createdBy.fullName}</p>
        <p className="surface-inset mt-4 px-4 py-3 text-sm text-slate-200">
          {capabilityLabel}
        </p>
      </section>
      <section className="surface-card p-6 text-sm text-slate-200">
        <div className="grid gap-2 md:grid-cols-2">
          <p>RAG: <RagBadge value={report.rag} /></p>
          <p>Progress: {report.progressPercentage}%</p>
          <p>Due: {new Date(report.dueDate).toLocaleDateString()}</p>
          <p>Submitted: {report.submittedAt ? new Date(report.submittedAt).toLocaleString() : 'Not yet'}</p>
          <p>Published: {report.publishedAt ? new Date(report.publishedAt).toLocaleString() : 'Not yet'}</p>
        </div>
        <div className="mt-4 grid gap-3">
          {daily ? (
            <>
              <p className="surface-inset p-4">Yesterday: {daily.yesterdayWork || 'N/A'}</p>
              <p className="surface-inset p-4">Today: {daily.todayWork || 'N/A'}</p>
              <p className="surface-inset p-4">Tomorrow: {daily.tomorrowWork || 'N/A'}</p>
            </>
          ) : (
            <p className="surface-inset p-4">Summary: {report.summary ?? 'No summary provided.'}</p>
          )}
          <p className="surface-inset p-4">
            Blockers: {report.blockers ?? 'No blockers recorded.'}
          </p>
        </div>
      </section>
    </div>
  );
}
