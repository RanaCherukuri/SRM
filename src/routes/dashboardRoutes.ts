import { Router, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/portfolio', authenticate, authorize('ADMIN', 'EXECUTIVE'), async (_req, res: Response, next: NextFunction) => {
  try {
    const [projects, publishedReports, openRisks, budgets] = await Promise.all([
      prisma.project.findMany({
        orderBy: [{ departmentId: 'asc' }, { id: 'asc' }],
        select: {
          id: true,
          name: true,
          code: true,
          status: true,
          health: true,
          isAtRisk: true,
          plannedEndDate: true,
          actualEndDate: true,
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
      prisma.risk.count({ where: { resolvedAt: null } }),
      prisma.budget.findMany({
        select: {
          projectId: true,
          plannedAmount: true,
          actualAmount: true,
          year: true,
          quarter: true,
          project: {
            select: {
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
      }),
    ]);

    const departmentRagMap = new Map<number, {
      department: { id: number; name: string; code: string };
      green: number;
      amber: number;
      red: number;
      unknown: number;
    }>();
    for (const project of projects) {
      const existing = departmentRagMap.get(project.department.id) ?? {
        department: project.department,
        green: 0,
        amber: 0,
        red: 0,
        unknown: 0,
      };
      if (project.health === 'GREEN') existing.green += 1;
      else if (project.health === 'AMBER') existing.amber += 1;
      else if (project.health === 'RED') existing.red += 1;
      else existing.unknown += 1;
      departmentRagMap.set(project.department.id, existing);
    }

    const now = new Date();
    const overdueProjects = projects
      .filter((project) => {
        const isTerminal = project.status === 'COMPLETED' || project.status === 'ARCHIVED';
        return Boolean(project.plannedEndDate && project.plannedEndDate < now && !isTerminal);
      })
      .map((project) => ({
        id: project.id,
        name: project.name,
        code: project.code,
        status: project.status,
        health: project.health,
        isAtRisk: project.isAtRisk,
        plannedEndDate: project.plannedEndDate,
        department: project.department,
      }));

    const budgetTotalsByDepartment = new Map<number, {
      department: { id: number; name: string; code: string };
      planned: number;
      actual: number;
    }>();
    let portfolioPlanned = 0;
    let portfolioActual = 0;
    for (const budget of budgets) {
      const planned = Number(budget.plannedAmount);
      const actual = Number(budget.actualAmount);
      portfolioPlanned += planned;
      portfolioActual += actual;

      const dept = budget.project.department;
      const existing = budgetTotalsByDepartment.get(dept.id) ?? {
        department: dept,
        planned: 0,
        actual: 0,
      };
      existing.planned += planned;
      existing.actual += actual;
      budgetTotalsByDepartment.set(dept.id, existing);
    }

    res.json({
      portfolio: {
        totals: {
          totalProjects: projects.length,
          atRiskProjects: projects.filter((project) => project.isAtRisk).length,
          publishedReports,
          openRisks,
        },
        ragCountsByDepartment: Array.from(departmentRagMap.values()),
        overdueProjects,
        budgetVariance: {
          plannedTotal: portfolioPlanned,
          actualTotal: portfolioActual,
          variance: portfolioActual - portfolioPlanned,
          byDepartment: Array.from(budgetTotalsByDepartment.values()).map((entry) => ({
            department: entry.department,
            plannedTotal: entry.planned,
            actualTotal: entry.actual,
            variance: entry.actual - entry.planned,
          })),
        },
        projects: projects.map((project) => ({
          id: project.id,
          name: project.name,
          code: project.code,
          status: project.status,
          health: project.health,
          isAtRisk: project.isAtRisk,
          plannedEndDate: project.plannedEndDate,
          actualEndDate: project.actualEndDate,
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
