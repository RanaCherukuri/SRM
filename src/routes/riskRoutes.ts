import { Router, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { authenticate, authorize, requireDepartmentScope, AuthenticatedRequest } from '../middleware/auth';
import { HttpError } from '../middleware/errorHandler';
import { createRiskSchema, updateRiskSchema } from '../utils/validation';
import { getAccessibleProjectWhere } from '../utils/access';
import { notifyAdminsAndExecs } from '../utils/notifications';

const router = Router();

router.get('/risks', authenticate, authorize('ADMIN', 'EXECUTIVE', 'MANAGER', 'CONTRIBUTOR', 'VIEWER'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new HttpError(401, 'Unauthenticated');
    }

    const projectId = typeof req.query.projectId === 'string' ? Number(req.query.projectId) : undefined;
    const includeResolved = req.query.includeResolved === 'true';
    const mine = req.query.mine === 'true';

    const risks = await prisma.risk.findMany({
      where: {
        ...(projectId ? { projectId } : {}),
        ...(mine ? { ownerId: req.user.sub } : {}),
        ...(includeResolved ? {} : { resolvedAt: null }),
        project: getAccessibleProjectWhere(req.user),
      },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      select: {
        id: true,
        projectId: true,
        title: true,
        description: true,
        severity: true,
        likelihood: true,
        mitigationPlan: true,
        ownerId: true,
        isEscalated: true,
        resolvedAt: true,
        createdAt: true,
        updatedAt: true,
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            code: true,
            department: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
      },
    });

    return res.status(200).json({
      risks: risks.map((risk) => ({
        id: risk.id,
        projectId: risk.projectId,
        title: risk.title,
        description: risk.description,
        severity: risk.severity,
        likelihood: risk.likelihood,
        mitigationPlan: risk.mitigationPlan,
        ownerId: risk.ownerId,
        isEscalated: risk.isEscalated,
        resolvedAt: risk.resolvedAt,
        createdAt: risk.createdAt,
        updatedAt: risk.updatedAt,
        owner: {
          id: risk.owner.id,
          fullName: `${risk.owner.firstName} ${risk.owner.lastName}`,
          email: risk.owner.email,
        },
        project: risk.project,
      })),
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/projects/:id/risks', authenticate, authorize('CONTRIBUTOR', 'MANAGER'), requireDepartmentScope('project'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const parsed = createRiskSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const projectId = Number(req.params.id);
    const ownerId = req.user?.sub;
    if (!ownerId) {
      throw new HttpError(401, 'Unauthenticated');
    }

    const severity = (parsed.data.severity ?? 'MEDIUM') as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    const shouldEscalate = severity === 'CRITICAL';

    const result = await prisma.$transaction(async (tx) => {
      const risk = await tx.risk.create({
        data: {
          projectId,
          title: parsed.data.title,
          description: parsed.data.description,
          severity,
          likelihood: (parsed.data.likelihood ?? 'MEDIUM') as 'LOW' | 'MEDIUM' | 'HIGH',
          mitigationPlan: parsed.data.mitigationPlan,
          ownerId,
          isEscalated: shouldEscalate,
        },
      });

      if (shouldEscalate) {
        await tx.project.update({
          where: { id: projectId },
          data: { isAtRisk: true },
        });
      }

      return { risk, escalated: shouldEscalate };
    });

    if (result.escalated) {
      notifyAdminsAndExecs('CRITICAL_RISK_ESCALATED', {
        riskId: result.risk.id,
        projectId: result.risk.projectId,
        title: result.risk.title,
      });
    }

    return res.status(201).json({ result });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return res.status(400).json({ error: error.message });
    }
    return next(error);
  }
});

router.patch('/risks/:id', authenticate, authorize('CONTRIBUTOR', 'MANAGER'), requireDepartmentScope('risk'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const parsed = updateRiskSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const riskId = Number(req.params.id);
    const result = await prisma.$transaction(async (tx) => {
      const current = await tx.risk.findUnique({ where: { id: riskId } });
      if (!current) {
        throw new HttpError(404, 'Risk not found');
      }

      const severity = parsed.data.severity ? (parsed.data.severity as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL') : current.severity;
      const shouldEscalate = severity === 'CRITICAL';

      const updated = await tx.risk.update({
        where: { id: riskId },
        data: {
          title: parsed.data.title ?? current.title,
          description: parsed.data.description ?? current.description,
          severity,
          likelihood: parsed.data.likelihood ? (parsed.data.likelihood as 'LOW' | 'MEDIUM' | 'HIGH') : current.likelihood,
          mitigationPlan: parsed.data.mitigationPlan ?? current.mitigationPlan,
          ownerId: parsed.data.ownerId ?? current.ownerId,
          isEscalated: shouldEscalate,
        },
      });
      if (shouldEscalate) {
        await tx.project.update({
          where: { id: current.projectId },
          data: { isAtRisk: true },
        });
      }

      return { risk: updated, escalated: shouldEscalate };
    });

    if (result.escalated) {
      notifyAdminsAndExecs('CRITICAL_RISK_ESCALATED', {
        riskId: result.risk.id,
        projectId: result.risk.projectId,
        title: result.risk.title,
      });
    }

    return res.status(200).json({ result });
  } catch (error) {
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return next(error);
  }
});

router.patch('/risks/:id/resolve', authenticate, authorize('MANAGER'), requireDepartmentScope('risk'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new HttpError(401, 'Unauthenticated');
    }

    const riskId = Number(req.params.id);

    const result = await prisma.$transaction(async (tx) => {
      const risk = await tx.risk.findUnique({ where: { id: riskId } });
      if (!risk) {
        throw new HttpError(404, 'Risk not found');
      }
      if (risk.resolvedAt) {
        throw new HttpError(409, 'Risk is already resolved');
      }

      const resolvedRisk = await tx.risk.update({
        where: { id: riskId },
        data: { resolvedAt: new Date(), isEscalated: false },
      });

      // Re-evaluate project isAtRisk: clear only if no other unresolved CRITICAL risks remain
      const unresolvedCriticalCount = await tx.risk.count({
        where: {
          projectId: risk.projectId,
          severity: 'CRITICAL',
          resolvedAt: null,
          id: { not: riskId },
        },
      });

      let project = null;
      if (unresolvedCriticalCount === 0) {
        project = await tx.project.update({
          where: { id: risk.projectId },
          data: { isAtRisk: false },
          select: { id: true, isAtRisk: true },
        });
      } else {
        project = await tx.project.findUnique({
          where: { id: risk.projectId },
          select: { id: true, isAtRisk: true },
        });
      }

      return { risk: resolvedRisk, project, remainingUnresolvedCritical: unresolvedCriticalCount };
    });

    return res.status(200).json({ result });
  } catch (error) {
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return next(error);
  }
});

export default router;
