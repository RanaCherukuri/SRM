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
        <article
          key={project.id}
          className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">
                {project.name} <span className="text-slate-400">({project.code})</span>
              </h3>
              <p className="mt-2 text-sm text-slate-300">
                {project.department.name} · {project.status} · health <HealthBadge value={project.health} />
                {project.isAtRisk ? ' · at risk' : ' · stable'}
              </p>
              <p className="mt-1 text-sm text-slate-400">Owner: {project.owner.fullName}</p>
            </div>
            <div className="flex flex-col items-start gap-2 text-sm text-slate-300">
              {project.counts ? (
                <p>
                  Reports {project.counts.statusReports} · Risks {project.counts.risks} · Viewer grants {project.counts.viewerGrants}
                </p>
              ) : null}
              <Link
                href={`${basePath}/${project.id}`}
                className="rounded-full border border-slate-700 px-3 py-1.5 transition hover:border-slate-500"
              >
                Open project
              </Link>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
