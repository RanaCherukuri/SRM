import { NextResponse } from 'next/server';
import { getApiBaseUrl } from '@/lib/backend';
import type { AuthSession } from '@/lib/types';

function getCookieHeader(request: Request) {
  return request.headers.get('cookie') ?? '';
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const cookieHeader = getCookieHeader(request);
  if (!cookieHeader) {
    return NextResponse.json({ error: 'Missing session cookie' }, { status: 401 });
  }

  const refreshResponse = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
    method: 'POST',
    headers: { Cookie: cookieHeader },
    cache: 'no-store',
  });
  const refreshPayload = await refreshResponse.json().catch(() => ({ error: 'Refresh failed' }));
  if (!refreshResponse.ok) {
    return NextResponse.json(refreshPayload, { status: refreshResponse.status });
  }

  const session = refreshPayload as AuthSession;
  const notificationId = Number((await params).id);

  const response = await fetch(`${getApiBaseUrl()}/notifications/${notificationId}/read`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
    },
    cache: 'no-store',
  });
  const payload = await response.json().catch(() => ({ error: 'Failed to mark notification as read' }));

  return NextResponse.json(payload, { status: response.status });
}
