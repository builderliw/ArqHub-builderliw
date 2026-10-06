import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  Bell,
  Building2,
  CreditCard,
  FileText,
  LayoutDashboard,
  MessageSquare,
  RefreshCw,
  Search,
  Shield,
  Users,
} from "lucide-react";
import { AppShell, type NavGroup } from "@/components/app-shell";
import { adminNav } from "@/lib/nav-admin";
import { externalSupabase } from "@/integrations/external-supabase/client";

export const Route = createFileRoute("/app/admin/empresas")({
  head: () => ({ meta: [{ title: "Empresas — Admin ArqHub" }] }),
  component: AdminEmpresasPage,
});


type OfficeRow = {
  id: string;
  name: string | null;
  slug: string | null;
  city: string | null;
  website: string | null;
  owner_id: string | null;
  portfolio_public: boolean | null;
  created_at: string | null;
};

function AdminEmpresasPage() {
  const [rows, setRows] = useState<OfficeRow[] | null>(null);
  const [q, setQ] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const { data, error } = await externalSupabase
        .from("offices")
        .select("id, name, slug, city, website, owner_id, portfolio_public, created_at")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      setRows((data ?? []) as OfficeRow[]);
      setErr(null);
    } catch (e) {
      setRows([]);
      setErr(e instanceof Error ? e.message : "Erro ao carregar empresas");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!rows) return [];
    if (!term) return rows;
    return rows.filter((row) =>
      [row.name, row.city, row.slug, row.website, row.owner_id]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term)),
    );
  }, [rows, q]);

  return (
    <AppShell role="admin" nav={adminNav} title="Empresas">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-[22px] font-semibold tracking-tight text-ink">Empresas cadastradas</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">Escritórios e empresas registrados na plataforma.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar empresa"
              className="w-64 rounded-lg border border-border bg-white py-2 pl-8 pr-3 text-[13px]"
            />
          </div>
          <button onClick={load} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-[13px] hover:bg-secondary">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Atualizar
          </button>
        </div>
      </div>

      {err && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-[13px] text-red-700">{err}</div>}

      <div className="overflow-x-auto rounded-xl border border-border bg-white">
        <table className="w-full min-w-[720px] text-[13px]">
          <thead className="bg-secondary">
            <tr className="text-left text-muted-foreground">
              <th className="px-4 py-2.5 font-medium">Empresa</th>
              <th className="px-4 py-2.5 font-medium">Cidade</th>
              <th className="px-4 py-2.5 font-medium">Portfólio</th>
              <th className="px-4 py-2.5 font-medium">Site</th>
              <th className="px-4 py-2.5 font-medium">Cadastro</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows === null ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Carregando…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Nenhuma empresa encontrada.</td></tr>
            ) : filtered.map((row) => (
              <tr key={row.id} className="hover:bg-secondary/30">
                <td className="px-4 py-3">
                  <div className="font-medium text-ink">{row.name ?? "Sem nome"}</div>
                  <div className="font-mono text-[11px] text-muted-foreground">{row.slug ?? row.id}</div>
                </td>
                <td className="px-4 py-3">{row.city ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className={`rounded px-1.5 py-0.5 text-[10.5px] font-medium uppercase tracking-wider ${row.portfolio_public ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"}`}>
                    {row.portfolio_public ? "Publicado" : "Privado"}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{row.website ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{row.created_at ? new Date(row.created_at).toLocaleDateString("pt-BR") : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
