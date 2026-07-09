'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ReportSummary, RiskSummary } from '@/lib/types';
import { RagBadge } from './rag-badge';
import { useSessionState } from './session-provider';

export function ManagerWorkspacePanels({
  submittedReports,
  risks,
}: {
  submittedReports: ReportSummary[];
  risks: RiskSummary[];
}) {
  const router = useRouter();
  const { accessToken } = useSessionState();
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="grid gap-6">
      <section className="surface-card p-6">
        <h2 className="text-xl font-semibold text-slate-50">Publish queue (SUBMITTED)</h2>
        <div className="mt-4 grid gap-3">
          {submittedReports.length === 0 ? (
            <p className="text-sm text-slate-300">No submitted reports are waiting for manager action.</p>
          ) : (
            submittedReports.map((report) => (
              <article key={report.id} className="surface-inset p-4 text-sm text-slate-200">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p>
                      #{report.id} · {report.project.name} ({report.project.code}) · <RagBadge value={report.rag} />
                    </p>
                    <p className="text-slate-300">Author: {report.createdBy.fullName}</p>
                  </div>
                  <button
                    type="button"
                    disabled={pendingId === report.id}
                    className="rounded-full border border-emerald-500/50 bg-emerald-500/20 px-3 py-1.5 font-semibold text-emerald-200 disabled:opacity-60"
                    onClick={async () => {
                      if (!accessToken) {
                        setError('Session access token unavailable.');
                        return;
                      }

                      setPendingId(report.id);
                      setError(null);
                      const response = await fetch(`/api/manager/status-reports/${report.id}/publish`, {
                        method: 'POST',
                        headers: {
                          'content-type': 'application/json',
                          Authorization: `Bearer ${accessToken}`,
                        },
                        body: JSON.stringify({}),
                      });
                      const payload = await response.json().catch(() => ({ error: 'Publish failed' }));
                      if (!response.ok) {
                        setError(payload.error ?? 'Publish failed');
                        setPendingId(null);
                        return;
                      }
                      setPendingId(null);
                      router.refresh();
                    }}
                  >
                    {pendingId === report.id ? 'Publishing…' : 'Publish'}
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="surface-card p-6">
        <h2 className="text-xl font-semibold text-slate-50">Risk register (unresolved)</h2>
        <div className="mt-4 grid gap-3">
          {risks.length === 0 ? (
            <p className="text-sm text-slate-300">No unresolved risks in your department scope.</p>
          ) : (
            risks.map((risk) => (
              <article key={risk.id} className="surface-inset p-4 text-sm text-slate-200">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p>{risk.title} · {risk.project.code} · {risk.severity}/{risk.likelihood}</p>
                    <p className="text-slate-300">Owner: {risk.owner.fullName}</p>
                  </div>
                  <button
                    type="button"
                    disabled={pendingId === risk.id}
                    className="rounded-full border border-amber-500/50 bg-amber-500/20 px-3 py-1.5 font-semibold text-amber-200 disabled:opacity-60"
                    onClick={async () => {
                      if (!accessToken) {
                        setError('Session access token unavailable.');
                        return;
                      }

                      setPendingId(risk.id);
                      setError(null);
                      const response = await fetch(`/api/manager/risks/${risk.id}/resolve`, {
                        method: 'PATCH',
                        headers: {
                          Authorization: `Bearer ${accessToken}`,
                        },
                      });
                      const payload = await response.json().catch(() => ({ error: 'Resolve failed' }));
                      if (!response.ok) {
                        setError(payload.error ?? 'Resolve failed');
                        setPendingId(null);
                        return;
                      }
                      setPendingId(null);
                      router.refresh();
                    }}
                  >
                    {pendingId === risk.id ? 'Resolving…' : 'Resolve'}
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
    </div>
  );
}
