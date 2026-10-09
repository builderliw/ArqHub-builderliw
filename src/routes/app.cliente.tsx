import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  LayoutDashboard, FolderOpen, FileText, MessageSquare, Calendar, Check,
  Download, AlertCircle, MessageCircle, X, ChevronRight, Building2, CalendarClock,
  ClipboardCheck, Files, Flag, ArrowRight, Clock,
  ShoppingBag,
BellRing , Images, ClipboardList, Sun, Camera } from "lucide-react";
import { AppShell, type NavGroup } from "@/components/app-shell";
import {
  useClienteCronograma,
  submitApproval,
  getDocSignedUrl,
  formatDate,
  formatSize,
  type Etapa,
  type Approval,
} from "@/hooks/use-cliente-cronograma";
import { ProjectChat } from "@/components/project-chat";
import { ProjectTimeline } from "@/components/project-timeline";
import { listClienteMessages, listClienteDiaryEntries } from "@/lib/cliente-data.functions";
import { externalSupabase } from "@/integrations/external-supabase/client";
import heroApt from "@/assets/cliente-banner.jpg.asset.json";

export const Route = createFileRoute("/app/cliente")({
  head: () => ({ meta: [{ title: "Portal do Cliente — ArqHub" }] }),
  component: PainelCliente,
});

const nav: NavGroup[] = [
  { items: [{ to: "/app/cliente", label: "Início", icon: LayoutDashboard }, { to: "/app/cliente/meu-projeto", label: "Meu projeto", icon: FolderOpen }] },
  {
    label: "Acompanhamento",
    items: [
      { to: "/app/cliente/agenda", label: "Agenda", icon: CalendarClock },
      { to: "/app/cliente/cronograma", label: "Cronograma", icon: Calendar },
      { to: "/app/cliente/documentos", label: "Documentos & Aprovações", icon: FolderOpen },
      { to: "/app/cliente/galeria", label: "Galeria", icon: Images },
      { to: "/app/cliente/diario", label: "Diário de obra", icon: ClipboardList },
      { to: "/app/cliente/produtos", label: "Produtos", icon: ShoppingBag },
    ],
  },
  {
    label: "Comunicação",
    items: [
      { to: "/app/cliente/mensagens", label: "Mensagens", icon: MessageSquare },
      { to: "/app/cliente/notificacoes", label: "Notificações", icon: BellRing },
    ],
  },
  { label: "Financeiro", items: [{ to: "/app/meus-pagamentos", label: "Meus pagamentos", icon: FileText }] },
];

