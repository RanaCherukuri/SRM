'use client';

import { useState } from 'react';

export function LogoutButton() {
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-100 transition hover:border-slate-500 disabled:opacity-50"
      onClick={async () => {
        setPending(true);
        await fetch('/api/session/logout', { method: 'POST' });
        window.location.assign('/login');
      }}
      disabled={pending}
    >
      {pending ? 'Signing out…' : 'Sign out'}
    </button>
  );
}
