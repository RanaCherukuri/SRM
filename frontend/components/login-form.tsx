'use client';

import { useState } from 'react';

export function LoginForm({ nextPath }: { nextPath?: string }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <form
      className="surface-card flex flex-col gap-4 p-7"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setError(null);

        try {
          const response = await fetch('/api/session/login', {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
            },
            body: JSON.stringify({ email, password, nextPath }),
          });

          const payload = (await response.json()) as {
            error?: string;
            homePath?: string;
          };

          if (!response.ok || !payload.homePath) {
            setError(payload.error ?? 'Login failed');
            setPending(false);
            return;
          }

          window.location.assign(payload.homePath);
        } catch {
          setError('Login failed');
          setPending(false);
        }
      }}
    >
      <div>
        <h2 className="text-xl font-bold text-slate-50">Welcome back</h2>
        <p className="mt-1 text-sm text-slate-400">Sign in to your workspace</p>
      </div>
      <label className="field-label">
        Email
        <input
          className="field-input"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </label>
      <label className="field-label">
        Password
        <input
          className="field-input"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </label>
      {error ? (
        <p className="rounded-2xl border border-rose-800 bg-rose-950/70 px-4 py-3 text-sm text-rose-200">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        className="primary-action px-4 py-3"
        disabled={pending}
      >
        {pending ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
