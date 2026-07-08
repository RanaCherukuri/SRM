import { Router, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';
import { prisma } from '../config/prisma';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  REFRESH_TOKEN_TTL_MS,
} from '../utils/jwt';
import { HttpError } from '../middleware/errorHandler';
import { authenticate, authorize, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const REFRESH_ROTATION_GRACE_MS = 15_000;

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: REFRESH_TOKEN_TTL_MS,
  path: '/',
};

const USER_ROLES: UserRole[] = ['ADMIN', 'EXECUTIVE', 'MANAGER', 'CONTRIBUTOR', 'VIEWER'];

function isUserRole(value: string | undefined): value is UserRole {
  return Boolean(value && USER_ROLES.includes(value as UserRole));
}

function serializeUser(user: {
  id: number;
  email: string;
  role: UserRole;
  departmentId: number | null;
}) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    departmentId: user.departmentId,
  };
}

function getCookieValue(cookieHeader: string | undefined, name: string) {
  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(';').map((chunk) => chunk.trim());
  const match = cookies.find((chunk) => chunk.startsWith(`${name}=`));

  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

router.post('/register', async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, role, departmentId } = req.body as {
      email?: string;
      password?: string;
      firstName?: string;
      lastName?: string;
      role?: string;
      departmentId?: number;
    };

    if (!email || !password || !firstName || !lastName) {
      throw new HttpError(400, 'Email, password, first name, and last name are required');
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new HttpError(409, 'User already exists');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        role: isUserRole(role) ? role : 'VIEWER',
        departmentId: departmentId ?? null,
      },
    });

    res.status(201).json(serializeUser(user));
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      throw new HttpError(400, 'Email and password are required');
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new HttpError(401, 'Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      throw new HttpError(401, 'Invalid credentials');
    }

    const payload = { sub: user.id, role: user.role, departmentId: user.departmentId };
    const accessToken = signAccessToken(payload);
    const { token: refreshToken, jti } = signRefreshToken(payload);

    // Persist refresh token record for revocation support
    await prisma.refreshToken.create({
      data: {
        jti,
        userId: user.id,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      },
    });

    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
    res.json({ accessToken, user: serializeUser(user) });
  } catch (error) {
    next(error);
  }
});

router.post('/refresh', async (req, res, next) => {
  try {
    const rawToken = getCookieValue(req.headers.cookie, 'refreshToken');
    if (!rawToken) {
      throw new HttpError(401, 'Missing refresh token');
    }

    const payload = verifyRefreshToken(rawToken);

    // Check DB record exists and is not expired.
    // Revoked tokens are accepted only during a short grace window to absorb
    // near-simultaneous refresh calls (SSR + hydration, tab races).
    const record = await prisma.refreshToken.findUnique({ where: { jti: payload.jti } });
    if (!record) {
      throw new HttpError(401, 'Refresh token not recognised');
    }
    if (record.expiresAt < new Date()) {
      throw new HttpError(401, 'Refresh token has expired');
    }
    if (
      record.revokedAt &&
      Date.now() - record.revokedAt.getTime() > REFRESH_ROTATION_GRACE_MS
    ) {
      throw new HttpError(401, 'Refresh token has been revoked');
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, departmentId: true },
    });

    if (!user) {
      throw new HttpError(401, 'Session user no longer exists');
    }

    // Rotate: old token is revoked, new token is issued.
    const newPayload = { sub: user.id, role: user.role, departmentId: user.departmentId };
    const accessToken = signAccessToken(newPayload);
    const { token: newRefreshToken, jti: newJti } = signRefreshToken(newPayload);

    await prisma.$transaction([
      prisma.refreshToken.updateMany({
        where: { jti: payload.jti, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
      prisma.refreshToken.create({
        data: {
          jti: newJti,
          userId: user.id,
          expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
        },
      }),
    ]);

    res.cookie('refreshToken', newRefreshToken, COOKIE_OPTIONS);
    res.json({ accessToken, user: serializeUser(user) });
  } catch (error) {
    next(error);
  }
});

router.post('/logout', async (req, res, next) => {
  try {
    const rawToken = getCookieValue(req.headers.cookie, 'refreshToken');
    if (rawToken) {
      try {
        const payload = verifyRefreshToken(rawToken);
        await prisma.refreshToken.updateMany({
          where: { jti: payload.jti, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      } catch {
        // Token invalid/already expired — still clear the cookie, don't error
      }
    }

    res.clearCookie('refreshToken', COOKIE_OPTIONS);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

// Admin: revoke all active sessions for a specific user
router.delete(
  '/admin/users/:id/sessions',
  authenticate,
  authorize('ADMIN'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const targetUserId = Number(req.params.id);
      if (!Number.isInteger(targetUserId) || targetUserId < 1) {
        throw new HttpError(400, 'Invalid user id');
      }

      const user = await prisma.user.findUnique({ where: { id: targetUserId } });
      if (!user) {
        throw new HttpError(404, 'User not found');
      }

      const { count } = await prisma.refreshToken.updateMany({
        where: { userId: targetUserId, revokedAt: null },
        data: { revokedAt: new Date() },
      });

      res.json({ message: `Revoked ${count} active session(s) for user ${targetUserId}` });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
