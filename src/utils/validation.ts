import { z } from 'zod';

export const createStatusReportSchema = z.object({
  reportDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  clientTimezoneOffsetMinutes: z.number().int().min(-840).max(840),
  progressPercentage: z.number().int().min(0).max(100).optional(),
  yesterdayWork: z.string().min(1),
  todayWork: z.string().min(1),
  tomorrowWork: z.string().min(1),
  blockers: z.string().optional(),
  rag: z.enum(['GREEN', 'AMBER', 'RED']).optional(),
});

/**
 * Compute canonical day boundaries for a given yyyy-mm-dd date.
 * Reporting windows are daily to match scrum updates.
 */
export function computeReportingPeriod(reportDate: string): {
  reportingPeriodStart: Date;
  reportingPeriodEnd: Date;
} {
  const [year, month, day] = reportDate.split('-').map(Number);
  const reportingPeriodStart = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  const reportingPeriodEnd = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
  return { reportingPeriodStart, reportingPeriodEnd };
}

export function computeLocalDayEndUtc(reportDate: string, timezoneOffsetMinutes: number) {
  const [year, month, day] = reportDate.split('-').map(Number);
  // UTC = local + timezoneOffsetMinutes (same convention as Date#getTimezoneOffset)
  const utcMillis = Date.UTC(year, month - 1, day, 23, 59, 59, 999) + (timezoneOffsetMinutes * 60 * 1000);
  return new Date(utcMillis);
}

export const publishStatusReportSchema = z.object({
  publishedAt: z.string().datetime().optional(),
  rag: z.enum(['GREEN', 'AMBER', 'RED']).optional(),
});

export const updateStatusReportSchema = z.object({
  progressPercentage: z.number().int().min(0).max(100).optional(),
  yesterdayWork: z.string().min(1).optional(),
  todayWork: z.string().min(1).optional(),
  tomorrowWork: z.string().min(1).optional(),
  blockers: z.string().optional(),
  rag: z.enum(['GREEN', 'AMBER', 'RED']).optional(),
});

export const createRiskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  likelihood: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  mitigationPlan: z.string().optional(),
  ownerId: z.number().int().positive(),
});

export const updateRiskSchema = createRiskSchema.partial();

export type CreateStatusReportInput = z.infer<typeof createStatusReportSchema>;
export type PublishStatusReportInput = z.infer<typeof publishStatusReportSchema>;
export type CreateRiskInput = z.infer<typeof createRiskSchema>;
export type UpdateRiskInput = z.infer<typeof updateRiskSchema>;
