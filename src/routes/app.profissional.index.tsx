import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { NewProjectModal } from "@/components/new-project-modal";
import { NewClientModal } from "@/components/new-client-modal";
import {
  FolderOpen, CheckSquare, Wallet, Users, MessageSquare, AlertTriangle,
  Calendar, ArrowRight, ArrowUpRight, Clock, Sparkles, Check,
  TrendingUp, Zap, Plus, Eye, EyeOff,
} from "lucide-react";
import { HiddenValue } from "@/components/hidden-value";
import { AppShell } from "@/components/app-shell";
import { navProfissional as nav } from "@/lib/nav-profissional";
import { NotificationsBell } from "@/components/notifications-bell";
import { useOfficeStatus } from "@/hooks/use-office-status";
import {
  useProfissionalData,
  formatBRLCents,
  formatShortDate,
  formatRelativeDate,
} from "@/hooks/use-profissional-data";
import { getSession } from "@/lib/session";
import bannerAsset from "@/assets/dashboard-banner-blueprints.jpg.asset.json";
import piggyBank from "@/assets/piggy-bank-no-bg.png.asset.json";


export const Route = createFileRoute("/app/profissional/")({
  head: () => ({ meta: [{ title: "Dashboard — ArqHub" }] }),
  component: PainelProfissional,
});

