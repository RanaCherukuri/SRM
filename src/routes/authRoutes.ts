import { Router } from 'express';
import bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';
import { prisma } from '../config/prisma';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { HttpError } from '../middleware/errorHandler';

const router = Router();
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
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
    const refreshToken = signRefreshToken(payload);

    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
    res.json({ accessToken, user: serializeUser(user) });
  } catch (error) {
    next(error);
  }
});

router.post('/refresh', async (req, res, next) => {
  try {
    const refreshToken = getCookieValue(req.headers.cookie, 'refreshToken');
    if (!refreshToken) {
      throw new HttpError(401, 'Missing refresh token');
    }

    const payload = verifyRefreshToken(refreshToken);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        role: true,
        departmentId: true,
      },
    });

    if (!user) {
      throw new HttpError(401, 'Session user no longer exists');
    }

    const accessToken = signAccessToken({
      sub: user.id,
      role: user.role,
      departmentId: user.departmentId,
    });

    res.json({ accessToken, user: serializeUser(user) });
  } catch (error) {
    next(error);
  }
});

router.post('/logout', (_req, res) => {
  res.clearCookie('refreshToken', COOKIE_OPTIONS);
  res.status(204).end();
});

export default router;
