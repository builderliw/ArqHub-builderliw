import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, History } from "lucide-react";
import { listProjectActivity } from "@/lib/project-activity.functions";
import { externalSupabase } from "@/integrations/external-supabase/client";

type Row = {
  id: string;
  actor_id: string | null;
  actor_name: string | null;
  actor_role: string | null;
  action: string;
  detail: string | null;
  created_at: string;
};

const ACTION_LABEL: Record<string, string> = {
  "project.created": "criou o projeto",
  "project.updated": "atualizou o projeto",
  "project.deleted": "excluiu o projeto",
  "message.sent": "enviou uma mensagem ao cliente",
  "stage.updated": "atualizou uma etapa",
  "stage.created": "adicionou uma etapa",
  "stage.deleted": "removeu uma etapa",
  "presentation.uploaded": "enviou um arquivo de apresentação",
  "presentation.deleted": "removeu um arquivo de apresentação",
  "document.uploaded": "enviou um documento",
  "diary.saved": "salvou o diário de obra",
};

function label(a: string) {
  return ACTION_LABEL[a] ?? a;
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function ProjectActivityPanel({ projectId }: { projectId: string }) {
  const list = useServerFn(listProjectActivity);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setRows(null); setErr(null);
      try {
        const { data: sess } = await externalSupabase.auth.getSession();
        const token = sess.session?.access_token;
        if (!token) { setErr("Sessão expirada."); return; }
        const r = await list({ data: { accessToken: token, projectId, limit: 200 } });
        setRows(r.activity as Row[]);
      } catch (e: any) {
        setErr(e?.message ?? "Erro ao carregar atividade.");
      }
    })();
  }, [projectId, list]);

  if (err) return <p className="text-[13px] text-red-600">{err}</p>;
  if (!rows) return <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  if (rows.length === 0) return (
    <div className="text-center py-10 text-muted-foreground text-[13px]">
      <History className="h-6 w-6 mx-auto mb-2 opacity-60" />
      Nenhuma atividade registrada ainda.
    </div>
  );

  return (
    <ul className="divide-y divide-border border border-border rounded-md bg-white">
      {rows.map((r) => (
        <li key={r.id} className="px-3.5 py-2.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[13px] text-ink">
                <span className="font-semibold">{r.actor_name ?? "Usuário"}</span>
                {r.actor_role && <span className="text-muted-foreground"> · {r.actor_role}</span>}
                <span className="text-muted-foreground"> {label(r.action)}</span>
              </div>
              {r.detail && (
                <div className="text-[12px] text-muted-foreground truncate">{r.detail}</div>
              )}
            </div>
            <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">{fmt(r.created_at)}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
