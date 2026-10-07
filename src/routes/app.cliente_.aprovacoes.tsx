import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  LayoutDashboard, FolderOpen, FileText, MessageSquare, Calendar,
  ClipboardCheck, ChevronRight, ShoppingBag, BellRing, CalendarClock, Images,
  AlertCircle,
} from "lucide-react";
import { AppShell, type NavGroup } from "@/components/app-shell";
import {
  useClienteCronograma,
  submitApproval,
  submitDocApproval,
  submitMeetingDecision,
  formatDate,
  type Etapa,
  type Reuniao,
} from "@/hooks/use-cliente-cronograma";

export const Route = createFileRoute("/app/cliente_/aprovacoes")({
  head: () => ({ meta: [{ title: "Aprovações — ArqHub" }] }),
  component: AprovacoesCliente,
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

type PendingItem =
  | { kind: "stage"; id: string; title: string; deadline: string | null; etapa: Etapa }
  | { kind: "doc"; id: string; title: string; deadline: string | null; doc: any }
  | { kind: "meeting"; id: string; title: string; deadline: string | null; meeting: Reuniao };

function AprovacoesCliente() {
  const d = useClienteCronograma();

  const pending: PendingItem[] = useMemo(() => {
    const items: PendingItem[] = [];
    for (const e of d.etapas ?? []) {
      if (!d.aprovacoes[e.id] && !e.done) {
        items.push({ kind: "stage", id: e.id, title: e.title, deadline: e.end_at, etapa: e });
      }
    }
    for (const doc of (d.documentos ?? []) as any[]) {
      if (doc.requires_approval && (doc.approval_status ?? "pending") === "pending") {
        items.push({ kind: "doc", id: doc.id, title: doc.name, deadline: doc.created_at, doc });
      }
    }
    const now = Date.now();
    for (const m of d.reunioes ?? []) {
      if (m.client_status === "pending" && m.status === "agendada" && new Date(m.scheduled_at).getTime() >= now - 24 * 3600 * 1000) {
        items.push({ kind: "meeting", id: m.id, title: m.title, deadline: m.scheduled_at, meeting: m });
      }
    }
    return items;
  }, [d.etapas, d.aprovacoes, d.documentos, d.reunioes]);

  if (d.loading) {
    return (
      <AppShell role="cliente" nav={nav} title="Aprovações">
        <div className="max-w-4xl mx-auto p-4 md:p-6">
          <div className="h-64 rounded-xl border border-border bg-secondary/30 animate-pulse" />
        </div>
      </AppShell>
    );
  }

  if (!d.projeto) {
    return (
      <AppShell role="cliente" nav={nav} title="Aprovações">
        <div className="max-w-4xl mx-auto p-4 md:p-6">
          <div className="rounded-xl border border-border bg-white p-8 text-center">
            <p className="text-[13px] text-muted-foreground">{d.error ?? "Sem projeto ativo."}</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell role="cliente" nav={nav} title="Aprovações">
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <nav className="text-[12px] text-muted-foreground mb-4">
          <Link to="/app/cliente" className="text-primary hover:underline">Cliente</Link>
          <ChevronRight className="inline h-3 w-3 mx-1 align-[-1px]" />
          <span className="text-ink font-medium">Aprovações</span>
        </nav>

        <section className="rounded-xl border border-border bg-white p-5 sm:p-6">
          <h1 className="text-[15px] font-semibold text-ink">Itens aguardando sua decisão</h1>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            {pending.length === 0 ? "Tudo em dia" : `${pending.length} pendente${pending.length === 1 ? "" : "s"}`}
          </p>

          {pending.length === 0 ? (
            <div className="mt-6 text-center text-[12.5px] text-muted-foreground py-8">
              Nenhum item aguardando decisão no momento.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {pending.map((it) => (
                <PendingCard key={`${it.kind}-${it.id}`} item={it} userId={d.userId!} onDone={d.refresh} />
              ))}
            </div>
          )}
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

function PendingCard({ item, userId, onDone }: { item: PendingItem; userId: string; onDone: () => Promise<void> }) {
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const style =
    item.kind === "stage"
      ? { wrap: "border-amber-300 bg-amber-50/40", tag: "text-amber-700", label: "FASE A APROVAR" }
      : item.kind === "doc"
        ? { wrap: "border-blue-300 bg-blue-50/40", tag: "text-blue-700", label: "DOCUMENTO A APROVAR" }
        : { wrap: "border-emerald-300 bg-emerald-50/40", tag: "text-emerald-700", label: "REUNIÃO A CONFIRMAR" };

  async function approve() {
    if (saving) return;
    setSaving(true); setErr(null);
    try {
      if (item.kind === "stage") {
        await submitApproval({ stageId: item.id, userId, status: "approved", note: null });
      } else if (item.kind === "doc") {
        await submitDocApproval({ documentId: item.id, status: "approved", note: null });
      } else {
        await submitMeetingDecision({ meetingId: item.id, decision: "accepted", note: null });
      }
      await onDone();
    } catch (e: any) {
      setErr(e?.message ?? "Erro ao enviar");
    } finally { setSaving(false); }
  }

  async function requestChanges() {
    if (saving) return;
    setSaving(true); setErr(null);
    try {
      if (item.kind === "stage") {
        await submitApproval({ stageId: item.id, userId, status: "changes_requested", note: null });
      } else if (item.kind === "doc") {
        await submitDocApproval({ documentId: item.id, status: "changes_requested", note: null });
      } else {
        await submitMeetingDecision({ meetingId: item.id, decision: "declined", note: null });
      }
      await onDone();
    } catch (e: any) {
      setErr(e?.message ?? "Erro ao enviar");
    } finally { setSaving(false); }
  }

  const deadlineLabel =
    item.kind === "meeting"
      ? `Em ${new Date(item.deadline!).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}`
      : item.deadline
        ? `Até ${formatDate(item.deadline)}`
        : "Sem prazo definido";

  return (
    <article className={`rounded-xl border ${style.wrap} p-4 sm:p-5`}>
      <div className={`text-[10.5px] font-semibold uppercase tracking-wider ${style.tag}`}>{style.label}</div>
      <h3 className="mt-1 text-[14px] font-semibold text-ink">{item.title}</h3>
      <div className="text-[12px] text-muted-foreground mt-1">{deadlineLabel}</div>
      {err && (
        <div className="mt-2 flex items-center gap-1.5 text-[11.5px] text-red-600">
          <AlertCircle className="h-3.5 w-3.5" /> {err}
        </div>
      )}
      <div className="mt-3 flex items-center gap-2">
        <button
          disabled={saving}
          onClick={approve}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-primary text-primary-foreground text-[12px] font-medium disabled:opacity-50"
        >
          {item.kind === "meeting" ? "Confirmar" : "Aprovar"}
        </button>
        <button
          disabled={saving}
          onClick={requestChanges}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-white border border-border text-[12px] font-medium text-ink hover:bg-secondary/50 disabled:opacity-50"
        >
          {item.kind === "meeting" ? "Recusar" : "Solicitar ajuste"}
        </button>
      </div>
    </article>
  );
}
