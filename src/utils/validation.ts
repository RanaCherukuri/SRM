import { z } from 'zod';

export const createStatusReportSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
  dueDate: z.string().datetime(),
  progressPercentage: z.number().int().min(0).max(100).optional(),
  summary: z.string().optional(),
  blockers: z.string().optional(),
  rag: z.enum(['GREEN', 'AMBER', 'RED']).optional(),
});

/**
 * Compute canonical period boundaries for a given year+month (UTC).
 * Returns the same timestamps regardless of client timezone or clock,
 * so the unique constraint (projectId, periodStart, periodEnd) reliably
 * catches duplicate periods.
 */
export function computeReportingPeriod(year: number, month: number): {
  reportingPeriodStart: Date;
  reportingPeriodEnd: Date;
} {
  const reportingPeriodStart = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  // Last millisecond of the month: advance to first day of next month then subtract 1ms
  const reportingPeriodEnd = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0) - 1);
  return { reportingPeriodStart, reportingPeriodEnd };
}

export const publishStatusReportSchema = z.object({
  publishedAt: z.string().datetime().optional(),
  rag: z.enum(['GREEN', 'AMBER', 'RED']).optional(),
});

export const updateStatusReportSchema = z.object({
  dueDate: z.string().datetime().optional(),
  progressPercentage: z.number().int().min(0).max(100).optional(),
  summary: z.string().optional(),
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
