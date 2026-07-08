export type UserRole = 'ADMIN' | 'EXECUTIVE' | 'MANAGER' | 'CONTRIBUTOR' | 'VIEWER';

export interface SessionUser {
  id: number;
  email: string;
  role: UserRole;
  departmentId: number | null;
}

export interface AuthSession {
  accessToken: string;
  user: SessionUser;
}

export interface ProjectSummary {
  id: number;
  name: string;
  code: string;
  status: string;
  health: string;
  isAtRisk: boolean;
  updatedAt?: string;
  department: {
    id: number;
    name: string;
    code: string;
  };
  owner: {
    id: number;
    fullName: string;
    email: string;
  };
  counts?: {
    statusReports: number;
    risks: number;
    viewerGrants: number;
  };
}

export interface ReportSummary {
  id: number;
  status: string;
  rag: string;
  progressPercentage: number;
  reportingPeriodStart: string;
  reportingPeriodEnd: string;
  dueDate: string;
  submittedAt: string | null;
  publishedAt: string | null;
  createdBy: {
    id: number;
    fullName: string;
    email: string;
  };
}

export interface RiskSummary {
  id: number;
  title: string;
  severity: string;
  likelihood: string;
  isEscalated: boolean;
  updatedAt: string;
  owner: {
    id: number;
    fullName: string;
    email: string;
  };
}

export interface ProjectDetail extends ProjectSummary {
  description: string | null;
  plannedStartDate: string | null;
  actualStartDate: string | null;
  plannedEndDate: string | null;
  actualEndDate: string | null;
  statusReports: ReportSummary[];
  risks: RiskSummary[];
  viewerGrants: Array<{
    id: number;
    fullName: string;
    email: string;
  }>;
}

export interface ProjectListResponse {
  projects: ProjectSummary[];
}

export interface ProjectDetailResponse {
  project: ProjectDetail;
}

export interface StatusReportDetail {
  id: number;
  projectId: number;
  status: string;
  rag: string;
  progressPercentage: number;
  summary: string | null;
  blockers: string | null;
  reportingPeriodStart: string;
  reportingPeriodEnd: string;
  dueDate: string;
  submittedAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: number;
    email: string;
    fullName: string;
  };
  project: {
    id: number;
    name: string;
    code: string;
    department: {
      id: number;
      name: string;
      code: string;
    };
  };
}

export interface StatusReportDetailResponse {
  report: StatusReportDetail;
}

export interface PortfolioResponse {
  portfolio: {
    totals: {
      totalProjects: number;
      atRiskProjects: number;
      publishedReports: number;
      openRisks: number;
    };
    projects: ProjectSummary[];
  };
}

export interface NotificationItem {
  id: number;
  userId: number;
  type: 'RAG_RED_PUBLISHED' | 'CRITICAL_RISK_ESCALATED' | string;
  payload: Record<string, unknown>;
  createdAt: string;
  readAt: string | null;
}

export interface NotificationsResponse {
  notifications: NotificationItem[];
}
