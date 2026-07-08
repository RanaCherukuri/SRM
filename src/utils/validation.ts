import { z } from 'zod';

export const createStatusReportSchema = z.object({
  reportingPeriodStart: z.string().datetime(),
  reportingPeriodEnd: z.string().datetime(),
  dueDate: z.string().datetime(),
  progressPercentage: z.number().int().min(0).max(100).optional(),
  summary: z.string().optional(),
  blockers: z.string().optional(),
  rag: z.enum(['GREEN', 'AMBER', 'RED']).optional(),
});

export const publishStatusReportSchema = z.object({
  publishedAt: z.string().datetime().optional(),
  rag: z.enum(['GREEN', 'AMBER', 'RED']).optional(),
});

export const updateStatusReportSchema = createStatusReportSchema.partial();

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