function PainelCliente() {
  const d = useClienteCronograma();
  const fetchMessages = useServerFn(listClienteMessages);
  const fetchDiary = useServerFn(listClienteDiaryEntries);
  const [recentMessages, setRecentMessages] = useState<Array<{ id: string; body: string; created_at: string; sender_id: string }>>([]);
  const [senderNames, setSenderNames] = useState<Record<string, string>>({});
  const [lastDiary, setLastDiary] = useState<any | null>(null);
  const [myUserId, setMyUserId] = useState<string | null>(null);

  useEffect(() => {
    const pid = d.projeto?.id;
    if (!pid) return;
    let cancel = false;
    (async () => {
      try {
        const { data: sess } = await externalSupabase.auth.getSession();
        const token = sess.session?.access_token;
        if (!token) return;
        const [m, di] = await Promise.all([
          fetchMessages({ data: { accessToken: token, projectId: pid, limit: 5 } }).catch(() => null),
          fetchDiary({ data: { accessToken: token, projectId: pid } }).catch(() => null),
        ]);
        if (cancel) return;
        if (m) {
          setRecentMessages(((m.messages ?? []) as any[]).slice(-3).reverse());
          setSenderNames(m.senderNames ?? {});
          setMyUserId(m.userId);
        }
        if (di) {
          const entries = (di.entries ?? []) as any[];
          const sorted = entries.slice().sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
          setLastDiary(sorted[0] ?? null);
        }
      } catch {}
    })();
    return () => { cancel = true; };
  }, [d.projeto?.id, fetchMessages, fetchDiary]);







  if (d.loading) {
    return (
      <AppShell role="cliente" nav={nav} title="Meu projeto">
        <DashboardSkeleton />
      </AppShell>
    );
  }

  if (!d.projeto) {
    return (
      <AppShell role="cliente" nav={nav} title="Meu projeto">
        <EmptyState message={d.error} />
      </AppShell>
    );
  }

  const { projeto, etapas, aprovacoes, documentos, userId } = d;
  const etapasConcluidas = etapas.filter((e) => e.done).length;
  const aprovacoesPendentes = etapas.filter((e) => !aprovacoes[e.id] && !e.done).length;
  const etapaAtual = etapas.find((e) => e.atual);
  const proximoMarco = etapas.find((e) => !e.done && e.end_at);
  const projetoFim = (projeto as any)?.deadline ?? [...etapas].reverse().find((e) => e.end_at)?.end_at ?? null;

  return (
    <AppShell role="cliente" nav={nav} title="Meu projeto">


      {/* Hero card */}
      <div className="relative overflow-hidden rounded-2xl border border-border mb-4 aspect-[4/2] sm:aspect-[16/5] md:aspect-[16/4.7] lg:aspect-[16/4] min-h-[187px] sm:min-h-0">
        <img
          src={(projeto as any).cover_url || heroApt.url}
          width={1920}
          height={1080}
          alt=""
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover object-[72%_55%] sm:object-[62%_55%] md:object-[55%_52%] lg:object-[50%_50%]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/30 to-transparent sm:bg-gradient-to-tr sm:from-ink/85 sm:via-ink/35 sm:to-transparent" />

        <div className="relative h-full flex flex-col justify-end p-4 sm:p-6 md:p-7 lg:p-8 [text-shadow:0_1px_2px_rgb(0_0_0_/_0.4)]">
          <div className="w-full sm:max-w-[560px] md:max-w-[620px]">
            <h2 className="text-[20px] sm:text-[24px] md:text-[28px] lg:text-[30px] font-semibold tracking-tight leading-[1.15] text-white truncate">
              {projeto.name || (projeto as any).cliente_name || "Projeto"}
            </h2>
            {(projeto as any).cliente_name && (
              <div className="mt-1 text-[12px] sm:text-[13px] text-white/85">
                Cliente <span className="text-white font-medium">{(projeto as any).cliente_name}</span>
              </div>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] sm:text-[12px] text-white/85">
              <span className="inline-flex items-center gap-1.5">
                <Building2 className="h-3 w-3 shrink-0" /> {projeto.escritorio}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CalendarClock className="h-3 w-3 shrink-0" />
                Início {formatDate(projeto.started_at ?? projeto.created_at)}
              </span>
              {projetoFim && (
                <span className="inline-flex items-center gap-1.5">
                  <Flag className="h-3 w-3 shrink-0" />
                  Entrega prevista {formatDate(projetoFim)}
                </span>
              )}
              {[projeto.city, projeto.uf].filter(Boolean).length > 0 && (
                <span className="inline-flex items-center gap-1.5">📍 {[projeto.city, projeto.uf].filter(Boolean).join("/")}</span>
              )}
              {(projeto as any).area_m2 && (
                <span className="inline-flex items-center gap-1.5">{(projeto as any).area_m2} m²</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Linha do tempo do projeto */}
      {(() => {
        const DEFAULT_ETAPAS = [
          "Levantamento e Análise de Dados",
          "Programa de Necessidades",
          "Estudo Preliminar",
          "Anteprojeto",
          "Projeto Legal",
          "Projeto Executivo",
          "Renderizações 3D",
          "Visualizador 3D",
        ];
        const items = etapas.length > 0
          ? etapas.map((e) => ({ id: e.id, title: e.title, done: e.done, atual: e.atual }))
          : DEFAULT_ETAPAS.map((title, i) => ({ id: `d-${i}`, title, done: false, atual: i === 0 }));
        const doneCount = items.filter((e) => e.done).length;
        const pct = Math.round((doneCount / items.length) * 100);
        const currentIdx = items.findIndex((e) => e.atual);
        const activeIdx = currentIdx >= 0 ? currentIdx : doneCount;
        const currentTitle = items[activeIdx]?.title;
        return (
          <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 mb-5">
            <div className="flex items-baseline justify-between gap-3 mb-4">
              <div className="min-w-0">
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Linha do tempo</div>
                {currentTitle && (
                  <div className="mt-0.5 text-[13px] text-ink truncate">
                    Etapa atual: <span className="font-medium">{currentTitle}</span>
                  </div>
                )}
              </div>
              <div className="text-[20px] sm:text-[24px] font-semibold text-ink tabular-nums shrink-0">{pct}%</div>
            </div>

            <div className="relative">
              <div className="absolute left-0 right-0 top-[7px] h-[2px] bg-muted rounded-full" />
              <div
                className="absolute left-0 top-[7px] h-[2px] bg-primary rounded-full transition-[width] duration-500"
                style={{ width: items.length > 1 ? `${(Math.max(0, activeIdx) / (items.length - 1)) * 100}%` : "0%" }}
              />
              <ol className="relative flex items-start justify-between gap-2">
                {items.map((e, i) => {
                  const isDone = e.done;
                  const isCurrent = i === activeIdx && !isDone;
                  return (
                    <li key={e.id} className="flex flex-col items-center text-center min-w-0 flex-1">
                      <span
                        className={`relative z-[1] inline-flex h-4 w-4 items-center justify-center rounded-full border-2 transition-colors ${
                          isDone
                            ? "bg-primary border-primary text-primary-foreground"
                            : isCurrent
                            ? "bg-background border-primary ring-4 ring-primary/15"
                            : "bg-background border-muted-foreground/30"
                        }`}
                      >
                        {isDone && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
                      </span>
                      <span
                        className={`mt-2 text-[10.5px] sm:text-[11px] leading-tight line-clamp-2 px-0.5 ${
                          isCurrent ? "text-ink font-semibold" : isDone ? "text-ink/70" : "text-muted-foreground"
                        }`}
                      >
                        {e.title}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        );
      })()}



      {/* Próxima ação destacada */}
      {aprovacoesPendentes > 0 && etapaAtual && (
        <a
          href="#aprovacoes"
          className="group flex items-center gap-4 rounded-xl border border-amber-200 bg-amber-50/60 px-5 py-4 mb-5 hover:bg-amber-50 transition-colors"
        >
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
            <ClipboardCheck className="h-4 w-4" />
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-ink">Você tem aprovações pendentes</div>
            <div className="text-[12px] text-muted-foreground">
              {aprovacoesPendentes} {aprovacoesPendentes === 1 ? "fase aguarda" : "fases aguardam"} sua avaliação.
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-amber-700 transition-transform group-hover:translate-x-0.5" />
        </a>
      )}

      {/* Reuniões a confirmar */}
      {(() => {
        const now = Date.now();
        const pendingMeetings = (d.reunioes ?? []).filter(
          (m) => m.client_status === "pending" && m.status === "agendada" && new Date(m.scheduled_at).getTime() >= now - 24 * 3600 * 1000,
        );
        if (pendingMeetings.length === 0) return null;
        const next = pendingMeetings[0];
        return (
          <Link
            to="/app/cliente/aprovacoes"
            className="group flex items-center gap-4 rounded-xl border border-blue-200 bg-blue-50/60 px-5 py-4 mb-5 hover:bg-blue-50 transition-colors"
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
              <CalendarClock className="h-4 w-4" />
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold text-ink">
                {pendingMeetings.length === 1 ? "Reunião aguardando sua confirmação" : `${pendingMeetings.length} reuniões aguardando confirmação`}
              </div>
              <div className="text-[12px] text-muted-foreground truncate">
                {next.title} · {new Date(next.scheduled_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-blue-700 transition-transform group-hover:translate-x-0.5" />
          </Link>
        );
      })()}

      {/* Lembrete de agenda + Aprovações + Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Lembrete de agenda (substitui KPI de etapas) */}
        {(() => {
          const now = Date.now();
          const prox = [...(d.reunioes ?? [])]
            .filter((m: any) => new Date(m.scheduled_at).getTime() >= now - 3600 * 1000 && m.status !== "cancelada")
            .sort((a: any, b: any) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())[0];
          const dt = prox ? new Date(prox.scheduled_at) : null;
          const dia = dt?.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
          const hora = dt?.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
          const diffDias = dt ? Math.max(0, Math.round((dt.getTime() - now) / (1000 * 60 * 60 * 24))) : 0;
          const quando = dt
            ? diffDias === 0 ? "Hoje" : diffDias === 1 ? "Amanhã" : `Em ${diffDias} dias`
            : "";
          const local = prox ? (prox.mode === "online" ? "Online" : prox.mode === "telefone" ? "Telefone" : (prox.location || "Presencial")) : "";
          return (
            <Link to="/app/cliente/agenda" className="group relative bg-white border border-border rounded-xl px-5 py-4 overflow-hidden hover:border-primary/40 transition-colors before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px] before:bg-primary">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-primary">Próximo compromisso</div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </div>
              {!prox ? (
                <>
                  <div className="mt-1 text-[18px] leading-none font-semibold tracking-tight text-ink">Sem lembretes</div>
                  <div className="mt-2 text-[11.5px] text-muted-foreground">Nenhum compromisso agendado.</div>
                </>
              ) : (
                <div className="flex items-start gap-3">
                  <div className="shrink-0 rounded-lg bg-primary/10 border border-primary/20 px-2.5 py-1.5 text-center leading-none">
                    <div className="text-[9.5px] font-semibold uppercase tracking-wider text-primary">{dia?.split(" ")[1]}</div>
                    <div className="mt-1 text-[18px] font-bold text-ink tabular-nums">{dia?.split(" ")[0]}</div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10.5px] font-semibold text-amber-700">
                      <Clock className="h-3 w-3" /> {quando} · {hora}
                    </div>
                    <div className="mt-1.5 text-[13px] font-semibold text-ink truncate">{prox.title || "Reunião"}</div>
                    <div className="mt-0.5 inline-flex items-center gap-1 text-[11.5px] text-muted-foreground">
                      <CalendarClock className="h-3 w-3" /> {local}
                      {prox.status === "remarcada" && (
                        <span className="ml-2 text-amber-600 font-medium">Remarcada</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </Link>
          );
        })()}

        <div className="relative bg-white border border-border rounded-xl px-5 py-4 overflow-hidden before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px] before:bg-amber-500">
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-amber-600">Aprovações pendentes</div>
          <div className="mt-2 text-[26px] leading-none font-semibold tracking-tight text-ink tabular-nums">{aprovacoesPendentes}</div>
          <div className="mt-2 text-[11.5px] text-muted-foreground">
            {aprovacoesPendentes > 0 ? "Fases aguardando sua avaliação" : "Nenhuma pendência no momento"}
          </div>
        </div>
      </div>

      <div className="mb-6">
        {/* Chat mini */}
        <Link to="/app/cliente/mensagens" className="group bg-white border border-border rounded-xl p-5 hover:border-primary/40 transition-colors flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="inline-flex items-center gap-2 text-[13px] font-semibold text-ink">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <MessageSquare className="h-4 w-4" />
              </span>
              Mensagens
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
          </div>
          {recentMessages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-[12px] text-muted-foreground py-6">
              Nenhuma mensagem ainda. Toque para iniciar uma conversa.
            </div>
          ) : (
            <ul className="space-y-2.5">
              {recentMessages.map((m) => {
                const mine = myUserId && m.sender_id === myUserId;
                const name = mine ? "Você" : (senderNames[m.sender_id] ?? projeto.escritorio ?? "Escritório");
                return (
                  <li key={m.id} className="flex items-start gap-2.5">
                    <span className={`mt-1 inline-flex h-2 w-2 rounded-full shrink-0 ${mine ? "bg-muted-foreground/40" : "bg-primary"}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-[12px] font-medium text-ink truncate">{name}</span>
                        <span className="text-[10.5px] text-muted-foreground shrink-0">
                          {new Date(m.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="text-[12.5px] text-muted-foreground line-clamp-2">{m.body}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Link>
      </div>







    </AppShell>
  );
}




/* ===================== UI partials ===================== */

function Breadcrumb() {
  return (
    <nav className="flex h-8 items-center gap-1.5 text-[12px] text-muted-foreground mb-2">
      <Link to="/app/cliente" className="hover:text-ink transition-colors">Cliente</Link>
      <ChevronRight className="h-3.5 w-3.5" />
      <span className="text-ink font-medium">Meu projeto</span>
    </nav>
  );
}

function PageHeader({ name }: { name: string; escritorio?: string }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-5">
      <div className="min-w-0">
        <h1 className="text-[28px] font-semibold tracking-tight text-ink leading-tight">{name}</h1>
      </div>
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex items-end justify-between mb-5">
      <div>
        <h3 className="text-[14px] font-semibold text-ink">{title}</h3>
        {subtitle && <p className="text-[11.5px] text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

type Accent = "primary" | "emerald" | "amber" | "blue";
const accentBar: Record<Accent, string> = {
  primary: "before:bg-primary",
  emerald: "before:bg-emerald-500",
  amber: "before:bg-amber-500",
  blue: "before:bg-blue-500",
};
const accentText: Record<Accent, string> = {
  primary: "text-primary",
  emerald: "text-emerald-600",
  amber: "text-amber-600",
  blue: "text-blue-600",
};

function StatCard({
  label, value, hint, accent,
}: { label: string; value: string; hint?: string; accent: Accent }) {
  return (
    <div className={`relative bg-white border border-border rounded-xl px-5 py-4 overflow-hidden before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px] ${accentBar[accent]}`}>
      <div className={`text-[10.5px] font-semibold uppercase tracking-[0.14em] ${accentText[accent]}`}>{label}</div>
      <div className="mt-2 text-[26px] leading-none font-semibold tracking-tight text-ink tabular-nums">{value}</div>
      {hint && <div className="mt-2 text-[11.5px] text-muted-foreground">{hint}</div>}
    </div>
  );
}
const accentBarSolid: Record<Accent, string> = {
  primary: "bg-primary",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  blue: "bg-blue-500",
};
function GlassStat({ label, value, hint, accent }: { label: string; value: string; hint?: string; accent: Accent }) {
  const labelAccent: Record<Accent, string> = {
    primary: "text-white",
    emerald: "text-emerald-200",
    amber: "text-amber-200",
    blue: "text-blue-200",
  };
  return (
    <div className="relative rounded-lg bg-white/10 backdrop-blur-xl border border-white/25 px-3 py-2.5 sm:px-4 sm:py-3 overflow-hidden shadow-[0_4px_20px_-4px_rgba(0,0,0,0.3)]">
      <span className={`absolute left-0 top-0 bottom-0 w-[3px] ${accentBarSolid[accent]}`} />
      <div className={`text-[9.5px] sm:text-[10px] font-semibold uppercase tracking-[0.14em] ${labelAccent[accent]} [text-shadow:0_1px_2px_rgb(0_0_0_/_0.4)]`}>{label}</div>
      <div className="mt-1 text-[18px] sm:text-[22px] leading-none font-semibold tracking-tight text-white tabular-nums [text-shadow:0_1px_3px_rgb(0_0_0_/_0.5)]">{value}</div>
      {hint && <div className="mt-1 text-[10.5px] sm:text-[11px] text-white/80 truncate [text-shadow:0_1px_2px_rgb(0_0_0_/_0.4)]">{hint}</div>}
    </div>
  );
}


function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-3 w-40 bg-secondary rounded" />
      <div className="h-8 w-80 bg-secondary rounded" />
      <div className="h-44 bg-secondary/60 rounded-2xl" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-secondary/60 rounded-xl" />
        ))}
      </div>
      <div className="h-60 bg-secondary/60 rounded-xl" />
    </div>
  );
}

function EmptyState({ message }: { message?: string | null }) {
  return (
    <>
      
      <h1 className="text-[28px] font-semibold tracking-tight text-ink leading-tight">Meu projeto</h1>
      <p className="text-[13px] text-muted-foreground mt-1 mb-6">Seu painel será ativado quando o escritório vincular um projeto à sua conta.</p>

      <div className="relative overflow-hidden rounded-2xl border border-border bg-white">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
        <div className="relative px-8 py-14 sm:px-12 sm:py-16 text-center max-w-xl mx-auto">
          <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-5">
            <Clock className="h-5 w-5" />
          </div>
          <h2 className="text-[20px] font-semibold tracking-tight text-ink">Aguardando vinculação</h2>
          <p className="text-[13.5px] text-muted-foreground mt-2">
            {message ?? "Assim que seu escritório vincular um projeto à sua conta, o cronograma, aprovações, documentos e mensagens aparecerão aqui."}
          </p>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-left">
            <FeatureHint icon={Calendar} title="Cronograma" desc="Acompanhe as fases" />
            <FeatureHint icon={ClipboardCheck} title="Aprovações" desc="Avalie entregas" />
            <FeatureHint icon={Files} title="Documentos" desc="Acesse arquivos" />
          </div>
        </div>
      </div>
    </>
  );
}

function FeatureHint({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="rounded-lg border border-border bg-white/60 px-3.5 py-3">
      <Icon className="h-4 w-4 text-primary mb-1.5" />
      <div className="text-[12.5px] font-medium text-ink">{title}</div>
      <div className="text-[11.5px] text-muted-foreground">{desc}</div>
    </div>
  );
}

/* ===================== Approvals / Docs ===================== */

function statusBadge(s: Approval["status"]) {
  if (s === "approved") return { label: "Aprovado", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: Check };
  if (s === "rejected") return { label: "Rejeitado", cls: "bg-red-50 text-red-700 border-red-200", icon: X };
  return { label: "Mudanças solicitadas", cls: "bg-amber-50 text-amber-700 border-amber-200", icon: MessageCircle };
}

function ApprovalRow({
  etapa, aprovacao, userId, onDone,
}: {
  etapa: Etapa;
  aprovacao: Approval | undefined;
  userId: string;
  onDone: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function decide(status: Approval["status"]) {
    if (saving) return;
    if (note.length > 1000) { setErr("Comentário muito longo (máx 1000)"); return; }
    setSaving(true); setErr(null);
    try {
      await submitApproval({ stageId: etapa.id, userId, status, note: note.trim() || null });
      setOpen(false); setNote(""); await onDone();
    } catch (e: any) {
      setErr(e?.message ?? "Erro ao enviar");
    } finally { setSaving(false); }
  }

  const badge = aprovacao ? statusBadge(aprovacao.status) : null;
  const Icon = badge?.icon;

  return (
    <li className="rounded-lg border border-border p-3.5 hover:border-primary/30 transition-colors">
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-medium text-ink truncate">{etapa.title}</div>
          <div className="text-[11.5px] text-muted-foreground">
            {formatDate(etapa.start_at)} → {formatDate(etapa.end_at)}
          </div>
        </div>
        {badge && Icon ? (
          <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${badge.cls}`}>
            <Icon className="h-3 w-3" strokeWidth={2} />
            {badge.label}
          </span>
        ) : etapa.done ? (
          <span className="text-[11px] text-muted-foreground">Concluída</span>
        ) : (
          <button
            onClick={() => setOpen((o) => !o)}
            className="text-[12px] font-medium text-primary hover:underline"
          >
            {open ? "Cancelar" : "Avaliar"}
          </button>
        )}
      </div>

      {aprovacao?.note && (
        <p className="mt-2 text-[12px] text-muted-foreground italic">"{aprovacao.note}"</p>
      )}

      {open && !aprovacao && (
        <div className="mt-3 space-y-2">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 1000))}
            placeholder="Observações (opcional)"
            rows={2}
            maxLength={1000}
            className="w-full text-[13px] rounded-md border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
          />
          {err && (
            <div className="flex items-center gap-1.5 text-[12px] text-red-600">
              <AlertCircle className="h-3.5 w-3.5" /> {err}
            </div>
          )}
          <div className="flex gap-2">
            <button disabled={saving} onClick={() => decide("approved")} className="flex-1 h-8 text-[12px] font-medium rounded-md bg-primary text-white hover:opacity-90 disabled:opacity-50">Aprovar</button>
            <button disabled={saving} onClick={() => decide("changes_requested")} className="flex-1 h-8 text-[12px] font-medium rounded-md border border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100 disabled:opacity-50">Pedir ajustes</button>
            <button disabled={saving} onClick={() => decide("rejected")} className="flex-1 h-8 text-[12px] font-medium rounded-md border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50">Rejeitar</button>
          </div>
        </div>
      )}
    </li>
  );
}

function DocumentRow({ doc }: { doc: { id: string; name: string; storage_path: string; mime_type: string | null; size_bytes: number | null; created_at: string } }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function open() {
    if (loading) return;
    setLoading(true); setErr(null);
    try {
      const url = await getDocSignedUrl(doc.storage_path);
      window.open(url, "_blank", "noopener");
    } catch (e: any) { setErr(e?.message ?? "Erro"); }
    finally { setLoading(false); }
  }

  return (
    <li className="px-2 py-2.5 flex items-center gap-3 hover:bg-secondary/40 rounded-md transition-colors">
      <FileText className="h-4 w-4 text-muted-foreground shrink-0" strokeWidth={1.75} />
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium text-ink truncate">{doc.name}</div>
        <div className="text-[11px] text-muted-foreground">
          {formatSize(doc.size_bytes)} · {formatDate(doc.created_at)}
        </div>
        {err && <div className="text-[11px] text-red-600 mt-0.5">{err}</div>}
      </div>
      <button onClick={open} disabled={loading} className="inline-flex items-center gap-1 text-[12px] text-primary hover:underline disabled:opacity-50">
        <Download className="h-3.5 w-3.5" strokeWidth={2} />
        {loading ? "..." : "Abrir"}
      </button>
    </li>
  );
}

function StageNotesHistory({
  etapas,
  aprovacoes,
  escritorio,
}: {
  etapas: Etapa[];
  aprovacoes: Record<string, Approval | undefined>;
  escritorio: string;
}) {
  // Considera apenas etapas que têm anotação do escritório (description) ou aprovação registrada
  type Item = {
    stageId: string;
    stageTitle: string;
    stageStatus: string;
    notes: Array<{ author: string; tone: "office" | "client"; text: string; date: string | null }>;
  };
  const items: Item[] = etapas
    .map((e) => {
      const notes: Item["notes"] = [];
      if (e.description && e.description.trim()) {
        notes.push({
          author: escritorio || "Escritório",
          tone: "office",
          text: e.description,
          date: e.start_at,
        });
      }
      const ap = aprovacoes[e.id];
      if (ap?.note) {
        notes.push({
          author: "Você",
          tone: "client",
          text: ap.note,
          date: ap.created_at,
        });
      }
      return { stageId: e.id, stageTitle: e.title, stageStatus: e.status, notes };
    })
    .filter((i) => i.notes.length > 0);

  if (items.length === 0) {
    return (
      <p className="text-[13px] text-muted-foreground py-6 text-center border border-dashed border-border rounded-lg">
        Nenhuma anotação registrada ainda. Conforme o escritório atualizar cada fase, o conteúdo aparece aqui.
      </p>
    );
  }

  return (
    <ul className="space-y-4">
      {items.map((it) => (
        <li key={it.stageId} className="border-l-2 border-primary/30 pl-3 sm:pl-4">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-[13px] font-semibold text-ink">{it.stageTitle}</span>
            <span className="text-[10.5px] uppercase tracking-wide text-muted-foreground">
              {it.stageStatus === "in_progress" ? "em andamento" : it.stageStatus === "done" ? "concluída" : "a fazer"}
            </span>
          </div>
          <div className="mt-2 space-y-2">
            {it.notes.map((n, i) => (
              <div
                key={i}
                className={`rounded-md border p-2.5 sm:p-3 ${
                  n.tone === "office"
                    ? "border-blue-200 bg-blue-50/50"
                    : "border-border bg-secondary/40"
                }`}
              >
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10.5px]">
                  <span
                    className={`font-semibold uppercase tracking-wide ${
                      n.tone === "office" ? "text-blue-700" : "text-muted-foreground"
                    }`}
                  >
                    {n.author}
                  </span>
                  {n.date && (
                    <span className="text-muted-foreground tabular-nums">{formatDate(n.date)}</span>
                  )}
                </div>
                <p className="text-[12.5px] text-ink leading-relaxed mt-1 whitespace-pre-wrap break-words">
                  {n.text}
                </p>
              </div>
            ))}
          </div>
        </li>
      ))}
    </ul>
  );
}
