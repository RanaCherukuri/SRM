import { ProjectList } from '@/components/project-list';
import { getProtectedData, requireRole, requireServerSession } from '@/lib/server-auth';

export default async function ViewerHomePage() {
  const session = await requireServerSession();
  requireRole(session.user.role, ['VIEWER']);

  const { projects } = await getProtectedData('/projects', session.accessToken);

  return (
    <div className="grid gap-6">
      <section className="hero-card hero-amber p-7">
        <p className="eyebrow text-amber-300">Viewer page</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-50">Read-only granted projects</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
          Viewers do not inherit full department visibility here. The project list comes only from explicit project grants.
        </p>
      </section>
      <ProjectList projects={projects} basePath="/viewer/projects" />
    </div>
  );
}
