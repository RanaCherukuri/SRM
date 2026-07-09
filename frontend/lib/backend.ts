const SESSION_COOKIE_NAME = 'refreshToken';
const SESSION_COOKIE_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

export function getApiBaseUrl() {
  return process.env.API_URL ?? 'http://localhost:3001';
}

export function getSessionCookieName() {
  return SESSION_COOKIE_NAME;
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_COOKIE_MAX_AGE_SECONDS,
  };
}

export function extractRefreshToken(setCookieHeader: string | null) {
  if (!setCookieHeader) {
    return null;
  }

  const match = setCookieHeader.match(/refreshToken=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}
