import { Router, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { HttpError } from '../middleware/errorHandler';

const router = Router();

// GET /notifications — returns the calling user's notifications, newest first
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new HttpError(401, 'Unauthenticated');
    }

    const unreadOnly = req.query.unread === 'true';

    const notifications = await prisma.notification.findMany({
      where: {
        userId: req.user.sub,
        ...(unreadOnly ? { readAt: null } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return res.json({ notifications });
  } catch (error) {
    return next(error);
  }
});

// PATCH /notifications/:id/read — mark a notification as read
router.patch('/:id/read', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new HttpError(401, 'Unauthenticated');
    }

    const notificationId = Number(req.params.id);
    const notification = await prisma.notification.findUnique({ where: { id: notificationId } });

    if (!notification || notification.userId !== req.user.sub) {
      throw new HttpError(404, 'Notification not found');
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: notification.readAt ?? new Date() },
    });

    return res.json({ notification: updated });
  } catch (error) {
    return next(error);
  }
});

export default router;