function saudacao() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function PainelProfissional() {
  const d = useProfissionalData();
  const office = useOfficeStatus();
  const navigate = useNavigate();
  const [showNewProject, setShowNewProject] = useState(false);
  const [showNewClient, setShowNewClient] = useState(false);
  const isMember = d.isMember || !!getSession()?.isMember;
  const fmt = (n: number) => n.toLocaleString("pt-BR");
  const nomeEscritorio = d.officeName ?? "Escritório";

  const proximasAgendas = d.entregas.slice(0, 5);
  const projetosAtencao = d.projetos.filter((p) => p.status === "Atenção");

  const dataHoje = new Date().toLocaleDateString("pt-BR", {
    weekday: "long", day: "2-digit", month: "long",
  });

  const subscriptionInfo = (() => {
    if (office.loading || !office.status) return null;
    if (!office.expiresAt) return null;
    const date = new Date(office.expiresAt).toLocaleDateString("pt-BR");
    const left = office.daysLeft;
    const label =
      office.status === "trial"
        ? "Teste grátis"
        : office.status === "active"
          ? "Assinatura ativa"
          : "Assinatura";
    const suffix =
      left === null ? "" : left > 0 ? ` · ${left} ${left === 1 ? "dia" : "dias"} restantes` : " · expira hoje";
    return { label, date, suffix };
  })();


  return (
    <AppShell role="profissional" nav={nav} title="Dashboard">
      <div
        className="relative -m-3 sm:-m-4 p-3 sm:p-4"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(75,98,65,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(75,98,65,0.06) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      >
      {/* HERO BANNER */}
      <section className="relative mb-3 overflow-hidden rounded-2xl border border-border shadow-lg">
        <div className="absolute inset-0">
          <img
            src={bannerAsset.url}
            alt=""
            className="h-full w-full object-cover"
            width={1920}
            height={640}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A]/45 via-[#0A0A0A]/20 to-transparent" />
          <div className="absolute inset-0 backdrop-blur-[2px] bg-white/5" />

        </div>

        <div className="relative flex min-h-[280px] sm:min-h-[320px] flex-col justify-end px-5 pt-10 pb-5 sm:px-6 sm:pt-12 sm:pb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white/90">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {dataHoje}
              </div>
              <h2 className="mt-1.5 text-[18px] sm:text-[22px] leading-tight font-semibold tracking-tight text-white">
                {saudacao()}, <span className="office-name-on-dark">{nomeEscritorio}</span>
              </h2>

              {subscriptionInfo && (
                <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 px-2.5 py-1 text-[11.5px] text-white/90">
                  <Clock className="h-3 w-3 text-emerald-300" strokeWidth={2} />
                  <span className="font-medium">{subscriptionInfo.label}</span>
                  <span className="text-white/70">até <span className="font-semibold text-white">{subscriptionInfo.date}</span>{subscriptionInfo.suffix}</span>
                </div>
              )}


            </div>
            
          </div>

          {/* Stat strip embedded in banner */}
          <div className={`relative mt-3 grid grid-cols-2 ${isMember ? "sm:grid-cols-3" : "sm:grid-cols-4"} gap-px overflow-hidden rounded-xl bg-white/15 backdrop-blur-xl border border-white/20`}>
            {[
              { label: "Projetos ativos", value: d.loading ? "—" : fmt(d.projetosAtivos), icon: FolderOpen, action: () => setShowNewProject(true), actionLabel: "Novo projeto" },
              { label: "Clientes", value: d.loading ? "—" : fmt(d.clientesAtivos), icon: Users, action: () => setShowNewClient(true), actionLabel: "Novo cliente" },
              ...(isMember
                ? []
                : [{ label: "Receita prevista", value: d.loading ? "—" : <HiddenValue value={formatBRLCents(d.receitaPrevistaCents)} eyeClassName="text-white/70 hover:text-white hover:bg-white/10" />, icon: Wallet, action: undefined, actionLabel: undefined }]),
              { label: "Tarefas pendentes", value: d.loading ? "—" : fmt(d.tarefasPendentes), icon: CheckSquare, action: () => navigate({ to: "/app/profissional/cronograma" }), actionLabel: "Abrir agenda" },
            ].map((s) => (
              <div key={s.label} className="bg-black/30 backdrop-blur-md px-3 py-2">
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-white/65">
                    <s.icon className="h-3 w-3" strokeWidth={2} />
                    {s.label}
                  </div>
                  {s.action && (
                    <button
                      type="button"
                      onClick={s.action}
                      aria-label={s.actionLabel}
                      title={s.actionLabel}
                      className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-white/25 bg-white/10 text-white/85 transition hover:bg-white/25 hover:text-white"
                    >
                      <Plus className="h-3 w-3" strokeWidth={2.5} />
                    </button>
                  )}
                </div>
                <div className="mt-0.5 text-[16px] sm:text-[17px] font-semibold tracking-tight text-white tabular-nums">
                  {s.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Primeiros passos */}
      {!isMember && !d.loading && d.clientesAtivos === 0 && (
        <div className="mb-3 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 to-transparent p-5">
          <div className="flex items-start gap-3 mb-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-[14px] font-semibold text-ink">Primeiros passos</h3>
              <p className="text-[12.5px] text-muted-foreground">Configure seu escritório para começar a operar.</p>
            </div>
          </div>
          <ol className="space-y-2">
            <li className="flex items-center gap-2.5 text-[13px]">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground"><Check className="h-3 w-3"/></span>
              <span className="text-muted-foreground line-through">Escritório cadastrado</span>
            </li>
            <li className="flex items-center gap-2.5 text-[13px]">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-border bg-white text-[10px] font-semibold">2</span>
              <Link to="/app/profissional/clientes" className="font-medium text-ink hover:text-primary">Cadastrar primeiro cliente e projeto</Link>
            </li>
            <li className="flex items-center gap-2.5 text-[13px] text-muted-foreground">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-border bg-white text-[10px] font-semibold">3</span>
              Enviar primeira mensagem ao cliente
            </li>
          </ol>
        </div>
      )}

      {/* Secondary KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        <MiniStat label="Entregas próximas" value={d.loading ? "—" : fmt(d.entregas.length)} hint="nas próximas semanas" icon={Zap} tone="violet" />
        <MiniStat label="Mensagens não lidas" value={d.loading ? "—" : fmt(d.mensagensNaoLidas)} hint="de clientes" icon={MessageSquare} tone="rose" />
        <MiniStat label="Contratos ativos" value={d.loading ? "—" : fmt(d.contratosAtivos)} hint="com orçamento" icon={TrendingUp} tone="emerald" />
        <MiniStat label="Projetos atrasados" value={d.loading ? "—" : fmt(d.projetosAtrasados)} hint="prazo vencido" icon={AlertTriangle} tone="amber" />
      </div>

      {isMember ? (
        <>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
          <div className="bg-white border border-border rounded-xl p-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Calendar className="h-3.5 w-3.5" strokeWidth={2} />
                </span>
                <h3 className="text-[13px] font-semibold text-ink">Próximas agendas</h3>
              </div>
              <Link to="/app/profissional/cronograma" className="text-muted-foreground hover:text-ink">
                <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.75} />
              </Link>
            </div>
            {proximasAgendas.length === 0 ? (
              <p className="text-[12.5px] text-muted-foreground py-4 text-center">
                {d.loading ? "Carregando..." : "Sem compromissos agendados."}
              </p>
            ) : (
              <ul className="space-y-3">
                {proximasAgendas.map((e) => (
                  <li key={e.id} className="flex items-start gap-3">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-medium text-ink truncate">{e.titulo}</div>
                      <div className="text-[11.5px] text-muted-foreground truncate">
                        {e.contexto}{e.data ? ` · ${formatShortDate(e.data)}` : ""}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-white border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
              <div>
                <h3 className="text-[13px] font-semibold text-ink">Últimas mensagens</h3>
                <p className="text-[11.5px] text-muted-foreground">Interações recentes de clientes</p>
              </div>
              <Link to="/app/profissional/mensagens" className="text-[12px] text-primary hover:underline inline-flex items-center gap-1">
                Abrir <ArrowRight className="h-3 w-3" strokeWidth={2} />
              </Link>
            </div>
            {d.mensagensRecentes.length === 0 ? (
              <p className="px-5 py-8 text-center text-[12.5px] text-muted-foreground">
                {d.loading ? "Carregando..." : "Sem novas mensagens."}
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {d.mensagensRecentes.map((m) => (
                  <li key={m.id} className="px-4 py-2 flex items-start gap-3">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-[12px] font-semibold shrink-0">
                      {m.remetente[0]?.toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-medium text-ink truncate">{m.remetente}</span>
                        <span className="text-[11px] text-muted-foreground">· {m.projeto}</span>
                      </div>
                      <div className="text-[12px] text-muted-foreground truncate">{m.preview}</div>
                    </div>
                    <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                      {formatRelativeDate(m.quando)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="bg-white border border-border rounded-xl overflow-hidden mb-3">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-amber-50 text-amber-700">
                <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2} />
              </span>
              <div>
                <h3 className="text-[13px] font-semibold text-ink">Projetos que precisam atenção</h3>
                <p className="text-[11.5px] text-muted-foreground">Atrasados ou em risco</p>
              </div>
            </div>
            <Link to="/app/profissional/projetos" className="text-[12px] text-primary hover:underline inline-flex items-center gap-1">
              Ver todos <ArrowRight className="h-3 w-3" strokeWidth={2} />
            </Link>
          </div>
          {projetosAtencao.length === 0 ? (
            <p className="px-5 py-8 text-center text-[12.5px] text-muted-foreground">
              {d.loading ? "Carregando..." : "Nenhum projeto em alerta. Tudo no prazo."}
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {projetosAtencao.map((p) => (
                <li key={p.id} className="px-4 py-2 flex items-center gap-3">
                  <Clock className="h-4 w-4 text-amber-600 shrink-0" strokeWidth={1.75} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-medium text-ink truncate">{p.nome}</div>
                    <div className="text-[11.5px] text-muted-foreground truncate">
                      {p.cliente} · {p.fase} · entrega {p.proximaEntrega ? formatShortDate(p.proximaEntrega) : "—"}
                    </div>
                  </div>
                  <span className="text-[11.5px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                    {p.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        </>
      ) : (
      <>
      {/* Linha 1: Agenda + Projetos em atenção */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-3">

        <div className="bg-white border border-border rounded-xl p-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Calendar className="h-3.5 w-3.5" strokeWidth={2} />
              </span>
              <h3 className="text-[13px] font-semibold text-ink">Próximas agendas</h3>
            </div>
            <Link to="/app/profissional/cronograma" className="text-muted-foreground hover:text-ink">
              <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.75} />
            </Link>
          </div>
          {proximasAgendas.length === 0 ? (
            <p className="text-[12.5px] text-muted-foreground py-4 text-center">
              {d.loading ? "Carregando..." : "Sem compromissos agendados."}
            </p>
          ) : (
            <ul className="space-y-3">
              {proximasAgendas.map((e) => (
                <li key={e.id} className="flex items-start gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-medium text-ink truncate">{e.titulo}</div>
                    <div className="text-[11.5px] text-muted-foreground truncate">
                      {e.contexto}{e.data ? ` · ${formatShortDate(e.data)}` : ""}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="lg:col-span-2 bg-white border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-amber-50 text-amber-700">
                <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2} />
              </span>
              <div>
                <h3 className="text-[13px] font-semibold text-ink">Projetos que precisam atenção</h3>
                <p className="text-[11.5px] text-muted-foreground">Atrasados ou em risco</p>
              </div>
            </div>
            <Link to="/app/profissional/projetos" className="text-[12px] text-primary hover:underline inline-flex items-center gap-1">
              Ver todos <ArrowRight className="h-3 w-3" strokeWidth={2} />
            </Link>
          </div>
          {projetosAtencao.length === 0 ? (
            <p className="px-5 py-8 text-center text-[12.5px] text-muted-foreground">
              {d.loading ? "Carregando..." : "Nenhum projeto em alerta. Tudo no prazo."}
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {projetosAtencao.map((p) => (
                <li key={p.id} className="px-4 py-2 flex items-center gap-3">
                  <Clock className="h-4 w-4 text-amber-600 shrink-0" strokeWidth={1.75} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-medium text-ink truncate">{p.nome}</div>
                    <div className="text-[11.5px] text-muted-foreground truncate">
                      {p.cliente} · {p.fase} · entrega {p.proximaEntrega ? formatShortDate(p.proximaEntrega) : "—"}
                    </div>
                  </div>
                  <span className="text-[11.5px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                    {p.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Linha 2: Últimas mensagens + Financeiro */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 bg-white border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
            <div>
              <h3 className="text-[13px] font-semibold text-ink">Últimas mensagens</h3>
              <p className="text-[11.5px] text-muted-foreground">Interações recentes de clientes</p>
            </div>
            <Link to="/app/profissional/mensagens" className="text-[12px] text-primary hover:underline inline-flex items-center gap-1">
              Abrir <ArrowRight className="h-3 w-3" strokeWidth={2} />
            </Link>
          </div>
          {d.mensagensRecentes.length === 0 ? (
            <p className="px-5 py-8 text-center text-[12.5px] text-muted-foreground">
              {d.loading ? "Carregando..." : "Sem novas mensagens."}
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {d.mensagensRecentes.map((m) => (
                <li key={m.id} className="px-4 py-2 flex items-start gap-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-[12px] font-semibold shrink-0">
                    {m.remetente[0]?.toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-medium text-ink truncate">{m.remetente}</span>
                      <span className="text-[11px] text-muted-foreground">· {m.projeto}</span>
                    </div>
                    <div className="text-[12px] text-muted-foreground truncate">{m.preview}</div>
                  </div>
                  <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                    {formatRelativeDate(m.quando)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="relative rounded-xl overflow-hidden border border-border bg-gradient-to-br from-primary to-primary-dark text-white p-3">
          <img
            src={piggyBank.url}
            alt=""
            aria-hidden
            className="pointer-events-none select-none absolute -right-2 top-2 w-32 opacity-30"
          />
          <div className="relative flex items-center justify-between mb-3">

            <div className="flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-white/15 backdrop-blur text-white">
                <Wallet className="h-3.5 w-3.5" strokeWidth={2} />
              </span>
              <h3 className="text-[13px] font-semibold">Financeiro</h3>
            </div>
            <Link to="/app/profissional/financeiro" className="text-white/70 hover:text-white">
              <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.75} />
            </Link>
          </div>
          <div className="mb-3">
            <div className="text-[11px] uppercase tracking-wider text-white/65">Receita prevista</div>
            <div className="mt-1 text-[28px] font-semibold tracking-tight tabular-nums">
              {d.loading ? "—" : <HiddenValue value={formatBRLCents(d.receitaPrevistaCents)} className="text-white" eyeClassName="text-white/70 hover:text-white hover:bg-white/10" />}
            </div>
          </div>
          <ul className="space-y-2.5 border-t border-white/15 pt-3">
            <li className="flex items-center justify-between text-[12.5px]">
              <span className="text-white/70">Recebido</span>
              <span className="font-semibold tabular-nums">{d.loading ? "—" : <HiddenValue value={formatBRLCents(0)} className="text-white" eyeClassName="text-white/70 hover:text-white hover:bg-white/10" />}</span>
            </li>
            <li className="flex items-center justify-between text-[12.5px]">
              <span className="text-white/70">Em atraso</span>
              <span className="font-semibold tabular-nums text-amber-200">{d.loading ? "—" : <HiddenValue value={formatBRLCents(0)} className="text-amber-200" eyeClassName="text-white/70 hover:text-white hover:bg-white/10" />}</span>
            </li>
            <li className="flex items-center justify-between text-[12.5px]">
              <span className="text-white/70">Contratos ativos</span>
              <span className="font-semibold tabular-nums">{d.loading ? "—" : fmt(d.contratosAtivos)}</span>
            </li>
          </ul>
        </div>
      </div>
      </>
      )}
      </div>

      {showNewProject && d.officeId && (
        <NewProjectModal
          officeId={d.officeId}
          onClose={() => setShowNewProject(false)}
          onCreated={() => setShowNewProject(false)}
        />
      )}
      {showNewClient && d.officeId && (
        <NewClientModal
          officeId={d.officeId}
          onClose={() => setShowNewClient(false)}
          onCreated={() => setShowNewClient(false)}
        />
      )}
   </AppShell>
  );
}

function MiniStat({
  label, value, hint, icon: Icon, tone,
}: {
  label: string; value: string; hint: string;
  icon: typeof FolderOpen;
  tone: "amber" | "emerald" | "rose" | "violet";
}) {
  const tones = {
    amber: "bg-amber-50 text-amber-700",
    emerald: "bg-emerald-50 text-emerald-700",
    rose: "bg-rose-50 text-rose-700",
    violet: "bg-violet-50 text-violet-700",
  } as const;
  return (
    <div className="bg-white border border-border rounded-xl p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2">
        <span className={`inline-flex h-7 w-7 items-center justify-center rounded-md ${tones[tone]}`}>
          <Icon className="h-3.5 w-3.5" strokeWidth={2} />
        </span>
        <div className="text-[10.5px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
      </div>
      <div className="mt-2.5 text-[22px] font-semibold tracking-tight text-ink tabular-nums">{value}</div>
      <div className="text-[11.5px] text-muted-foreground mt-0.5">{hint}</div>
    </div>
  );
}
