import { Prisma, UserRole } from '@prisma/client';
import { prisma } from '../config/prisma';

export interface AccessUser {
  sub: number;
  role: UserRole;
  departmentId?: number | null;
}

export function getAccessibleProjectWhere(user: AccessUser): Prisma.ProjectWhereInput {
  switch (user.role) {
    case 'ADMIN':
    case 'EXECUTIVE':
      return {};
    case 'MANAGER':
    case 'CONTRIBUTOR':
      return user.departmentId ? { departmentId: user.departmentId } : { id: -1 };
    case 'VIEWER':
      return { viewerGrants: { some: { userId: user.sub } } };
    default:
      return { id: -1 };
  }
}

export async function hasProjectAccess(user: AccessUser, projectId: number) {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      ...getAccessibleProjectWhere(user),
    },
    select: { id: true },
  });

  return Boolean(project);
}

export async function getScopedProjectId(resourceType: 'project' | 'statusReport' | 'risk' | 'department', resourceId: number) {
  if (resourceType === 'project') {
    const project = await prisma.project.findUnique({
      where: { id: resourceId },
      select: { id: true },
    });

    return project?.id ?? null;
  }

  if (resourceType === 'statusReport') {
    const report = await prisma.statusReport.findUnique({
      where: { id: resourceId },
      select: { projectId: true },
    });

    return report?.projectId ?? null;
  }

  if (resourceType === 'risk') {
    const risk = await prisma.risk.findUnique({
      where: { id: resourceId },
      select: { projectId: true },
    });

    return risk?.projectId ?? null;
  }

  return null;
}
