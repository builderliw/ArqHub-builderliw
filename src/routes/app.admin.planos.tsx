import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { RefreshCw, ChevronLeft, ChevronRight, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { adminNav } from "@/lib/nav-admin";
import { externalSupabase } from "@/integrations/external-supabase/client";
import { updatePlan } from "@/lib/admin-plans.functions";

export const Route = createFileRoute("/app/admin/planos")({
  head: () => ({ meta: [{ title: "Planos & Assinaturas — Admin" }] }),
  component: Page,
});


function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function frequencyFromCode(code: string) {
  if (code?.includes("yearly")) return "Anual";
  if (code?.includes("monthly")) return "Mensal";
  return "—";
}

const PAGE_SIZE = 10;

type PlanRow = { id: string; code: string; name: string | null; price_cents: number | null; active: boolean | null; is_featured: boolean | null };

function Page() {
  const updateFn = useServerFn(updatePlan);
  const [planos, setPlanos] = useState<PlanRow[] | null>(null);
  const [subs, setSubs] = useState<any[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<PlanRow | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [p, s] = await Promise.all([
        externalSupabase.from("plans").select("id, code, name, price_cents, active, is_featured").order("price_cents", { ascending: true }),
        externalSupabase.from("subscriptions").select("id, office_id, plan_id, status, last_payment_at, last_payment_status, updated_at").order("updated_at", { ascending: false }).limit(500),
      ]);
      if (p.error) throw p.error;
      if (s.error) throw s.error;
      setPlanos((p.data ?? []) as PlanRow[]);
      setSubs(s.data ?? []);
      setErr(null);
    } catch (e: any) {
      setErr(e?.message ?? "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!editing) return;
    setSaving(true);
    try {
      await updateFn({ data: {
        id: editing.id,
        name: editing.name ?? undefined,
        price_cents: editing.price_cents ?? 0,
        active: !!editing.active,
        is_featured: !!editing.is_featured,
      }});
      toast.success("Plano atualizado");
      setEditing(null);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filteredSubs = useMemo(() => {
    if (!subs) return [];
    if (!statusFilter) return subs;
    return subs.filter((s) => s.status === statusFilter);
  }, [subs, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredSubs.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filteredSubs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [statusFilter]);

  return (
    <AppShell role="admin" nav={adminNav} title="Planos & Assinaturas">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:flex-wrap">
        <div>
          <h2 className="text-[22px] font-semibold tracking-tight text-ink">Planos & Assinaturas</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Configuração comercial e base ativa.</p>
        </div>
        <button onClick={load} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-[13px] hover:bg-secondary">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Atualizar
        </button>
      </div>

      {err && <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-700 text-[13px] mb-4">{err}</div>}

      <h3 className="text-[11px] font-semibold mb-2 uppercase tracking-wider text-muted-foreground">Planos</h3>
      <div className="bg-white border border-border rounded-xl overflow-x-auto mb-6">
        <table className="w-full min-w-[720px] text-[13px]">
          <thead className="bg-secondary"><tr className="text-left text-muted-foreground">
            <th className="px-4 py-2.5 font-medium">Código</th>
            <th className="px-4 py-2.5 font-medium">Nome</th>
            <th className="px-4 py-2.5 font-medium">Preço</th>
            <th className="px-4 py-2.5 font-medium">Frequência</th>
            <th className="px-4 py-2.5 font-medium">Status</th>
            <th className="px-4 py-2.5 font-medium text-right">Ações</th>
          </tr></thead>
          <tbody className="divide-y divide-border">
            {planos === null ? <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">Carregando…</td></tr>
            : planos.length === 0 ? <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">Nenhum plano cadastrado.</td></tr>
            : planos.map((p) => (
              <tr key={p.code} className="hover:bg-secondary/30">
                <td className="px-4 py-2.5 font-mono text-[11.5px]">{p.code}</td>
                <td className="px-4 py-2.5">{p.name ?? "—"} {p.is_featured && <span className="ml-1 text-[10px] uppercase tracking-wider text-primary">destaque</span>}</td>
                <td className="px-4 py-2.5">{p.price_cents ? formatBRL(p.price_cents) : "—"}</td>
                <td className="px-4 py-2.5">{frequencyFromCode(p.code)}</td>
                <td className="px-4 py-2.5">{p.active ? <span className="text-emerald-700">Ativo</span> : <span className="text-muted-foreground">Inativo</span>}</td>
                <td className="px-4 py-2.5 text-right">
                  <button onClick={() => setEditing(p)} className="inline-flex items-center gap-1 text-[12px] text-primary hover:underline">
                    <Pencil className="h-3.5 w-3.5" /> Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-end justify-between mb-2 gap-3 flex-wrap">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Assinaturas</h3>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-border bg-white px-3 py-1.5 text-[13px]"
        >
          <option value="">Todos status</option>
          <option value="active">Ativa</option>
          <option value="pending">Pendente</option>
          <option value="canceled">Cancelada</option>
          <option value="expired">Expirada</option>
        </select>
      </div>
      <div className="bg-white border border-border rounded-xl overflow-x-auto">
        <table className="w-full min-w-[720px] text-[13px]">
          <thead className="bg-secondary"><tr className="text-left text-muted-foreground">
            <th className="px-4 py-2.5 font-medium">Office</th>
            <th className="px-4 py-2.5 font-medium">Plano</th>
            <th className="px-4 py-2.5 font-medium">Status</th>
            <th className="px-4 py-2.5 font-medium">Último pagamento</th>
            <th className="px-4 py-2.5 font-medium">Atualizado</th>
          </tr></thead>
          <tbody className="divide-y divide-border">
            {subs === null ? <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">Carregando…</td></tr>
            : pageRows.length === 0 ? <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">Nenhuma assinatura.</td></tr>
            : pageRows.map((s) => (
              <tr key={s.id} className="hover:bg-secondary/30">
                <td className="px-4 py-2.5 font-mono text-[11px] truncate max-w-[160px]">{s.office_id ?? "—"}</td>
                <td className="px-4 py-2.5 font-mono text-[11px]">{s.plan_id ?? "—"}</td>
                <td className="px-4 py-2.5">{s.status ?? "—"}</td>
                <td className="px-4 py-2.5">{s.last_payment_at ? new Date(s.last_payment_at).toLocaleString("pt-BR") : "—"}</td>
                <td className="px-4 py-2.5">{s.updated_at ? new Date(s.updated_at).toLocaleString("pt-BR") : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center justify-between px-4 py-3 border-t border-border text-[12.5px] text-muted-foreground">
          <span>Página {currentPage} de {totalPages} · {filteredSubs.length} resultado(s)</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-border hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Anterior
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-border hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Próxima <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" onClick={() => !saving && setEditing(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold tracking-tight">Editar plano</h3>
                <p className="text-[11.5px] font-mono text-muted-foreground">{editing.code}</p>
              </div>
              <button onClick={() => setEditing(null)} className="p-1 hover:bg-secondary rounded"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[11.5px] uppercase tracking-wider text-muted-foreground">Nome</label>
                <input value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-lg border border-border text-[13px]" />
              </div>
              <div>
                <label className="text-[11.5px] uppercase tracking-wider text-muted-foreground">Preço (R$)</label>
                <input
                  type="number" step="0.01" min={0}
                  value={editing.price_cents != null ? (editing.price_cents / 100).toString() : ""}
                  onChange={(e) => setEditing({ ...editing, price_cents: Math.round(Number(e.target.value || 0) * 100) })}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-border text-[13px]"
                />
              </div>
              <label className="flex items-center gap-2 text-[13px]">
                <input type="checkbox" checked={!!editing.active} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} />
                Plano ativo
              </label>
              <label className="flex items-center gap-2 text-[13px]">
                <input type="checkbox" checked={!!editing.is_featured} onChange={(e) => setEditing({ ...editing, is_featured: e.target.checked })} />
                Destaque
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setEditing(null)} disabled={saving} className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-secondary disabled:opacity-50">Cancelar</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-dark disabled:opacity-50">
                {saving ? "Salvando…" : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
