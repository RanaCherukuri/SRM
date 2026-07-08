import 'server-only';

import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { getApiBaseUrl, getSessionCookieName } from './backend';
import type {
  AuthSession,
  PortfolioResponse,
  ProjectDetailResponse,
  ProjectListResponse,
  RiskListResponse,
  StatusReportListResponse,
  StatusReportDetailResponse,
  UserRole,
} from './types';

type ProtectedResponseMap = {
  '/projects': ProjectListResponse;
  '/dashboard/portfolio': PortfolioResponse;
  '/status-reports': StatusReportListResponse;
  '/risks': RiskListResponse;
};

export async function tryGetServerSession() {
  const refreshToken = (await cookies()).get(getSessionCookieName())?.value;
  if (!refreshToken) {
    return null;
  }

  const response = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
    method: 'POST',
    headers: {
      Cookie: `${getSessionCookieName()}=${encodeURIComponent(refreshToken)}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as AuthSession;
}

export async function requireServerSession() {
  const session = await tryGetServerSession();
  if (!session) {
    redirect('/login');
  }

  return session;
}

export function requireRole(role: UserRole, allowedRoles: UserRole[]) {
  if (role === 'ADMIN') {
    return;
  }

  if (!allowedRoles.includes(role)) {
    redirect('/forbidden');
  }
}

async function fetchProtected(path: string, accessToken: string) {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: 'no-store',
  });

  if (response.status === 401) {
    redirect('/login');
  }

  if (response.status === 403) {
    redirect('/forbidden');
  }

  if (response.status === 404) {
    notFound();
  }

  if (!response.ok) {
    throw new Error(`Protected fetch failed: ${path} -> ${response.status}`);
  }

  return response;
}

export async function getProtectedData<T extends keyof ProtectedResponseMap>(path: T, accessToken: string) {
  const response = await fetchProtected(path, accessToken);
  return (await response.json()) as ProtectedResponseMap[T];
}

export async function getProjectDetail(projectId: number, accessToken: string) {
  const response = await fetchProtected(`/projects/${projectId}`, accessToken);
  return (await response.json()) as ProjectDetailResponse;
}

export async function getStatusReportDetail(reportId: number, accessToken: string) {
  const response = await fetchProtected(`/status-reports/${reportId}`, accessToken);
  return (await response.json()) as StatusReportDetailResponse;
}

export async function getStatusReportsList(
  accessToken: string,
  params?: {
    mine?: boolean;
    status?: 'DRAFT' | 'SUBMITTED' | 'PUBLISHED';
    projectId?: number;
  },
) {
  const query = new URLSearchParams();
  if (params?.mine) query.set('mine', 'true');
  if (params?.status) query.set('status', params.status);
  if (params?.projectId) query.set('projectId', String(params.projectId));
  const suffix = query.size ? `?${query.toString()}` : '';
  const response = await fetchProtected(`/status-reports${suffix}`, accessToken);
  return (await response.json()) as StatusReportListResponse;
}

export async function getRiskList(
  accessToken: string,
  params?: {
    mine?: boolean;
    includeResolved?: boolean;
    projectId?: number;
  },
) {
  const query = new URLSearchParams();
  if (params?.mine) query.set('mine', 'true');
  if (params?.includeResolved) query.set('includeResolved', 'true');
  if (params?.projectId) query.set('projectId', String(params.projectId));
  const suffix = query.size ? `?${query.toString()}` : '';
  const response = await fetchProtected(`/risks${suffix}`, accessToken);
  return (await response.json()) as RiskListResponse;
}
