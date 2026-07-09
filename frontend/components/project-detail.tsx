import Link from 'next/link';
import type { ProjectDetail } from '@/lib/types';
import { HealthBadge, RagBadge } from './rag-badge';

export function ProjectDetailPanel({
  project,
  reportBasePath,
}: {
  project: ProjectDetail;
  reportBasePath?: string;
}) {
  return (
    <div className="grid gap-6">
      <section className="surface-card p-6">
        <h2 className="text-2xl font-semibold text-slate-50">
          {project.name} <span className="text-slate-300">({project.code})</span>
        </h2>
        <p className="mt-3 text-sm text-slate-200">
          {project.department.name} · {project.status} · health <HealthBadge value={project.health} />
          {project.isAtRisk ? ' · at risk' : ''}
        </p>
        <p className="mt-3 text-sm text-slate-300">{project.description ?? 'No description yet.'}</p>
        <div className="mt-4 grid gap-2 text-sm text-slate-200 md:grid-cols-2">
          <p>Owner: {project.owner.fullName}</p>
          <p>Viewer grants: {project.viewerGrants.length}</p>
          <p>Planned end: {project.plannedEndDate ? new Date(project.plannedEndDate).toLocaleDateString() : 'N/A'}</p>
          <p>Actual end: {project.actualEndDate ? new Date(project.actualEndDate).toLocaleDateString() : 'N/A'}</p>
        </div>
      </section>

      <section className="surface-card p-6">
        <h3 className="section-title">Status reports</h3>
        <div className="mt-4 grid gap-3">
          {project.statusReports.map((report) => (
            <article key={report.id} className="surface-inset p-4 text-sm text-slate-200">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p>
                    Report #{report.id} · {report.status} · <RagBadge value={report.rag} /> · {report.progressPercentage}%
                  </p>
                  <p className="text-slate-300">Author: {report.createdBy.fullName}</p>
                </div>
                {reportBasePath ? (
                  <Link href={`${reportBasePath}/${report.id}`} className="soft-action px-3 py-1.5">
                    Open report
                  </Link>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="surface-card p-6">
        <h3 className="section-title">Risks</h3>
        <div className="mt-4 grid gap-3">
          {project.risks.map((risk) => (
            <article key={risk.id} className="surface-inset p-4 text-sm text-slate-200">
              <p>{risk.title} · {risk.severity}/{risk.likelihood}{risk.isEscalated ? ' · escalated' : ' · active'}</p>
              <p className="text-slate-300">Owner: {risk.owner.fullName}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="surface-card p-6">
        <h3 className="section-title">Viewer access grants</h3>
        <div className="mt-4 grid gap-2 text-sm text-slate-200">
          {project.viewerGrants.length ? project.viewerGrants.map((grant) => (
            <p key={grant.id}>{grant.fullName} · {grant.email}</p>
          )) : <p className="text-slate-300">No explicit viewer grants.</p>}
        </div>
      </section>
    </div>
  );
}
