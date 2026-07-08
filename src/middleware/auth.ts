import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { HttpError } from './errorHandler';
import { verifyAccessToken } from '../utils/jwt';

export interface AuthenticatedRequest extends Request {
  user?: {
    sub: number;
    role: string;
    departmentId?: number | null;
  };
}

function getTokenFromHeader(req: Request) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return null;
  }

  return header.substring(7);
}

export function authenticate(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  const token = getTokenFromHeader(req);
  if (!token) {
    return next(new HttpError(401, 'Missing bearer token'));
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    return next();
  } catch {
    return next(new HttpError(401, 'Invalid or expired token'));
  }
}

export function authorize(...allowedRoles: string[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new HttpError(401, 'Unauthenticated'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new HttpError(403, 'Forbidden'));
    }

    return next();
  };
}

export function requireDepartmentScope(resourceType: 'project' | 'statusReport' | 'risk' | 'department' = 'department') {
  return async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new HttpError(401, 'Unauthenticated'));
    }

    if (req.user.role === 'ADMIN' || req.user.role === 'EXECUTIVE') {
      return next();
    }

    if (!req.user.departmentId) {
      return next(new HttpError(403, 'Department scope required'));
    }

    const resourceId = req.params.id ? Number(req.params.id) : undefined;
    if (!resourceId) {
      return next();
    }

    let targetDepartmentId: number | null = null;

    if (resourceType === 'project') {
      const project = await prisma.project.findUnique({ where: { id: resourceId }, select: { departmentId: true } });
      targetDepartmentId = project?.departmentId ?? null;
    } else if (resourceType === 'statusReport') {
      const report = await prisma.statusReport.findUnique({
        where: { id: resourceId },
        select: { project: { select: { departmentId: true } } },
      });
      targetDepartmentId = report?.project.departmentId ?? null;
    } else if (resourceType === 'risk') {
      const risk = await prisma.risk.findUnique({
        where: { id: resourceId },
        select: { project: { select: { departmentId: true } } },
      });
      targetDepartmentId = risk?.project.departmentId ?? null;
    }

    if (!targetDepartmentId) {
      return next(new HttpError(404, 'Resource not found'));
    }

    if (targetDepartmentId !== req.user.departmentId) {
      return next(new HttpError(403, 'Resource outside department scope'));
    }

    return next();
  };
}
