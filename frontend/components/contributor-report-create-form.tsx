'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSessionState } from './session-provider';

function getErrorMessage(payload: unknown) {
  if (payload && typeof payload === 'object' && 'error' in payload) {
    const raw = (payload as { error?: unknown }).error;
    if (typeof raw === 'string') return raw;
    if (raw && typeof raw === 'object') return JSON.stringify(raw);
  }
  return 'Create failed';
}

export function ContributorReportCreateForm({ projectId }: { projectId: number }) {
  const router = useRouter();
  const { accessToken, accessTokenState } = useSessionState();
  const [reportDate, setReportDate] = useState(new Date().toISOString().slice(0, 10));
  const [rag, setRag] = useState<'GREEN' | 'AMBER' | 'RED'>('AMBER');
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [yesterdayWork, setYesterdayWork] = useState('');
  const [todayWork, setTodayWork] = useState('');
  const [tomorrowWork, setTomorrowWork] = useState('');
  const [blockers, setBlockers] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <form
      className="grid gap-4 rounded-3xl border border-slate-800 bg-slate-900/70 p-6"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!accessToken) {
          setError('Session still loading. Please wait a second and try again.');
          return;
        }

        setPending(true);
        setError(null);

        const response = await fetch(`/api/contributor/projects/${projectId}/status-reports`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            reportDate,
            clientTimezoneOffsetMinutes: new Date().getTimezoneOffset(),
            rag,
            progressPercentage,
            yesterdayWork,
            todayWork,
            tomorrowWork,
            blockers: blockers || undefined,
          }),
        });

        const payload = await response.json().catch(() => ({ error: 'Create failed' }));
        if (!response.ok || !payload.report?.id) {
          setError(getErrorMessage(payload));
          setPending(false);
          return;
        }

        router.push(`/contributor/reports/${payload.report.id}`);
        router.refresh();
      }}
    >
      <h3 className="text-lg font-semibold text-white">Create daily scrum report</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm text-slate-300">
          Report date
          <input
            type="date"
            value={reportDate}
            onChange={(event) => setReportDate(event.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
            required
          />
        </label>
        <label className="grid gap-2 text-sm text-slate-300">
          RAG
          <select
            value={rag}
            onChange={(event) => setRag(event.target.value as 'GREEN' | 'AMBER' | 'RED')}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
          >
            <option value="GREEN">GREEN</option>
            <option value="AMBER">AMBER</option>
            <option value="RED">RED</option>
          </select>
        </label>
      </div>
      <label className="grid gap-2 text-sm text-slate-300">
        Progress %
        <input
          type="number"
          min={0}
          max={100}
          value={progressPercentage}
          onChange={(event) => setProgressPercentage(Number(event.target.value))}
          className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
        />
      </label>
      <label className="grid gap-2 text-sm text-slate-300">
        What did I do yesterday?
        <textarea
          value={yesterdayWork}
          onChange={(event) => setYesterdayWork(event.target.value)}
          rows={3}
          className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
          required
        />
      </label>
      <label className="grid gap-2 text-sm text-slate-300">
        What will I do today?
        <textarea
          value={todayWork}
          onChange={(event) => setTodayWork(event.target.value)}
          rows={3}
          className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
          required
        />
      </label>
      <label className="grid gap-2 text-sm text-slate-300">
        What will I do tomorrow?
        <textarea
          value={tomorrowWork}
          onChange={(event) => setTomorrowWork(event.target.value)}
          rows={3}
          className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
          required
        />
      </label>
      <label className="grid gap-2 text-sm text-slate-300">
        Any blockers?
        <textarea
          value={blockers}
          onChange={(event) => setBlockers(event.target.value)}
          rows={3}
          className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
        />
      </label>
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      <button
        type="submit"
        disabled={pending || accessTokenState !== 'ready'}
        className="w-fit rounded-full border border-cyan-500/50 bg-cyan-500/20 px-4 py-2 text-sm font-semibold text-cyan-200 disabled:opacity-60"
      >
        {pending ? 'Creating…' : accessTokenState !== 'ready' ? 'Preparing session…' : 'Create draft'}
      </button>
    </form>
  );
}
