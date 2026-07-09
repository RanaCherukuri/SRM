import Link from 'next/link';
import type { ProjectSummary } from '@/lib/types';
import { HealthBadge } from './rag-badge';

export function ProjectList({
  projects,
  basePath,
}: {
  projects: ProjectSummary[];
  basePath: string;
}) {
  return (
    <div className="grid gap-4">
      {projects.map((project) => (
        <article key={project.id} className="surface-card surface-card-hover p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-semibold text-slate-50">{project.name}</h3>
                <span className="rounded-md border border-slate-700/60 bg-slate-800/60 px-1.5 py-0.5 font-mono text-xs text-slate-400">
                  {project.code}
                </span>
                <HealthBadge value={project.health} />
                {project.isAtRisk ? (
                  <span className="rounded-full border border-rose-400/40 bg-rose-400/10 px-2 py-0.5 text-[11px] font-bold text-rose-300">
                    AT RISK
                  </span>
                ) : null}
              </div>
              <p className="meta-line mt-2">
                <span>{project.department.name}</span>
                <span className="text-slate-600">•</span>
                <span>{project.status}</span>
                <span className="text-slate-600">•</span>
                <span>Owner: {project.owner.fullName}</span>
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-start gap-3 lg:items-end">
              {project.counts ? (
                <div className="flex gap-4 text-center">
                  <div>
                    <p className="text-base font-bold text-slate-100">{project.counts.statusReports}</p>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Reports</p>
                  </div>
                  <div>
                    <p className="text-base font-bold text-slate-100">{project.counts.risks}</p>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Risks</p>
                  </div>
                  <div>
                    <p className="text-base font-bold text-slate-100">{project.counts.viewerGrants}</p>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Viewers</p>
                  </div>
                </div>
              ) : null}
              <Link href={`${basePath}/${project.id}`} className="soft-action px-4 py-1.5 text-sm">
                Open project →
              </Link>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
