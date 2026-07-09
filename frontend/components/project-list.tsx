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
          className="surface-card p-5"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-50">
                {project.name} <span className="text-slate-300">({project.code})</span>
              </h3>
              <p className="mt-2 text-sm text-slate-200">
                {project.department.name} · {project.status} · health <HealthBadge value={project.health} />
                {project.isAtRisk ? ' · at risk' : ' · stable'}
              </p>
              <p className="mt-1 text-sm text-slate-300">Owner: {project.owner.fullName}</p>
            </div>
            <div className="flex flex-col items-start gap-2 text-sm text-slate-200">
              {project.counts ? (
                <p>
                  Reports {project.counts.statusReports} · Risks {project.counts.risks} · Viewer grants {project.counts.viewerGrants}
                </p>
              ) : null}
              <Link
                href={`${basePath}/${project.id}`}
                className="soft-action px-3 py-1.5"
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
