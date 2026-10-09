import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState, useMemo, useCallback } from "react";
import {
  Calendar, MapPin, Video, Phone, AlertCircle, Plus,
  CheckSquare, ListTodo, ArrowUpRight, ChevronRight, CalendarPlus,
  Table2, LayoutGrid, ChevronDown, Paperclip, Tag as TagIcon,
  ChevronLeft, Flag,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { navProfissional as nav } from "@/lib/nav-profissional";
import { externalSupabase } from "@/integrations/external-supabase/client";
import { listProfessionalCronograma } from "@/lib/profissional-project-data.functions";
import { CronogramaProjectPanel } from "@/components/cronograma-project-panel";
import { toast } from "sonner";
import { Loader2, X, Check } from "lucide-react";

export const Route = createFileRoute("/app/profissional/cronograma")({
  head: () => ({ meta: [{ title: "Agenda da semana — ArqHub" }] }),
  component: CronogramaPage,
});

type Phase = "briefing" | "design" | "execution" | "delivery" | "completed";

const PHASES: { key: Phase; title: string; accent: string; head: string }[] = [
  { key: "briefing",  title: "Briefing",     accent: "border-t-amber-500",   head: "bg-amber-50 text-amber-900" },
  { key: "design",    title: "Em Projeto",   accent: "border-t-blue-500",    head: "bg-blue-50 text-blue-900" },
  { key: "execution", title: "Execução",     accent: "border-t-emerald-500", head: "bg-emerald-50 text-emerald-900" },
  { key: "delivery",  title: "Entrega",      accent: "border-t-violet-500",  head: "bg-violet-50 text-violet-900" },
  { key: "completed", title: "Concluídos",   accent: "border-t-slate-400",   head: "bg-slate-100 text-slate-700" },
];

const STATUS_TO_PHASE: Record<string, Phase> = {
  briefing: "briefing",
  design: "design",
  em_andamento: "design",
  execution: "execution",
  delivery: "delivery",
  completed: "completed",
  finalizado: "completed",
  paused: "design",
  pausado: "design",
};

type NextMeeting = {
  id: string;
  title: string;
  scheduled_at: string;
  mode: "presencial" | "online" | "telefone";
  location: string | null;
  link: string | null;
};

export type StageRow = {
  id: string;
  project_id: string;
  title: string;
  status: string;
  order_index: number;
  end_at: string | null;
};

type Project = {
  id: string;
  name: string;
  status: string;
  deadline: string | null;
  client_id: string | null;
  client_name?: string | null;
  stages_total: number;
  stages_open: number;
  next_meeting?: NextMeeting | null;
  stages: StageRow[];
};

type MeetingRow = NextMeeting & { project_id: string; project_name: string };

function CronogramaPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [meetings, setMeetings] = useState<MeetingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [meetingFor, setMeetingFor] = useState<Project | null>(null);
  const [meetingInitial, setMeetingInitial] = useState<NextMeeting | null>(null);


  const loadCronograma = useServerFn(listProfessionalCronograma);

  const load = useCallback(async () => {
    setLoading(true); setErr(null);
    try {
      const { data: sess } = await externalSupabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) { setLoading(false); return; }

      const r = await loadCronograma({ data: { accessToken: token } });
      const projs: any[] = r.projects ?? [];
      const allStages: any[] = r.stages ?? [];
      const allMeetings: any[] = r.meetings ?? [];

      const stagesByProject = new Map<string, StageRow[]>();
      for (const s of allStages as StageRow[]) {
        const list = stagesByProject.get(s.project_id) ?? [];
        list.push(s);
        stagesByProject.set(s.project_id, list);
      }

      const projNameById = new Map<string, string>(projs.map((p) => [p.id, p.name]));
      const nowIso = new Date().toISOString();
      const meetByProject = new Map<string, NextMeeting>();
      const allMeets: MeetingRow[] = [];
      for (const m of allMeetings) {
        const row: MeetingRow = {
          id: m.id,
          title: m.title,
          scheduled_at: m.scheduled_at,
          mode: m.mode,
          location: m.location,
          link: m.link,
          project_id: m.project_id,
          project_name: projNameById.get(m.project_id) ?? "",
        };
        allMeets.push(row);
        if (m.scheduled_at >= nowIso && !meetByProject.has(m.project_id)) {
          meetByProject.set(m.project_id, { id: row.id, title: row.title, scheduled_at: row.scheduled_at, mode: row.mode, location: row.location, link: row.link });
        }
      }
      setMeetings(allMeets);

      const list: Project[] = projs.map((p) => {
        const stages = stagesByProject.get(p.id) ?? [];
        const open = stages.filter((s) => s.status !== "done" && s.status !== "completed").length;
        return {
          id: p.id,
          name: p.name,
          status: p.status,
          deadline: p.deadline ?? null,
          client_id: p.client_id ?? null,
          client_name: p.client_name ?? null,
          stages_total: stages.length,
          stages_open: open,
          next_meeting: meetByProject.get(p.id) ?? null,
          stages,
        };
      });
      setProjects(list);
    } catch (e: any) {
      setErr(e?.message ?? "Erro ao carregar.");
    } finally {
      setLoading(false);
    }
  }, [loadCronograma]);

  useEffect(() => { load(); }, [load]);

  // grouped phases não é mais usado no kanban (substituído pela semana)

  function openMeeting(p: Project, initial: NextMeeting | null) {
    setMeetingInitial(initial);
    setMeetingFor(p);
  }

  return (
    <AppShell role="profissional" nav={nav} title="Agenda da semana">
      <header className="mb-4 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[22px] font-semibold text-ink tracking-tight">Agenda da semana</h1>
          <p className="text-[12.5px] text-muted-foreground mt-0.5">
            Todos os compromissos e prazos da semana em formato de calendário.
          </p>
        </div>
        <Link
          to="/app/profissional/projetos"
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-[12.5px] font-medium text-white hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2} /> Novo projeto
        </Link>
      </header>

      {err && (
        <div className="mb-4 flex items-center gap-2 text-[12.5px] text-red-700 bg-red-50 border border-red-200 rounded-lg p-2.5">
          <AlertCircle className="h-3.5 w-3.5" /> {err}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-40 rounded-xl border border-border bg-secondary/30 animate-pulse" />)}
        </div>
      ) : (
        <WeekKanbanView
          projects={projects}
          meetings={meetings}
          onOpen={(id) => setOpenId(id)}
          onEditMeeting={(m) => {
            const p = projects.find((x) => x.id === m.project_id);
            if (p) openMeeting(p, { id: m.id, title: m.title, scheduled_at: m.scheduled_at, mode: m.mode, location: m.location, link: m.link });
          }}
        />
      )}


      {openId && (
        <CronogramaProjectPanel
          projectId={openId}
          onClose={() => setOpenId(null)}
          onChanged={() => load()}
        />
      )}

      {meetingFor && (
        <QuickMeetingForm
          project={meetingFor}
          initial={meetingInitial}
          onClose={() => { setMeetingFor(null); setMeetingInitial(null); }}
          onSaved={() => { setMeetingFor(null); setMeetingInitial(null); load(); }}
        />
      )}
    </AppShell>
  );
}

