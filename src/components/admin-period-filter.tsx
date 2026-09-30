export const PERIOD_OPTIONS = [
  { days: 7, label: "7 dias" },
  { days: 30, label: "30 dias" },
  { days: 90, label: "90 dias" },
  { days: 0, label: "Desde o início" },
] as const;

export function periodLabel(days: number) {
  return PERIOD_OPTIONS.find((o) => o.days === days)?.label ?? `${days} dias`;
}

export function AdminPeriodFilter({ value, onChange }: { value: number; onChange: (days: number) => void }) {
  return (
    <div className="inline-flex flex-wrap items-center gap-1 rounded-xl border border-border bg-white p-1">
      {PERIOD_OPTIONS.map((o) => {
        const active = o.days === value;
        return (
          <button
            key={o.days}
            type="button"
            onClick={() => onChange(o.days)}
            className={`rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium transition ${
              active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary/70"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
