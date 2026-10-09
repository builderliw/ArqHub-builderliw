import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  X, Loader2, Pencil, ExternalLink, User, Calendar, MapPin, Phone, Video,
  Plus, ListTodo, StickyNote, FileText,
} from "lucide-react";
import { externalSupabase } from "@/integrations/external-supabase/client";
import { toast } from "sonner";
import { EditProjectModal } from "@/components/edit-project-modal";
import { ProjectStagesManager } from "@/components/project-stages-manager";
import { ProjectMeetingsManager } from "@/components/project-meetings-manager";
import { ProjectNotesManager } from "@/components/project-notes-manager";

type Tab = "overview" | "tarefas" | "reunioes" | "notas";

type ProjectDetail = {
  id: string;
  name: string;
  status: string;
  deadline: string | null;
  description: string | null;
  location: string | null;
  city: string | null;
  uf: string | null;
  budget_cents: number | null;
  client_id: string | null;
  client_name: string | null;
  client_email: string | null;
  client_phone: string | null;
};

const STATUS_LABEL: Record<string, string> = {
  briefing: "Briefing",
  design: "Em projeto",
  em_andamento: "Em projeto",
  execution: "Execução",
  delivery: "Entrega",
  completed: "Concluído",
  finalizado: "Concluído",
  paused: "Pausado",
  pausado: "Pausado",
};

export function CronogramaProjectPanel({
  projectId,
  onClose,
  onChanged,
}: {
  projectId: string;
  onClose: () => void;
  onChanged?: () => void;
}) {
  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [editing, setEditing] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error } = await externalSupabase
      .from("projects")
      .select("id, name, status, deadline, description, location, city, uf, budget_cents, client_id, client:clients(name, email, phone)")
      .eq("id", projectId)
      .maybeSingle();
    if (error) { toast.error(error.message); setLoading(false); return; }
    if (!data) { setProject(null); setLoading(false); return; }
    const c: any = (data as any).client ?? null;
    setProject({
      id: (data as any).id,
      name: (data as any).name,
      status: (data as any).status,
      deadline: (data as any).deadline ?? null,
      description: (data as any).description ?? null,
      location: (data as any).location ?? null,
      city: (data as any).city ?? null,
      uf: (data as any).uf ?? null,
      budget_cents: (data as any).budget_cents ?? null,
      client_id: (data as any).client_id ?? null,
      client_name: c?.name ?? null,
      client_email: c?.email ?? null,
      client_phone: c?.phone ?? null,
    });
    setLoading(false);
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [projectId]);

  const projectsArr = project ? [{ id: project.id, name: project.name }] : [];

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <aside className="w-full max-w-[640px] h-full bg-white border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        <header className="px-5 py-4 border-b border-border flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Projeto</div>
            <h2 className="text-[17px] font-semibold text-ink truncate mt-0.5">{project?.name ?? "Carregando…"}</h2>
            {project && (
              <div className="mt-1 flex items-center gap-2 flex-wrap">
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-secondary text-ink font-medium">
                  {STATUS_LABEL[project.status] ?? project.status}
                </span>
                {project.client_name && (
                  <span className="text-[11.5px] text-muted-foreground inline-flex items-center gap-1">
                    <User className="h-3 w-3" /> {project.client_name}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setEditing(true)} className="p-2 rounded-md hover:bg-secondary text-muted-foreground hover:text-ink" title="Editar projeto">
              <Pencil className="h-4 w-4" />
            </button>
            <Link to="/app/profissional/projetos" className="p-2 rounded-md hover:bg-secondary text-muted-foreground hover:text-ink" title="Abrir em projetos">
              <ExternalLink className="h-4 w-4" />
            </Link>
            <button onClick={onClose} className="p-2 rounded-md hover:bg-secondary text-muted-foreground hover:text-ink" title="Fechar">
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <nav className="px-3 border-b border-border flex gap-1 overflow-x-auto">
          {([
            { k: "overview", label: "Visão geral", Icon: FileText },
            { k: "tarefas",  label: "Tarefas",     Icon: ListTodo },
            { k: "reunioes", label: "Reuniões",    Icon: Calendar },
            { k: "notas",    label: "Anotações",   Icon: StickyNote },
          ] as { k: Tab; label: string; Icon: any }[]).map(({ k, label, Icon }) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`inline-flex items-center gap-1.5 px-3 py-2.5 text-[12.5px] font-medium border-b-2 -mb-px transition-colors ${
                tab === k
                  ? "border-primary text-ink"
                  : "border-transparent text-muted-foreground hover:text-ink"
              }`}
            >
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </nav>

        <div className="flex-1 overflow-y-auto p-5">
          {loading || !project ? (
            <div className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Carregando…
            </div>
          ) : tab === "overview" ? (
            <Overview p={project} />
          ) : tab === "tarefas" ? (
            <ProjectStagesManager projectId={project.id} />
          ) : tab === "reunioes" ? (
            <ProjectMeetingsManager projects={projectsArr} clientId={project.client_id ?? ""} />
          ) : (
            <ProjectNotesManager projects={projectsArr} />
          )}
        </div>
      </aside>

      {editing && (
        <EditProjectModal
          projectId={projectId}
          onClose={() => setEditing(false)}
          onSaved={() => { setEditing(false); load(); onChanged?.(); }}
        />
      )}
    </div>
  );
}

function Overview({ p }: { p: ProjectDetail }) {
  const money = p.budget_cents != null
    ? (p.budget_cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    : null;
  const local = [p.location, p.city, p.uf].filter(Boolean).join(", ");
  return (
    <div className="space-y-5">
      {p.description && (
        <section>
          <h3 className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium mb-1.5">Descrição</h3>
          <p className="text-[13px] text-ink whitespace-pre-wrap">{p.description}</p>
        </section>
      )}
      <section className="grid grid-cols-2 gap-3">
        <Info label="Entrega" value={p.deadline ? new Date(p.deadline).toLocaleDateString("pt-BR") : "—"} />
        <Info label="Orçamento" value={money ?? "—"} />
        <Info label="Localização" value={local || "—"} className="col-span-2" />
      </section>
      <section>
        <h3 className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium mb-2">Cliente</h3>
        {p.client_id ? (
          <div className="rounded-lg border border-border bg-white p-3 space-y-1.5">
            <div className="text-[13px] font-semibold text-ink">{p.client_name ?? "—"}</div>
            {p.client_email && <div className="text-[12px] text-muted-foreground">{p.client_email}</div>}
            {p.client_phone && <div className="text-[12px] text-muted-foreground inline-flex items-center gap-1"><Phone className="h-3 w-3" /> {p.client_phone}</div>}
            <Link to="/app/profissional/clientes" className="inline-flex items-center gap-1 text-[12px] text-primary hover:underline mt-1">
              Abrir cliente <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        ) : (
          <div className="text-[12.5px] text-muted-foreground italic">Sem cliente vinculado.</div>
        )}
      </section>
    </div>
  );
}

function Info({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={`rounded-lg border border-border bg-white p-3 ${className ?? ""}`}>
      <div className="text-[10.5px] uppercase tracking-wide text-muted-foreground font-medium">{label}</div>
      <div className="text-[13px] text-ink mt-0.5">{value}</div>
    </div>
  );
}

// silence unused
void MapPin; void Video; void Plus;