// ---------- Monday-style table view ----------

function ViewTab({
  active, onClick, Icon, label,
}: {
  active: boolean; onClick: () => void; Icon: any; label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-2.5 text-[12.5px] font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
        active ? "border-primary text-ink" : "border-transparent text-muted-foreground hover:text-ink"
      }`}
    >
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
  );
}

const PHASE_META: Record<Phase, { label: string; bar: string; pill: string; title: string }> = {
  briefing:  { label: "Briefing",   bar: "bg-amber-500",   pill: "bg-amber-500 text-white",   title: "text-amber-600" },
  design:    { label: "Em Projeto", bar: "bg-blue-500",    pill: "bg-blue-500 text-white",    title: "text-blue-600" },
  execution: { label: "Execução",   bar: "bg-emerald-500", pill: "bg-emerald-500 text-white", title: "text-emerald-600" },
  delivery:  { label: "Entrega",    bar: "bg-violet-500",  pill: "bg-violet-500 text-white",  title: "text-violet-600" },
  completed: { label: "Concluído",  bar: "bg-slate-400",   pill: "bg-slate-400 text-white",   title: "text-slate-500" },
};

type Priority = "alta" | "media" | "baixa";
const PRIORITY_META: Record<Priority, { label: string; pill: string }> = {
  alta:  { label: "Alta",  pill: "bg-red-500 text-white" },
  media: { label: "Média", pill: "bg-orange-400 text-white" },
  baixa: { label: "Baixa", pill: "bg-sky-300 text-sky-950" },
};

function derivePriority(p: Project): Priority {
  if (!p.deadline) return "baixa";
  const days = Math.ceil((new Date(p.deadline).getTime() - Date.now()) / 86400000);
  if (days <= 14) return "alta";
  if (days <= 45) return "media";
  return "baixa";
}

function initials(name: string | null | undefined) {
  if (!name) return "—";
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

// ---- Status (Monday-style) ------------------------------------------------

type TaskStatus = "todo" | "in_progress" | "review" | "done";

const STATUS_META: Record<TaskStatus, { label: string; emoji: string; pill: string; cell: string }> = {
  todo:        { label: "Não Iniciado",       emoji: "🟥", pill: "bg-red-500 text-white",     cell: "bg-red-50 text-red-700" },
  in_progress: { label: "Em Andamento",       emoji: "🟨", pill: "bg-amber-400 text-amber-950", cell: "bg-amber-50 text-amber-800" },
  review:      { label: "Aguardando Cliente", emoji: "🟧", pill: "bg-orange-500 text-white",  cell: "bg-orange-50 text-orange-800" },
  done:        { label: "Concluído",          emoji: "🟩", pill: "bg-emerald-500 text-white", cell: "bg-emerald-50 text-emerald-800" },
};

function normStatus(s: string | null | undefined): TaskStatus {
  if (s === "in_progress") return "in_progress";
  if (s === "review") return "review";
  if (s === "done" || s === "completed") return "done";
  return "todo";
}

function progressBar(stages: StageRow[]): { bar: string; pct: number } {
  const total = stages.length;
  if (total === 0) return { bar: "", pct: 0 };
  const done = stages.filter((s) => normStatus(s.status) === "done").length;
  const pct = Math.round((done / total) * 100);
  const filled = Math.round((done / total) * 10);
  const bar = "🟩".repeat(filled) + "⬜".repeat(10 - filled);
  return { bar, pct };
}

// ---- Sincronização tarefa ↔ agenda ----------------------------------------
// Vínculo via marcador em notes, já que o schema externo não tem coluna stage_id.
const STAGE_TAG = (id: string) => `[stage:${id}]`;
type MeetingStatus = "agendada" | "realizada" | "cancelada" | "remarcada";

function stageStatusToMeeting(s: TaskStatus): MeetingStatus {
  if (s === "done") return "realizada";
  if (s === "review") return "remarcada";
  return "agendada";
}

async function syncStageMeetingStatus(stageId: string, status: TaskStatus) {
  const { data } = await externalSupabase
    .from("project_meetings")
    .select("id")
    .ilike("notes", `%${STAGE_TAG(stageId)}%`)
    .limit(1);
  const m = data?.[0];
  if (!m) return;
  await externalSupabase
    .from("project_meetings")
    .update({ status: stageStatusToMeeting(status) })
    .eq("id", m.id);
}

async function createStageWithAgenda(args: {
  project_id: string;
  client_id: string | null;
  title: string;
  status: TaskStatus;
  end_at: string | null;
  order_index: number;
}) {
  const { data: u } = await externalSupabase.auth.getUser();
  const { data: inserted, error } = await externalSupabase
    .from("project_stages")
    .insert({
      project_id: args.project_id,
      title: args.title,
      status: args.status,
      progress: 0,
      order_index: args.order_index,
      end_at: args.end_at,
    })
    .select("id")
    .single();
  if (error) throw error;
  // Cria evento de agenda se houver prazo e cliente vinculado
  if (args.end_at && args.client_id) {
    await externalSupabase.from("project_meetings").insert({
      project_id: args.project_id,
      client_id: args.client_id,
      title: `Tarefa: ${args.title}`,
      scheduled_at: new Date(args.end_at).toISOString(),
      duration_min: 30,
      mode: "presencial",
      status: stageStatusToMeeting(args.status),
      notes: `Sincronizado com tarefa do cronograma. ${STAGE_TAG(inserted!.id)}`,
      created_by: u?.user?.id ?? null,
    });
  }
  return inserted!.id;
}


function TableView({
  projects, onOpen, onChanged,
}: {
  projects: Project[];
  onOpen: (id: string) => void;
  onChanged: () => void;
}) {
  if (projects.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-secondary/20 p-10 text-center text-[12.5px] text-muted-foreground">
        Nenhum projeto cadastrado. Crie um projeto em <Link to="/app/profissional/projetos" className="text-primary underline">Projetos</Link> para ver o quadro.
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {projects.map((p) => (
        <ProjectBoard key={p.id} project={p} onOpen={() => onOpen(p.id)} onChanged={onChanged} />
      ))}
    </div>
  );
}

function ProjectBoard({
  project, onOpen, onChanged,
}: {
  project: Project;
  onOpen: () => void;
  onChanged: () => void;
}) {
  const meta = PHASE_META[STATUS_TO_PHASE[project.status] ?? "design"];
  const { bar, pct } = progressBar(project.stages);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState("");
  const [busy, setBusy] = useState(false);

  async function changeStatus(stageId: string, status: TaskStatus) {
    const { error } = await externalSupabase.from("project_stages").update({ status }).eq("id", stageId);
    if (error) { toast.error(error.message); return; }
    await syncStageMeetingStatus(stageId, status);
    toast.success("Status atualizado");
    onChanged();
  }

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setBusy(true);
    try {
      await createStageWithAgenda({
        project_id: project.id,
        client_id: project.client_id,
        title: newTitle.trim(),
        status: "todo",
        end_at: newDate ? new Date(newDate).toISOString() : null,
        order_index: project.stages.length,
      });
      toast.success("Tarefa adicionada");
      setNewTitle(""); setNewDate(""); setAdding(false);
      onChanged();
    } catch (e: any) {
      toast.error(e?.message ?? "Erro");
    } finally { setBusy(false); }
  }

  async function removeTask(id: string) {
    if (!confirm("Excluir esta tarefa?")) return;
    const { error } = await externalSupabase.from("project_stages").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Tarefa removida"); onChanged();
  }

  return (
    <section>
      <button
        onClick={onOpen}
        className="group flex items-center gap-2 mb-2 hover:opacity-80 transition-opacity"
        title="Abrir projeto"
      >
        <ChevronDown className={`h-3.5 w-3.5 ${meta.title}`} />
        <h2 className={`text-[14px] font-semibold ${meta.title}`}>{project.name}</h2>
        <span className="text-[11px] text-muted-foreground">· {project.client_name ?? "Sem cliente"}</span>
        <span className={`text-[10px] uppercase tracking-wide font-semibold px-1.5 py-0.5 rounded ${meta.pill}`}>{meta.label}</span>
        <ArrowUpRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
      </button>

      <div className="rounded-xl border border-border bg-white overflow-hidden shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        {/* Column header */}
        <div className="grid grid-cols-[40px_60px_minmax(0,1fr)_110px_110px_180px_40px] items-center bg-secondary/40 border-b border-border text-[10.5px] uppercase tracking-wide text-muted-foreground font-semibold">
          <div className="h-9" />
          <div className="px-2">ID</div>
          <div className="px-3">Tarefa</div>
          <div className="px-2 text-center">Resp.</div>
          <div className="px-2 text-center">Prazo</div>
          <div className="px-2 text-center">Status</div>
          <div />
        </div>

        {project.stages.length === 0 && !adding ? (
          <div className="px-4 py-6 text-[12px] text-muted-foreground italic text-center">
            Nenhuma tarefa ainda. Use <span className="font-medium not-italic">+ Adicionar tarefa</span> abaixo.
          </div>
        ) : project.stages.map((s, idx) => {
          const st = normStatus(s.status);
          const stMeta = STATUS_META[st];
          const tid = `T-${String(idx + 1).padStart(2, "0")}`;
          return (
            <div key={s.id} className="grid grid-cols-[40px_60px_minmax(0,1fr)_110px_110px_180px_40px] items-center hover:bg-secondary/30 transition-colors border-b border-border last:border-b-0">
              <div className="self-stretch flex items-center justify-center">
                <span className={`w-1.5 h-8 rounded-r ${meta.bar}`} />
              </div>
              <div className="px-2 text-[11px] text-muted-foreground tabular-nums">{tid}</div>
              <div className="px-3 py-2.5 min-w-0 text-[13px] font-medium text-ink truncate">{s.title}</div>
              <div className="px-2 flex justify-center">
                <div className="h-7 w-7 rounded-full bg-primary/15 text-primary text-[10.5px] font-semibold flex items-center justify-center">
                  {initials(project.client_name)}
                </div>
              </div>
              <div className="px-2 text-center text-[11.5px] text-ink tabular-nums">
                {s.end_at ? new Date(s.end_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) : <span className="text-muted-foreground">—</span>}
              </div>
              <div className="px-2 flex justify-center">
                <select
                  value={st}
                  onChange={(e) => changeStatus(s.id, e.target.value as TaskStatus)}
                  className={`text-[10.5px] font-semibold uppercase tracking-wide px-2 py-1 rounded border-0 w-full text-center cursor-pointer ${stMeta.pill}`}
                  title="Alterar status"
                >
                  {(Object.keys(STATUS_META) as TaskStatus[]).map((k) => (
                    <option key={k} value={k}>{STATUS_META[k].emoji} {STATUS_META[k].label}</option>
                  ))}
                </select>
              </div>
              <div className="px-1 text-center">
                <button onClick={() => removeTask(s.id)} className="text-muted-foreground hover:text-red-600 p-1" title="Excluir">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}

        {/* Inline add row */}
        {adding ? (
          <form onSubmit={addTask} className="grid grid-cols-[40px_60px_minmax(0,1fr)_110px_110px_180px_40px] items-center bg-amber-50/40 border-t border-border">
            <div />
            <div className="px-2 text-[11px] text-muted-foreground">novo</div>
            <input
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="O que precisa ser feito?"
              className="px-3 py-2.5 text-[13px] bg-transparent outline-none border-0"
            />
            <div />
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="px-2 text-[11.5px] bg-transparent outline-none border-0 text-center"
            />
            <div className="px-2 flex gap-1.5 justify-center">
              <button type="submit" disabled={busy || !newTitle.trim()} className="inline-flex items-center gap-1 px-2 h-7 rounded bg-ink text-white text-[11px] disabled:opacity-50">
                {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />} Salvar
              </button>
              <button type="button" onClick={() => { setAdding(false); setNewTitle(""); setNewDate(""); }} className="px-2 h-7 rounded border border-border text-[11px] bg-white">Cancelar</button>
            </div>
            <div />
          </form>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="w-full inline-flex items-center justify-center gap-1.5 py-2 text-[11.5px] text-muted-foreground hover:text-ink hover:bg-secondary/30 transition-colors border-t border-border"
          >
            <Plus className="h-3 w-3" /> Adicionar tarefa
          </button>
        )}

        {/* Progress bar row */}
        {project.stages.length > 0 && (
          <div className="grid grid-cols-[40px_60px_minmax(0,1fr)_110px_110px_180px_40px] items-center bg-secondary/30 border-t border-border">
            <div />
            <div className="px-2 text-[10.5px] uppercase tracking-wide text-muted-foreground font-semibold">∑</div>
            <div className="px-3 py-2 text-[12px] font-semibold text-ink">Progresso do Grupo</div>
            <div />
            <div />
            <div className="px-2 py-2 text-[13px] tracking-wider tabular-nums text-center">
              {bar} <span className="ml-2 text-ink font-semibold">{pct}%</span>
            </div>
            <div />
          </div>
        )}
      </div>
    </section>
  );
}

// RowEditor removido — status agora é editado direto na célula via select.

// suppress unused-icon warnings (kept for future expansion)
void Paperclip; void TagIcon; void CalendarPlus; void Calendar; void Video; void Phone; void MapPin;




function ProjectCard({
  p, onOpen, onScheduleMeeting,
}: {
  p: Project;
  onOpen: () => void;
  onScheduleMeeting: (initial: NextMeeting | null) => void;
}) {
  const ModeIcon = p.next_meeting?.mode === "online" ? Video : p.next_meeting?.mode === "telefone" ? Phone : MapPin;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(); } }}
      className="block rounded-lg border border-border bg-white p-2.5 hover:border-foreground/20 hover:shadow-[0_4px_12px_rgba(16,24,40,0.06)] transition-all group cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[12.5px] font-semibold text-ink truncate">{p.name}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5 truncate">{p.client_name ?? "Sem cliente"}</div>
        </div>
        <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
      </div>

      {(p.next_meeting || p.stages_open > 0 || p.deadline) && (
        <div className="mt-2 pt-2 border-t border-border/60 space-y-1">
          {p.next_meeting && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onScheduleMeeting(p.next_meeting!); }}
              className="w-full text-left rounded-md -mx-1 px-1 py-0.5 hover:bg-secondary/60 transition-colors"
              title="Editar reunião"
            >
              <div className="flex items-center gap-1.5 text-[11px] text-ink">
                <Calendar className="h-3 w-3 text-primary" />
                <span className="truncate font-medium">{p.next_meeting.title}</span>
                <span className="text-muted-foreground shrink-0 ml-auto">
                  {new Date(p.next_meeting.scheduled_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10.5px] text-muted-foreground mt-0.5">
                <ModeIcon className="h-3 w-3" />
                <span className="truncate">
                  {p.next_meeting.mode === "online"
                    ? (p.next_meeting.link || "Online")
                    : p.next_meeting.mode === "telefone"
                    ? "Telefone"
                    : (p.next_meeting.location || "Presencial")}
                </span>
              </div>
            </button>
          )}
          {p.stages_open > 0 && (
            <div className="flex items-center gap-1.5 text-[10.5px] text-muted-foreground">
              <ListTodo className="h-3 w-3" />
              <span>{p.stages_open} {p.stages_open === 1 ? "etapa aberta" : "etapas abertas"}</span>
            </div>
          )}
          {p.deadline && (
            <div className="flex items-center gap-1.5 text-[10.5px] text-muted-foreground">
              <CheckSquare className="h-3 w-3" />
              <span>Entrega {new Date(p.deadline).toLocaleDateString("pt-BR")}</span>
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onScheduleMeeting(null); }}
        className="mt-2 w-full inline-flex items-center justify-center gap-1 rounded-md border border-dashed border-border py-1 text-[10.5px] text-muted-foreground hover:text-ink hover:border-foreground/30 transition-colors"
      >
        <CalendarPlus className="h-3 w-3" /> {p.next_meeting ? "Nova reunião" : "Agendar reunião"}
      </button>
    </div>
  );
}

// ---------- Quick meeting form (create or edit next meeting from a card) ----------

function QuickMeetingForm({
  project, initial, onClose, onSaved,
}: {
  project: Project;
  initial: NextMeeting | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const localIso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const initDt = initial ? new Date(initial.scheduled_at) : new Date(Date.now() + 24 * 60 * 60 * 1000);

  const [title, setTitle] = useState(initial?.title ?? "Reunião com cliente");
  const [when, setWhen] = useState(localIso(initDt));
  const [duration, setDuration] = useState("60");
  const [mode, setMode] = useState<NextMeeting["mode"]>(initial?.mode ?? "presencial");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [link, setLink] = useState(initial?.link ?? "");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!title.trim() || !when) return;
    setSaving(true);
    try {
      const { data: u } = await externalSupabase.auth.getUser();
      const payload = {
        project_id: project.id,
        client_id: project.client_id,
        title: title.trim(),
        scheduled_at: new Date(when).toISOString(),
        duration_min: Number(duration) || 60,
        mode,
        location: mode === "presencial" ? (location.trim() || null) : null,
        link: mode === "online" ? (link.trim() || null) : null,
        notes: notes.trim() || null,
        status: "agendada" as const,
        created_by: u?.user?.id ?? null,
      };
      const q = initial
        ? await externalSupabase.from("project_meetings").update(payload).eq("id", initial.id)
        : await externalSupabase.from("project_meetings").insert(payload);
      if (q.error) throw q.error;
      toast.success(initial ? "Reunião atualizada" : "Reunião agendada");
      onSaved();
    } catch (e: any) {
      toast.error(e?.message ?? "Erro");
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl border border-border w-full max-w-lg p-5 max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-1">
          <h4 className="text-[15px] font-semibold text-ink">{initial ? "Editar reunião" : "Nova reunião"}</h4>
          <button onClick={onClose} className="text-muted-foreground hover:text-ink"><X className="h-4 w-4" /></button>
        </div>
        <div className="text-[11.5px] text-muted-foreground mb-4">{project.name}</div>
        <div className="grid grid-cols-2 gap-3">
          <Field className="col-span-2" label="Título *">
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="qf-ipt" />
          </Field>
          <Field label="Data e hora *">
            <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className="qf-ipt" />
          </Field>
          <Field label="Duração (min)">
            <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} className="qf-ipt" />
          </Field>
          <Field label="Modo" className="col-span-2">
            <select value={mode} onChange={(e) => setMode(e.target.value as NextMeeting["mode"])} className="qf-ipt">
              <option value="presencial">Presencial</option>
              <option value="online">Online</option>
              <option value="telefone">Telefone</option>
            </select>
          </Field>
          {mode === "presencial" && (
            <Field className="col-span-2" label="Local">
              <input value={location} onChange={(e) => setLocation(e.target.value)} className="qf-ipt" placeholder="Escritório, obra…" />
            </Field>
          )}
          {mode === "online" && (
            <Field className="col-span-2" label="Link">
              <input value={link} onChange={(e) => setLink(e.target.value)} className="qf-ipt" placeholder="https://meet…" />
            </Field>
          )}
          <Field className="col-span-2" label="Observações">
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="qf-ipt min-h-[70px]" />
          </Field>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="px-3 h-9 rounded-md border border-border text-[12.5px]">Cancelar</button>
          <button disabled={saving || !title.trim() || !when} onClick={save}
            className="inline-flex items-center gap-1.5 px-3 h-9 rounded-md bg-ink text-white text-[12.5px] font-medium disabled:opacity-50">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Salvar
          </button>
        </div>
        <style>{`.qf-ipt{width:100%;border:1px solid hsl(var(--border));border-radius:.5rem;padding:.5rem .65rem;font-size:13px;background:#fff;outline:none}.qf-ipt:focus{border-color:hsl(var(--primary))}`}</style>
      </div>
    </div>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="block text-[11px] font-medium text-muted-foreground mb-1">{label}</span>
      {children}
    </label>
  );
}

