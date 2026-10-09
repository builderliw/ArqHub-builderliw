import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import {
  Plus, Search, Mail, Phone, MapPin, FolderOpen, MessageSquare,
  FileText, Image as ImageIcon, ShoppingBag, Users as UsersIcon, Loader2,
  Calendar, StickyNote, ClipboardList, HardHat, Presentation,
  ArrowUp, ArrowDown, ArrowUpDown, History,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { navProfissional as nav } from "@/lib/nav-profissional";
import { externalSupabase } from "@/integrations/external-supabase/client";
import { NewClientModal } from "@/components/new-client-modal";
import { limitLabel, planLimits } from "@/lib/plan-features";
import { useUpgradeModal } from "@/components/upgrade-modal";
import type { Plan } from "@/lib/session";
import { NewProjectModal } from "@/components/new-project-modal";
import { EditProjectModal } from "@/components/edit-project-modal";
import { ProjectChat } from "@/components/project-chat";
import { ProjectDocumentsManager } from "@/components/project-documents-manager";
import { ProjectPresentationManager } from "@/components/project-presentation-manager";
import { ProjectPhotosManager } from "@/components/project-photos-manager";
import { ClientProductsTab } from "@/components/client-products-tab";
import { ProjectMeetingsManager } from "@/components/project-meetings-manager";
import { ProjectNotesManager } from "@/components/project-notes-manager";
import { ProjectDiarioObraTab } from "@/components/project-diario-obra-tab";
import { ProjectContratoTab } from "@/components/project-contrato-tab";
import { ProjectActivityTab } from "@/components/project-activity-tab";
import { listProfissionalClientData, deleteProfissionalCliente } from "@/lib/profissional-clientes.functions";
import { getSession } from "@/lib/session";
import { toast } from "sonner";
import { Pencil, Trash2, Crown, User as UserIcon } from "lucide-react";

/** Avatar de cliente: coroa dourada para VIP (com portal), usuário neutro para comum. */
function ClientAvatar({ vip, size = "sm" }: { vip: boolean; size?: "sm" | "lg" }) {
  const box = size === "lg" ? "h-10 w-10 sm:h-11 sm:w-11" : "h-9 w-9";
  const ico = size === "lg" ? "h-[18px] w-[18px] sm:h-5 sm:w-5" : "h-4 w-4";
  return (
    <span
      title={vip ? "Cliente VIP (portal ativo)" : "Cliente comum"}
      className={`relative inline-flex ${box} shrink-0 items-center justify-center rounded-xl border ${
        vip
          ? "border-amber-300/70 bg-gradient-to-br from-amber-50 to-amber-100 text-amber-600"
          : "border-border bg-secondary text-muted-foreground"
      }`}
    >
      {vip ? <Crown className={ico} strokeWidth={2} /> : <UserIcon className={ico} strokeWidth={2} />}
      {vip && (
        <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-amber-400 ring-2 ring-white" />
      )}
    </span>
  );
}


export const Route = createFileRoute("/app/profissional/clientes")({
  head: () => ({ meta: [{ title: "Clientes — ArqHub" }] }),
  component: ClientesPage,
});

function isVipClient(c: { has_portal?: boolean | null } & Record<string, any>) {
  return c?.has_portal === true;
}

type Cliente = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: string;
  created_at: string;
  cidade?: string | null;
  uf?: string | null;
  rua?: string | null;
  numero?: string | null;
};

type Projeto = {
  id: string;
  name: string;
  status: string | null;
  client_id: string | null;
  client_email?: string | null;
  location: string | null;
  city: string | null;
  area_m2: number | null;
  created_at: string;
  description?: string | null;
  budget_cents?: number | null;
  deadline?: string | null;
};

type TabKey = "overview" | "agenda" | "notes" | "contrato" | "diario" | "documents" | "presentation" | "photos" | "messages" | "products" | "activity";

function normalizeEmail(email: string | null | undefined) {
  return (email ?? "").trim().toLowerCase();
}

function projectBelongsToClient(project: Projeto, client: Cliente) {
  const clientEmail = normalizeEmail(client.email);
  return project.client_id === client.id || (!!clientEmail && normalizeEmail(project.client_email) === clientEmail);
}

