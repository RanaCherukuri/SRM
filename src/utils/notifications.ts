import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';

type NotificationType = 'RAG_RED_PUBLISHED' | 'CRITICAL_RISK_ESCALATED';

/**
 * Fire-and-forget: persist notification rows for all ADMIN and EXECUTIVE users.
 * Does NOT throw — failures are logged and swallowed so the caller's transaction
 * is never blocked or rolled back by a notification write failure.
 */
export function notifyAdminsAndExecs(
  type: NotificationType,
  payload: Record<string, unknown>,
): void {
  void (async () => {
    try {
      const recipients = await prisma.user.findMany({
        where: { role: { in: ['ADMIN', 'EXECUTIVE'] } },
        select: { id: true },
      });

      if (recipients.length === 0) return;

      await prisma.notification.createMany({
        data: recipients.map((r) => ({
          userId: r.id,
          type,
          payload: payload as Prisma.InputJsonValue,
        })),
      });
    } catch (err) {
      console.error(`[notifications] Failed to persist ${type} notification`, err);
    }
  })();
}
