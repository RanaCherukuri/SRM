'use client';

import { useState } from 'react';

export function LogoutButton() {
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      className="soft-action px-4 py-2 text-sm disabled:opacity-50"
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