function ClientesPage() {
  const search = useSearch({ from: "/app/profissional/clientes" }) as Record<string, any>;
  const [officeId, setOfficeId] = useState<string | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(search.clientId || null);
  const [tab, setTab] = useState<TabKey>(search.tab === "messages" ? "messages" : "overview");
  const listClientData = useServerFn(listProfissionalClientData);

  async function load() {
    setLoading(true);
    try {
      const { data: sess } = await externalSupabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) { setLoading(false); return; }

      const data = await listClientData({ data: { accessToken: token } });
      const list = ((data.clientes ?? []) as Cliente[]).sort((a, b) =>
        a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }),
      );

      setOfficeId(data.officeId);
      setClientes(list);
      setProjetos((data.projetos ?? []) as Projeto[]);
      setSelectedId((current) => (current && list.some((c) => c.id === current) ? current : list[0]?.id ?? null));
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao carregar clientes e projetos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const [sortKey, setSortKey] = useState<"name" | "created_at">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    const base = !t
      ? clientes
      : clientes.filter(
          (c) =>
            c.name.toLowerCase().includes(t) ||
            (c.email ?? "").toLowerCase().includes(t) ||
            (c.phone ?? "").toLowerCase().includes(t),
        );
    const dir = sortDir === "asc" ? 1 : -1;
    return [...base].sort((a, b) => {
      if (sortKey === "name") {
        return a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }) * dir;
      }
      return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * dir;
    });
  }, [clientes, q, sortKey, sortDir]);

  const portals = planLimits((getSession()?.plan ?? "trial") as Plan).portals;
  const { requireUpgrade, modal: upgradeModal } = useUpgradeModal();
  const portalsFull = clientes.length >= portals;

  const selected = clientes.find((c) => c.id === selectedId) ?? null;
  const projetosDoCliente = selected ? projetos.filter((p) => projectBelongsToClient(p, selected)) : [];

  return (
    <AppShell role="profissional" nav={nav} title="Clientes">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[22px] font-semibold tracking-tight text-ink">Clientes</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {loading ? "Carregando..." : `${clientes.length} cadastrado${clientes.length === 1 ? "" : "s"}`}
          </p>
          <p className="text-[12.5px] text-muted-foreground mt-1">
            Portais de clientes VIPs: <strong className="text-ink">{clientes.length}</strong> de {limitLabel(portals)}
          </p>
        </div>
        <button
          onClick={() => {
            if (portalsFull) {
              requireUpgrade({
                title: "Limite de portais atingido",
                description: `Seu plano permite ${limitLabel(portals)} portais para clientes VIPs. Faça upgrade para cadastrar mais clientes.`,
              });
              return;
            }
            setShowModal(true);
          }}
          disabled={!officeId}
          className="inline-flex items-center gap-1.5 px-3.5 h-9 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md text-[13px] font-medium disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2} /> Novo cliente
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
        {/* Sidebar — lista alfabética */}
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
          <div className="px-3 py-2 border-b border-border flex items-center gap-1.5 bg-secondary/20">
            <span className="text-[11px] text-muted-foreground">Ordenar:</span>
            {([
              { k: "name" as const, label: "Nome" },
              { k: "created_at" as const, label: "Cadastro" },
            ]).map((o) => {
              const active = sortKey === o.k;
              return (
                <button
                  key={o.k}
                  onClick={() => {
                    if (active) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                    else { setSortKey(o.k); setSortDir(o.k === "created_at" ? "desc" : "asc"); }
                  }}
                  title={active ? (sortDir === "asc" ? "Crescente" : "Decrescente") : `Ordenar por ${o.label}`}
                  className={`inline-flex items-center gap-1 h-7 px-2 rounded-md text-[11.5px] font-medium transition-colors ${
                    active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  {o.label}
                  {active
                    ? (sortDir === "asc"
                        ? <ArrowUp className="h-3 w-3" strokeWidth={2.5} />
                        : <ArrowDown className="h-3 w-3" strokeWidth={2.5} />)
                    : <ArrowUpDown className="h-3 w-3 opacity-50" />}
                </button>
              );
            })}
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground mx-auto" /></div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-[12.5px] text-muted-foreground">
                {clientes.length === 0 ? "Nenhum cliente ainda." : "Sem resultados."}
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {filtered.map((c) => {
                  const isActive = c.id === selectedId;
                  const isVip = isVipClient(c);
                  const projCount = projetos.filter((p) => projectBelongsToClient(p, c)).length;
                  return (
                    <li key={c.id}>
                      <button
                        onClick={() => { setSelectedId(c.id); setTab("overview"); }}
                        className={`w-full text-left px-3 py-2.5 flex items-center gap-2.5 hover:bg-secondary/40 transition-colors ${isActive ? "bg-primary/5" : ""}`}
                      >
                        <ClientAvatar vip={isVip} />


                        <div className="min-w-0 flex-1">
                          <div className={`text-[13px] truncate ${isActive ? "font-semibold text-ink" : "font-medium text-ink"}`}>{c.name}</div>
                          <div className="text-[11px] text-muted-foreground truncate">
                            {projCount > 0 ? `${projCount} projeto${projCount === 1 ? "" : "s"}` : "Sem projetos"}
                            {sortKey === "created_at" && c.created_at
                              ? ` · ${new Date(c.created_at).toLocaleDateString("pt-BR")}`
                              : ""}
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

        {/* Detail */}
        <section className="bg-white border border-border rounded-xl overflow-hidden min-h-[60vh]">
          {!selected ? (
            <div className="h-full flex flex-col items-center justify-center p-10 text-center">
              <UsersIcon className="h-7 w-7 text-muted-foreground mb-3" />
              <p className="text-[13px] text-muted-foreground">
                Selecione um cliente à esquerda ou crie um novo.
              </p>
            </div>
          ) : (
            <>
              <header className="px-5 py-4 border-b border-border">
                <div className="flex items-start gap-3">
                  <ClientAvatar vip={isVipClient(selected)} size="lg" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[15px] sm:text-[16px] font-semibold text-ink truncate">{selected.name}</h3>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${
                          isVipClient(selected)
                            ? "bg-amber-100 text-amber-700"
                            : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        {isVipClient(selected) ? <Crown className="h-2.5 w-2.5" /> : null}
                        {isVipClient(selected) ? "VIP" : "Comum"}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5 text-[12px] text-muted-foreground">
                      {selected.email && <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3"/>{selected.email}</span>}
                      {selected.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3"/>{selected.phone}</span>}
                      {(selected.cidade || selected.uf) && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3"/>{[selected.cidade, selected.uf].filter(Boolean).join("/")}</span>}
                    </div>
                  </div>
                </div>

                {/* Abas estilo pastas de arquivo, coloridas */}
                <nav className="mt-4 -mx-5 -mb-4 px-5 overflow-x-auto scrollbar-none">
                  <div className="flex items-end gap-1 border-b border-border min-w-max pt-1">
                  {[
                    { k: "overview" as const, label: "Visão geral", icon: FolderOpen, color: "#2563EB" },
                    { k: "agenda" as const, label: "Agenda", icon: Calendar, color: "#0EA5E9" },
                    { k: "notes" as const, label: "Anotações", icon: StickyNote, color: "#D946EF" },
                    { k: "contrato" as const, label: "Contrato", icon: ClipboardList, color: "#9333EA" },
                    { k: "diario" as const, label: "Diário de obra", icon: HardHat, color: "#DC2626" },
                    { k: "documents" as const, label: "Documentos", icon: FileText, color: "#0891B2" },
                    { k: "presentation" as const, label: "Meu projeto", icon: Presentation, color: "#7C3AED" },
                    { k: "photos" as const, label: "Galeria", icon: ImageIcon, color: "#EC4899" },
                    { k: "messages" as const, label: "Mensagens", icon: MessageSquare, color: "#16A34A" },
                    { k: "products" as const, label: "Produtos", icon: ShoppingBag, color: "#4F46E5" },
                    { k: "activity" as const, label: "Atividades", icon: History, color: "#EA580C" },
                  ].map((t) => {
                    const Ico = t.icon;
                    const active = tab === t.k;
                    return (
                      <button
                        key={t.k}
                        onClick={() => setTab(t.k)}
                        className="relative inline-flex items-center gap-1.5 px-3 whitespace-nowrap text-[12.5px] font-medium rounded-t-xl border border-b-0 transition-all"
                        style={{
                          height: active ? 36 : 31,
                          marginBottom: active ? -1 : 0,
                          borderColor: active ? t.color : "transparent",
                          borderTopWidth: 2,
                          borderTopColor: active ? t.color : "transparent",
                          background: active ? "#fff" : `color-mix(in oklab, ${t.color} 10%, white)`,
                          color: active ? t.color : `color-mix(in oklab, ${t.color} 70%, #6b7280)`,
                          boxShadow: active ? "0 -3px 8px -6px rgba(0,0,0,0.35)" : "none",
                        }}
                      >
                        <Ico className="h-3.5 w-3.5" strokeWidth={2} />
                        {t.label}
                      </button>
                    );
                  })}
                  </div>
                </nav>


              </header>

              <div className={tab === "messages" ? "" : "p-5"}>
                {tab === "overview" && (
                  <div className="p-5"><OverviewTab cliente={selected} projetos={projetosDoCliente} officeId={officeId} onChanged={load} /></div>
                )}
                {tab === "messages" && (
                  <MessagesTab officeId={officeId} clientId={selected.id} projetos={projetosDoCliente} onChanged={load} presetProjectId={search.projectId} />
                )}
                {tab === "agenda" && (
                  <ProjectMeetingsManager projects={projetosDoCliente.map((p) => ({ id: p.id, name: p.name }))} clientId={selected.id} />
                )}
                {tab === "notes" && (
                  <ProjectNotesManager projects={projetosDoCliente.map((p) => ({ id: p.id, name: p.name }))} />
                )}
                {tab === "contrato" && (
                  <ProjectContratoTab cliente={selected} projetos={projetosDoCliente} />
                )}
                {tab === "diario" && (
                  <ProjectDiarioObraTab projects={projetosDoCliente.map((p) => ({ id: p.id, name: p.name }))} />
                )}
                {tab === "documents" && (
                  <ProjectDocumentsManager projects={projetosDoCliente.map((p) => ({ id: p.id, name: p.name }))} />
                )}
                {tab === "presentation" && (
                  <ProjectPresentationManager projects={projetosDoCliente.map((p) => ({ id: p.id, name: p.name }))} />
                )}
                {tab === "photos" && (
                  <ProjectPhotosManager projects={projetosDoCliente.map((p) => ({ id: p.id, name: p.name }))} />
                )}
                {tab === "activity" && (
                  <ProjectActivityTab
                    clientName={selected.name}
                    projects={projetosDoCliente.map((p) => ({ id: p.id, name: p.name }))}
                  />

                )}
                {tab === "products" && (
                  <ClientProductsTab projects={projetosDoCliente.map((p) => ({ id: p.id, name: p.name }))} officeId={officeId} />
                )}
              </div>
            </>
          )}
        </section>
      </div>

      {showModal && officeId && (
        <NewClientModal
          officeId={officeId}
          onClose={() => setShowModal(false)}
          onCreated={() => { setShowModal(false); load(); }}
        />
      )}
      {upgradeModal}
    </AppShell>
  );
}

