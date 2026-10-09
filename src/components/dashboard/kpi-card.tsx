import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Sparkline } from "./sparkline";

type Props = {
  label: string;
  value: string;
  delta?: string;
  trend?: "up" | "down" | "flat";
  data?: number[];
  hint?: string;
  icon?: LucideIcon;
  accent?: "primary" | "emerald" | "amber" | "blue" | "violet" | "rose";
};

const accentMap: Record<NonNullable<Props["accent"]>, string> = {
  primary: "bg-primary/10 text-primary",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  blue: "bg-blue-50 text-blue-600",
  violet: "bg-violet-50 text-violet-600",
  rose: "bg-rose-50 text-rose-600",
};

export function KpiCard({ label, value, delta, trend = "up", data, hint, icon: Icon, accent = "primary" }: Props) {
  const positive = trend !== "down";
  const color = positive ? "text-emerald-600" : "text-rose-500";
  const sparkColor = positive ? "rgb(16 185 129)" : "rgb(244 63 94)";

  return (
    <div className="group relative rounded-xl bg-white border border-border p-5 transition-all hover:shadow-[0_8px_28px_-12px_rgba(0,0,0,0.12)] hover:-translate-y-px">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {Icon && (
              <span className={`inline-flex h-7 w-7 items-center justify-center rounded-md ${accentMap[accent]}`}>
                <Icon className="h-3.5 w-3.5" strokeWidth={2} />
              </span>
            )}
            <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
          </div>
          <div className="mt-2.5 text-[26px] leading-none font-semibold tracking-tight text-ink tabular-nums">
            {value}
          </div>
        </div>
        {data && (
          <div className={color}>
            <Sparkline data={data} color={sparkColor} />
          </div>
        )}
      </div>
      {(delta || hint) && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          {delta && (
            <span className={`inline-flex items-center gap-0.5 font-medium ${color}`}>
              {trend === "down" ? (
                <ArrowDownRight className="h-3 w-3" strokeWidth={2} />
              ) : (
                <ArrowUpRight className="h-3 w-3" strokeWidth={2} />
              )}
              {delta}
            </span>
          )}
          {hint && <span className="text-muted-foreground">{hint}</span>}
        </div>
      )}
    </div>
  );
}
