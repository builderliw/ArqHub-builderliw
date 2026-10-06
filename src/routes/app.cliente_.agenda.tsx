import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  LayoutDashboard, FolderOpen, FileText, MessageSquare, Calendar,
  ClipboardCheck, ShoppingBag, BellRing, CalendarClock, Check, X, ChevronRight,
  Images,
} from "lucide-react";
import { AppShell, type NavGroup } from "@/components/app-shell";
import { useClienteCronograma, submitMeetingDecision, type Reuniao } from "@/hooks/use-cliente-cronograma";
import { toast } from "sonner";

export const Route = createFileRoute("/app/cliente_/agenda")({
  head: () => ({ meta: [{ title: "Agenda — ArqHub" }] }),
  component: AgendaCliente,
});

const nav: NavGroup[] = [
  { label: "Interface", items: [{ to: "/app/cliente", label: "Início", icon: LayoutDashboard }, { to: "/app/cliente/meu-projeto", label: "Meu projeto", icon: FolderOpen }] },
  {
    label: "Acompanhamento",
    items: [
      { to: "/app/cliente/agenda", label: "Agenda", icon: CalendarClock },
      { to: "/app/cliente/aprovacoes", label: "Aprovações", icon: ClipboardCheck },
      { to: "/app/cliente/cronograma", label: "Cronograma", icon: Calendar },
      { to: "/app/cliente/documentos", label: "Documentos", icon: FolderOpen },
      { to: "/app/cliente/galeria", label: "Galeria", icon: Images },
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

const MESES = ["01","02","03","04","05","06","07","08","09","10","11","12"];

function DateChip({ iso }: { iso: string }) {
  const d = new Date(iso);
  const mm = MESES[d.getMonth()];
  const yyyy = d.getFullYear();
  const dd = String(d.getDate()).padStart(2, "0");
  return (
    <div className="shrink-0 rounded-md bg-secondary/60 px-2.5 py-1.5 text-center leading-none">
      <div className="text-[9.5px] font-medium text-muted-foreground tabular-nums tracking-tight">{mm}/{yyyy}</div>
      <div className="mt-1 text-[14px] font-bold text-ink tabular-nums">{dd}</div>
    </div>
  );
}

function timeStr(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function modeLabel(m: Reuniao) {
  if (m.mode === "online") return "Online";
  if (m.mode === "telefone") return "Telefone";
  return m.location || "Presencial";
}

function AgendaCliente() {
  const { reunioes, loading, refresh } = useClienteCronograma();
  const [busy, setBusy] = useState<string | null>(null);

  const proximos = useMemo(() => {
    const now = Date.now();
    return [...(reunioes ?? [])]
      .filter((m) => new Date(m.scheduled_at).getTime() >= now - 3600 * 1000 && m.status !== "cancelada")
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
  }, [reunioes]);

  async function decide(m: Reuniao, decision: "accepted" | "declined") {
    setBusy(m.id);
    try {
      await submitMeetingDecision({ meetingId: m.id, decision, note: null });
      toast.success(decision === "accepted" ? "Reunião confirmada" : "Reunião recusada");
      await refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "Erro");
    } finally { setBusy(null); }
  }

  return (
    <AppShell role="cliente" nav={nav} title="Agenda">
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <nav className="text-[12px] text-muted-foreground mb-4">
          <Link to="/app/cliente" className="text-primary hover:underline">Cliente</Link>
          <ChevronRight className="inline h-3 w-3 mx-1 align-[-1px]" />
          <span className="text-ink font-medium">Agenda</span>
        </nav>

        <section className="rounded-xl border border-border bg-white p-5 sm:p-6">
          <h1 className="text-[15px] font-semibold text-ink">Próximos compromissos</h1>
          <p className="text-[12px] text-muted-foreground mt-0.5">Visitas, reuniões e marcos</p>

          <div className="mt-4">
            {loading ? (
              <div className="text-[12.5px] text-muted-foreground py-4">Carregando…</div>
            ) : proximos.length === 0 ? (
              <div className="text-[12.5px] text-muted-foreground py-6 text-center">Nenhum compromisso agendado.</div>
            ) : (
              <ul className="divide-y divide-border">
                {proximos.map((m) => (
                  <li key={m.id} className="flex items-center gap-4 py-3.5 first:pt-0 last:pb-0">
                    <DateChip iso={m.scheduled_at} />
                    <div className="min-w-0 flex-1">
                      <div className="text-[13.5px] font-semibold text-ink truncate">{m.title}</div>
                      <div className="text-[12px] text-muted-foreground mt-0.5 truncate">
                        {timeStr(m.scheduled_at)} · {modeLabel(m)}
                      </div>
                    </div>
                    {m.client_status === "pending" && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          disabled={busy === m.id}
                          onClick={() => decide(m, "accepted")}
                          className="inline-flex items-center gap-1 h-8 px-2.5 rounded-md bg-primary text-primary-foreground text-[11.5px] font-medium disabled:opacity-50"
                        >
                          <Check className="h-3.5 w-3.5" /> Confirmar
                        </button>
                        <button
                          disabled={busy === m.id}
                          onClick={() => decide(m, "declined")}
                          className="inline-flex items-center gap-1 h-8 px-2.5 rounded-md border border-border text-[11.5px] disabled:opacity-50"
                        >
                          <X className="h-3.5 w-3.5" /> Recusar
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <div className="mt-8 text-center">
          <Link to="/" className="inline-flex items-center gap-1 text-[12.5px] text-muted-foreground hover:text-ink">
            Conhecer o ArqHub <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