// kept for compatibility with bundler tree-shake
void ChevronRight;

function QuickAddTask({ projects, onCreated }: { projects: Project[]; onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [projectId, setProjectId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [endAt, setEndAt] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const project = projects.find((p) => p.id === projectId) ?? null;
  const phase = project ? (PHASE_META[STATUS_TO_PHASE[project.status] ?? "design"]) : null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!projectId || !title.trim()) { toast.error("Selecione um projeto e informe o título."); return; }
    setSaving(true);
    try {
      const orderIndex = (project?.stages.length ?? 0);
      await createStageWithAgenda({
        project_id: projectId,
        client_id: project?.client_id ?? null,
        title: title.trim(),
        status,
        end_at: endAt ? new Date(endAt).toISOString() : null,
        order_index: orderIndex,
      });
      toast.success(endAt && project?.client_id ? "Tarefa criada e sincronizada com a agenda" : "Tarefa criada");
      setTitle(""); setEndAt(""); setStatus("todo");
      onCreated();
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao criar tarefa");
    } finally { setSaving(false); }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full inline-flex items-center justify-center gap-1.5 rounded-md border border-dashed border-border py-2 text-[12.5px] text-muted-foreground hover:text-ink hover:border-foreground/30 transition-colors"
      >
        <Plus className="h-3.5 w-3.5" /> Adicionar tarefa rápida
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-border bg-white p-3 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.4fr)_minmax(0,2fr)_140px_160px_auto] gap-2 items-end">
        <label className="block">
          <span className="block text-[10.5px] uppercase tracking-wide text-muted-foreground font-semibold mb-1">Projeto / Fase</span>
          <select required value={projectId} onChange={(e) => setProjectId(e.target.value)} className="h-9 w-full border border-border rounded-md px-2 text-[13px] bg-white">
            <option value="">— Selecione —</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          {phase && <span className={`mt-1 inline-block text-[10px] uppercase tracking-wide font-semibold px-1.5 py-0.5 rounded ${phase.pill}`}>{phase.label}</span>}
        </label>
        <label className="block">
          <span className="block text-[10.5px] uppercase tracking-wide text-muted-foreground font-semibold mb-1">Título</span>
          <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Aprovar planta baixa" className="h-9 w-full border border-border rounded-md px-2 text-[13px]" />
        </label>
        <label className="block">
          <span className="block text-[10.5px] uppercase tracking-wide text-muted-foreground font-semibold mb-1">Status</span>
          <select value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)} className="h-9 w-full border border-border rounded-md px-2 text-[13px] bg-white">
            {(Object.keys(STATUS_META) as TaskStatus[]).map((k) => (
              <option key={k} value={k}>{STATUS_META[k].emoji} {STATUS_META[k].label}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="block text-[10.5px] uppercase tracking-wide text-muted-foreground font-semibold mb-1">Prazo</span>
          <input type="date" value={endAt} onChange={(e) => setEndAt(e.target.value)} className="h-9 w-full border border-border rounded-md px-2 text-[13px]" />
        </label>
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={() => setOpen(false)} className="h-9 px-3 rounded-md border border-border text-[12.5px] bg-white">Fechar</button>
          <button type="submit" disabled={saving} className="h-9 px-3 rounded-md bg-ink text-white text-[12.5px] font-medium disabled:opacity-50 inline-flex items-center gap-1.5">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} Adicionar
          </button>
        </div>
      </div>
      {endAt && project && !project.client_id && (
        <p className="mt-2 text-[11px] text-amber-700">Projeto sem cliente vinculado — a tarefa será criada, mas o evento da agenda não será sincronizado.</p>
      )}
    </form>
  );
}

