import { Sparkles, ArrowRight, Lock } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { getSession } from "@/lib/session";

export function ToolHero({
  icon,
  title,
  subtitle,
  bullets,
  slug,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  bullets: string[];
  slug: string;
}) {
  const plan = getSession()?.plan ?? "trial";
  const locked = plan === "basico";

  return (
    <div className="max-w-3xl mx-auto mt-4">
      <div className="bg-white border border-border rounded-xl p-8 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            {icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-[20px] font-semibold tracking-tight text-ink">{title}</h2>
              <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full font-medium">
                <Sparkles className="h-3 w-3" /> Premium
              </span>
              {locked && (
                <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full font-medium">
                  <Lock className="h-3 w-3" /> Bloqueado
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{subtitle}</p>
          </div>
        </div>

        <ul className="mt-6 space-y-3">
          {bullets.map((b) => (
            <li key={b} className="flex items-start gap-2.5 text-[13px] text-foreground/80">
              <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
              {b}
            </li>
          ))}
        </ul>

        {locked ? (
          <div className="mt-8 rounded-lg border border-amber-200 bg-amber-50 p-5">
            <div className="flex gap-3">
              <Lock className="h-5 w-5 text-amber-600 shrink-0" />
              <div>
                <p className="text-[13px] font-medium text-amber-900 leading-tight">
                  Recurso Premium
                </p>
                <p className="text-[13px] text-amber-800/80 mt-1 leading-relaxed">
                  Esta ferramenta é exclusiva dos planos <strong>Premium</strong> e <strong>Enterprise</strong>.
                  Assine para liberar o acesso a todas as ferramentas de IA do ArqHub.
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                to="/planos"
                className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <Sparkles className="h-4 w-4" /> Assinar Premium
              </Link>
              <Link
                to="/recursos/premium/$slug"
                params={{ slug }}
                className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium hover:bg-secondary transition-colors"
              >
                Saiba mais <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-8 flex flex-wrap gap-2">
            <Link
              to={`/app/profissional/ferramentas/${slug}` as any}
              className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Começar a usar
            </Link>
            <Link
              to="/recursos/premium/$slug"
              params={{ slug }}
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-5 py-2.5 text-sm font-medium hover:bg-secondary transition-colors"
            >
              Manual da ferramenta <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
