import jwt from 'jsonwebtoken';

const isLocalDev = process.env.NODE_ENV === 'development' && !process.env.CI;
const JWT_SECRET = process.env.JWT_SECRET ?? (isLocalDev ? 'dev-secret' : undefined);
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? (isLocalDev ? 'dev-refresh-secret' : undefined);

function requireEnv(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`${name} must be set outside local development`);
  }
  return value;
}

const resolvedJwtSecret = requireEnv(JWT_SECRET, 'JWT_SECRET');
const resolvedRefreshSecret = requireEnv(JWT_REFRESH_SECRET, 'JWT_REFRESH_SECRET');

export interface TokenPayload {
  sub: number;
  role: string;
  departmentId?: number | null;
}

export function signAccessToken(payload: TokenPayload) {
  return jwt.sign(payload, resolvedJwtSecret, { expiresIn: '15m' });
}

export function signRefreshToken(payload: TokenPayload) {
  return jwt.sign(payload, resolvedRefreshSecret, { expiresIn: '7d' });
}

export function verifyAccessToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, resolvedJwtSecret);
  if (typeof decoded === 'string' || !decoded.sub || typeof decoded.role !== 'string') {
    throw new Error('Invalid token payload');
  }

  return {
    sub: Number(decoded.sub),
    role: decoded.role,
    departmentId: decoded.departmentId ? Number(decoded.departmentId) : null,
  };
}

export function verifyRefreshToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, resolvedRefreshSecret);
  if (typeof decoded === 'string' || !decoded.sub || typeof decoded.role !== 'string') {
    throw new Error('Invalid token payload');
  }

  return {
    sub: Number(decoded.sub),
    role: decoded.role,
    departmentId: decoded.departmentId ? Number(decoded.departmentId) : null,
  };
}
