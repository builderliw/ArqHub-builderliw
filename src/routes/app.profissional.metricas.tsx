import { createFileRoute } from "@tanstack/react-router";
import {
  TrendingUp, AlertTriangle, Check, MessageCircle, X, Clock, Calendar,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { navProfissional as nav } from "@/lib/nav-profissional";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { useOfficeMetrics, formatBRLCents } from "@/hooks/use-office-metrics";

export const Route = createFileRoute("/app/profissional/metricas")({
  head: () => ({ meta: [{ title: "Métricas do Escritório — ArqHub" }] }),
  component: PainelMetricas,
});

function PainelMetricas() {
  const m = useOfficeMetrics();

  if (m.loading) {
    return (
      <AppShell role="profissional" nav={nav} title="Métricas">
        <div className="text-[13px] text-muted-foreground">Carregando métricas...</div>
      </AppShell>
    );
  }

  if (!m.officeId) {
    return (
      <AppShell role="profissional" nav={nav} title="Métricas">
        <div className="bg-white border border-border rounded-xl p-10 text-center">
          <h2 className="text-[18px] font-semibold text-ink">Nenhum escritório encontrado</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Configure seu escritório para ver as métricas.
          </p>
        </div>
      </AppShell>
    );
  }

  const fmt = (n: number) => n.toLocaleString("pt-BR");
  const maxRevenue = Math.max(...m.revenueByMonth.map((x) => x.cents), 1);
  const totalStatus = m.statusBreakdown.reduce((a, s) => a + s.count, 0) || 1;

  return (
    <AppShell role="profissional" nav={nav} title="Métricas do escritório">
      <div className="mb-6">
        <h2 className="text-[22px] font-semibold tracking-tight text-ink">Métricas do escritório</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Visão consolidada de performance, receita e prazos.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiCard label="Projetos totais" value={fmt(m.totals.projetos)} hint={`${m.totals.ativos} ativos`} />
        <KpiCard label="Receita total" value={formatBRLCents(m.totals.receitaTotalCents)} hint="soma de orçamentos" />
        <KpiCard label="Ticket médio" value={formatBRLCents(m.totals.ticketMedioCents)} hint="por projeto" />
        <KpiCard label="Progresso médio" value={`${m.totals.progressoMedio}%`} hint="projetos ativos" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Receita por mês */}
        <section className="bg-white border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-[13px] font-semibold text-ink">Receita por mês</h3>
              <p className="text-[11.5px] text-muted-foreground">Últimos 6 meses</p>
            </div>
            <TrendingUp className="h-4 w-4 text-primary" strokeWidth={1.75} />
          </div>
          <div className="flex items-end gap-2 h-40">
            {m.revenueByMonth.map((mo) => {
              const h = (mo.cents / maxRevenue) * 100;
              return (
                <div key={mo.month} className="flex-1 flex flex-col items-center gap-1.5">
                  <div className="text-[10px] text-muted-foreground tabular-nums">
                    {mo.cents > 0 ? formatBRLCents(mo.cents).replace("R$\u00a0", "") : ""}
                  </div>
                  <div className="w-full bg-secondary rounded-t-md relative overflow-hidden" style={{ height: "100%" }}>
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-primary to-primary/70 rounded-t-md transition-all"
                      style={{ height: `${Math.max(h, mo.cents > 0 ? 4 : 0)}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-muted-foreground capitalize">{mo.label}</div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Status breakdown */}
        <section className="bg-white border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-[13px] font-semibold text-ink">Projetos por status</h3>
              <p className="text-[11.5px] text-muted-foreground">{m.totals.projetos} projetos</p>
            </div>
          </div>
          {m.statusBreakdown.length === 0 ? (
            <p className="text-[13px] text-muted-foreground py-6">Sem projetos cadastrados.</p>
          ) : (
            <ul className="space-y-3">
              {m.statusBreakdown.map((s) => {
                const pct = Math.round((s.count / totalStatus) * 100);
                return (
                  <li key={s.status}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[13px] text-ink">{s.label}</span>
                      <span className="text-[11.5px] text-muted-foreground tabular-nums">
                        {s.count} · {pct}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {/* Aprovações */}
      <section className="bg-white border border-border rounded-xl p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-[13px] font-semibold text-ink">Aprovações de clientes</h3>
            <p className="text-[11.5px] text-muted-foreground">
              {m.approvals.total} etapas no total
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatPill icon={Check} color="text-primary" bg="bg-primary/10" label="Aprovadas" value={m.approvals.approved} />
          <StatPill icon={MessageCircle} color="text-amber-700" bg="bg-amber-50" label="Ajustes pedidos" value={m.approvals.changes} />
          <StatPill icon={X} color="text-red-700" bg="bg-red-50" label="Rejeitadas" value={m.approvals.rejected} />
          <StatPill icon={Clock} color="text-muted-foreground" bg="bg-secondary" label="Pendentes" value={m.approvals.pending} />
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Projetos em atraso */}
        <section className="bg-white border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[13px] font-semibold text-ink">Projetos em atraso</h3>
              <p className="text-[11.5px] text-muted-foreground">Prazo final vencido</p>
            </div>
            <AlertTriangle className="h-4 w-4 text-amber-600" strokeWidth={1.75} />
          </div>
          {m.overdue.length === 0 ? (
            <p className="text-[13px] text-muted-foreground py-4">Nenhum projeto atrasado. 🎉</p>
          ) : (
            <ul className="divide-y divide-border -mx-1">
              {m.overdue.map((p) => (
                <li key={p.id} className="px-1 py-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[13px] font-medium text-ink truncate">{p.name}</div>
                      <div className="text-[11.5px] text-muted-foreground">{p.client}</div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11.5px] font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-700 shrink-0">
                      {p.daysOverdue}d atraso
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Próximas entregas */}
        <section className="bg-white border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[13px] font-semibold text-ink">Próximas entregas</h3>
              <p className="text-[11.5px] text-muted-foreground">Próximos 30 dias</p>
            </div>
            <Calendar className="h-4 w-4 text-primary" strokeWidth={1.75} />
          </div>
          {m.upcoming.length === 0 ? (
            <p className="text-[13px] text-muted-foreground py-4">Sem entregas nos próximos 30 dias.</p>
          ) : (
            <ul className="divide-y divide-border -mx-1">
              {m.upcoming.map((s) => (
                <li key={s.id} className="px-1 py-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[13px] font-medium text-ink truncate">{s.title}</div>
                      <div className="text-[11.5px] text-muted-foreground truncate">{s.project}</div>
                    </div>
                    <span className={`inline-flex items-center gap-1 text-[11.5px] font-medium px-2 py-0.5 rounded-full shrink-0 ${
                      s.daysLeft <= 3 ? "bg-amber-50 text-amber-700" : "bg-primary/10 text-primary"
                    }`}>
                      {s.daysLeft === 0 ? "hoje" : `em ${s.daysLeft}d`}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function StatPill({
  icon: Icon, color, bg, label, value,
}: {
  icon: any; color: string; bg: string; label: string; value: number;
}) {
  return (
    <div className={`rounded-lg border border-border p-3.5 ${bg}`}>
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${color}`} strokeWidth={2} />
        <span className="text-[11.5px] text-muted-foreground">{label}</span>
      </div>
      <div className={`mt-1.5 text-[22px] font-semibold tabular-nums ${color}`}>{value}</div>
    </div>
  );
}
