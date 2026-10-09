import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  FolderOpen, Plus, ChevronRight, ListChecks, Pencil, MessageSquare, ShoppingBag, Tag, Search, History,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ProjectActivityPanel } from "@/components/project-activity-panel";
import { getSession } from "@/lib/session";
import { navProfissional as nav } from "@/lib/nav-profissional";
import { ProjectChat } from "@/components/project-chat";
import { ProjectStagesManager } from "@/components/project-stages-manager";
import { ProjectProductsManager } from "@/components/project-products-manager";
import { ProductCategoriesManager } from "@/components/product-categories-manager";
import { NewProjectModal } from "@/components/new-project-modal";
import { EditProjectModal } from "@/components/edit-project-modal";
import { listProfessionalProjects } from "@/lib/profissional-project-data.functions";
import { externalSupabase } from "@/integrations/external-supabase/client";
import { formatShortDate } from "@/hooks/use-profissional-data";

type ProjetoRow = {
  id: string;
  nome: string;
  cliente: string;
  fase: string;
  progresso: number;
  proximaEntrega: string | null;
  status: string;
  rawStatus: string;
};

export const Route = createFileRoute("/app/profissional/projetos")({
  head: () => ({ meta: [{ title: "Projetos — ArqHub" }] }),
  component: ProjetosPage,
});

