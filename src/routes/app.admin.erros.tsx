import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { LayoutDashboard, Users, CreditCard, Shield, Activity, AlertCircle, ChevronLeft, ChevronRight, Search, MessageSquare } from "lucide-react";
import { AppShell, type NavGroup } from "@/components/app-shell";
import { adminNav } from "@/lib/nav-admin";

export const Route = createFileRoute("/app/admin/erros")({
  head: () => ({ meta: [{ title: "Erros — Admin" }] }),
  component: Page,
});


type Erro = { id: string; level: "error" | "warn" | "info"; source: string; message: string; created_at: string };

const PAGE_SIZE = 10;

function Page() {
  // Sem fonte de erros conectada — mantém vazio. Filtros funcionais.
  const [rows] = useState<Erro[]>([]);
  const [q, setQ] = useState("");
  const [level, setLevel] = useState<"" | Erro["level"]>("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (level && r.level !== level) return false;
      if (!term) return true;
      return r.message.toLowerCase().includes(term) || r.source.toLowerCase().includes(term);
    });
  }, [rows, q, level]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <AppShell role="admin" nav={adminNav} title="Erros">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:flex-wrap">
        <div>
          <h2 className="text-[22px] font-semibold tracking-tight text-ink">Erros</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Monitoramento de falhas da plataforma.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
              placeholder="Buscar mensagem"
              className="pl-8 pr-3 py-2 rounded-lg border border-border bg-white text-[13px] w-64"
            />
          </div>
          <select
            value={level}
            onChange={(e) => { setLevel(e.target.value as any); setPage(1); }}
            className="rounded-lg border border-border bg-white px-3 py-2 text-[13px] w-full sm:w-auto"
          >
            <option value="">Todos os níveis</option>
            <option value="error">Erro</option>
            <option value="warn">Aviso</option>
            <option value="info">Info</option>
          </select>
        </div>
      </div>

      <div className="bg-white border border-border rounded-xl overflow-x-auto">
        <table className="w-full min-w-[720px] text-[13px]">
          <thead className="bg-secondary"><tr className="text-left text-muted-foreground">
            <th className="px-4 py-2.5 font-medium">Data</th>
            <th className="px-4 py-2.5 font-medium">Nível</th>
            <th className="px-4 py-2.5 font-medium">Origem</th>
            <th className="px-4 py-2.5 font-medium">Mensagem</th>
          </tr></thead>
          <tbody className="divide-y divide-border">
            {pageRows.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                <AlertCircle className="h-6 w-6 mx-auto mb-2" strokeWidth={1.5} />
                Nenhum erro registrado.
              </td></tr>
            ) : pageRows.map((r) => (
              <tr key={r.id} className="hover:bg-secondary/30">
                <td className="px-4 py-2.5 whitespace-nowrap">{new Date(r.created_at).toLocaleString("pt-BR")}</td>
                <td className="px-4 py-2.5">{r.level}</td>
                <td className="px-4 py-2.5">{r.source}</td>
                <td className="px-4 py-2.5 truncate max-w-[400px]">{r.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center justify-between px-4 py-3 border-t border-border text-[12.5px] text-muted-foreground">
          <span>Página {currentPage} de {totalPages} · {filtered.length} resultado(s)</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-border hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed">
              <ChevronLeft className="h-3.5 w-3.5" /> Anterior
            </button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-border hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed">
              Próxima <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
