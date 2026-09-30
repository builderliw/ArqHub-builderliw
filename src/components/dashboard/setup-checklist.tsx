import { Link } from "@tanstack/react-router";
import { Check, Circle, ChevronRight, Sparkles } from "lucide-react";

export type ChecklistItem = {
  id: string;
  label: string;
  done: boolean;
  to?: string;
  onClick?: () => void;
};

export function SetupChecklist({
  items,
  onDismiss,
}: {
  items: ChecklistItem[];
  onDismiss?: () => void;
}) {
  const total = items.length;
  const done = items.filter((i) => i.done).length;
  const allDone = done === total;
  const pct = total > 0 ? (done / total) * 100 : 0;

  return (
    <div className="bg-white border border-border rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border bg-gradient-to-r from-primary/5 to-transparent flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Sparkles className="h-4 w-4" strokeWidth={2} />
          </span>
          <div>
            <h3 className="text-[13.5px] font-semibold text-ink">
              {allDone ? "Escritório configurado com sucesso" : "Primeiros Passos"}
            </h3>
            <p className="text-[11.5px] text-muted-foreground">
              {allDone ? "Tudo pronto. Bom trabalho!" : `${done}/${total} concluídos`}
            </p>
          </div>
        </div>
        {allDone && onDismiss && (
          <button onClick={onDismiss} className="text-[12px] text-muted-foreground hover:text-ink">
            Dispensar
          </button>
        )}
      </div>
      <div className="px-5 pt-3 pb-2">
        <div className="h-1 bg-secondary rounded-full overflow-hidden">
          <div className="h-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <ul className="px-2 py-2">
        {items.map((it) => {
          const content = (
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-secondary/40 transition-colors group cursor-pointer">
              {it.done ? (
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white shrink-0">
                  <Check className="h-3 w-3" strokeWidth={2.5} />
                </span>
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground/50 shrink-0" strokeWidth={1.75} />
              )}
              <span className={`flex-1 text-[13px] ${it.done ? "text-muted-foreground line-through" : "text-ink font-medium"}`}>
                {it.label}
              </span>
              {!it.done && (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={1.75} />
              )}
            </div>
          );
          if (it.to && !it.done) return <li key={it.id}><Link to={it.to}>{content}</Link></li>;
          if (it.onClick && !it.done) return <li key={it.id}><button onClick={it.onClick} className="w-full text-left">{content}</button></li>;
          return <li key={it.id}>{content}</li>;
        })}
      </ul>
    </div>
  );
}
