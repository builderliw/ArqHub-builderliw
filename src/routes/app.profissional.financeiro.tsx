import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Wallet, TrendingUp, TrendingDown, ArrowUpRight, Briefcase, Users, Target, AlertCircle, Loader2, CircleDollarSign, BarChart3, PiggyBank, Receipt, Eye, EyeOff } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { navProfissional as nav } from "@/lib/nav-profissional";
import { useOfficeMetrics, formatBRLCents } from "@/hooks/use-office-metrics";
import financeiroBanner from "@/assets/financeiro-banner.jpg.asset.json";



export const Route = createFileRoute("/app/profissional/financeiro")({
  head: () => ({ meta: [{ title: "Financeiro — ArqHub" }] }),
  component: FinanceiroPage,
});

function FinanceiroPage() {
  const m = useOfficeMetrics();
  const [hidden, setHidden] = useState(false);
  const fmt = (cents: number) => (hidden ? "R$ ••••••" : formatBRLCents(cents));

  if (m.loading) {
    return (
      <AppShell role="profissional" nav={nav} title="Financeiro">
        <div className="flex justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      </AppShell>
    );
  }

  const maxRev = Math.max(1, ...m.revenueByMonth.map((x) => x.cents));
  const lastTwo = m.revenueByMonth.slice(-2);
  const growth = lastTwo.length === 2 && lastTwo[0].cents > 0
    ? Math.round(((lastTwo[1].cents - lastTwo[0].cents) / lastTwo[0].cents) * 100)
    : null;

  const projetadoRecebido = m.totals.receitaTotalCents - m.totals.receitaAtivosCents;
  const taxaConclusao = m.totals.projetos ? Math.round((m.totals.concluidos / m.totals.projetos) * 100) : 0;

  return (
    <AppShell role="profissional" nav={nav} title="Financeiro">
      <div className="flex flex-col gap-3 flex-1 min-h-0">
      {/* Hero financeiro */}
      <div className="relative overflow-hidden rounded-2xl shadow-lg text-primary-foreground flex-1 min-h-0">
        <img src={financeiroBanner.url} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/80 to-primary/40" />
        <div className="relative p-10 sm:p-16 h-full flex items-center">
          <div className="max-w-3xl">
            <h1 className="text-[22px] sm:text-[28px] font-semibold tracking-tight text-white leading-tight">
              A vida financeira do seu escritório.
            </h1>
            <div className="mt-3 flex items-center gap-2 text-[32px] sm:text-[40px] leading-none font-semibold tracking-tight text-white break-words">
              <span>{fmt(m.totals.receitaTotalCents)}</span>
              <button
                type="button"
                onClick={() => setHidden((h) => !h)}
                aria-label={hidden ? "Mostrar valores" : "Esconder valores"}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-white/10 text-white/85 hover:text-white transition-colors"
              >
                {hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11.5px]">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/12 border border-white/20 backdrop-blur">
                <CircleDollarSign className="h-3 w-3" />
                <span className="text-white/80">Em andamento:</span> <strong className="font-semibold text-white">{fmt(m.totals.receitaAtivosCents)}</strong>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/12 border border-white/20 backdrop-blur">
                <PiggyBank className="h-3 w-3" />
                <span className="text-white/80">Entregue:</span> <strong className="font-semibold text-white">{fmt(projetadoRecebido)}</strong>
              </span>
              {growth !== null && (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border backdrop-blur ${growth >= 0 ? "bg-emerald-400/20 border-emerald-300/40 text-emerald-50" : "bg-rose-400/20 border-rose-300/40 text-rose-50"}`}>
                  {growth >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {growth >= 0 ? "+" : ""}{growth}% vs mês anterior
                </span>
              )}
              <Link to="/app/profissional/projetos" className="ml-auto inline-flex items-center gap-1 px-2.5 h-7 rounded-md bg-white text-primary text-[11.5px] font-medium hover:bg-white/90 transition-colors shadow-sm">
                Ver projetos <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico + breakdown */}
      <div className="grid lg:grid-cols-3 gap-3 h-40 shrink-0">
        <div className="lg:col-span-2 bg-white border border-border rounded-xl p-3 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                <BarChart3 className="h-3 w-3" /> Receita por mês
              </div>
              <h3 className="text-[13px] font-semibold text-ink mt-0.5">Últimos 6 meses</h3>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-muted-foreground">Total no período</div>
              <div className="text-[13px] font-semibold text-ink">
                {fmt(m.revenueByMonth.reduce((a, x) => a + x.cents, 0))}
              </div>
            </div>
          </div>

          <div className="flex items-end gap-2 flex-1 min-h-0">
            {m.revenueByMonth.map((mo) => {
              const h = Math.max(4, Math.round((mo.cents / maxRev) * 100));
              return (
                <div key={mo.month} className="flex-1 flex flex-col items-center gap-1 group h-full">
                  <div className="text-[10px] font-medium text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                    {fmt(mo.cents)}
                  </div>
                  <div className="w-full flex-1 flex items-end">
                    <div
                      className="w-full rounded-t-md bg-gradient-to-t from-primary to-primary/60 hover:from-primary hover:to-primary/80 transition-all"
                      style={{ height: `${h}%` }}
                    />
                  </div>
                  <div className="text-[10.5px] text-muted-foreground capitalize">{mo.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white border border-border rounded-xl p-3 flex flex-col min-h-0">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Carteira</div>
          <h3 className="text-[13px] font-semibold text-ink mb-2">Distribuição por status</h3>
          {m.statusBreakdown.length === 0 ? (
            <p className="text-[12px] text-muted-foreground italic">Sem projetos cadastrados.</p>
          ) : (
            <ul className="space-y-1.5 flex-1 overflow-auto">
              {m.statusBreakdown.map((s) => {
                const pct = m.totals.projetos ? Math.round((s.count / m.totals.projetos) * 100) : 0;
                return (
                  <li key={s.status}>
                    <div className="flex items-center justify-between text-[11.5px] mb-0.5">
                      <span className="text-ink font-medium">{s.label}</span>
                      <span className="text-muted-foreground">{s.count} · {pct}%</span>
                    </div>
                    <div className="h-1 rounded-full bg-secondary overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Atrasos + Próximas entregas */}
      <div className="grid lg:grid-cols-2 gap-3 h-28 shrink-0">
        <div className="bg-white border border-border rounded-xl p-3 flex flex-col min-h-0">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-3.5 w-3.5 text-rose-500" />
            <h3 className="text-[13px] font-semibold text-ink">Projetos em atraso</h3>
            <span className="ml-auto text-[10.5px] px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-600 font-medium">{m.overdue.length}</span>
          </div>
          {m.overdue.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-[11.5px] text-muted-foreground">Tudo em dia. Nenhum atraso registrado.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border -mx-1 flex-1 overflow-auto">
              {m.overdue.map((p) => (
                <li key={p.id} className="px-1 py-1.5 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-[12.5px] font-medium text-ink truncate">{p.name}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{p.client}</div>
                  </div>
                  <span className="text-[10.5px] px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-600 font-medium">
                    {p.daysOverdue}d
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white border border-border rounded-xl p-3 flex flex-col min-h-0">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-3.5 w-3.5 text-primary" />
            <h3 className="text-[13px] font-semibold text-ink">Próximas entregas</h3>
            <span className="ml-auto text-[10.5px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{m.upcoming.length}</span>
          </div>
          {m.upcoming.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-[11.5px] text-muted-foreground">Nenhuma etapa nos próximos 30 dias.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border -mx-1 flex-1 overflow-auto">
              {m.upcoming.map((s) => (
                <li key={s.id} className="px-1 py-1.5 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-[12.5px] font-medium text-ink truncate">{s.title}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{s.project}</div>
                  </div>
                  <span className={`text-[10.5px] px-1.5 py-0.5 rounded-full font-medium ${s.daysLeft <= 3 ? "bg-amber-50 text-amber-700" : "bg-secondary text-muted-foreground"}`}>
                    em {s.daysLeft}d
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* KPIs (rodapé) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
        <KPI icon={<Receipt className="h-3.5 w-3.5" />} label="Ticket médio" value={fmt(m.totals.ticketMedioCents)} tone="indigo" />
        <KPI icon={<Briefcase className="h-3.5 w-3.5" />} label="Projetos ativos" value={String(m.totals.ativos)} sub={`${m.totals.projetos} no total`} tone="primary" />
        <KPI icon={<Target className="h-3.5 w-3.5" />} label="Taxa de conclusão" value={`${taxaConclusao}%`} sub={`${m.totals.concluidos} concluídos`} tone="emerald" />
        <KPI icon={<Users className="h-3.5 w-3.5" />} label="Clientes" value={String(m.totals.clientes)} tone="amber" />
      </div>
      </div>
    </AppShell>
  );
}

function KPI({ icon, label, value, sub, tone }: { icon: React.ReactNode; label: string; value: string; sub?: string; tone: "primary" | "emerald" | "amber" | "indigo" }) {
  const tones: Record<string, string> = {
    primary: "from-primary/15 to-primary/5 text-primary",
    emerald: "from-emerald-100 to-emerald-50 text-emerald-600",
    amber: "from-amber-100 to-amber-50 text-amber-600",
    indigo: "from-indigo-100 to-indigo-50 text-indigo-600",
  };
  return (
    <div className="bg-white border border-border rounded-xl p-3 hover:shadow-sm transition-shadow">
      <div className={`h-7 w-7 rounded-lg bg-gradient-to-br ${tones[tone]} flex items-center justify-center mb-1.5`}>{icon}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-[17px] font-semibold text-ink tracking-tight mt-0.5 leading-tight">{value}</div>
      {sub && <div className="text-[10.5px] text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

