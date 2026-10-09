import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AdminPeriodFilter, periodLabel } from "@/components/admin-period-filter";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import type { AdminOverview } from "@/lib/admin-overview.functions";
import {
  Users,
  Building2,
  CreditCard,
  MessageSquare,
  Sparkles,
  Activity,
  TrendingUp,
  ArrowUpRight,
  BookOpen,
  Bell,
  AlertCircle,
  Wallet,
  ShieldCheck,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { adminNav } from "@/lib/nav-admin";
import { getAdminOverview } from "@/lib/admin-overview.functions";
import { getOnboardingFunnel } from "@/lib/admin-onboarding.functions";
import { externalSupabase } from "@/integrations/external-supabase/client";
import { ArrowRight, MousePointer2, UserCheck, ShoppingCart, Percent } from "lucide-react";

export const Route = createFileRoute("/app/admin/")({
  head: () => ({ meta: [{ title: "Admin — ArqHub" }] }),
  component: PainelAdmin,
});

function fmtBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}
function fmt(n: number) {
  return n.toLocaleString("pt-BR");
}
function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `há ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `há ${h}h`;
  const d = Math.floor(h / 24);
  return `há ${d}d`;
}

function PainelAdmin() {
  const overview = useServerFn(getAdminOverview);
  const onboarding = useServerFn(getOnboardingFunnel);
  const [days, setDays] = useState(30);
  const label = periodLabel(days).toLowerCase();
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-overview", days],
    queryFn: async () => {
      const { data: sess } = await externalSupabase.auth.getSession();
      const accessToken = sess.session?.access_token;
      if (!accessToken) throw new Error("Sessão expirada. Faça login novamente.");
      return overview({ data: { accessToken, days } });
    },
    refetchInterval: 60000,
  });

  const funnelQuery = useQuery({
    queryKey: ["admin-onboarding-funnel", days],
    queryFn: async () => {
      const { data: sess } = await externalSupabase.auth.getSession();
      const accessToken = sess.session?.access_token;
      if (!accessToken) throw new Error("Sessão expirada.");
      return onboarding({ data: { accessToken, days } });
    },
  });

  const funnel = funnelQuery.data;

  return (
    <AppShell role="admin" nav={adminNav} title="Administração da plataforma">
      {/* HERO BANNER */}
      <section className="relative overflow-hidden rounded-2xl mb-6 border border-primary/20 bg-gradient-to-br from-primary via-primary to-emerald-700 text-white">
        <div
          className="absolute inset-0 opacity-[0.08] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
        <div className="absolute -top-24 -right-16 h-72 w-72 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-10 h-60 w-60 rounded-full bg-emerald-300/20 blur-3xl pointer-events-none" />

        <div className="relative px-5 sm:px-8 py-7 sm:py-9 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur px-3 py-1 text-[11px] font-medium uppercase tracking-wider">
              <ShieldCheck className="h-3.5 w-3.5" /> Painel administrativo
            </div>
            <h1 className="mt-3 text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight">
              Bem-vindo ao comando do ArqHub
            </h1>
            <p className="mt-2 text-sm sm:text-base text-white/85 max-w-xl">
              Visão consolidada de usuários, receita, suporte e operação em tempo real.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Link
              to="/app/admin/usuarios"
              className="inline-flex items-center gap-1.5 rounded-lg bg-white text-primary px-3.5 py-2 text-sm font-medium hover:bg-white/90 transition"
            >
              <Users className="h-4 w-4" /> Usuários
            </Link>
            <Link
              to="/app/admin/planos"
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 border border-white/25 backdrop-blur px-3.5 py-2 text-sm font-medium hover:bg-white/20 transition"
            >
              <CreditCard className="h-4 w-4" /> Planos
            </Link>
          </div>
        </div>
      </section>

      {error && (
        <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 px-4 py-3 text-sm">
          {(error as Error).message}
        </div>
      )}

      {/* FILTRO DE PERÍODO */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <p className="text-[13px] text-muted-foreground">
          Período: <span className="font-medium text-ink">{periodLabel(days)}</span>
        </p>
        <AdminPeriodFilter value={days} onChange={setDays} />
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <KpiTile
          to="/app/admin/usuarios"
          label="Usuários"
          value={isLoading ? "—" : fmt(data?.users.total ?? 0)}
          hint={isLoading ? " " : `+${fmt(data?.period.usersNew ?? 0)} em ${label}`}
          icon={Users}
          tone="blue"
        />
        <KpiTile
          to="/app/admin/empresas"
          label="Escritórios"
          value={isLoading ? "—" : fmt(data?.offices.total ?? 0)}
          hint={isLoading ? " " : `${fmt(data?.offices.active ?? 0)} ativos · ${fmt(data?.offices.trial ?? 0)} em teste`}
          icon={Building2}
          tone="violet"
        />
        <KpiTile
          to="/app/admin/planos"
          label="MRR atual"
          value={isLoading ? "—" : fmtBRL(data?.subscriptions.mrrCents ?? 0)}
          hint={isLoading ? " " : `${fmt(data?.subscriptions.active ?? 0)} assinaturas ativas`}
          icon={TrendingUp}
          tone="emerald"
        />
        <KpiTile
          to="/app/admin/pagamentos"
          label={`Receita · ${periodLabel(days)}`}
          value={isLoading ? "—" : fmtBRL(data?.period.revenueCents ?? 0)}
          hint={isLoading ? " " : `${fmt(data?.period.paymentsApproved ?? 0)} pagamentos aprovados`}
          icon={Wallet}
          tone="primary"
        />
      </div>

      {/* SECONDARY KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <KpiTile
          to="/app/admin/suporte"
          label="Suporte"
          value={isLoading ? "—" : fmt(data?.support.pending ?? 0)}
          hint={isLoading ? " " : `${fmt(data?.support.total ?? 0)} no total`}
          icon={MessageSquare}
          tone="amber"
          badge={!isLoading && (data?.support.pending ?? 0) > 0 ? "novo" : undefined}
        />
        <KpiTile
          to="/app/admin/enterprise"
          label="Enterprise"
          value={isLoading ? "—" : fmt(data?.enterprise.pending ?? 0)}
          hint={isLoading ? " " : `${fmt(data?.enterprise.total ?? 0)} solicitações`}
          icon={Sparkles}
          tone="rose"
          badge={!isLoading && (data?.enterprise.pending ?? 0) > 0 ? "novo" : undefined}
        />
        <KpiTile
          to="/app/admin/materiais"
          label="Materiais"
          value={isLoading ? "—" : fmt(data?.materials.total ?? 0)}
          hint="conteúdos publicados"
          icon={BookOpen}
          tone="blue"
        />
        <KpiTile
          to="/app/admin/pagamentos"
          label="Churn 30d"
          value={
            isLoading
              ? "—"
              : `${(
                  ((data?.subscriptions.canceled30d ?? 0) /
                    Math.max(1, (data?.subscriptions.active ?? 0) + (data?.subscriptions.canceled30d ?? 0))) *
                  100
                )
                  .toFixed(1)
                  .replace(".", ",")}%`
          }
          hint={isLoading ? " " : `${fmt(data?.subscriptions.canceled30d ?? 0)} cancelamentos`}
          icon={Activity}
          tone="rose"
        />
      </div>

      {/* TRÁFEGO + DOWNLOADS (desde o primeiro dia) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 bg-white border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-ink">Fluxo do site</h3>
              <p className="text-[11.5px] text-muted-foreground">
                Dados acumulados{data?.since ? ` desde ${new Date(data.since).toLocaleDateString("pt-BR")}` : ""}
              </p>
            </div>
            <Link to="/app/admin/logs" className="text-xs text-primary hover:underline">
              Ver logs
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <MiniStat label={`Pageviews · ${periodLabel(days)}`} value={isLoading ? "—" : fmt(data?.period.pageviews ?? 0)} />
            <MiniStat label={`Visitantes · ${periodLabel(days)}`} value={isLoading ? "—" : fmt(data?.period.visitors ?? 0)} />
            <MiniStat label="Anônimos" value={isLoading ? "—" : fmt(data?.traffic.anonymous ?? 0)} />
            <MiniStat label="Mobile" value={isLoading ? "—" : fmt(data?.traffic.mobile ?? 0)} />
            <MiniStat label="Desktop" value={isLoading ? "—" : fmt(data?.traffic.desktop ?? 0)} />
            <MiniStat label="Apps instalados" value={isLoading ? "—" : fmt(data?.traffic.installs ?? 0)} />
          </div>
          <div className="mt-5">
            <h4 className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Páginas mais vistas</h4>
            <ul className="space-y-1.5">
              {(data?.traffic.topPages ?? []).map((p) => (
                <li key={p.route} className="flex items-center justify-between text-[13px]">
                  <span className="truncate text-foreground/80">{p.route}</span>
                  <span className="tabular-nums font-medium">{fmt(p.count)}</span>
                </li>
              ))}
              {!isLoading && !(data?.traffic.topPages ?? []).length && (
                <li className="text-[13px] text-muted-foreground">Sem registros ainda.</li>
              )}
            </ul>
          </div>
        </div>

        <div className="bg-white border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-ink">Downloads</h3>
            <Link to="/app/admin/downloads" className="text-xs text-primary hover:underline">
              Detalhes
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <MiniStat label="Total" value={isLoading ? "—" : fmt(data?.downloads.total ?? 0)} />
            <MiniStat label={periodLabel(days)} value={isLoading ? "—" : fmt(data?.period.downloads ?? 0)} />
          </div>
          <h4 className="mt-5 text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Mais baixados</h4>
          <ul className="space-y-1.5">
            {(data?.downloads.top ?? []).map((d) => (
              <li key={d.slug} className="flex items-center justify-between text-[13px]">
                <span className="truncate text-foreground/80">{d.title}</span>
                <span className="tabular-nums font-medium">{fmt(d.count)}</span>
              </li>
            ))}
            {!isLoading && !(data?.downloads.top ?? []).length && (
              <li className="text-[13px] text-muted-foreground">Nenhum download ainda.</li>
            )}
          </ul>
        </div>
      </div>

      {/* FUNIL DE ONBOARDING */}
      <div className="bg-white border border-border rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-semibold text-ink">Funil de Onboarding</h3>
            <p className="text-[11.5px] text-muted-foreground">Conversão de visitantes em clientes pagantes ({periodLabel(days)})</p>
          </div>
          {funnel && (
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[11px] font-bold uppercase tracking-wider border border-emerald-100">
              <Percent className="h-3 w-3" /> Taxa de Ativação: {funnel.activationRate}%
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Step 1: Visits */}
          <div className="relative flex flex-col items-center text-center">
            <div className="h-12 w-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <MousePointer2 className="h-6 w-6" />
            </div>
            <div className="text-2xl font-bold text-ink">{isLoading || funnelQuery.isLoading ? "—" : fmt(funnel?.steps.visits ?? 0)}</div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Visitas Únicas</div>
            
            <div className="hidden md:flex absolute -right-4 top-6 items-center">
              <ArrowRight className="h-4 w-4 text-muted-foreground/30" />
            </div>
          </div>

          {/* Step 2: Login */}
          <div className="relative flex flex-col items-center text-center">
            <div className="h-12 w-12 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center mb-3">
              <UserCheck className="h-6 w-6" />
            </div>
            <div className="text-2xl font-bold text-ink">{isLoading || funnelQuery.isLoading ? "—" : fmt(funnel?.steps.login ?? 0)}</div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Logins / Cadastros</div>
            <div className="mt-1 text-[10px] font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded">
              CV: {funnel?.rates.visitToLogin}%
            </div>

            <div className="hidden md:flex absolute -right-4 top-6 items-center">
              <ArrowRight className="h-4 w-4 text-muted-foreground/30" />
            </div>
          </div>

          {/* Step 3: Purchase */}
          <div className="relative flex flex-col items-center text-center">
            <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <ShoppingCart className="h-6 w-6" />
            </div>
            <div className="text-2xl font-bold text-ink">{isLoading || funnelQuery.isLoading ? "—" : fmt(funnel?.steps.purchase ?? 0)}</div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Assinaturas / Compras</div>
            <div className="mt-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
              CV: {funnel?.rates.loginToPurchase}%
            </div>
          </div>
        </div>

        <div className="mt-8 pt-5 border-t border-dashed border-border flex justify-center">
          <div className="text-center">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Conversão Geral (Visita → Compra)</div>
            <div className="text-xl font-bold text-primary">{funnel?.rates.overall}%</div>
          </div>
        </div>
      </div>



      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Recent events */}
        <div className="lg:col-span-2 bg-white border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
            <div>
              <h3 className="text-sm font-semibold text-ink">Atividade recente</h3>
              <p className="text-[11.5px] text-muted-foreground">Eventos consolidados dos módulos</p>
            </div>
            <Link to="/app/admin/logs" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
              Ver tudo <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          {isLoading ? (
            <ul className="divide-y divide-border">
              {[0, 1, 2, 3, 4].map((i) => (
                <li key={i} className="px-5 py-3.5">
                  <div className="h-3 w-2/3 bg-secondary rounded animate-pulse" />
                </li>
              ))}
            </ul>
          ) : data?.events.length ? (
            <ul className="divide-y divide-border">
              {data.events.map((e: AdminOverview["events"][number]) => (
                <li key={e.id} className="px-5 py-3 flex items-center justify-between gap-3 hover:bg-secondary/40 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <EventTag kind={e.kind} />
                    <span className="text-[13px] text-ink truncate">{e.title}</span>
                  </div>
                  <span className="text-[11.5px] text-muted-foreground shrink-0">{timeAgo(e.at)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-5 py-10 text-center text-sm text-muted-foreground">
              Nenhum evento recente.
            </div>
          )}
        </div>

        {/* Quick actions + Health */}
        <div className="space-y-4">
          <div className="bg-white border border-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-ink mb-3">Acesso rápido</h3>
            <div className="grid grid-cols-2 gap-2">
              <QuickLink to="/app/admin/usuarios" icon={Users} label="Usuários" />
              <QuickLink to="/app/admin/planos" icon={CreditCard} label="Planos" />
              <QuickLink to="/app/admin/suporte" icon={MessageSquare} label="Suporte" />
              <QuickLink to="/app/admin/enterprise" icon={Sparkles} label="Enterprise" />
              <QuickLink to="/app/admin/materiais" icon={BookOpen} label="Materiais" />
              <QuickLink to="/app/admin/configuracoes" icon={Bell} label="Config." />
            </div>
          </div>

          <div className="bg-white border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-ink">Saúde do sistema</h3>
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60 animate-ping" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </span>
                Estável
              </span>
            </div>
            <ul className="space-y-2 text-[13px]">
              {[
                { s: "API", ok: true },
                { s: "Banco de dados", ok: true },
                { s: "Pagamentos", ok: true },
                { s: "Storage", ok: true },
                { s: "Webhooks", ok: true },
              ].map((it) => (
                <li key={it.s} className="flex items-center justify-between">
                  <span className="text-foreground/80">{it.s}</span>
                  <span className={`inline-flex items-center gap-1.5 font-medium ${it.ok ? "text-emerald-600" : "text-rose-500"}`}>
                    {it.ok ? "Operacional" : "Instável"}
                    {!it.ok && <AlertCircle className="h-3 w-3" />}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

const toneMap: Record<string, string> = {
  primary: "bg-primary/10 text-primary",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  blue: "bg-blue-50 text-blue-600",
  violet: "bg-violet-50 text-violet-600",
  rose: "bg-rose-50 text-rose-600",
};

function KpiTile({
  to,
  label,
  value,
  hint,
  icon: Icon,
  tone = "primary",
  badge,
}: {
  to: string;
  label: string;
  value: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  tone?: keyof typeof toneMap;
  badge?: string;
}) {
  return (
    <Link
      to={to}
      className="group relative rounded-xl bg-white border border-border p-4 sm:p-5 transition-all hover:shadow-[0_10px_30px_-14px_rgba(0,0,0,0.15)] hover:-translate-y-px hover:border-primary/30"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={`inline-flex h-7 w-7 items-center justify-center rounded-md shrink-0 ${toneMap[tone]}`}>
              <Icon className="h-3.5 w-3.5" strokeWidth={2} />
            </span>
            <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground truncate">
              {label}
            </div>
          </div>
          <div className="mt-2.5 text-2xl sm:text-[26px] leading-none font-semibold tracking-tight text-ink tabular-nums">
            {value}
          </div>
          {hint && <p className="mt-2 text-[11.5px] text-muted-foreground truncate">{hint}</p>}
        </div>
        {badge && (
          <span className="inline-flex items-center rounded-full bg-rose-100 text-rose-700 text-[10px] font-medium px-2 py-0.5 shrink-0">
            {badge}
          </span>
        )}
      </div>
      <ArrowUpRight className="absolute top-3 right-3 h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition" />
    </Link>
  );
}

function QuickLink({
  to,
  icon: Icon,
  label,
}: {
  to: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
}) {
  return (
    <Link
      to={to}
      className="flex flex-col items-start gap-1.5 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/60 hover:border-primary/30 p-2.5 transition-colors"
    >
      <Icon className="h-4 w-4 text-primary" strokeWidth={2} />
      <span className="text-[12px] font-medium text-ink">{label}</span>
    </Link>
  );
}

const tagColors: Record<string, string> = {
  suporte: "bg-amber-50 text-amber-700",
  enterprise: "bg-violet-50 text-violet-700",
  pagamento: "bg-emerald-50 text-emerald-700",
  erro: "bg-rose-50 text-rose-700",
};
function EventTag({ kind }: { kind: string }) {
  return (
    <span className={`text-[10.5px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 ${tagColors[kind] ?? "bg-secondary text-foreground"}`}>
      {kind}
    </span>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/30 px-3 py-2.5">
      <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground truncate">{label}</div>
      <div className="mt-1 text-lg font-semibold tabular-nums text-ink">{value}</div>
    </div>
  );
}
