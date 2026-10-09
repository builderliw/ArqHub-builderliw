import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { MessageSquare, Search, CheckCheck, Circle, Reply, Clock } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { navProfissional as nav } from "@/lib/nav-profissional";
import { externalSupabase } from "@/integrations/external-supabase/client";
import { formatRelativeDate } from "@/hooks/use-profissional-data";
import { listProfessionalConversations } from "@/lib/profissional-project-data.functions";

export const Route = createFileRoute("/app/profissional/mensagens")({
  head: () => ({ meta: [{ title: "Mensagens — ArqHub" }] }),
  component: MensagensPage,
});

type Conversa = {
  projectId: string;
  projectName: string;
  clientId: string;
  clientName: string;
  ultimaMensagem: string;
  ultimaData: string;
  ultimaSenderId: string;
  naoLidas: number;
  totalMensagens: number;
  userId: string;
};

type LeituraFiltro = "todas" | "nao_lidas" | "lidas";
type RespostaFiltro = "todas" | "respondidas" | "nao_respondidas";

const lastReadKey = (projectId: string) => `chat:lastRead:${projectId}`;

function MensagensPage() {
  const [loading, setLoading] = useState(true);
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [busca, setBusca] = useState("");
  const [leitura, setLeitura] = useState<LeituraFiltro>("todas");
  const [resposta, setResposta] = useState<RespostaFiltro>("todas");
  const loadConversations = useServerFn(listProfessionalConversations);

  useEffect(() => {
    let alive = true;
    async function run() {
      const { data: sess } = await externalSupabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) { if (alive) setLoading(false); return; }
      try {
        const r = await loadConversations({ data: { accessToken: token } });
        const userId = r.userId;
        const lista: Conversa[] = (r.conversations ?? []).map((c: any) => {
          const lastRead = typeof window !== "undefined"
            ? window.localStorage.getItem(lastReadKey(c.projectId))
            : null;
          const naoLidas = (c.mensagensDeOutros ?? []).filter(
            (iso: string) => !lastRead || iso > lastRead,
          ).length;
          return {
            projectId: c.projectId,
            projectName: c.projectName,
            clientId: c.clientId,
            clientName: c.clientName,
            ultimaMensagem: c.ultimaMensagem,
            ultimaData: c.ultimaData,
            ultimaSenderId: c.ultimaSenderId,
            naoLidas,
            totalMensagens: c.totalMensagens,
            userId,
          };
        }).sort((a: Conversa, b: Conversa) => (a.ultimaData < b.ultimaData ? 1 : -1));
        if (alive) { setConversas(lista); setLoading(false); }
      } catch (e) {
        console.error("[mensagens] load failed", e);
        if (alive) setLoading(false);
      }
    }
    run();
    const t = setInterval(run, 15000);
    return () => { alive = false; clearInterval(t); };
  }, [loadConversations]);


  const counts = useMemo(() => {
    const naoLidas = conversas.filter((c) => c.naoLidas > 0).length;
    const naoRespondidas = conversas.filter((c) => c.ultimaSenderId && c.ultimaSenderId !== c.userId).length;
    return { naoLidas, naoRespondidas, total: conversas.length };
  }, [conversas]);

  // agrupar por cliente
  const grupos = useMemo(() => {
    const filtradas = conversas.filter((c) => {
      if (busca) {
        const q = busca.toLowerCase();
        if (!c.projectName.toLowerCase().includes(q) && !c.clientName.toLowerCase().includes(q)) return false;
      }
      if (leitura === "nao_lidas" && c.naoLidas === 0) return false;
      if (leitura === "lidas" && c.naoLidas > 0) return false;
      const respondida = c.ultimaSenderId === c.userId;
      if (resposta === "respondidas" && !respondida) return false;
      if (resposta === "nao_respondidas" && respondida) return false;
      return true;
    });

    const map = new Map<string, { clientId: string; clientName: string; conversas: Conversa[]; ultimaData: string }>();
    for (const c of filtradas) {
      const g = map.get(c.clientId) ?? { clientId: c.clientId, clientName: c.clientName, conversas: [], ultimaData: "" };
      g.conversas.push(c);
      if (c.ultimaData > g.ultimaData) g.ultimaData = c.ultimaData;
      map.set(c.clientId, g);
    }
    return Array.from(map.values()).sort((a, b) => (a.ultimaData < b.ultimaData ? 1 : -1));
  }, [conversas, busca, leitura, resposta]);

  return (
    <AppShell role="profissional" nav={nav} title="Mensagens">
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-[22px] font-semibold tracking-tight text-ink">Central de mensagens</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Todas as conversas do escritório, agrupadas por cliente.</p>
        </div>
        <div className="flex items-center gap-2 px-3 h-9 bg-white border border-border rounded-md w-72">
          <Search className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="bg-transparent flex-1 outline-none text-[13px]"
            placeholder="Buscar projeto ou cliente..."
          />
        </div>
      </div>

      {/* Filtros */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <FilterGroup
          label="Leitura"
          value={leitura}
          onChange={(v) => setLeitura(v as LeituraFiltro)}
          options={[
            { v: "todas", label: `Todas (${counts.total})`, icon: null },
            { v: "nao_lidas", label: `Não lidas (${counts.naoLidas})`, icon: <Circle className="h-3 w-3 fill-primary text-primary" /> },
            { v: "lidas", label: "Lidas", icon: <CheckCheck className="h-3.5 w-3.5" /> },
          ]}
        />
        <FilterGroup
          label="Resposta"
          value={resposta}
          onChange={(v) => setResposta(v as RespostaFiltro)}
          options={[
            { v: "todas", label: "Todas", icon: null },
            { v: "nao_respondidas", label: `Aguardando resposta (${counts.naoRespondidas})`, icon: <Clock className="h-3.5 w-3.5" /> },
            { v: "respondidas", label: "Respondidas", icon: <Reply className="h-3.5 w-3.5" /> },
          ]}
        />
      </div>

      {loading ? (
        <div className="text-[13px] text-muted-foreground">Carregando...</div>
      ) : grupos.length === 0 ? (
        <div className="bg-white border border-border rounded-xl p-12 text-center max-w-xl mx-auto">
          <div className="mx-auto h-12 w-12 rounded-full bg-secondary flex items-center justify-center mb-4">
            <MessageSquare className="h-5 w-5 text-muted-foreground" strokeWidth={1.75} />
          </div>
          <h3 className="text-[15px] font-semibold text-ink">
            {conversas.length === 0 ? "Nenhuma mensagem ainda" : "Nada encontrado com esses filtros"}
          </h3>
          <p className="text-[12.5px] text-muted-foreground mt-1 max-w-sm mx-auto">
            {conversas.length === 0
              ? "As conversas dos seus projetos aparecerão aqui. Abra um projeto para iniciar."
              : "Ajuste os filtros para ver outras conversas."}
          </p>
          {conversas.length === 0 && (
            <Link
              to="/app/profissional"
              className="inline-flex items-center gap-1.5 mt-4 px-3.5 h-9 bg-ink text-white rounded-md text-[13px] font-medium"
            >
              Ver projetos
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          {grupos.map((g) => (
            <section key={g.clientId} className="bg-white border border-border rounded-xl overflow-hidden">
              <header className="flex items-center gap-3 px-5 py-3 bg-secondary/40 border-b border-border">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary text-[13px] font-semibold">
                  {g.clientName[0]?.toUpperCase() ?? "?"}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-semibold text-ink truncate">{g.clientName}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {g.conversas.length} {g.conversas.length === 1 ? "conversa" : "conversas"}
                  </div>
                </div>
              </header>
              <ul className="divide-y divide-border">
                {g.conversas.map((c) => {
                  const respondida = c.ultimaSenderId === c.userId;
                  return (
                    <li key={c.projectId} className="hover:bg-secondary/30 transition-colors">
                      <Link
                        to="/app/profissional/clientes"
                        search={{ clientId: c.clientId, tab: "messages", projectId: c.projectId }}
                        className="flex items-center gap-3 px-5 py-3.5"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <div className="text-[13.5px] font-medium text-ink truncate">{c.projectName}</div>
                            {c.naoLidas > 0 && (
                              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-white text-[10.5px] font-semibold">
                                {c.naoLidas > 99 ? "99+" : c.naoLidas}
                              </span>
                            )}
                            {!respondida && c.ultimaSenderId && (
                              <span className="inline-flex items-center gap-1 px-1.5 h-[18px] rounded-full bg-amber-100 text-amber-800 text-[10.5px] font-medium">
                                <Clock className="h-2.5 w-2.5" strokeWidth={2} /> aguardando
                              </span>
                            )}
                            {respondida && (
                              <span className="inline-flex items-center gap-1 px-1.5 h-[18px] rounded-full bg-emerald-100 text-emerald-800 text-[10.5px] font-medium">
                                <Reply className="h-2.5 w-2.5" strokeWidth={2} /> respondida
                              </span>
                            )}
                            <span className="ml-auto text-[11px] text-muted-foreground shrink-0">{formatRelativeDate(c.ultimaData)}</span>
                          </div>
                          <div className="text-[12px] text-muted-foreground truncate mt-0.5">
                            <span className="font-medium">{respondida ? "Você: " : `${c.clientName}: `}</span>
                            {c.ultimaMensagem}
                          </div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </AppShell>
  );
}

function FilterGroup<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { v: T; label: string; icon: React.ReactNode }[];
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[11px] uppercase tracking-wide text-muted-foreground mr-1">{label}</span>
      <div className="inline-flex bg-white border border-border rounded-md p-0.5">
        {options.map((o) => (
          <button
            key={o.v}
            onClick={() => onChange(o.v)}
            className={`inline-flex items-center gap-1.5 px-2.5 h-7 rounded text-[12px] font-medium transition-colors ${
              value === o.v ? "bg-ink text-white" : "text-muted-foreground hover:text-ink"
            }`}
          >
            {o.icon}
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
