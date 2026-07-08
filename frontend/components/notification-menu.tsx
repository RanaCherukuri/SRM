'use client';

import { useEffect, useMemo, useState } from 'react';
import type { NotificationItem, NotificationsResponse } from '@/lib/types';
import { useSessionState } from './session-provider';

function formatNotificationTitle(item: NotificationItem) {
  if (item.type === 'RAG_RED_PUBLISHED') {
    return 'RED report published';
  }
  if (item.type === 'CRITICAL_RISK_ESCALATED') {
    return 'Critical risk escalation';
  }
  return item.type;
}

function formatNotificationMeta(item: NotificationItem) {
  const projectId = item.payload.projectId;
  const reportId = item.payload.reportId;
  const riskId = item.payload.riskId;

  const parts: string[] = [];
  if (typeof projectId === 'number') parts.push(`Project ${projectId}`);
  if (typeof reportId === 'number') parts.push(`Report ${reportId}`);
  if (typeof riskId === 'number') parts.push(`Risk ${riskId}`);
  return parts.join(' · ');
}

export function NotificationMenu() {
  const { accessTokenState } = useSessionState();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);

  const unreadCount = useMemo(
    () => items.filter((item) => item.readAt === null).length,
    [items],
  );

  useEffect(() => {
    if (accessTokenState !== 'ready') {
      return;
    }

    let active = true;
    const timer = setInterval(() => {
      void load();
    }, 30000);

    const load = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/notifications', { cache: 'no-store' });
        if (!response.ok || !active) return;
        const payload = (await response.json()) as NotificationsResponse;
        setItems(payload.notifications);
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [accessTokenState]);

  const markRead = async (id: number) => {
    const response = await fetch(`/api/notifications/${id}/read`, {
      method: 'PATCH',
    });
    if (!response.ok) {
      return;
    }

    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              readAt: new Date().toISOString(),
            }
          : item,
      ),
    );
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="relative rounded-full border border-slate-800 px-3 py-1.5 text-sm text-slate-300 transition hover:border-slate-600 hover:text-white"
      >
        Notifications
        {unreadCount > 0 ? (
          <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-xs font-semibold text-white">
            {unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-20 mt-2 w-96 rounded-2xl border border-slate-800 bg-slate-950 p-3 shadow-2xl">
          <div className="mb-2 flex items-center justify-between px-2">
            <p className="text-sm font-semibold text-white">Notifications</p>
            {loading ? <p className="text-xs text-slate-400">Refreshing…</p> : null}
          </div>

          <div className="max-h-80 space-y-2 overflow-y-auto">
            {items.length === 0 ? (
              <p className="rounded-xl border border-slate-800 bg-slate-900/70 p-3 text-sm text-slate-400">
                No notifications yet.
              </p>
            ) : (
              items.slice(0, 10).map((item) => (
                <article
                  key={item.id}
                  className={`rounded-xl border p-3 ${
                    item.readAt
                      ? 'border-slate-800 bg-slate-900/70'
                      : 'border-violet-600/40 bg-violet-900/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{formatNotificationTitle(item)}</p>
                      <p className="mt-1 text-xs text-slate-400">{formatNotificationMeta(item)}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {item.readAt === null ? (
                      <button
                        type="button"
                        onClick={() => void markRead(item.id)}
                        className="rounded-full border border-slate-700 px-2 py-1 text-xs text-slate-200 hover:border-slate-500"
                      >
                        Mark read
                      </button>
                    ) : null}
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