function OverviewTab({ cliente, projetos, officeId, onChanged }: { cliente: Cliente; projetos: Projeto[]; officeId: string | null; onChanged: () => void }) {
  const [editProjectId, setEditProjectId] = useState<string | null>(null);
  const [showNewProject, setShowNewProject] = useState(false);
  const [editingClient, setEditingClient] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const deleteCliente = useServerFn(deleteProfissionalCliente);
  const projectsFull = useMemo(() => {
    const map: Record<string, any> = {};
    projetos.forEach((p: any) => { map[p.id] = p; });
    return map;
  }, [projetos]);

  async function handleDelete() {
    const email = cliente.email || "este cliente";
    const msg = `Todos os dados referentes ao e-mail ${email} serão apagados da plataforma. Deseja excluir assim mesmo?`;
    if (!window.confirm(msg)) return;
    setDeleting(true);
    try {
      const { data: sess } = await externalSupabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) throw new Error("Sessão expirada.");
      await deleteCliente({ data: { accessToken: token, clientId: cliente.id } });
      toast.success("Cliente excluído.");
      onChanged();
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao excluir cliente.");
    } finally {
      setDeleting(false);
    }
  }

  const fullClient: any = cliente;
  const enderecoLinha = [
    [fullClient.rua, fullClient.numero].filter(Boolean).join(", "),
    [fullClient.cidade, fullClient.uf].filter(Boolean).join("/"),
  ].filter(Boolean).join(" — ") || "—";

  const formatBRL = (cents: number | null | undefined) => {
    if (cents == null) return "—";
    return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };
  const formatDate = (iso: string | null | undefined) => {
    if (!iso) return "—";
    try {
      const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
      if (m) return `${m[3]}/${m[2]}/${m[1]}`;
      return new Date(iso).toLocaleDateString("pt-BR");
    } catch { return iso; }
  };

  return (
    <div className="space-y-5">
      {/* Resumo do cliente */}
      <div className="rounded-xl border border-border bg-white">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h4 className="text-[13px] font-semibold text-ink">Resumo do cliente</h4>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditingClient(true)}
              title="Editar cliente"
              className="inline-flex items-center gap-1.5 px-2.5 h-8 rounded-md border border-border bg-white hover:border-primary/40 hover:text-primary text-[12.5px] font-medium text-ink transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" /> Editar
            </button>
            {!getSession()?.isMember && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                title="Excluir cliente"
                className="inline-flex items-center gap-1.5 px-2.5 h-8 rounded-md border border-border bg-white hover:border-destructive/40 hover:text-destructive text-[12.5px] font-medium text-ink transition-colors disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" /> {deleting ? "Excluindo..." : "Excluir"}
              </button>
            )}
          </div>
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-[13px]">
          <SummaryItem label="Nome" value={cliente.name} />
          <SummaryItem label="E-mail" value={cliente.email || "—"} />
          <SummaryItem label="Telefone" value={cliente.phone || "—"} />
          <SummaryItem label="Endereço" value={enderecoLinha} />
        </div>
      </div>

      {/* Resumo dos projetos */}
      <div className="rounded-xl border border-border bg-white">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h4 className="text-[13px] font-semibold text-ink">Resumo dos projetos ({projetos.length})</h4>
          <button
            type="button"
            disabled={!officeId}
            onClick={() => setShowNewProject(true)}
            className="inline-flex items-center gap-1.5 px-2.5 h-8 rounded-md bg-ink text-white text-[12px] font-medium hover:bg-black disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2} /> Novo projeto
          </button>
        </div>
        {projetos.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-[12.5px] text-muted-foreground">Nenhum projeto vinculado a este cliente.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {projetos.map((p) => {
              const full = projectsFull[p.id] ?? {};
              return (
                <li key={p.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <FolderOpen className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="text-[13px] font-semibold text-ink truncate">{p.name}</span>
                      </div>
                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-[12.5px]">
                        <SummaryItem label="Status" value={p.status || "—"} />
                        <SummaryItem label="Localização" value={[p.city, p.location].filter(Boolean).join(" · ") || "—"} />
                        <SummaryItem label="Área" value={p.area_m2 ? `${p.area_m2} m²` : "—"} />
                        <SummaryItem label="Orçamento" value={formatBRL(full.budget_cents)} />
                        <SummaryItem label="Prazo" value={formatDate(full.deadline)} />
                        {full.description && <SummaryItem label="Descrição" value={full.description} />}
                      </div>
                    </div>
                    <button
                      onClick={() => setEditProjectId(p.id)}
                      title="Editar projeto"
                      className="inline-flex items-center gap-1.5 px-2.5 h-8 rounded-md border border-border bg-white hover:border-primary/40 hover:text-primary text-[12.5px] font-medium text-ink transition-colors shrink-0"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Editar
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {editingClient && officeId && (
        <NewClientModal
          officeId={officeId}
          editClient={{
            id: cliente.id,
            name: cliente.name,
            email: cliente.email,
            phone: cliente.phone,
            rua: (cliente as any).rua ?? null,
            numero: (cliente as any).numero ?? null,
            cidade: (cliente as any).cidade ?? null,
            uf: (cliente as any).uf ?? null,
            cep: (cliente as any).cep ?? null,
            bairro: (cliente as any).bairro ?? null,
            complemento: (cliente as any).complemento ?? null,
            has_portal: (cliente as any).has_portal ?? null,
            status: (cliente as any).status ?? null,

          }}
          onClose={() => setEditingClient(false)}
          onCreated={() => { setEditingClient(false); onChanged(); }}
        />
      )}

      {editProjectId && (
        <EditProjectModal
          projectId={editProjectId}
          onClose={() => setEditProjectId(null)}
          onSaved={() => { setEditProjectId(null); onChanged(); }}
        />
      )}

      {showNewProject && officeId && (
        <NewProjectModal
          officeId={officeId}
          presetClientId={cliente.id}
          onClose={() => setShowNewProject(false)}
          onCreated={() => { setShowNewProject(false); onChanged(); }}
        />
      )}
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[10.5px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-[13px] text-ink mt-0.5 break-words">{value || "—"}</div>
    </div>
  );
}

function ReadOrInputField({
  label, value, editing, onChange, type = "text", maxLength,
}: {
  label: string;
  value: string;
  editing: boolean;
  onChange: (v: string) => void;
  type?: string;
  maxLength?: number;
}) {
  return (
    <div className="rounded-lg border border-border bg-secondary/20 px-3 py-2">
      <div className="text-[10.5px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
      {editing ? (
        <input
          type={type}
          value={value}
          maxLength={maxLength}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-white border border-border rounded px-2 py-1 mt-1 text-[13px] outline-none focus:border-primary"
        />
      ) : (
        <div className="text-[13px] text-ink mt-0.5 truncate">{value || "—"}</div>
      )}
    </div>
  );
}

function MessagesTab({ officeId, clientId, projetos, onChanged, presetProjectId }: { officeId: string | null; clientId: string; projetos: Projeto[]; onChanged: () => void | Promise<void>; presetProjectId?: string }) {
  const [activeId, setActiveId] = useState<string | null>(presetProjectId ?? null);
  const [showNewProject, setShowNewProject] = useState(false);

  useEffect(() => {
    if (projetos.length === 0) { setActiveId(null); return; }
    setActiveId((prev) => {
      if (presetProjectId && projetos.find((p) => p.id === presetProjectId)) return presetProjectId;
      return prev && projetos.find((p) => p.id === prev) ? prev : projetos[0].id;
    });
  }, [projetos, presetProjectId]);

  if (projetos.length === 0) {
    return (
      <div className="p-5">
        <div className="rounded-xl border border-dashed border-border bg-secondary/20 p-10 text-center">
          <MessageSquare className="h-7 w-7 text-muted-foreground mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-[13px] text-ink font-medium">Inicie uma conversa com este cliente</p>
          <p className="text-[12.5px] text-muted-foreground mt-1 max-w-md mx-auto">
            As mensagens são organizadas por projeto. Crie um projeto para começar a trocar mensagens — o cliente verá a conversa no painel dele.
          </p>
          <button
            onClick={() => setShowNewProject(true)}
            disabled={!officeId}
            className="mt-4 inline-flex items-center gap-1.5 px-3.5 h-9 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md text-[13px] font-medium disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2} /> Criar projeto e iniciar conversa
          </button>
        </div>

        {showNewProject && officeId && (
          <NewProjectModal
            officeId={officeId}
            presetClientId={clientId}
            onClose={() => setShowNewProject(false)}
            onCreated={() => { setShowNewProject(false); onChanged(); }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] h-[calc(100vh-280px)] min-h-[480px]">
      <aside className="border-r border-border overflow-y-auto bg-secondary/20">
        <div className="px-3 py-2 text-[10.5px] font-medium uppercase tracking-wider text-muted-foreground">
          Projetos
        </div>
        <ul>
          {projetos.map((p) => {
            const active = p.id === activeId;
            return (
              <li key={p.id}>
                <button
                  onClick={() => setActiveId(p.id)}
                  className={`w-full text-left px-3 py-2 text-[12.5px] border-l-2 transition-colors ${active ? "border-primary bg-primary/5 text-ink font-medium" : "border-transparent text-muted-foreground hover:text-ink hover:bg-secondary/40"}`}
                >
                  <div className="truncate">{p.name}</div>
                  {p.status && <div className="text-[10.5px] text-muted-foreground/80 truncate">{p.status}</div>}
                </button>
              </li>
            );
          })}
        </ul>
      </aside>
      <div className="min-h-0 overflow-hidden">
        {activeId && (
          <ProjectChat key={activeId} projectId={activeId} officeId={officeId} variant="whatsapp" />
        )}
      </div>
    </div>
  );
}

