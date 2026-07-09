type RagTone = 'GREEN' | 'AMBER' | 'RED' | 'UNKNOWN';

const toneClassMap: Record<RagTone, string> = {
  GREEN: 'bg-emerald-400/20 text-emerald-100 border-emerald-300/45',
  AMBER: 'bg-amber-400/20 text-amber-100 border-amber-300/45',
  RED: 'bg-rose-400/20 text-rose-100 border-rose-300/45',
  UNKNOWN: 'bg-slate-400/20 text-slate-100 border-slate-300/45',
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
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-[0.03em] ${toneClassMap[tone]}`}
    >
      {tone}
    </span>
  );
}

export function HealthBadge({ value }: { value: string }) {
  return <RagBadge value={value} />;
}
