type RagTone = 'GREEN' | 'AMBER' | 'RED' | 'UNKNOWN';

const toneClassMap: Record<RagTone, string> = {
  GREEN: 'bg-emerald-400/15 text-emerald-200 border-emerald-400/40 shadow-[0_0_10px_rgba(52,211,153,0.12)]',
  AMBER: 'bg-amber-400/15 text-amber-200 border-amber-400/40 shadow-[0_0_10px_rgba(251,191,36,0.12)]',
  RED: 'bg-rose-400/15 text-rose-200 border-rose-400/40 shadow-[0_0_10px_rgba(251,113,133,0.14)]',
  UNKNOWN: 'bg-slate-400/15 text-slate-300 border-slate-400/35',
};

const dotClassMap: Record<RagTone, string> = {
  GREEN: 'bg-emerald-400',
  AMBER: 'bg-amber-400',
  RED: 'bg-rose-400',
  UNKNOWN: 'bg-slate-400',
};

function normalizeTone(value: string): RagTone {
  if (value === 'GREEN' || value === 'AMBER' || value === 'RED') {
    return value;
  }
  return 'UNKNOWN';
}

export function RagBadge({ value }: { value: string }) {
  const tone = normalizeTone(value);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold tracking-wider ${toneClassMap[tone]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotClassMap[tone]}`} />
      {tone}
    </span>
  );
}

export function HealthBadge({ value }: { value: string }) {
  return <RagBadge value={value} />;
}
