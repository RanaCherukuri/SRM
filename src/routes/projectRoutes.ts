import { Router, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { authenticate, authorize, AuthenticatedRequest, requireDepartmentScope } from '../middleware/auth';
import { HttpError } from '../middleware/errorHandler';
import { getAccessibleProjectWhere, hasProjectAccess } from '../utils/access';

const router = Router();

router.get('/', authenticate, authorize('ADMIN', 'EXECUTIVE', 'MANAGER', 'CONTRIBUTOR', 'VIEWER'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new HttpError(401, 'Unauthenticated');
    }

    const projects = await prisma.project.findMany({
      where: getAccessibleProjectWhere(req.user),
      orderBy: [{ departmentId: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        name: true,
        code: true,
        status: true,
        health: true,
        isAtRisk: true,
        updatedAt: true,
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            statusReports: true,
            risks: true,
            viewerGrants: true,
          },
        },
      },
    });

    res.json({
      projects: projects.map((project) => ({
        id: project.id,
        name: project.name,
        code: project.code,
        status: project.status,
        health: project.health,
        isAtRisk: project.isAtRisk,
        updatedAt: project.updatedAt,
        department: project.department,
        owner: {
          id: project.owner.id,
          fullName: `${project.owner.firstName} ${project.owner.lastName}`,
          email: project.owner.email,
        },
        counts: project._count,
      })),
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', authenticate, authorize('ADMIN', 'EXECUTIVE', 'MANAGER', 'CONTRIBUTOR', 'VIEWER'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new HttpError(401, 'Unauthenticated');
    }

    const projectId = Number(req.params.id);
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        code: true,
        description: true,
        status: true,
        health: true,
        isAtRisk: true,
        plannedStartDate: true,
        actualStartDate: true,
        plannedEndDate: true,
        actualEndDate: true,
        updatedAt: true,
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        statusReports: {
          orderBy: [{ reportingPeriodEnd: 'desc' }, { id: 'desc' }],
          select: {
            id: true,
            status: true,
            rag: true,
            progressPercentage: true,
            reportingPeriodStart: true,
            reportingPeriodEnd: true,
            dueDate: true,
            submittedAt: true,
            publishedAt: true,
            createdBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        risks: {
          orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
          select: {
            id: true,
            title: true,
            severity: true,
            likelihood: true,
            isEscalated: true,
            updatedAt: true,
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        viewerGrants: {
          orderBy: [{ userId: 'asc' }],
          select: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!project) {
      throw new HttpError(404, 'Project not found');
    }

    const allowed = await hasProjectAccess(req.user, projectId);
    if (!allowed) {
      if (req.user.role === 'VIEWER') {
        throw new HttpError(403, 'Project outside granted project scope');
      }

      throw new HttpError(403, 'Project outside department scope');
    }

    res.json({
      project: {
        id: project.id,
        name: project.name,
        code: project.code,
        description: project.description,
        status: project.status,
        health: project.health,
        isAtRisk: project.isAtRisk,
        plannedStartDate: project.plannedStartDate,
        actualStartDate: project.actualStartDate,
        plannedEndDate: project.plannedEndDate,
        actualEndDate: project.actualEndDate,
        updatedAt: project.updatedAt,
        department: project.department,
        owner: {
          id: project.owner.id,
          fullName: `${project.owner.firstName} ${project.owner.lastName}`,
          email: project.owner.email,
        },
        statusReports: project.statusReports.map((report) => ({
          id: report.id,
          status: report.status,
          rag: report.rag,
          progressPercentage: report.progressPercentage,
          reportingPeriodStart: report.reportingPeriodStart,
          reportingPeriodEnd: report.reportingPeriodEnd,
          dueDate: report.dueDate,
          submittedAt: report.submittedAt,
          publishedAt: report.publishedAt,
          createdBy: {
            id: report.createdBy.id,
            fullName: `${report.createdBy.firstName} ${report.createdBy.lastName}`,
            email: report.createdBy.email,
          },
        })),
        risks: project.risks.map((risk) => ({
          id: risk.id,
          title: risk.title,
          severity: risk.severity,
          likelihood: risk.likelihood,
          isEscalated: risk.isEscalated,
          updatedAt: risk.updatedAt,
          owner: {
            id: risk.owner.id,
            fullName: `${risk.owner.firstName} ${risk.owner.lastName}`,
            email: risk.owner.email,
          },
        })),
        viewerGrants: project.viewerGrants.map((grant) => ({
          id: grant.user.id,
          fullName: `${grant.user.firstName} ${grant.user.lastName}`,
          email: grant.user.email,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticate, authorize('ADMIN', 'MANAGER'), requireDepartmentScope(), (_req: AuthenticatedRequest, res: Response) => {
  res.status(201).json({ message: 'Project create placeholder' });
});

export default router;