// ---------- Tarefas (lista plana) ----------
function TasksView({
  projects, onOpen, onChanged,
}: {
  projects: Project[];
  onOpen: (id: string) => void;
  onChanged: () => void;
}) {
  type Row = StageRow & { project_name: string };
  const rows: Row[] = projects.flatMap((p) => p.stages.map((s) => ({ ...s, project_name: p.name })));
  const [filter, setFilter] = useState<"all" | TaskStatus>("all");
  const filtered = filter === "all" ? rows : rows.filter((r) => normStatus(r.status) === filter);

  async function quickUpdate(id: string, status: TaskStatus) {
    const { error } = await externalSupabase.from("project_stages").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    await syncStageMeetingStatus(id, status);
    toast.success("Tarefa atualizada");
    onChanged();
  }


  return (
    <div className="space-y-3">
      <QuickAddTask projects={projects} onCreated={onChanged} />

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-secondary/20 p-10 text-center text-[12.5px] text-muted-foreground">
          Nenhuma tarefa nos projetos ainda. Use o formulário acima para adicionar.
        </div>
      ) : (
      <>
      <div className="flex items-center gap-1.5 flex-wrap">

        <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>Todas ({rows.length})</FilterChip>
        {(Object.keys(STATUS_META) as TaskStatus[]).map((k) => {
          const c = rows.filter((r) => normStatus(r.status) === k).length;
          return (
            <FilterChip key={k} active={filter === k} onClick={() => setFilter(k)}>
              {STATUS_META[k].emoji} {STATUS_META[k].label} ({c})
            </FilterChip>
          );
        })}
      </div>

      <div className="rounded-xl border border-border bg-white overflow-hidden">
        <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)_110px_180px_120px] items-center bg-secondary/40 border-b border-border text-[10.5px] uppercase tracking-wide text-muted-foreground font-semibold">
          <div className="px-3 py-2.5">Tarefa</div>
          <div className="px-3">Projeto</div>
          <div className="px-3 text-center">Prazo</div>
          <div className="px-3 text-center">Status</div>
          <div className="px-3" />
        </div>
        {filtered.map((r) => {
          const stMeta = STATUS_META[normStatus(r.status)];
          return (
            <div key={r.id} className="grid grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)_110px_180px_120px] items-center border-b border-border last:border-b-0 hover:bg-secondary/30">
              <div className="px-3 py-2.5 text-[13px] text-ink truncate">{r.title}</div>
              <button onClick={() => onOpen(r.project_id)} className="px-3 text-[12px] text-primary hover:underline text-left truncate">{r.project_name}</button>
              <div className="px-3 text-center text-[11.5px] text-ink tabular-nums">
                {r.end_at ? new Date(r.end_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) : <span className="text-muted-foreground">—</span>}
              </div>
              <div className="px-3 flex justify-center">
                <select
                  value={normStatus(r.status)}
                  onChange={(e) => quickUpdate(r.id, e.target.value as TaskStatus)}
                  className={`text-[11px] font-semibold uppercase tracking-wide px-2 py-1 rounded border-0 ${stMeta.pill} cursor-pointer`}
                >
                  {(Object.keys(STATUS_META) as TaskStatus[]).map((k) => (
                    <option key={k} value={k}>{STATUS_META[k].emoji} {STATUS_META[k].label}</option>
                  ))}
                </select>
              </div>
              <div className="px-3 text-right">
                <button onClick={() => onOpen(r.project_id)} className="text-[11.5px] text-muted-foreground hover:text-ink">Abrir →</button>
              </div>
            </div>
          );
        })}
      </div>
      </>
      )}
    </div>
  );
}


