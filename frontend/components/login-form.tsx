'use client';

import { useState } from 'react';

export function LoginForm({ nextPath }: { nextPath?: string }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <form
      className="flex flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl"
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
      <label className="flex flex-col gap-2 text-sm text-slate-300">
        Email
        <input
          className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-500"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </label>
      <label className="flex flex-col gap-2 text-sm text-slate-300">
        Password
        <input
          className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-500"
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
        className="rounded-2xl bg-sky-500 px-4 py-3 font-medium text-slate-950 transition hover:bg-sky-400 disabled:opacity-60"
        disabled={pending}
      >
        {pending ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
