import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, FolderOpen, FileText, MessageSquare, Calendar,
  ClipboardCheck, ShoppingBag, BellRing, ChevronRight, Shield, ArrowLeft,
CalendarClock , Images } from "lucide-react";
import { AppShell, type NavGroup } from "@/components/app-shell";
import { ProjectChat } from "@/components/project-chat";
import { externalSupabase } from "@/integrations/external-supabase/client";
import { listClienteProjectsForMessages } from "@/lib/cliente-data.functions";
import { formatRelativeDate } from "@/hooks/use-profissional-data";

export const Route = createFileRoute("/app/cliente_/mensagens")({
  head: () => ({ meta: [{ title: "Mensagens — ArqHub" }] }),
  component: MensagensPage,
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

type Projeto = {
  id: string;
  name: string;
  office_id: string | null;
  office_name: string;
  office_logo: string | null;
  last_body: string | null;
  last_at: string | null;
  last_from_other: boolean;
  unread: number;
};

function MensagensPage() {
  const [loading, setLoading] = useState(true);
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const refresh = async () => {
    const { data: sess } = await externalSupabase.auth.getSession();
    const token = sess.session?.access_token;
    if (!token) { setLoading(false); return; }
    try {
      const r = await listClienteProjectsForMessages({ data: { accessToken: token } });
      setProjetos(r.projects as Projeto[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 5000);
    return () => clearInterval(t);
  }, []);

  // Auto-abrir conversa: se houver não-lidas, abre a primeira com não-lidas;
  // caso contrário, se houver apenas um projeto, abre-o direto.
  useEffect(() => {
    if (activeId || projetos.length === 0) return;
    const comNaoLida = projetos.find((p) => p.unread > 0);
    if (comNaoLida) setActiveId(comNaoLida.id);
    else if (projetos.length === 1) setActiveId(projetos[0].id);
  }, [projetos, activeId]);

  const active = projetos.find((p) => p.id === activeId) ?? null;
  const initialOf = (s: string) => (s?.[0] ?? "E").toUpperCase();

  return (
    <AppShell role="cliente" nav={nav} title="Mensagens">
      <div className="-m-6 lg:-m-8 h-[calc(100dvh-3.5rem)] flex flex-col">
        <div className="px-6 lg:px-8 pt-4 pb-3 shrink-0">
          <nav className="flex h-7 items-center gap-1.5 text-[12px] text-muted-foreground">
            <Link to="/app/cliente" className="hover:text-ink transition-colors">Cliente</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-ink font-medium">Mensagens</span>
          </nav>
          <h1 className="mt-1 text-[20px] font-semibold tracking-tight text-ink leading-tight flex items-center gap-2">
            💬 Mensagens
          </h1>
          <p className="text-[12.5px] text-muted-foreground">
            Converse diretamente com o escritório. Mensagens privadas e seguras 🔒
          </p>
        </div>

        <div className="flex-1 min-h-0 px-4 lg:px-6 pb-4 lg:pb-6">
          {loading ? (
            <div className="h-full rounded-2xl border border-border bg-secondary/40 animate-pulse" />
          ) : projetos.length === 0 ? (
            <div className="h-full rounded-2xl border border-border bg-white p-10 text-center flex flex-col items-center justify-center">
              <div className="h-14 w-14 rounded-full bg-secondary flex items-center justify-center text-[28px] mb-3">💬</div>
              <h3 className="text-[15px] font-semibold text-ink">Sem projeto vinculado ainda</h3>
              <p className="text-[13px] text-muted-foreground mt-1 max-w-md">
                Seu painel de mensagens será ativado assim que o escritório vincular um projeto à sua conta.
              </p>
            </div>
          ) : active ? (
            <div className="h-full rounded-2xl overflow-hidden border border-[#d1d7db] bg-white shadow-[0_8px_24px_-12px_rgba(0,0,0,0.12)] flex flex-col">
              <div className="px-4 py-3 bg-gradient-to-r from-[#008069] to-[#017561] flex items-center gap-3 text-white shrink-0">
                <button
                  onClick={() => setActiveId(null)}
                  className="h-8 w-8 -ml-1 grid place-items-center rounded-full hover:bg-white/10 transition-colors"
                  aria-label="Voltar"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div className="min-w-0 flex-1">
                  <h3 className="text-[14.5px] font-semibold truncate flex items-center gap-1.5">
                    {active.office_name}
                    <span className="text-[10px] font-normal bg-white/20 px-1.5 py-0.5 rounded-full">✓ verificado</span>
                  </h3>
                  <p className="text-[11.5px] text-white/80 truncate">{active.name}</p>
                </div>
              </div>


              <div className="flex-1 min-h-0 flex flex-col">
                <ProjectChat projectId={active.id} mode="cliente" variant="whatsapp" officeId={active.office_id} />
              </div>

              <div className="px-4 py-2 bg-[#f0f2f5] border-t border-[#d1d7db] text-[10.5px] text-muted-foreground flex items-center justify-center gap-1.5 shrink-0">
                <Shield className="h-3 w-3" /> Mensagens criptografadas · só você e o escritório podem ler
              </div>
            </div>
          ) : (
            <ul className="h-full overflow-y-auto bg-white border border-border rounded-2xl divide-y divide-border">
              {projetos.map((p) => (
                <li key={p.id}>
                  <button
                    onClick={() => setActiveId(p.id)}
                    className="w-full text-left px-5 py-3.5 hover:bg-secondary/30 transition-colors flex items-center gap-3"
                  >
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary text-[14px] font-semibold shrink-0 overflow-hidden">
                      {p.office_logo ? (
                        <img src={p.office_logo} alt={p.office_name} className="h-full w-full object-cover" />
                      ) : (
                        initialOf(p.office_name)
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-[13.5px] font-medium text-ink truncate">{p.office_name}</div>
                        <div className="text-[11px] text-muted-foreground shrink-0">
                          {p.last_at ? formatRelativeDate(p.last_at) : ""}
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <div className="text-[12px] text-muted-foreground truncate">
                          <span className="font-medium">{p.name}</span>
                          {p.last_body ? ` · ${p.last_body}` : " · Nenhuma mensagem ainda"}
                        </div>
                        {p.unread > 0 && (
                          <span className="shrink-0 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-white text-[10.5px] font-semibold">
                            {p.unread > 99 ? "99+" : p.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AppShell>
  );
}
