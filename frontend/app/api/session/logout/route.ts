import { NextResponse } from 'next/server';
import { getApiBaseUrl, getSessionCookieName, getSessionCookieOptions } from '@/lib/backend';

export async function POST(request: Request) {
  const cookieHeader = request.headers.get('cookie');

  await fetch(`${getApiBaseUrl()}/auth/logout`, {
    method: 'POST',
    headers: cookieHeader
      ? {
          Cookie: cookieHeader,
        }
      : {},
    cache: 'no-store',
  }).catch(() => undefined);

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: getSessionCookieName(),
    value: '',
    ...getSessionCookieOptions(),
    maxAge: 0,
  });

  return response;
}
