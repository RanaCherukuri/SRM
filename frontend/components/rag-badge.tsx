type RagTone = 'GREEN' | 'AMBER' | 'RED' | 'UNKNOWN';

const toneClassMap: Record<RagTone, string> = {
  GREEN: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  AMBER: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  RED: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  UNKNOWN: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
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
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold tracking-wide ${toneClassMap[tone]}`}
    >
      {tone}
    </span>
  );
}

export function HealthBadge({ value }: { value: string }) {
  return <RagBadge value={value} />;
}
