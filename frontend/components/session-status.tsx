'use client';

import { useSessionState } from './session-provider';

export function SessionStatus() {
  const { accessTokenState } = useSessionState();

  const label =
    accessTokenState === 'ready'
      ? 'Client token: memory'
      : accessTokenState === 'loading'
        ? 'Client token: loading'
        : 'Client token: unavailable';

  return (
    <span className="rounded-full border border-emerald-400/30 bg-emerald-950/45 px-3 py-1.5 text-xs font-medium text-emerald-100">
      {label}
    </span>
  );
}
