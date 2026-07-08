import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { HttpError } from './errorHandler';
import { verifyAccessToken } from '../utils/jwt';
import { getScopedProjectId, hasProjectAccess } from '../utils/access';

export interface AuthenticatedRequest extends Request {
  user?: {
    sub: number;
    role: UserRole;
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

export function authorize(...allowedRoles: UserRole[]) {
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

    const resourceId = req.params.id ? Number(req.params.id) : undefined;
    if (!resourceId) {
      if (req.user.role === 'VIEWER') {
        return next(new HttpError(403, 'Project grant scope required'));
      }

      if ((req.user.role === 'MANAGER' || req.user.role === 'CONTRIBUTOR') && !req.user.departmentId) {
        return next(new HttpError(403, 'Department scope required'));
      }

      return next();
    }

    const projectId = await getScopedProjectId(resourceType, resourceId);
    if (!projectId) {
      return next(new HttpError(404, 'Resource not found'));
    }

    const allowed = await hasProjectAccess(req.user, projectId);
    if (!allowed) {
      if (req.user.role === 'VIEWER') {
        return next(new HttpError(403, 'Resource outside granted project scope'));
      }

      return next(new HttpError(403, 'Resource outside department scope'));
    }

    return next();
  };
}
