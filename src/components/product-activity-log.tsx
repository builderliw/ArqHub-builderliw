import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, ShoppingCart, RotateCcw } from "lucide-react";
import { externalSupabase } from "@/integrations/external-supabase/client";
import { listProfessionalProductActivity } from "@/lib/profissional-project-data.functions";

type LogRow = {
  id: string;
  product_id: string;
  action: "purchased" | "unpurchased";
  actor_role: "client" | "office";
  created_at: string;
  product_name?: string | null;
};

function fmt(d: string) {
  try {
    return new Date(d).toLocaleString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return d; }
}

export function ProductActivityLog({ projectId }: { projectId: string }) {
  const [rows, setRows] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const listActivity = useServerFn(listProfessionalProductActivity);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const token = (await externalSupabase.auth.getSession()).data.session?.access_token;
      if (!token) { setRows([]); setLoading(false); return; }
      const r = await listActivity({ data: { accessToken: token, projectId } });
      setRows((r.rows ?? []) as LogRow[]);
      setLoading(false);
    })();
  }, [projectId, listActivity]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Carregando atividade…
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center text-[12.5px] text-muted-foreground">
        Nenhuma atividade registrada ainda.
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border border border-border rounded-lg">
      {rows.map((r) => {
        const purchased = r.action === "purchased";
        return (
          <li key={r.id} className="flex items-start gap-3 px-3 py-2.5">
            <div className={`mt-0.5 h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${
              purchased ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
            }`}>
              {purchased ? <ShoppingCart className="h-3.5 w-3.5" /> : <RotateCcw className="h-3.5 w-3.5" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] text-ink">
                <span className="font-medium">{r.product_name}</span>{" "}
                <span className={purchased ? "text-emerald-700" : "text-amber-700"}>
                  marcado como {purchased ? "Comprado" : "Não comprado"}
                </span>{" "}
                <span className="text-muted-foreground">
                  por {r.actor_role === "client" ? "cliente" : "escritório"}
                </span>
              </div>
              <div className="text-[11.5px] text-muted-foreground mt-0.5">{fmt(r.created_at)}</div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
