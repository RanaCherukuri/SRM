import { Router, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/portfolio', authenticate, authorize('ADMIN', 'EXECUTIVE'), async (_req, res: Response, next: NextFunction) => {
  try {
    const [projects, publishedReports, openRisks] = await Promise.all([
      prisma.project.findMany({
        orderBy: [{ departmentId: 'asc' }, { id: 'asc' }],
        select: {
          id: true,
          name: true,
          code: true,
          status: true,
          health: true,
          isAtRisk: true,
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
        },
      }),
      prisma.statusReport.count({ where: { status: 'PUBLISHED' } }),
      prisma.risk.count({ where: { isEscalated: false } }),
    ]);

    res.json({
      portfolio: {
        totals: {
          totalProjects: projects.length,
          atRiskProjects: projects.filter((project) => project.isAtRisk).length,
          publishedReports,
          openRisks,
        },
        projects: projects.map((project) => ({
          id: project.id,
          name: project.name,
          code: project.code,
          status: project.status,
          health: project.health,
          isAtRisk: project.isAtRisk,
          department: project.department,
          owner: {
            id: project.owner.id,
            fullName: `${project.owner.firstName} ${project.owner.lastName}`,
            email: project.owner.email,
          },
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
