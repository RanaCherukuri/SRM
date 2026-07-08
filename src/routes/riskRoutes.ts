import { Router, Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { authenticate, authorize, requireDepartmentScope, AuthenticatedRequest } from '../middleware/auth';
import { HttpError } from '../middleware/errorHandler';
import { createRiskSchema, updateRiskSchema } from '../utils/validation';

const router = Router();

router.post('/:id/risks', authenticate, authorize('CONTRIBUTOR', 'MANAGER'), requireDepartmentScope('project'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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
      void (async () => {
        try {
          console.info(`[notification] Critical risk escalation notification queued for project ${projectId}`);
        } catch (notificationError) {
          console.error('Notification delivery failed after risk creation', notificationError);
        }
      })();
    }

    return res.status(201).json({ result });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return res.status(400).json({ error: error.message });
    }
    return next(error);
  }
});

router.patch('/:id', authenticate, authorize('CONTRIBUTOR', 'MANAGER'), requireDepartmentScope('risk'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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
      void (async () => {
        try {
          console.info(`[notification] Critical risk escalation notification queued for risk ${riskId}`);
        } catch (notificationError) {
          console.error('Notification delivery failed after risk update', notificationError);
        }
      })();
    }

    return res.status(200).json({ result });
  } catch (error) {
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return next(error);
  }
});

export default router;
