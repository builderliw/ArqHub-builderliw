import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  LayoutDashboard, Users, CreditCard, Shield, Activity, AlertCircle,
  FileText, Bell, Building2, Loader2, RefreshCw, MessageSquare,
} from "lucide-react";
import { AppShell, type NavGroup } from "@/components/app-shell";
import { adminNav } from "@/lib/nav-admin";
import { listEnterpriseRequests, updateEnterpriseRequestStatus } from "@/lib/enterprise-requests.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/app/admin/enterprise")({
  head: () => ({ meta: [{ title: "Pedidos Enterprise — Admin ArqHub" }] }),
  component: AdminEnterprisePage,
});


type EnterpriseRequest = {
  id: string;
  empresa: string;
  cnpj: string | null;
  nome: string;
  email: string;
  telefone: string;
  cargo: string | null;
  num_escritorios: string | null;
  num_usuarios: string | null;
  mensagem: string;
  status: string;
  created_at: string;
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendente",
  contacted: "Contatado",
  won: "Fechado",
  lost: "Perdido",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  contacted: "bg-blue-50 text-blue-700",
  won: "bg-primary/10 text-primary",
  lost: "bg-red-50 text-red-700",
};

function AdminEnterprisePage() {
  const listFn = useServerFn(listEnterpriseRequests);
  const updateFn = useServerFn(updateEnterpriseRequestStatus);
  const [items, setItems] = useState<EnterpriseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<EnterpriseRequest | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await listFn({ data: { limit: 100 } });
      setItems(res.items as EnterpriseRequest[]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function changeStatus(id: string, status: EnterpriseRequest["status"]) {
    try {
      await updateFn({ data: { id, status: status as "pending" | "contacted" | "won" | "lost" } });
      toast.success("Status atualizado");
      setItems((arr) => arr.map((i) => (i.id === id ? { ...i, status } : i)));
      if (selected?.id === id) setSelected({ ...selected, status });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar");
    }
  }

  return (
    <AppShell role="admin" nav={adminNav} title="Pedidos Enterprise">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-[22px] font-semibold tracking-tight text-ink">Pedidos do plano Enterprise</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Solicitações enviadas pelo formulário público de Enterprise.
          </p>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md border border-border hover:bg-secondary"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Atualizar
        </button>
      </div>

      <div className="bg-white border border-border rounded-xl overflow-x-auto">
        {loading ? (
          <div className="p-12 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            Nenhum pedido recebido ainda.
          </div>
        ) : (
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-secondary/40 text-[11.5px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">Empresa</th>
                <th className="text-left px-4 py-2.5 font-medium">Contato</th>
                <th className="text-left px-4 py-2.5 font-medium">Usuários</th>
                <th className="text-left px-4 py-2.5 font-medium">Status</th>
                <th className="text-left px-4 py-2.5 font-medium">Recebido</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((r) => (
                <tr key={r.id} className="hover:bg-secondary/30">
                  <td className="px-4 py-3">
                    <div className="font-medium text-ink">{r.empresa}</div>
                    {r.cnpj && <div className="text-[11.5px] text-muted-foreground">{r.cnpj}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-ink">{r.nome}</div>
                    <div className="text-[11.5px] text-muted-foreground">{r.email} · {r.telefone}</div>
                  </td>
                  <td className="px-4 py-3 text-foreground/80">{r.num_usuarios ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block text-[10.5px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded ${STATUS_COLORS[r.status] ?? "bg-secondary text-foreground/70"}`}>
                      {STATUS_LABEL[r.status] ?? r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[12px] text-muted-foreground">
                    {new Date(r.created_at).toLocaleString("pt-BR")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setSelected(r)}
                      className="text-[12px] text-primary hover:underline"
                    >
                      Ver detalhes
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selected && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="text-lg font-semibold tracking-tight">{selected.empresa}</h3>
                <p className="text-[12px] text-muted-foreground">
                  Recebido em {new Date(selected.created_at).toLocaleString("pt-BR")}
                </p>
              </div>
              <select
                value={selected.status}
                onChange={(e) => changeStatus(selected.id, e.target.value as EnterpriseRequest["status"])}
                className="text-sm px-2 py-1.5 rounded-md border border-border"
              >
                <option value="pending">Pendente</option>
                <option value="contacted">Contatado</option>
                <option value="won">Fechado</option>
                <option value="lost">Perdido</option>
              </select>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm mb-4">
              <Info label="CNPJ" value={selected.cnpj} />
              <Info label="Contato" value={selected.nome} />
              <Info label="Cargo" value={selected.cargo} />
              <Info label="E-mail" value={selected.email} />
              <Info label="Telefone" value={selected.telefone} />
              <Info label="Nº escritórios" value={selected.num_escritorios} />
              <Info label="Nº usuários" value={selected.num_usuarios} />
            </dl>
            <div>
              <div className="text-[11.5px] uppercase tracking-wider text-muted-foreground mb-1">
                Mensagem
              </div>
              <p className="text-sm text-foreground whitespace-pre-wrap bg-secondary/40 rounded-md p-3 border border-border">
                {selected.mensagem}
              </p>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <a
                href={`mailto:${selected.email}?subject=ArqHub Enterprise — ${encodeURIComponent(selected.empresa)}`}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-dark"
              >
                Responder por e-mail
              </a>
              <button
                onClick={() => setSelected(null)}
                className="px-4 py-2 rounded-lg border border-border text-sm font-semibold hover:bg-secondary"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function Info({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-[11.5px] uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="text-foreground">{value || "—"}</dd>
    </div>
  );
}
