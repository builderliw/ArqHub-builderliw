import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, History, RefreshCw, User } from "lucide-react";
import { externalSupabase } from "@/integrations/external-supabase/client";
import { listProjectActivity } from "@/lib/project-activity.functions";

type Proj = { id: string; name: string };
type Row = {
  id: string;
  actor_id: string | null;
  actor_name: string | null;
  actor_role: string | null;
  action: string;
  detail: string | null;
  created_at: string;
  projectName?: string;
};

const PALETTE = ["#7C3AED", "#2563EB", "#DC2626", "#0891B2", "#D946EF", "#EA580C", "#16A34A"];
function colorFor(key: string) {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

function formatWhen(iso: string) {
  const d = new Date(iso);
  const dia = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  const hora = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return `no dia ${dia} às ${hora}`;
}

export function ProjectActivityTab({ projects, clientName }: { projects: Proj[]; clientName?: string }) {
  const list = useServerFn(listProjectActivity);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [projFilter, setProjFilter] = useState<string>("all");
  const [actorFilter, setActorFilter] = useState<string>("all");
  const ids = projects.map((p) => p.id).join(",");

  async function load() {
    setLoading(true);
    try {
      const { data: sess } = await externalSupabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token || projects.length === 0) { setRows([]); return; }
      const all: Row[] = [];
      for (const p of projects) {
        try {
          const r = await list({ data: { accessToken: token, projectId: p.id, limit: 200 } });
          for (const a of r.activity as Row[]) all.push({ ...a, projectName: p.name });
        } catch { /* projeto sem acesso/log */ }
      }
      all.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
      setRows(all);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [ids]);

  const actors = useMemo(
    () => Array.from(new Set(rows.map((r) => r.actor_name ?? "Desconhecido"))),
    [rows],
  );

  const filtered = rows.filter(
    (r) =>
      (projFilter === "all" || r.projectName === projFilter) &&
      (actorFilter === "all" || (r.actor_name ?? "Desconhecido") === actorFilter),
  );

  if (projects.length === 0) {
    return <p className="text-[12.5px] text-muted-foreground">Cadastre um projeto para acompanhar o histórico.</p>;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink mr-auto">
          <History className="h-4 w-4 text-primary" /> Relatório de atividades
        </div>
        <select
          value={projFilter}
          onChange={(e) => setProjFilter(e.target.value)}
          className="h-8 rounded-md border border-border bg-white px-2 text-[12px]"
        >
          <option value="all">Todos os projetos</option>
          {projects.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
        </select>
        <select
          value={actorFilter}
          onChange={(e) => setActorFilter(e.target.value)}
          className="h-8 rounded-md border border-border bg-white px-2 text-[12px]"
        >
          <option value="all">Todos os responsáveis</option>
          {actors.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <button
          onClick={() => void load()}
          className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md border border-border text-[12px] hover:bg-secondary"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Atualizar
        </button>
      </div>

      {loading ? (
        <div className="py-10 text-center"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground mx-auto" /></div>
      ) : filtered.length === 0 ? (
        <p className="py-10 text-center text-[12.5px] text-muted-foreground">
          Nenhuma atividade registrada ainda.
        </p>
      ) : (
        <ol className="relative border-l border-border ml-2">
          {filtered.map((r) => {
            const name = r.actor_name ?? "Desconhecido";
            const color = colorFor(r.actor_id ?? name);
            return (
              <li key={r.id} className="ml-4 pb-4">
                <span
                  className="absolute -left-[7px] mt-1.5 h-3.5 w-3.5 rounded-full border-2 border-white"
                  style={{ background: color }}
                />
                <p className="text-[12.5px] leading-relaxed text-ink">
                  <span className="inline-flex items-center gap-1 font-semibold align-middle" style={{ color }}>
                    <User className="h-3 w-3" /> {name}
                  </span>
                  {r.actor_role && (
                    <span className="mx-1.5 text-[10.5px] px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground align-middle">
                      {r.actor_role}
                    </span>
                  )}
                  <span> {r.action}</span>
                  {r.detail && <span className="font-medium"> {r.detail}</span>}
                  <span className="text-muted-foreground"> {formatWhen(r.created_at)}</span>
                  {clientName && <span> para o cliente <span className="font-medium">{clientName}</span></span>}
                  <span className="text-muted-foreground">.</span>
                </p>
                {r.projectName && (
                  <div className="text-[11px] text-muted-foreground mt-0.5">Projeto: {r.projectName}</div>
                )}

              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
