import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { UserRole } from '@prisma/client';

const isLocalDev = process.env.NODE_ENV === 'development' && !process.env.CI;
const JWT_SECRET = process.env.JWT_SECRET ?? (isLocalDev ? 'dev-secret' : undefined);
// Env var is REFRESH_TOKEN_SECRET (matches .env); JWT_REFRESH_SECRET accepted as alias for compat
const REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET ??
  process.env.JWT_REFRESH_SECRET ??
  (isLocalDev ? 'dev-refresh-secret' : undefined);

function requireEnv(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`${name} must be set outside local development`);
  }
  return value;
}

const resolvedJwtSecret = requireEnv(JWT_SECRET, 'JWT_SECRET');
const resolvedRefreshSecret = requireEnv(REFRESH_TOKEN_SECRET, 'REFRESH_TOKEN_SECRET');

export const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface TokenPayload {
  sub: number;
  role: UserRole;
  departmentId?: number | null;
}

export interface RefreshTokenPayload extends TokenPayload {
  jti: string;
}

export function signAccessToken(payload: TokenPayload) {
  return jwt.sign(payload, resolvedJwtSecret, { expiresIn: '15m' });
}

/** Returns both the signed token string and the jti (for DB persistence). */
export function signRefreshToken(payload: TokenPayload): { token: string; jti: string } {
  const jti = randomUUID();
  const token = jwt.sign({ ...payload, jti }, resolvedRefreshSecret, { expiresIn: '7d' });
  return { token, jti };
}

export function verifyAccessToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, resolvedJwtSecret);
  if (typeof decoded === 'string' || !decoded.sub || typeof decoded.role !== 'string') {
    throw new Error('Invalid token payload');
  }

  return {
    sub: Number(decoded.sub),
    role: decoded.role as UserRole,
    departmentId: decoded.departmentId ? Number(decoded.departmentId) : null,
  };
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const decoded = jwt.verify(token, resolvedRefreshSecret);
  if (
    typeof decoded === 'string' ||
    !decoded.sub ||
    typeof decoded.role !== 'string' ||
    typeof decoded.jti !== 'string'
  ) {
    throw new Error('Invalid token payload');
  }

  return {
    sub: Number(decoded.sub),
    role: decoded.role as UserRole,
    departmentId: decoded.departmentId ? Number(decoded.departmentId) : null,
    jti: decoded.jti,
  };
}
