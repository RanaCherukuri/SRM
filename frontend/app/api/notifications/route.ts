import { NextResponse } from 'next/server';
import { getApiBaseUrl } from '@/lib/backend';
import type { AuthSession } from '@/lib/types';

function getCookieHeader(request: Request) {
  return request.headers.get('cookie') ?? '';
}

export async function GET(request: Request) {
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
  const url = new URL(request.url);
  const unreadSuffix = url.searchParams.get('unread') === 'true' ? '?unread=true' : '';

  const response = await fetch(`${getApiBaseUrl()}/notifications${unreadSuffix}`, {
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
    },
    cache: 'no-store',
  });
  const payload = await response.json().catch(() => ({ error: 'Failed to fetch notifications' }));

  return NextResponse.json(payload, { status: response.status });
}
