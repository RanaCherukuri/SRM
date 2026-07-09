import { Router, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { authenticate, authorize, requireDepartmentScope, AuthenticatedRequest } from '../middleware/auth';
import { HttpError } from '../middleware/errorHandler';
import { createStatusReportSchema, publishStatusReportSchema, updateStatusReportSchema, computeLocalDayEndUtc, computeReportingPeriod } from '../utils/validation';
import { getAccessibleProjectWhere, hasProjectAccess } from '../utils/access';
import { notifyAdminsAndExecs } from '../utils/notifications';

const router = Router();

function formatDailySummary(yesterdayWork: string, todayWork: string, tomorrowWork: string) {
  return [
    `Yesterday: ${yesterdayWork}`,
    `Today: ${todayWork}`,
    `Tomorrow: ${tomorrowWork}`,
  ].join('\n\n');
}

function parseDailySummary(summary: string | null | undefined) {
  if (!summary) {
    return {
      yesterdayWork: '',
      todayWork: '',
      tomorrowWork: '',
    };
  }

  const match = summary.match(
    /^Yesterday:\s*([\s\S]*?)\n\nToday:\s*([\s\S]*?)\n\nTomorrow:\s*([\s\S]*)$/m,
  );

  if (!match) {
    return {
      yesterdayWork: summary,
      todayWork: '',
      tomorrowWork: '',
    };
  }

  return {
    yesterdayWork: match[1].trim(),
    todayWork: match[2].trim(),
    tomorrowWork: match[3].trim(),
  };
}

router.post('/projects/:id/status-reports', authenticate, authorize('CONTRIBUTOR', 'MANAGER'), requireDepartmentScope('project'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const parsed = createStatusReportSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const projectId = Number(req.params.id);
    const userId = req.user?.sub;
    if (!userId) {
      throw new HttpError(401, 'Unauthenticated');
    }

    const { reportingPeriodStart, reportingPeriodEnd } = computeReportingPeriod(parsed.data.reportDate);
    const sameUserSameDay = await prisma.statusReport.findFirst({
      where: {
        projectId,
        createdById: userId,
        reportingPeriodStart: {
          gte: reportingPeriodStart,
          lte: reportingPeriodEnd,
        },
      },
      select: { id: true },
    });
    if (sameUserSameDay) {
      return res.status(409).json({ error: 'You already created a daily report for this project/date' });
    }

    const reportsForProjectDay = await prisma.statusReport.count({
      where: {
        projectId,
        reportingPeriodStart: {
          gte: reportingPeriodStart,
          lte: reportingPeriodEnd,
        },
      },
    });
    const periodOffsetMs = reportsForProjectDay;
    const uniquePeriodStart = new Date(reportingPeriodStart.getTime() + periodOffsetMs);
    const uniquePeriodEnd = new Date(reportingPeriodEnd.getTime() + periodOffsetMs);
    const editableUntil = computeLocalDayEndUtc(
      parsed.data.reportDate,
      parsed.data.clientTimezoneOffsetMinutes,
    );

    const report = await prisma.statusReport.create({
      data: {
        projectId,
        createdById: userId,
        reportingPeriodStart: uniquePeriodStart,
        reportingPeriodEnd: uniquePeriodEnd,
        dueDate: editableUntil,
        status: 'DRAFT',
        rag: (parsed.data.rag ?? 'AMBER') as 'GREEN' | 'AMBER' | 'RED',
        progressPercentage: parsed.data.progressPercentage ?? 0,
        summary: formatDailySummary(
          parsed.data.yesterdayWork,
          parsed.data.todayWork,
          parsed.data.tomorrowWork,
        ),
        blockers: parsed.data.blockers,
      },
    });

    return res.status(201).json({ report });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(409).json({ error: 'A daily report for this project/date already exists' });
    }
    return next(error);
  }
});

