import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import {
  Plus, Search, Mail, Phone, MapPin, FolderOpen, MessageSquare,
  FileText, Image as ImageIcon, ShoppingBag, Users as UsersIcon, Loader2,
  Calendar, StickyNote, ClipboardList, HardHat, Presentation, History,
  Pencil, Trash2, Crown, User as UserIcon,
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
import { isDemoId } from "@/lib/demo-client";
import { getSession } from "@/lib/session";
import { toast } from "sonner";

export const Route = createFileRoute("/app/profissional/clientes")({
  head: () => ({ meta: [{ title: "Clientes — ArqHub" }] }),
  component: ClientesPage,
});

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
      {vip && <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-amber-400 ring-2 ring-white" />}
    </span>
  );
}

function isVipClient(c: { has_portal?: boolean | null }) {
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
  isDemo?: boolean;
  has_portal?: boolean | null;
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

type TabKey =
  | "overview" | "agenda" | "notes" | "contrato" | "diario"
  | "documents" | "presentation" | "photos" | "messages" | "products" | "activity";

function normalizeEmail(email: string | null | undefined) {
  return (email ?? "").trim().toLowerCase();
}

function projectBelongsToClient(project: Projeto, client: Cliente) {
  const clientEmail = normalizeEmail(client.email);
  return (
    project.client_id === client.id ||
    (!!clientEmail && normalizeEmail(project.client_email) === clientEmail)
  );
}

const TABS: { k: TabKey; label: string; icon: typeof FolderOpen }[] = [
  { k: "overview", label: "Visão geral", icon: FolderOpen },
  { k: "agenda", label: "Agenda", icon: Calendar },
  { k: "notes", label: "Anotações", icon: StickyNote },
  { k: "contrato", label: "Contrato", icon: ClipboardList },
  { k: "diario", label: "Diário de obra", icon: HardHat },
  { k: "documents", label: "Documentos", icon: FileText },
  { k: "presentation", label: "Meu projeto", icon: Presentation },
  { k: "photos", label: "Galeria", icon: ImageIcon },
  { k: "messages", label: "Mensagens", icon: MessageSquare },
  { k: "products", label: "Produtos", icon: ShoppingBag },
  { k: "activity", label: "Atividades", icon: History },
];

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
  const [editProjectId, setEditProjectId] = useState<string | null>(null);
  const [showNewProject, setShowNewProject] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const listClientData = useServerFn(listProfissionalClientData);
  const deleteClient = useServerFn(deleteProfissionalCliente);

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
      setSelectedId((cur) => (cur && list.some((c) => c.id === cur) ? cur : list[0]?.id ?? null));
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao carregar clientes e projetos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

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

  const portals = planLimits((getSession()?.plan ?? "trial") as Plan).portals;
  const { requireUpgrade, modal: upgradeModal } = useUpgradeModal();
  const portalsFull = clientes.filter((c) => !c.isDemo && !isDemoId(c.id)).length >= portals;

  const selected = clientes.find((c) => c.id === selectedId) ?? null;
  const projetosDoCliente = selected
    ? projetos.filter((p) => projectBelongsToClient(p, selected))
    : [];
  const projOpts = projetosDoCliente.map((p) => ({ id: p.id, name: p.name }));

  async function handleDelete() {
    if (!selected || isDemoId(selected.id) || selected.isDemo) {
      toast.error("O cliente de demonstração não pode ser excluído.");
      return;
    }
    if (!confirm(`Excluir cliente ${selected.name}?`)) return;
    setDeleting(true);
    try {
      const { data: sess } = await externalSupabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) throw new Error("Sessão expirada.");
      await deleteClient({ data: { accessToken: token, clientId: selected.id } });
      toast.success("Cliente excluído.");
      setSelectedId(null);
      await load();
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao excluir.");
    } finally {
      setDeleting(false);
    }
  }

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
          onClick={() => {
            if (portalsFull) {
              requireUpgrade({
                title: "Limite de portais atingido",
                description: `Seu plano permite ${limitLabel(portals)} portais. Faça upgrade para cadastrar mais.`,
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
                  const isVip = isVipClient(c);
                  const projCount = projetos.filter((p) => projectBelongsToClient(p, c)).length;
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => { setSelectedId(c.id); setTab("overview"); }}
                        className={`w-full text-left px-3 py-2.5 flex items-center gap-2.5 hover:bg-secondary/40 transition-colors ${isActive ? "bg-primary/5" : ""}`}
                      >
                        <ClientAvatar vip={isVip} />
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
                            {projCount > 0 ? `${projCount} projeto${projCount === 1 ? "" : "s"}` : "Sem projetos"}
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

        <section className="bg-white border border-border rounded-xl overflow-hidden min-h-[60vh]">
          {!selected ? (
            <div className="h-full flex flex-col items-center justify-center p-10 text-center">
              <UsersIcon className="h-7 w-7 text-muted-foreground mb-3" />
              <p className="text-[13px] text-muted-foreground">Selecione um cliente à esquerda ou crie um novo.</p>
            </div>
          ) : (
            <>
              <header className="px-5 py-4 border-b border-border">
                <div className="flex items-start gap-3">
                  <ClientAvatar vip={isVipClient(selected)} size="lg" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-[15px] sm:text-[16px] font-semibold text-ink truncate">{selected.name}</h3>
                      {(selected.isDemo || isDemoId(selected.id)) && (
                        <span className="inline-flex rounded-full bg-sky-100 px-2 py-0.5 text-[10.5px] font-semibold text-sky-700">
                          Cliente demonstração
                        </span>
                      )}
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${
                          isVipClient(selected) ? "bg-amber-100 text-amber-700" : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        {isVipClient(selected) ? <Crown className="h-2.5 w-2.5" /> : null}
                        {isVipClient(selected) ? "VIP" : "Comum"}
                      </span>
                      {!(selected.isDemo || isDemoId(selected.id)) && (
                        <button
                          type="button"
                          onClick={() => void handleDelete()}
                          disabled={deleting}
                          className="ml-auto inline-flex items-center gap-1 text-[12px] text-red-600 hover:bg-red-50 px-2 py-1 rounded-md"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Excluir
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5 text-[12px] text-muted-foreground">
                      {selected.email && (
                        <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" />{selected.email}</span>
                      )}
                      {selected.phone && (
                        <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{selected.phone}</span>
                      )}
                      {(selected.cidade || selected.uf) && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" />{[selected.cidade, selected.uf].filter(Boolean).join("/")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <nav className="mt-4 -mx-5 -mb-4 px-5 overflow-x-auto scrollbar-none">
                  <div className="flex items-end gap-0.5 border-b border-border min-w-max">
                    {TABS.map((t) => {
                      const Ico = t.icon;
                      const active = tab === t.k;
                      return (
                        <button
                          key={t.k}
                          type="button"
                          onClick={() => setTab(t.k)}
                          className={`relative inline-flex items-center gap-1.5 px-3.5 h-9 whitespace-nowrap text-[12.5px] font-medium transition-colors border-b-2 -mb-px ${
                            active
                              ? "text-primary border-primary bg-primary/[0.04]"
                              : "text-muted-foreground border-transparent hover:text-ink hover:bg-secondary/50"
                          }`}
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
                  <div className="space-y-4">
                    {(selected.isDemo || isDemoId(selected.id)) && (
                      <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-[13px] text-sky-900 leading-relaxed">
                        Cliente imaginário para explorar o painel. Use as abas acima (agenda, documentos, mensagens…).
                        Não pode ser excluído.
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <h4 className="text-[14px] font-semibold text-ink">Projetos</h4>
                      <button
                        type="button"
                        onClick={() => setShowNewProject(true)}
                        disabled={!officeId || isDemoId(selected.id)}
                        className="inline-flex items-center gap-1 text-[12.5px] font-medium text-primary hover:underline disabled:opacity-40"
                      >
                        <Plus className="h-3.5 w-3.5" /> Novo projeto
                      </button>
                    </div>
                    {projetosDoCliente.length === 0 ? (
                      <p className="text-[13px] text-muted-foreground">Nenhum projeto vinculado a este cliente.</p>
                    ) : (
                      <ul className="space-y-2">
                        {projetosDoCliente.map((p) => (
                          <li
                            key={p.id}
                            className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3"
                          >
                            <div className="min-w-0">
                              <div className="text-[13px] font-medium text-ink truncate">{p.name}</div>
                              <div className="text-[11px] text-muted-foreground">
                                {p.status ?? "sem status"}
                                {p.city ? ` · ${p.city}` : ""}
                                {p.area_m2 ? ` · ${p.area_m2} m²` : ""}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setEditProjectId(p.id)}
                              className="inline-flex items-center gap-1 text-[12px] text-muted-foreground hover:text-ink"
                            >
                              <Pencil className="h-3.5 w-3.5" /> Editar
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
                {tab === "messages" && (
                  <div className="h-[min(70vh,640px)]">
                    {projetosDoCliente[0] ? (
                      <ProjectChat
                        projectId={search.projectId || projetosDoCliente[0].id}
                        officeId={officeId}
                        variant="whatsapp"
                      />
                    ) : (
                      <p className="p-5 text-[13px] text-muted-foreground">Crie um projeto para usar mensagens.</p>
                    )}
                  </div>
                )}
                {tab === "agenda" && <ProjectMeetingsManager projects={projOpts} clientId={selected.id} />}
                {tab === "notes" && <ProjectNotesManager projects={projOpts} />}
                {tab === "contrato" && <ProjectContratoTab cliente={selected} projetos={projetosDoCliente} />}
                {tab === "diario" && <ProjectDiarioObraTab projects={projOpts} />}
                {tab === "documents" && <ProjectDocumentsManager projects={projOpts} />}
                {tab === "presentation" && <ProjectPresentationManager projects={projOpts} />}
                {tab === "photos" && <ProjectPhotosManager projects={projOpts} />}
                {tab === "products" && <ClientProductsTab projects={projOpts} officeId={officeId} />}
                {tab === "activity" && (
                  <ProjectActivityTab clientName={selected.name} projects={projOpts} />
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
          onCreated={() => { setShowModal(false); void load(); }}
        />
      )}
      {showNewProject && officeId && selected && (
        <NewProjectModal
          officeId={officeId}
          presetClientId={selected.id}
          onClose={() => setShowNewProject(false)}
          onCreated={() => { setShowNewProject(false); void load(); }}
        />
      )}
      {editProjectId && (
        <EditProjectModal
          projectId={editProjectId}
          onClose={() => setEditProjectId(null)}
          onSaved={() => { setEditProjectId(null); void load(); }}
        />
      )}
      {upgradeModal}
    </AppShell>
  );
}
