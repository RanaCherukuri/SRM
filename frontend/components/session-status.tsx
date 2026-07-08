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
    <span className="rounded-full border border-emerald-700/50 bg-emerald-950/60 px-3 py-1.5 text-xs font-medium text-emerald-200">
      {label}
    </span>
  );
}
