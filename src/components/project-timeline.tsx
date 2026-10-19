// Reconstruído em out/2026 (arquivo original perdido na migração da Lovable).
// Linha do tempo vertical das etapas de um projeto.
import { Check, Circle, Clock } from "lucide-react";
import { formatShortDate } from "@/hooks/use-profissional-data";

export type TimelineStage = {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  progress?: number | null;
  start_at?: string | null;
  end_at?: string | null;
  done?: boolean;
  atual?: boolean;
};

const DONE = new Set(["done", "completed"]);

export function ProjectTimeline({
  stages,
  emptyText = "Nenhuma etapa cadastrada ainda.",
  className = "",
}: {
  stages: TimelineStage[];
  emptyText?: string;
  className?: string;
}) {
  if (!stages || stages.length === 0) {
    return <p className={`text-[13px] text-muted-foreground ${className}`}>{emptyText}</p>;
  }

  return (
    <ol className={`relative ${className}`}>
      {stages.map((s, i) => {
        const done = s.done ?? DONE.has(s.status);
        const current = s.atual ?? s.status === "in_progress";
        const last = i === stages.length - 1;
        const progress = Math.max(0, Math.min(100, Math.round(Number(s.progress) || 0)));
        return (
          <li key={s.id} className="relative flex gap-3 pb-5 last:pb-0">
            {!last && (
              <span
                aria-hidden
                className={`absolute left-[11px] top-6 bottom-0 w-px ${done ? "bg-primary/50" : "bg-border"}`}
              />
            )}
            <span
              className={`relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                done
                  ? "bg-primary border-primary text-primary-foreground"
                  : current
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-background border-border text-muted-foreground"
              }`}
            >
              {done ? (
                <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
              ) : current ? (
                <Clock className="h-3.5 w-3.5" />
              ) : (
                <Circle className="h-2.5 w-2.5" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className={`text-[13.5px] font-medium truncate ${done ? "text-muted-foreground" : "text-ink"}`}>
                  {s.title}
                </span>
                {s.end_at && (
                  <span className="shrink-0 text-[11.5px] text-muted-foreground">{formatShortDate(s.end_at)}</span>
                )}
              </div>
              {s.description && (
                <p className="mt-0.5 text-[12.5px] text-muted-foreground line-clamp-2">{s.description}</p>
              )}
              {current && (
                <div className="mt-2 h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
