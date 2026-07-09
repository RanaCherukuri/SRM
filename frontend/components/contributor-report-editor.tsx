'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { StatusReportDetail } from '@/lib/types';
import { useSessionState } from './session-provider';

function parseDailySummary(summary: string | null) {
  if (!summary) {
    return { yesterdayWork: '', todayWork: '', tomorrowWork: '' };
  }
  const match = summary.match(
    /^Yesterday:\s*([\s\S]*?)\n\nToday:\s*([\s\S]*?)\n\nTomorrow:\s*([\s\S]*)$/m,
  );
  if (!match) {
    return { yesterdayWork: summary, todayWork: '', tomorrowWork: '' };
  }
  return {
    yesterdayWork: match[1].trim(),
    todayWork: match[2].trim(),
    tomorrowWork: match[3].trim(),
  };
}

function getErrorMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === 'object' && 'error' in payload) {
    const raw = (payload as { error?: unknown }).error;
    if (typeof raw === 'string') return raw;
    if (raw && typeof raw === 'object') return JSON.stringify(raw);
  }
  return fallback;
}

export function ContributorReportEditor({ report }: { report: StatusReportDetail }) {
  const router = useRouter();
  const { accessToken, accessTokenState } = useSessionState();
  const initialSummary = useMemo(() => parseDailySummary(report.summary), [report.summary]);
  const [rag, setRag] = useState<'GREEN' | 'AMBER' | 'RED'>(report.rag as 'GREEN' | 'AMBER' | 'RED');
  const [progressPercentage, setProgressPercentage] = useState(report.progressPercentage);
  const [yesterdayWork, setYesterdayWork] = useState(initialSummary.yesterdayWork);
  const [todayWork, setTodayWork] = useState(initialSummary.todayWork);
  const [tomorrowWork, setTomorrowWork] = useState(initialSummary.tomorrowWork);
  const [blockers, setBlockers] = useState(report.blockers ?? '');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const editable = report.status === 'DRAFT' || report.status === 'SUBMITTED';

  return (
    <div className="grid gap-4 rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
      <h3 className="section-title">Daily report actions</h3>
      {!editable ? (
        <p className="text-sm text-slate-400">This report is no longer editable because it is {report.status}.</p>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="field-label">
              RAG
              <select
                value={rag}
                onChange={(event) => setRag(event.target.value as 'GREEN' | 'AMBER' | 'RED')}
                className="field-input"
              >
                <option value="GREEN">GREEN</option>
                <option value="AMBER">AMBER</option>
                <option value="RED">RED</option>
              </select>
            </label>
            <label className="field-label">
              Progress %
              <input
                type="number"
                min={0}
                max={100}
                value={progressPercentage}
                onChange={(event) => setProgressPercentage(Number(event.target.value))}
                className="field-input"
              />
            </label>
          </div>
          <label className="field-label">
            What did I do yesterday?
            <textarea
              value={yesterdayWork}
              onChange={(event) => setYesterdayWork(event.target.value)}
              rows={3}
              className="field-input"
              required
            />
          </label>
          <label className="field-label">
            What will I do today?
            <textarea
              value={todayWork}
              onChange={(event) => setTodayWork(event.target.value)}
              rows={3}
              className="field-input"
              required
            />
          </label>
          <label className="field-label">
            What will I do tomorrow?
            <textarea
              value={tomorrowWork}
              onChange={(event) => setTomorrowWork(event.target.value)}
              rows={3}
              className="field-input"
              required
            />
          </label>
          <label className="field-label">
            Any blockers?
            <textarea
              value={blockers}
              onChange={(event) => setBlockers(event.target.value)}
              rows={3}
              className="field-input"
            />
          </label>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={pending || accessTokenState !== 'ready'}
              className="primary-action px-5 py-2.5 text-sm"
              onClick={async () => {
                if (!accessToken) {
                  setError('Session still loading. Please wait a second and try again.');
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
                    rag,
                    progressPercentage,
                    yesterdayWork,
                    todayWork,
                    tomorrowWork,
                    blockers: blockers || null,
                  }),
                });
                const payload = await response.json().catch(() => ({ error: 'Update failed' }));
                if (!response.ok) {
                  setError(getErrorMessage(payload, 'Update failed'));
                  setPending(false);
                  return;
                }
                setPending(false);
                router.refresh();
              }}
            >
              {pending ? 'Saving…' : accessTokenState !== 'ready' ? 'Preparing session…' : 'Save'}
            </button>
            <button
              type="button"
              disabled={pending || accessTokenState !== 'ready'}
              className="success-action px-5 py-2.5 text-sm"
              onClick={async () => {
                if (!accessToken) {
                  setError('Session still loading. Please wait a second and try again.');
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
                  setError(getErrorMessage(payload, 'Submit failed'));
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
