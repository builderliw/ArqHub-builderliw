import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  LayoutDashboard, Users, CreditCard, Shield, Activity, AlertCircle,
  FileText, Bell, Building2, Loader2, RefreshCw, MessageSquare,
} from "lucide-react";
import { AppShell, type NavGroup } from "@/components/app-shell";
import { adminNav } from "@/lib/nav-admin";
import { listSupportMessages, updateSupportMessageStatus } from "@/lib/support-messages.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/app/admin/suporte")({
  head: () => ({ meta: [{ title: "Mensagens de suporte — Admin ArqHub" }] }),
  component: AdminSuportePage,
});


type SupportMessage = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  status: "new" | "in_progress" | "resolved";
  created_at: string;
};

const STATUS_LABEL: Record<string, string> = {
  new: "Novo",
  in_progress: "Em andamento",
  resolved: "Resolvido",
};

const STATUS_COLORS: Record<string, string> = {
  new: "bg-amber-50 text-amber-700",
  in_progress: "bg-blue-50 text-blue-700",
  resolved: "bg-primary/10 text-primary",
};

function AdminSuportePage() {
  const listFn = useServerFn(listSupportMessages);
  const updateFn = useServerFn(updateSupportMessageStatus);
  const [items, setItems] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<SupportMessage | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await listFn({ data: { limit: 200 } });
      setItems(res.items as SupportMessage[]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function changeStatus(id: string, status: SupportMessage["status"]) {
    try {
      await updateFn({ data: { id, status } });
      toast.success("Status atualizado");
      setItems((arr) => arr.map((i) => (i.id === id ? { ...i, status } : i)));
      if (selected?.id === id) setSelected({ ...selected, status });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar");
    }
  }

  return (
    <AppShell role="admin" nav={adminNav} title="Mensagens de Suporte">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-[22px] font-semibold tracking-tight text-ink">Mensagens recebidas pelo suporte</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Enviadas pelo formulário público em /ajuda/suporte.
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
            Nenhuma mensagem recebida ainda.
          </div>
        ) : (
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-secondary/40 text-[11.5px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">Remetente</th>
                <th className="text-left px-4 py-2.5 font-medium">Mensagem</th>
                <th className="text-left px-4 py-2.5 font-medium">Status</th>
                <th className="text-left px-4 py-2.5 font-medium">Recebido</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((r) => (
                <tr key={r.id} className="hover:bg-secondary/30">
                  <td className="px-4 py-3">
                    <div className="font-medium text-ink">{r.name}</div>
                    <div className="text-[11.5px] text-muted-foreground">
                      {r.email}{r.phone ? ` · ${r.phone}` : ""}
                    </div>
                  </td>
                  <td className="px-4 py-3 max-w-md">
                    <div className="text-foreground/80 line-clamp-2">{r.message}</div>
                  </td>
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
                <h3 className="text-lg font-semibold tracking-tight">{selected.name}</h3>
                <p className="text-[12px] text-muted-foreground">
                  Recebido em {new Date(selected.created_at).toLocaleString("pt-BR")}
                </p>
              </div>
              <select
                value={selected.status}
                onChange={(e) => changeStatus(selected.id, e.target.value as SupportMessage["status"])}
                className="text-sm px-2 py-1.5 rounded-md border border-border"
              >
                <option value="new">Novo</option>
                <option value="in_progress">Em andamento</option>
                <option value="resolved">Resolvido</option>
              </select>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm mb-4">
              <Info label="E-mail" value={selected.email} />
              <Info label="Telefone" value={selected.phone} />
            </dl>
            <div>
              <div className="text-[11.5px] uppercase tracking-wider text-muted-foreground mb-1">
                Mensagem
              </div>
              <p className="text-sm text-foreground whitespace-pre-wrap bg-secondary/40 rounded-md p-3 border border-border">
                {selected.message}
              </p>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <a
                href={`mailto:${selected.email}?subject=ArqHub Suporte — Re: sua mensagem`}
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
