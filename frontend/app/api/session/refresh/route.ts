import { NextResponse } from 'next/server';
import {
  extractRefreshToken,
  getApiBaseUrl,
  getSessionCookieName,
  getSessionCookieOptions,
} from '@/lib/backend';

export async function POST(request: Request) {
  const refreshToken = request.headers
    .get('cookie')
    ?.split(';')
    .map((chunk) => chunk.trim())
    .find((chunk) => chunk.startsWith(`${getSessionCookieName()}=`))
    ?.slice(getSessionCookieName().length + 1);

  if (!refreshToken) {
    return NextResponse.json({ error: 'Missing refresh token' }, { status: 401 });
  }

  const response = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
    method: 'POST',
    headers: {
      Cookie: `${getSessionCookieName()}=${refreshToken}`,
    },
    cache: 'no-store',
  });

  const payload = await response.json().catch(() => ({ error: 'Refresh failed' }));
  const nextResponse = NextResponse.json(payload, { status: response.status });

  if (response.ok) {
    const rotatedRefreshToken = extractRefreshToken(response.headers.get('set-cookie'));
    if (rotatedRefreshToken) {
      nextResponse.cookies.set({
        name: getSessionCookieName(),
        value: rotatedRefreshToken,
        ...getSessionCookieOptions(),
      });
    }
  }

  return nextResponse;
}
