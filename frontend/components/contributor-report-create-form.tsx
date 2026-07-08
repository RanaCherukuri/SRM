'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSessionState } from './session-provider';

export function ContributorReportCreateForm({ projectId }: { projectId: number }) {
  const router = useRouter();
  const { accessToken } = useSessionState();
  const [year, setYear] = useState(new Date().getUTCFullYear());
  const [month, setMonth] = useState(new Date().getUTCMonth() + 1);
  const [dueDate, setDueDate] = useState('');
  const [rag, setRag] = useState<'GREEN' | 'AMBER' | 'RED'>('AMBER');
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [summary, setSummary] = useState('');
  const [blockers, setBlockers] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <form
      className="grid gap-4 rounded-3xl border border-slate-800 bg-slate-900/70 p-6"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!accessToken) {
          setError('Session access token unavailable.');
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
            year,
            month,
            dueDate: new Date(dueDate).toISOString(),
            rag,
            progressPercentage,
            summary: summary || undefined,
            blockers: blockers || undefined,
          }),
        });

        const payload = await response.json().catch(() => ({ error: 'Create failed' }));
        if (!response.ok || !payload.report?.id) {
          setError(payload.error ?? 'Create failed');
          setPending(false);
          return;
        }

        router.push(`/contributor/reports/${payload.report.id}`);
        router.refresh();
      }}
    >
      <h3 className="text-lg font-semibold text-white">Create draft report</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm text-slate-300">
          Year
          <input
            type="number"
            min={2000}
            max={2100}
            value={year}
            onChange={(event) => setYear(Number(event.target.value))}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
            required
          />
        </label>
        <label className="grid gap-2 text-sm text-slate-300">
          Month
          <input
            type="number"
            min={1}
            max={12}
            value={month}
            onChange={(event) => setMonth(Number(event.target.value))}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
            required
          />
        </label>
        <label className="grid gap-2 text-sm text-slate-300">
          Due date (UTC)
          <input
            type="datetime-local"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
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
        Summary
        <textarea
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
          rows={3}
          className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
        />
      </label>
      <label className="grid gap-2 text-sm text-slate-300">
        Blockers
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
        disabled={pending}
        className="w-fit rounded-full border border-cyan-500/50 bg-cyan-500/20 px-4 py-2 text-sm font-semibold text-cyan-200 disabled:opacity-60"
      >
        {pending ? 'Creating…' : 'Create draft'}
      </button>
    </form>
  );
}
