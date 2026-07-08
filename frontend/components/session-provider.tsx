'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { SessionUser } from '@/lib/types';

type SessionState = {
  user: SessionUser;
  accessToken: string | null;
  accessTokenState: 'loading' | 'ready' | 'missing';
};

const SessionContext = createContext<SessionState | null>(null);

export function SessionProvider({
  children,
  initialUser,
}: {
  children: React.ReactNode;
  initialUser: SessionUser;
}) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [accessTokenState, setAccessTokenState] = useState<'loading' | 'ready' | 'missing'>('loading');

  useEffect(() => {
    let active = true;

    const refresh = async () => {
      try {
        const response = await fetch('/api/session/refresh', {
          method: 'POST',
          cache: 'no-store',
        });

        if (!active) {
          return;
        }

        if (!response.ok) {
          setAccessToken(null);
          setAccessTokenState('missing');
          return;
        }

        const payload = (await response.json()) as { accessToken: string };
        setAccessToken(payload.accessToken);
        setAccessTokenState('ready');
      } catch {
        if (!active) {
          return;
        }

        setAccessToken(null);
        setAccessTokenState('missing');
      }
    };

    void refresh();

    return () => {
      active = false;
    };
  }, []);

  const value = useMemo(
    () => ({
      user: initialUser,
      accessToken,
      accessTokenState,
    }),
    [accessToken, accessTokenState, initialUser],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSessionState() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSessionState must be used inside SessionProvider');
  }

  return context;
}