router.get('/status-reports', authenticate, authorize('ADMIN', 'EXECUTIVE', 'MANAGER', 'CONTRIBUTOR', 'VIEWER'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new HttpError(401, 'Unauthenticated');
    }

    const mine = req.query.mine === 'true';
    const status = typeof req.query.status === 'string' ? req.query.status.toUpperCase() : undefined;
    const projectId = typeof req.query.projectId === 'string' ? Number(req.query.projectId) : undefined;
    const createdByIdRaw = typeof req.query.createdById === 'string' ? Number(req.query.createdById) : undefined;
    const createdById = Number.isFinite(createdByIdRaw) ? createdByIdRaw : undefined;
    const fromDateRaw = typeof req.query.fromDate === 'string' && req.query.fromDate ? new Date(req.query.fromDate) : undefined;
    const toDateRaw = typeof req.query.toDate === 'string' && req.query.toDate ? new Date(req.query.toDate) : undefined;
    const fromDate = fromDateRaw && !Number.isNaN(fromDateRaw.getTime()) ? fromDateRaw : undefined;
    const toDate = toDateRaw && !Number.isNaN(toDateRaw.getTime()) ? toDateRaw : undefined;

    const reports = await prisma.statusReport.findMany({
      where: {
        ...(mine ? { createdById: req.user.sub } : {}),
        ...(status && ['DRAFT', 'SUBMITTED', 'PUBLISHED'].includes(status) ? { status: status as 'DRAFT' | 'SUBMITTED' | 'PUBLISHED' } : {}),
        ...(projectId ? { projectId } : {}),
        ...(createdById ? { createdById } : {}),
        ...((fromDate || toDate)
          ? {
              reportingPeriodStart: {
                ...(fromDate ? { gte: fromDate } : {}),
                ...(toDate ? { lte: toDate } : {}),
              },
            }
          : {}),
        project: getAccessibleProjectWhere(req.user),
      },
      orderBy: [{ reportingPeriodEnd: 'desc' }, { id: 'desc' }],
      select: {
        id: true,
        projectId: true,
        status: true,
        rag: true,
        progressPercentage: true,
        reportingPeriodStart: true,
        reportingPeriodEnd: true,
        dueDate: true,
        submittedAt: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
        createdBy: {
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
      reports: reports.map((report) => ({
        id: report.id,
        projectId: report.projectId,
        status: report.status,
        rag: report.rag,
        progressPercentage: report.progressPercentage,
        reportingPeriodStart: report.reportingPeriodStart,
        reportingPeriodEnd: report.reportingPeriodEnd,
        dueDate: report.dueDate,
        submittedAt: report.submittedAt,
        publishedAt: report.publishedAt,
        createdAt: report.createdAt,
        updatedAt: report.updatedAt,
        createdBy: {
          id: report.createdBy.id,
          fullName: `${report.createdBy.firstName} ${report.createdBy.lastName}`,
          email: report.createdBy.email,
        },
        project: report.project,
      })),
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/status-reports/:id', authenticate, authorize('ADMIN', 'EXECUTIVE', 'MANAGER', 'CONTRIBUTOR', 'VIEWER'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new HttpError(401, 'Unauthenticated');
    }

    const reportId = Number(req.params.id);
    const report = await prisma.statusReport.findUnique({
      where: { id: reportId },
      select: {
        id: true,
        projectId: true,
        status: true,
        rag: true,
        progressPercentage: true,
        summary: true,
        blockers: true,
        reportingPeriodStart: true,
        reportingPeriodEnd: true,
        dueDate: true,
        submittedAt: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
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

    if (!report) {
      throw new HttpError(404, 'Status report not found');
    }

    const allowed = await hasProjectAccess(req.user, report.projectId);
    if (!allowed) {
      if (req.user.role === 'VIEWER') {
        throw new HttpError(403, 'Report outside granted project scope');
      }

      throw new HttpError(403, 'Report outside department scope');
    }

    return res.status(200).json({
      report: {
        id: report.id,
        projectId: report.projectId,
        status: report.status,
        rag: report.rag,
        progressPercentage: report.progressPercentage,
        summary: report.summary,
        blockers: report.blockers,
        reportingPeriodStart: report.reportingPeriodStart,
        reportingPeriodEnd: report.reportingPeriodEnd,
        dueDate: report.dueDate,
        submittedAt: report.submittedAt,
        publishedAt: report.publishedAt,
        createdAt: report.createdAt,
        updatedAt: report.updatedAt,
        createdBy: {
          id: report.createdBy.id,
          email: report.createdBy.email,
          fullName: `${report.createdBy.firstName} ${report.createdBy.lastName}`,
        },
        project: report.project,
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.patch('/status-reports/:id', authenticate, authorize('CONTRIBUTOR', 'MANAGER'), requireDepartmentScope('statusReport'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const parsed = updateStatusReportSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const reportId = Number(req.params.id);
    const userId = req.user?.sub;
    if (!userId) {
      throw new HttpError(401, 'Unauthenticated');
    }

    const existing = await prisma.statusReport.findUnique({ where: { id: reportId } });
    if (!existing) {
      throw new HttpError(404, 'Status report not found');
    }

    if (existing.status !== 'DRAFT' && existing.status !== 'SUBMITTED') {
      throw new HttpError(409, 'Only draft/submitted reports can be edited');
    }

    if (req.user?.role === 'CONTRIBUTOR' && existing.createdById !== userId) {
      throw new HttpError(403, 'You can only edit your own reports');
    }

    if (req.user?.role === 'CONTRIBUTOR' && new Date() > existing.dueDate) {
      throw new HttpError(403, 'Editing window closed at local 11:59 PM');
    }

    const updateData: {
      rag?: 'GREEN' | 'AMBER' | 'RED';
      progressPercentage?: number;
      summary?: string | null;
      blockers?: string | null;
    } = {};

    if (parsed.data.rag) {
      updateData.rag = parsed.data.rag as 'GREEN' | 'AMBER' | 'RED';
    }
    if (parsed.data.progressPercentage !== undefined) {
      updateData.progressPercentage = parsed.data.progressPercentage;
    }
    if (
      parsed.data.yesterdayWork !== undefined ||
      parsed.data.todayWork !== undefined ||
      parsed.data.tomorrowWork !== undefined
    ) {
      const current = parseDailySummary(existing.summary);
      updateData.summary = formatDailySummary(
        parsed.data.yesterdayWork ?? current.yesterdayWork,
        parsed.data.todayWork ?? current.todayWork,
        parsed.data.tomorrowWork ?? current.tomorrowWork,
      );
    }
    if (parsed.data.blockers !== undefined) {
      updateData.blockers = parsed.data.blockers;
    }

    const report = await prisma.statusReport.update({
      where: { id: reportId },
      data: updateData,
    });

    return res.status(200).json({ report });
  } catch (error) {
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return next(error);
  }
});

router.post('/status-reports/:id/submit', authenticate, authorize('CONTRIBUTOR'), requireDepartmentScope('statusReport'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const reportId = Number(req.params.id);
    const userId = req.user?.sub;
    if (!userId) {
      throw new HttpError(401, 'Unauthenticated');
    }

    const existing = await prisma.statusReport.findUnique({ where: { id: reportId } });
    if (!existing) {
      throw new HttpError(404, 'Status report not found');
    }

    if (existing.createdById !== userId) {
      throw new HttpError(403, 'You can only submit your own reports');
    }

    if (new Date() > existing.dueDate) {
      throw new HttpError(403, 'Submission window closed at local 11:59 PM');
    }

    if (existing.status === 'SUBMITTED') {
      return res.status(200).json({ report: existing });
    }

    if (existing.status !== 'DRAFT') {
      throw new HttpError(409, 'Only draft reports can be submitted');
    }

    const updated = await prisma.statusReport.updateMany({
      where: {
        id: reportId,
        status: 'DRAFT',
      },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
    });

    if (updated.count !== 1) {
      throw new HttpError(409, 'Report was updated by another request');
    }

    const report = await prisma.statusReport.findUnique({ where: { id: reportId } });
    if (!report) {
      throw new HttpError(404, 'Status report not found');
    }

    return res.status(200).json({ report });
  } catch (error) {
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return next(error);
  }
});

router.post('/status-reports/:id/publish', authenticate, authorize('MANAGER'), requireDepartmentScope('statusReport'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const parsed = publishStatusReportSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const reportId = Number(req.params.id);
    const userId = req.user?.sub;
    if (!userId) {
      throw new HttpError(401, 'Unauthenticated');
    }

    const transactionResult = await prisma.$transaction(async (tx) => {
      const existing = await tx.statusReport.findUnique({ where: { id: reportId } });
      if (!existing) {
        throw new HttpError(404, 'Status report not found');
      }

      if (existing.status === 'PUBLISHED') {
        throw new HttpError(409, 'Report is already published');
      }

      if (existing.status !== 'SUBMITTED') {
        throw new HttpError(409, 'Report must be submitted before it can be published');
      }

      const reportAuthorId = existing.createdById;
      if (reportAuthorId === userId) {
        throw new HttpError(403, 'A contributor cannot publish their own report');
      }

      const newRag = parsed.data.rag ?? existing.rag;
      const updated = await tx.statusReport.updateMany({
        where: {
          id: reportId,
          status: 'SUBMITTED',
        },
        data: {
          status: 'PUBLISHED',
          rag: newRag,
          publishedAt: parsed.data.publishedAt ? new Date(parsed.data.publishedAt) : new Date(),
        },
      });

      if (updated.count !== 1) {
        throw new HttpError(409, 'Report was updated by another request');
      }

      const project = await tx.project.update({
        where: { id: existing.projectId },
        data: {
          health: newRag === 'RED' ? 'RED' : newRag === 'AMBER' ? 'AMBER' : 'GREEN',
        },
      });

      return { reportId, project, shouldNotify: newRag === 'RED' && existing.rag !== 'RED' };
    });

    if (transactionResult.shouldNotify) {
      void (async () => {
        try {
          const department = await prisma.department.findFirst({
            where: { projects: { some: { id: transactionResult.project.id } } },
            select: { id: true, name: true },
          });

          notifyAdminsAndExecs('RAG_RED_PUBLISHED', {
            projectId: transactionResult.project.id,
            reportId: transactionResult.reportId,
            departmentId: department?.id ?? null,
            departmentName: department?.name ?? null,
          });
        } catch (notificationError) {
          console.error('Notification delivery failed after publish', notificationError);
        }
      })();
    }

    return res.status(200).json({
      message: 'Report published',
      result: {
        reportId: transactionResult.reportId,
        project: transactionResult.project,
      },
    });
  } catch (error) {
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return next(error);
  }
});

export default router;
