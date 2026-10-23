import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Mail, Phone, MapPin, Users as UsersIcon, Loader2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { navProfissional as nav } from "@/lib/nav-profissional";
import { externalSupabase } from "@/integrations/external-supabase/client";
import { NewClientModal } from "@/components/new-client-modal";
import { listProfissionalClientData } from "@/lib/profissional-clientes.functions";
import { isDemoId } from "@/lib/demo-client";
import { toast } from "sonner";

export const Route = createFileRoute("/app/profissional/clientes")({
  head: () => ({ meta: [{ title: "Clientes — ArqHub" }] }),
  component: ClientesPage,
});

type Cliente = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: string;
  created_at: string;
  cidade?: string | null;
  uf?: string | null;
  isDemo?: boolean;
};

function ClientesPage() {
  const [officeId, setOfficeId] = useState<string | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const listClientData = useServerFn(listProfissionalClientData);

  async function load() {
    setLoading(true);
    try {
      const { data: sess } = await externalSupabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) {
        setLoading(false);
        return;
      }
      const data = await listClientData({ data: { accessToken: token } });
      const list = ((data.clientes ?? []) as Cliente[]).sort((a, b) =>
        a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }),
      );
      setOfficeId(data.officeId);
      setClientes(list);
      setSelectedId((cur) => (cur && list.some((c) => c.id === cur) ? cur : list[0]?.id ?? null));
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao carregar clientes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return clientes;
    return clientes.filter(
      (c) =>
        c.name.toLowerCase().includes(t) ||
        (c.email ?? "").toLowerCase().includes(t) ||
        (c.phone ?? "").toLowerCase().includes(t),
    );
  }, [clientes, q]);

  const selected = clientes.find((c) => c.id === selectedId) ?? null;

  return (
    <AppShell role="profissional" nav={nav} title="Clientes">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[22px] font-semibold tracking-tight text-ink">Clientes</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {loading ? "Carregando..." : `${clientes.length} cadastrado${clientes.length === 1 ? "" : "s"}`}
          </p>
          <p className="text-[12.5px] text-muted-foreground mt-1">
            O cliente <strong className="text-ink">Maria Silva (Demo)</strong> aparece para todos explorarem o painel.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          disabled={!officeId}
          className="inline-flex items-center gap-1.5 px-3.5 h-9 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md text-[13px] font-medium disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2} /> Novo cliente
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
        <aside className="bg-white border border-border rounded-xl overflow-hidden flex flex-col max-h-[calc(100vh-180px)]">
          <div className="px-3 py-2.5 border-b border-border flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar cliente..."
              className="flex-1 text-[13px] outline-none bg-transparent placeholder:text-muted-foreground"
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mx-auto" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-[12.5px] text-muted-foreground">Nenhum cliente ainda.</div>
            ) : (
              <ul className="divide-y divide-border">
                {filtered.map((c) => {
                  const isActive = c.id === selectedId;
                  const demo = c.isDemo || isDemoId(c.id);
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(c.id)}
                        className={`w-full text-left px-3 py-2.5 flex items-center gap-2.5 hover:bg-secondary/40 transition-colors ${isActive ? "bg-primary/5" : ""}`}
                      >
                        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-secondary text-muted-foreground text-[12px] font-semibold">
                          {c.name.slice(0, 1).toUpperCase()}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className={`text-[13px] truncate ${isActive ? "font-semibold text-ink" : "font-medium text-ink"}`}>
                            {c.name}
                            {demo && (
                              <span className="ml-1.5 inline-flex rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-semibold text-sky-700 align-middle">
                                Demo
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-muted-foreground truncate">
                            {c.email || "Sem e-mail"}
                            {c.cidade ? ` · ${c.cidade}${c.uf ? "/" + c.uf : ""}` : ""}
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>

        <section className="bg-white border border-border rounded-xl overflow-hidden min-h-[50vh] p-6">
          {!selected ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16">
              <UsersIcon className="h-7 w-7 text-muted-foreground mb-3" />
              <p className="text-[13px] text-muted-foreground">Selecione um cliente ou crie um novo.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-[18px] font-semibold text-ink">{selected.name}</h3>
                {(selected.isDemo || isDemoId(selected.id)) && (
                  <span className="inline-flex rounded-full bg-sky-100 px-2.5 py-0.5 text-[11px] font-semibold text-sky-700">
                    Cliente demonstração
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted-foreground">
                {selected.email && (
                  <span className="inline-flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" /> {selected.email}
                  </span>
                )}
                {selected.phone && (
                  <span className="inline-flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" /> {selected.phone}
                  </span>
                )}
                {(selected.cidade || selected.uf) && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {[selected.cidade, selected.uf].filter(Boolean).join("/")}
                  </span>
                )}
              </div>
              {(selected.isDemo || isDemoId(selected.id)) && (
                <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-[13px] text-sky-900 leading-relaxed">
                  Este é um <strong>cliente imaginário</strong> compartilhado com todos os escritórios para você
                  conhecer o painel (abas, projetos e fluxo). Não pode ser excluído. Cadastre clientes reais com
                  "Novo cliente".
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {showModal && officeId && (
        <NewClientModal
          officeId={officeId}
          onClose={() => setShowModal(false)}
          onCreated={() => {
            setShowModal(false);
            void load();
          }}
        />
      )}
    </AppShell>
  );
}
