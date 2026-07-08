import { NextResponse } from 'next/server';
import { extractRefreshToken, getApiBaseUrl, getSessionCookieName, getSessionCookieOptions } from '@/lib/backend';
import { getRoleHomePath } from '@/lib/routes';
import type { AuthSession } from '@/lib/types';

export async function POST(request: Request) {
  const body = (await request.json()) as {
    email?: string;
    password?: string;
    nextPath?: string;
  };

  const response = await fetch(`${getApiBaseUrl()}/auth/login`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      email: body.email,
      password: body.password,
    }),
    cache: 'no-store',
  });

  const payload = await response.json().catch(() => ({ error: 'Login failed' }));
  if (!response.ok) {
    return NextResponse.json(payload, { status: response.status });
  }

  const refreshToken = extractRefreshToken(response.headers.get('set-cookie'));
  if (!refreshToken) {
    return NextResponse.json({ error: 'Missing refresh cookie from backend login' }, { status: 502 });
  }

  const session = payload as AuthSession;
  const homePath = body.nextPath || getRoleHomePath(session.user.role);
  const nextResponse = NextResponse.json({
    accessToken: session.accessToken,
    user: session.user,
    homePath,
  });

  nextResponse.cookies.set({
    name: getSessionCookieName(),
    value: refreshToken,
    ...getSessionCookieOptions(),
  });

  return nextResponse;
}
