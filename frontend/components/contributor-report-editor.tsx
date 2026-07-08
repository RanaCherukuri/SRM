'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { StatusReportDetail } from '@/lib/types';
import { useSessionState } from './session-provider';

export function ContributorReportEditor({ report }: { report: StatusReportDetail }) {
  const router = useRouter();
  const { accessToken } = useSessionState();
  const [dueDate, setDueDate] = useState(report.dueDate.slice(0, 16));
  const [rag, setRag] = useState<'GREEN' | 'AMBER' | 'RED'>(report.rag as 'GREEN' | 'AMBER' | 'RED');
  const [progressPercentage, setProgressPercentage] = useState(report.progressPercentage);
  const [summary, setSummary] = useState(report.summary ?? '');
  const [blockers, setBlockers] = useState(report.blockers ?? '');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const editable = report.status === 'DRAFT';

  return (
    <div className="grid gap-4 rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
      <h3 className="text-lg font-semibold text-white">Draft actions</h3>
      {!editable ? (
        <p className="text-sm text-slate-400">This report is no longer editable because it is {report.status}.</p>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm text-slate-300">
              Due date
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
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
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={pending}
              className="rounded-full border border-cyan-500/50 bg-cyan-500/20 px-4 py-2 text-sm font-semibold text-cyan-200 disabled:opacity-60"
              onClick={async () => {
                if (!accessToken) {
                  setError('Session access token unavailable.');
                  return;
                }

                setPending(true);
                setError(null);
                const response = await fetch(`/api/contributor/status-reports/${report.id}`, {
                  method: 'PATCH',
                  headers: {
                    'content-type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                  },
                  body: JSON.stringify({
                    dueDate: new Date(dueDate).toISOString(),
                    rag,
                    progressPercentage,
                    summary: summary || null,
                    blockers: blockers || null,
                  }),
                });
                const payload = await response.json().catch(() => ({ error: 'Update failed' }));
                if (!response.ok) {
                  setError(payload.error ?? 'Update failed');
                  setPending(false);
                  return;
                }
                setPending(false);
                router.refresh();
              }}
            >
              {pending ? 'Saving…' : 'Save draft'}
            </button>
            <button
              type="button"
              disabled={pending}
              className="rounded-full border border-emerald-500/50 bg-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-200 disabled:opacity-60"
              onClick={async () => {
                if (!accessToken) {
                  setError('Session access token unavailable.');
                  return;
                }

                setPending(true);
                setError(null);
                const response = await fetch(`/api/contributor/status-reports/${report.id}/submit`, {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${accessToken}`,
                  },
                });
                const payload = await response.json().catch(() => ({ error: 'Submit failed' }));
                if (!response.ok) {
                  setError(payload.error ?? 'Submit failed');
                  setPending(false);
                  return;
                }
                setPending(false);
                router.refresh();
              }}
            >
              Submit report
            </button>
          </div>
        </>
      )}
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
    </div>
  );
}
