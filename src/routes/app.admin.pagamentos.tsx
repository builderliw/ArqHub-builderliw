import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { LayoutDashboard, Activity, RefreshCw } from "lucide-react";
import { AppShell, type NavGroup } from "@/components/app-shell";
import { adminNav } from "@/lib/nav-admin";
import { listAdminPayments } from "@/lib/payment-tracking.functions";
import { externalSupabase } from "@/integrations/external-supabase/client";

export const Route = createFileRoute("/app/admin/pagamentos")({
  head: () => ({ meta: [{ title: "Log de pagamentos — Admin" }] }),
  component: AdminPagamentosPage,
});


function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const eventColors: Record<string, string> = {
  created: "bg-blue-50 text-blue-700",
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-primary/10 text-primary",
  failed: "bg-red-50 text-red-700",
  webhook_received: "bg-secondary text-muted-foreground",
  subscription_activated: "bg-emerald-50 text-emerald-700",
};

function AdminPagamentosPage() {
  const fn = useServerFn(listAdminPayments);
  const [items, setItems] = useState<any[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [method, setMethod] = useState("");

  async function load() {
    setLoading(true);
    try {
      const { data: sess } = await externalSupabase.auth.getSession();
      const accessToken = sess.session?.access_token;
      if (!accessToken) throw new Error("Sessão expirada. Faça login novamente.");
      const r = await fn({
        data: {
          accessToken,
          limit: 100,
          status: status || undefined,
          method: method || undefined,
        } as any,
      });
      setItems(r.items);
      setErr(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao carregar log");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, method]);

  return (
    <AppShell role="admin" nav={adminNav} title="Log de pagamentos">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:flex-wrap">
        <div>
          <h2 className="text-[22px] font-semibold tracking-tight text-ink">Eventos de pagamento</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Auditoria de criação, pendência, aprovação, falhas e ativação de assinaturas.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border border-border bg-white px-3 py-2 t-body-sm"
          >
            <option value="">Todos status</option>
            <option value="approved">Aprovado</option>
            <option value="pending">Pendente</option>
            <option value="rejected">Recusado</option>
            <option value="cancelled">Cancelado</option>
          </select>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="rounded-lg border border-border bg-white px-3 py-2 t-body-sm"
          >
            <option value="">Todos métodos</option>
            <option value="pix">PIX</option>
            <option value="card">Cartão</option>
          </select>
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border t-label hover:bg-secondary"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Atualizar
          </button>
        </div>
      </div>

      {err && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-700 t-body-sm mb-4">
          {err}
        </div>
      )}

      <div className="bg-white border border-border rounded-xl overflow-x-auto">
        <table className="w-full min-w-[720px] text-[13px]">
          <thead className="bg-secondary">
            <tr className="text-left text-muted-foreground">
              <th className="px-4 py-2.5 font-medium">Data</th>
              <th className="px-4 py-2.5 font-medium">Evento</th>
              <th className="px-4 py-2.5 font-medium">Método</th>
              <th className="px-4 py-2.5 font-medium">Plano</th>
              <th className="px-4 py-2.5 font-medium">Valor</th>
              <th className="px-4 py-2.5 font-medium">Email</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium">Payment ID</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items === null ? (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-muted-foreground">
                  Carregando…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-muted-foreground">
                  Nenhum evento encontrado.
                </td>
              </tr>
            ) : (
              items.map((e) => (
                <tr key={e.id} className="hover:bg-secondary/30">
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    {new Date(e.created_at).toLocaleString("pt-BR")}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`text-[10.5px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        eventColors[e.event_type] ?? "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {e.event_type}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">{e.method ?? "—"}</td>
                  <td className="px-4 py-2.5">
                    {e.plan_code ?? "—"}
                    {e.frequency && (
                      <span className="text-muted-foreground"> · {e.frequency}</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">{e.amount ? formatBRL(Number(e.amount)) : "—"}</td>
                  <td className="px-4 py-2.5 truncate max-w-[180px]">{e.payer_email ?? "—"}</td>
                  <td className="px-4 py-2.5">{e.status ?? "—"}</td>
                  <td className="px-4 py-2.5 font-mono text-[11.5px]">{e.payment_id ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