function ProjetosPage() {
  const loadProjects = useServerFn(listProfessionalProjects);
  const [officeId, setOfficeId] = useState<string | null>(null);
  const [projetos, setProjetos] = useState<ProjetoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "completed" | "attention">("all");

  const [chatProject, setChatProject] = useState<{ id: string; nome: string } | null>(null);
  const [stagesProject, setStagesProject] = useState<{ id: string; nome: string } | null>(null);
  const [productsProject, setProductsProject] = useState<{ id: string; nome: string } | null>(null);
  const [activityProject, setActivityProject] = useState<{ id: string; nome: string } | null>(null);
  const [editProject, setEditProject] = useState<string | null>(null);
  const [showNewProject, setShowNewProject] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const isMember = !!getSession()?.isMember;

  async function reload() {
    setLoading(true);
    const { data: sess } = await externalSupabase.auth.getSession();
    const token = sess.session?.access_token;
    if (!token) { setLoading(false); return; }
    const res = await loadProjects({ data: { accessToken: token } });
    setOfficeId(res.officeId);
    setProjetos(res.projects as ProjetoRow[]);
    setLoading(false);
  }

  useEffect(() => { reload(); }, []);

  const filtered = projetos.filter((p) => {
    if (query && !`${p.nome} ${p.cliente}`.toLowerCase().includes(query.toLowerCase())) return false;
    if (statusFilter === "completed") return p.rawStatus === "completed";
    if (statusFilter === "active") return p.rawStatus !== "completed" && p.rawStatus !== "archived";
    if (statusFilter === "attention") return p.status === "Atenção";
    return true;
  });

  const semProjetos = !loading && projetos.length === 0;

  return (
    <AppShell role="profissional" nav={nav} title="Projetos">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[22px] font-semibold tracking-tight text-ink">Projetos</h2>
          <p className="text-sm text-muted-foreground mt-1">Cadastro, etapas e acompanhamento.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCategories(true)}
            disabled={!officeId}
            className="inline-flex items-center gap-1.5 px-3 h-9 border border-border bg-white rounded-md text-[13px] font-medium hover:bg-secondary disabled:opacity-50"
          >
            <Tag className="h-3.5 w-3.5" strokeWidth={2} /> Categorias
          </button>
          <button
            onClick={() => setShowNewProject(true)}
            disabled={!officeId}
            className="inline-flex items-center gap-1.5 px-3.5 h-9 bg-ink hover:bg-black text-white rounded-md text-[13px] font-medium transition-colors disabled:opacity-50 shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2} /> Novo projeto
          </button>
        </div>
      </div>

      {!semProjetos && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por projeto ou cliente..."
              className="w-full h-9 pl-8 pr-3 text-[13px] border border-border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex items-center gap-1 text-[12px]">
            {([
              ["all", "Todos"],
              ["active", "Ativos"],
              ["attention", "Atenção"],
              ["completed", "Concluídos"],
            ] as const).map(([k, label]) => (
              <button
                key={k}
                onClick={() => setStatusFilter(k)}
                className={`px-2.5 h-8 rounded-md border ${statusFilter === k ? "bg-ink text-white border-ink" : "bg-white border-border text-muted-foreground hover:bg-secondary"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="ml-auto text-[12px] text-muted-foreground">
            {filtered.length} de {projetos.length}
          </div>
        </div>
      )}

      <div className="bg-white border border-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="px-5 py-10 text-center text-[13px] text-muted-foreground">Carregando...</div>
        ) : semProjetos ? (
          <div className="px-5 py-12 text-center">
            <div className="mx-auto h-10 w-10 rounded-full bg-secondary flex items-center justify-center mb-3">
              <FolderOpen className="h-5 w-5 text-muted-foreground" strokeWidth={1.75} />
            </div>
            <h3 className="text-[14px] font-semibold text-ink">Sem projetos cadastrados</h3>
            <p className="text-[12.5px] text-muted-foreground mt-1 max-w-sm mx-auto">
              Cadastre o primeiro projeto para acompanhar prazos, equipe e entregas.
            </p>
            <button
              onClick={() => setShowNewProject(true)}
              disabled={!officeId}
              className="mt-4 inline-flex items-center gap-1.5 px-3.5 h-9 bg-ink hover:bg-black text-white rounded-md text-[13px] font-medium disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2} /> Cadastrar projeto
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-12 text-center text-[13px] text-muted-foreground">
            Nenhum projeto encontrado com os filtros selecionados.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-muted-foreground bg-secondary/30">
                <th className="text-left font-medium px-5 py-2">Projeto</th>
                <th className="text-left font-medium px-3 py-2">Cliente</th>
                <th className="text-left font-medium px-3 py-2">Fase</th>
                <th className="text-left font-medium px-3 py-2 w-[140px]">Progresso</th>
                <th className="text-left font-medium px-3 py-2">Entrega</th>
                <th className="text-right font-medium px-5 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (

                <tr key={p.id} className="border-t border-border hover:bg-secondary/30 transition-colors group">
                  <td className="px-5 py-3">
                    <div className="text-[13px] font-medium text-ink flex items-center gap-1.5">
                      {p.nome}
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={1.75} />
                    </div>
                  </td>
                  <td className="px-3 py-3 text-[13px] text-muted-foreground">{p.cliente}</td>
                  <td className="px-3 py-3 text-[12.5px] text-muted-foreground">{p.fase}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 flex-1 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${p.progresso}%` }} />
                      </div>
                      <span className="text-[11.5px] text-muted-foreground tabular-nums w-8 text-right">{p.progresso}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-[12.5px] text-muted-foreground">
                    {p.proximaEntrega ? formatShortDate(p.proximaEntrega) : "—"}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 text-[11.5px] font-medium px-2 py-0.5 rounded-full ${
                        p.status === "Atenção"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-emerald-50 text-emerald-700"
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${p.status === "Atenção" ? "bg-amber-500" : "bg-emerald-500"}`} />
                        {p.status}
                      </span>
                      <button
                        onClick={() => setStagesProject({ id: p.id, nome: p.nome })}
                        className="p-1 rounded-md text-muted-foreground hover:text-primary hover:bg-secondary transition-colors"
                        title="Gerenciar etapas"
                      >
                        <ListChecks className="h-3.5 w-3.5" strokeWidth={1.75} />
                      </button>
                      <button
                        onClick={() => setProductsProject({ id: p.id, nome: p.nome })}
                        className="p-1 rounded-md text-muted-foreground hover:text-primary hover:bg-secondary transition-colors"
                        title="Produtos do projeto"
                      >
                        <ShoppingBag className="h-3.5 w-3.5" strokeWidth={1.75} />
                      </button>
                      <button
                        onClick={() => setChatProject({ id: p.id, nome: p.nome })}
                        className="p-1 rounded-md text-muted-foreground hover:text-primary hover:bg-secondary transition-colors"
                        title="Mensagens"
                      >
                        <MessageSquare className="h-3.5 w-3.5" strokeWidth={1.75} />
                      </button>
                      <button
                        onClick={() => setActivityProject({ id: p.id, nome: p.nome })}
                        className="p-1 rounded-md text-muted-foreground hover:text-primary hover:bg-secondary transition-colors"
                        title="Histórico de atividade"
                      >
                        <History className="h-3.5 w-3.5" strokeWidth={1.75} />
                      </button>
                      {!isMember && (
                        <button
                          onClick={() => setEditProject(p.id)}
                          className="p-1 rounded-md text-muted-foreground hover:text-primary hover:bg-secondary transition-colors"
                          title="Editar projeto"
                        >
                          <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {chatProject && (
        <Modal onClose={() => setChatProject(null)} title="Mensagens" subtitle={chatProject.nome}>
          <ProjectChat projectId={chatProject.id} height={420} />
        </Modal>
      )}
      {stagesProject && (
        <Modal onClose={() => setStagesProject(null)} title="Etapas do projeto" subtitle={stagesProject.nome} wide>
          <ProjectStagesManager projectId={stagesProject.id} />
        </Modal>
      )}
      {productsProject && (
        <Modal onClose={() => setProductsProject(null)} title="Produtos do projeto" subtitle={productsProject.nome} wide>
          <ProjectProductsManager projectId={productsProject.id} officeId={officeId} />
        </Modal>
      )}
      {activityProject && (
        <Modal onClose={() => setActivityProject(null)} title="Atividade do projeto" subtitle={activityProject.nome} wide>
          <ProjectActivityPanel projectId={activityProject.id} />
        </Modal>
      )}
      {showCategories && officeId && (
        <Modal onClose={() => setShowCategories(false)} title="Categorias de produtos">
          <ProductCategoriesManager officeId={officeId} />
        </Modal>
      )}
      {showNewProject && officeId && (
        <NewProjectModal
          officeId={officeId}
          onClose={() => setShowNewProject(false)}
          onCreated={() => { setShowNewProject(false); reload(); }}
        />
      )}
      {editProject && (
        <EditProjectModal
          projectId={editProject}
          onClose={() => setEditProject(null)}
          onSaved={() => { setEditProject(null); reload(); }}
        />
      )}
    </AppShell>
  );
}

function Modal({
  onClose, title, subtitle, wide, children,
}: {
  onClose: () => void;
  title: string;
  subtitle?: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className={`bg-white rounded-xl shadow-2xl w-full ${wide ? "max-w-3xl" : "max-w-xl"} max-h-[85vh] overflow-hidden flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-3.5 border-b border-border flex items-start justify-between">
          <div>
            <h3 className="text-[14px] font-semibold text-ink">{title}</h3>
            {subtitle && <p className="text-[12px] text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-muted-foreground hover:bg-secondary">
            <span className="block h-4 w-4">✕</span>
          </button>
        </div>
        <div className="flex-1 overflow-auto p-5">{children}</div>
      </div>
    </div>
  );
}