function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 rounded-full text-[11.5px] font-medium border transition-colors ${
        active ? "bg-ink text-white border-ink" : "bg-white text-muted-foreground border-border hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

// ---------- Agenda ----------
function AgendaView({
  meetings, projects, onEdit, onNew,
}: {
  meetings: MeetingRow[];
  projects: Project[];
  onEdit: (m: MeetingRow) => void;
  onNew: (p: Project) => void;
}) {
  const grouped = useMemo(() => {
    const g = new Map<string, MeetingRow[]>();
    for (const m of meetings) {
      const k = new Date(m.scheduled_at).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
      const arr = g.get(k) ?? [];
      arr.push(m); g.set(k, arr);
    }
    return Array.from(g.entries());
  }, [meetings]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[12px] text-muted-foreground">Próximas reuniões e agendamentos dos projetos.</p>
        {projects.length > 0 && (
          <select
            onChange={(e) => {
              const p = projects.find((x) => x.id === e.target.value);
              if (p) onNew(p);
              e.currentTarget.value = "";
            }}
            defaultValue=""
            className="h-9 border border-border rounded-md px-2 text-[12.5px] bg-white"
          >
            <option value="" disabled>+ Novo agendamento…</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        )}
      </div>

      {meetings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-secondary/20 p-10 text-center text-[12.5px] text-muted-foreground">
          Nenhum agendamento futuro.
        </div>
      ) : (
        grouped.map(([day, list]) => (
          <div key={day}>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">{day}</div>
            <div className="rounded-xl border border-border bg-white overflow-hidden">
              {list.map((m) => (
                <button
                  key={m.id}
                  onClick={() => onEdit(m)}
                  className="w-full grid grid-cols-[80px_minmax(0,1fr)_140px_120px] items-center border-b border-border last:border-b-0 hover:bg-secondary/30 text-left transition-colors"
                >
                  <div className="px-3 py-2.5 text-[13px] font-semibold tabular-nums text-ink">
                    {new Date(m.scheduled_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                  <div className="px-3 min-w-0">
                    <div className="text-[13px] text-ink truncate">{m.title}</div>
                    <div className="text-[11.5px] text-muted-foreground truncate">{m.project_name}</div>
                  </div>
                  <div className="px-3 text-[11.5px] text-muted-foreground inline-flex items-center gap-1.5">
                    {m.mode === "online" ? <Video className="h-3.5 w-3.5" /> : m.mode === "telefone" ? <Phone className="h-3.5 w-3.5" /> : <MapPin className="h-3.5 w-3.5" />}
                    <span className="truncate capitalize">{m.mode}</span>
                  </div>
                  <div className="px-3 text-right text-[11.5px] text-muted-foreground">Editar →</div>
                </button>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}


// ---------- Week Kanban (segunda a sexta) ----------
const WEEKDAY_LABELS = ["Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira"];
const WEEKDAY_SHORT = ["SEG", "TER", "QUA", "QUI", "SEX"];
const WEEKDAY_ACCENT = [
  { head: "bg-blue-50 text-blue-900", top: "border-t-blue-500" },
  { head: "bg-emerald-50 text-emerald-900", top: "border-t-emerald-500" },
  { head: "bg-amber-50 text-amber-900", top: "border-t-amber-500" },
  { head: "bg-violet-50 text-violet-900", top: "border-t-violet-500" },
  { head: "bg-rose-50 text-rose-900", top: "border-t-rose-500" },
];

function startOfWeekMonday(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = x.getDay(); // 0=Sun..6=Sat
  const diff = (day === 0 ? -6 : 1 - day);
  x.setDate(x.getDate() + diff);
  return x;
}

function sameLocalDay(iso: string, day: Date) {
  const d = new Date(iso);
  return d.getFullYear() === day.getFullYear() && d.getMonth() === day.getMonth() && d.getDate() === day.getDate();
}

type WeekItem =
  | { kind: "meeting"; id: string; at: string; title: string; project_name: string; project_id: string; mode: NextMeeting["mode"]; location: string | null; link: string | null; meeting: MeetingRow }
  | { kind: "stage"; id: string; at: string; title: string; project_name: string; project_id: string; status: TaskStatus };

function WeekKanbanView({
  projects, meetings, onOpen, onEditMeeting,
}: {
  projects: Project[];
  meetings: MeetingRow[];
  onOpen: (id: string) => void;
  onEditMeeting: (m: MeetingRow) => void;
}) {
  const [weekStart, setWeekStart] = useState(() => startOfWeekMonday(new Date()));

  const days = useMemo(() => Array.from({ length: 5 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  }), [weekStart]);

  const itemsByDay = useMemo(() => {
    const buckets: WeekItem[][] = days.map(() => []);
    const projNameById = new Map(projects.map((p) => [p.id, p.name]));

    for (const m of meetings) {
      for (let i = 0; i < days.length; i++) {
        if (sameLocalDay(m.scheduled_at, days[i])) {
          buckets[i].push({
            kind: "meeting",
            id: m.id,
            at: m.scheduled_at,
            title: m.title,
            project_name: m.project_name,
            project_id: m.project_id,
            mode: m.mode,
            location: m.location,
            link: m.link,
            meeting: m,
          });
          break;
        }
      }
    }

    for (const p of projects) {
      for (const s of p.stages) {
        if (!s.end_at) continue;
        for (let i = 0; i < days.length; i++) {
          if (sameLocalDay(s.end_at, days[i])) {
            buckets[i].push({
              kind: "stage",
              id: s.id,
              at: s.end_at,
              title: s.title,
              project_name: projNameById.get(p.id) ?? p.name,
              project_id: p.id,
              status: normStatus(s.status),
            });
            break;
          }
        }
      }
    }

    for (const b of buckets) b.sort((a, c) => a.at.localeCompare(c.at));
    return buckets;
  }, [days, meetings, projects]);

  const todayIdx = (() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return days.findIndex((d) => d.getTime() === today.getTime());
  })();

  const weekLabel = `${days[0].toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} – ${days[4].toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}`;

  function shiftWeek(delta: number) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + delta * 7);
    setWeekStart(d);
  }

  const totalItems = itemsByDay.reduce((acc, b) => acc + b.length, 0);

  return (
    <div className="space-y-3">
      {/* Week header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5">
          <button onClick={() => shiftWeek(-1)} className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-border bg-white hover:bg-secondary" title="Semana anterior">
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => setWeekStart(startOfWeekMonday(new Date()))} className="h-8 px-3 inline-flex items-center rounded-md border border-border bg-white text-[12px] font-medium hover:bg-secondary">
            Hoje
          </button>
          <button onClick={() => shiftWeek(1)} className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-border bg-white hover:bg-secondary" title="Próxima semana">
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          <span className="ml-2 text-[13px] font-semibold text-ink tabular-nums">{weekLabel}</span>
        </div>
        <span className="text-[11.5px] text-muted-foreground">
          {totalItems} {totalItems === 1 ? "compromisso" : "compromissos"} na semana
        </span>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-secondary/20 p-10 text-center text-[12.5px] text-muted-foreground">
          Nenhum projeto cadastrado ainda. Crie um projeto em <Link to="/app/profissional/projetos" className="text-primary underline">Projetos</Link> para começar a popular sua semana.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {days.map((d, i) => {
            const items = itemsByDay[i];
            const accent = WEEKDAY_ACCENT[i];
            const isToday = i === todayIdx;
            return (
              <div
                key={i}
                className={`rounded-xl bg-white border border-border border-t-4 ${accent.top} flex flex-col min-h-[22rem] shadow-[0_1px_2px_rgba(16,24,40,0.04)] ${isToday ? "ring-2 ring-primary/30" : ""}`}
              >
                <div className={`px-3 py-2.5 rounded-t-lg flex items-center justify-between ${accent.head}`}>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[10.5px] font-bold tracking-wider opacity-70">{WEEKDAY_SHORT[i]}</span>
                    <span className="text-[12.5px] font-semibold tracking-tight truncate">
                      {WEEKDAY_LABELS[i]}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10.5px] font-semibold tabular-nums opacity-70">
                      {d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                    </span>
                    {isToday && <span className="text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary text-white">Hoje</span>}
                  </div>
                </div>

                <div className="flex-1 p-2 space-y-2">
                  {items.length === 0 ? (
                    <div className="h-24 flex items-center justify-center text-[11px] text-muted-foreground italic">
                      Sem compromissos
                    </div>
                  ) : items.map((it) => it.kind === "meeting" ? (
                    <button
                      key={`m-${it.id}`}
                      onClick={() => onEditMeeting(it.meeting)}
                      className="w-full text-left rounded-lg border border-border bg-white p-2.5 hover:border-primary/40 hover:shadow-[0_4px_12px_rgba(16,24,40,0.06)] transition-all group"
                    >
                      <div className="flex items-center gap-1.5 text-[10.5px] font-semibold text-primary tabular-nums mb-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(it.at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        <span className="ml-auto text-[9.5px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary">Reunião</span>
                      </div>
                      <div className="text-[12.5px] font-semibold text-ink leading-tight line-clamp-2">{it.title}</div>
                      <div className="text-[11px] text-muted-foreground truncate mt-0.5">{it.project_name}</div>
                      <div className="flex items-center gap-1.5 text-[10.5px] text-muted-foreground mt-1">
                        {it.mode === "online" ? <Video className="h-3 w-3" /> : it.mode === "telefone" ? <Phone className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                        <span className="truncate">
                          {it.mode === "online" ? (it.link || "Online") : it.mode === "telefone" ? "Telefone" : (it.location || "Presencial")}
                        </span>
                      </div>
                    </button>
                  ) : (
                    <button
                      key={`s-${it.id}`}
                      onClick={() => onOpen(it.project_id)}
                      className="w-full text-left rounded-lg border border-border bg-white p-2.5 hover:border-foreground/30 hover:shadow-[0_4px_12px_rgba(16,24,40,0.06)] transition-all"
                    >
                      <div className="flex items-center gap-1.5 text-[10.5px] font-semibold tabular-nums mb-1">
                        <Flag className="h-3 w-3 text-amber-600" />
                        <span className="text-amber-700">Prazo</span>
                        <span className={`ml-auto text-[9.5px] uppercase tracking-wider px-1.5 py-0.5 rounded ${STATUS_META[it.status].pill}`}>
                          {STATUS_META[it.status].label}
                        </span>
                      </div>
                      <div className="text-[12.5px] font-semibold text-ink leading-tight line-clamp-2">{it.title}</div>
                      <div className="text-[11px] text-muted-foreground truncate mt-0.5">{it.project_name}</div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
