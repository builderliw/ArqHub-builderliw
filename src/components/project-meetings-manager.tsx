// Reconstruído em out/2026 (arquivo original perdido na migração da Lovable).
// Agenda de reuniões do(s) projeto(s) de um cliente.
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  CalendarClock, Check, Clock, Loader2, MapPin, Pencil, Phone, Plus, Trash2, Video, X,
} from "lucide-react";
import { toast } from "sonner";
import { externalSupabase } from "@/integrations/external-supabase/client";
import {
  deleteProfessionalMeeting,
  listProfessionalMeetings,
  saveProfessionalMeeting,
} from "@/lib/profissional-project-data.functions";

type Meeting = {
  id: string;
  project_id: string;
  title: string;
  scheduled_at: string;
  duration_min: number;
  location: string | null;
  mode: "presencial" | "online" | "telefone" | string;
  link: string | null;
  notes: string | null;
  status: "agendada" | "realizada" | "cancelada" | "remarcada" | string;
  client_status?: "pending" | "accepted" | "declined" | null;
  client_note?: string | null;
};

type Draft = {
  title: string;
  date: string;
  time: string;
  duration_min: string;
  mode: string;
  location: string;
  link: string;
  notes: string;
  status: string;
};

const MODES = [
  { value: "presencial", label: "Presencial", Icon: MapPin },
  { value: "online", label: "Online", Icon: Video },
  { value: "telefone", label: "Telefone", Icon: Phone },
];

const STATUS = [
  { value: "agendada", label: "Agendada", cls: "bg-primary/10 text-primary" },
  { value: "realizada", label: "Realizada", cls: "bg-emerald-50 text-emerald-700" },
  { value: "remarcada", label: "Remarcada", cls: "bg-amber-50 text-amber-800" },
  { value: "cancelada", label: "Cancelada", cls: "bg-secondary text-muted-foreground line-through" },
];

const CLIENT_STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: "Aguardando cliente", cls: "text-muted-foreground" },
  accepted: { label: "Cliente confirmou", cls: "text-emerald-700" },
  declined: { label: "Cliente recusou", cls: "text-red-600" },
};

const pad = (n: number) => String(n).padStart(2, "0");

function toDraft(m?: Meeting): Draft {
  const d = m ? new Date(m.scheduled_at) : new Date(Date.now() + 24 * 3600 * 1000);
  return {
    title: m?.title ?? "",
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: m ? `${pad(d.getHours())}:${pad(d.getMinutes())}` : "10:00",
    duration_min: String(m?.duration_min ?? 60),
    mode: m?.mode ?? "presencial",
    location: m?.location ?? "",
    link: m?.link ?? "",
    notes: m?.notes ?? "",
    status: m?.status ?? "agendada",
  };
}

function fmtWhen(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

async function token() {
  const { data } = await externalSupabase.auth.getSession();
  const t = data.session?.access_token;
  if (!t) throw new Error("Sessão expirada. Entre novamente.");
  return t;
}

export function ProjectMeetingsManager({
  projects,
  clientId,
}: {
  projects: { id: string; name: string }[];
  clientId: string;
}) {
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<{ id: string | null; draft: Draft } | null>(null);
  const [saving, setSaving] = useState(false);
  const listFn = useServerFn(listProfessionalMeetings);
  const saveFn = useServerFn(saveProfessionalMeeting);
  const deleteFn = useServerFn(deleteProfessionalMeeting);

  useEffect(() => {
    if (!projects.find((p) => p.id === projectId)) setProjectId(projects[0]?.id ?? "");
  }, [projects, projectId]);

  const load = useCallback(async () => {
    if (!projectId) {
      setMeetings([]);
      return;
    }
    setLoading(true);
    try {
      const r: any = await listFn({ data: { accessToken: await token(), projectId } });
      setMeetings((r.meetings ?? []) as Meeting[]);
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao carregar reuniões");
    }
    setLoading(false);
  }, [projectId, listFn]);

  useEffect(() => {
    load();
  }, [load]);

  async function save() {
    if (!editing) return;
    const d = editing.draft;
    if (!d.title.trim() || !d.date || !d.time) {
      toast.error("Preencha título, data e horário");
      return;
    }
    const scheduled = new Date(`${d.date}T${d.time}:00`);
    if (Number.isNaN(scheduled.getTime())) {
      toast.error("Data ou horário inválido");
      return;
    }
    setSaving(true);
    try {
      const meeting: Record<string, unknown> = {
        title: d.title.trim(),
        scheduled_at: scheduled.toISOString(),
        duration_min: Math.max(5, Math.round(Number(d.duration_min) || 60)),
        mode: d.mode,
        location: d.mode === "presencial" ? d.location.trim() || null : null,
        link: d.mode === "online" ? d.link.trim() || null : null,
        notes: d.notes.trim() || null,
        status: d.status,
      };
      if (clientId) meeting.client_id = clientId;
      await saveFn({ data: { accessToken: await token(), projectId, meeting, id: editing.id } });
      toast.success(editing.id ? "Reunião atualizada" : "Reunião agendada");
      setEditing(null);
      await load();
    } catch (e: any) {
      toast.error(e?.message ?? "Não foi possível salvar");
    }
    setSaving(false);
  }

  async function remove(m: Meeting) {
    if (!confirm(`Excluir a reunião “${m.title}”?`)) return;
    try {
      await deleteFn({ data: { accessToken: await token(), projectId, id: m.id } });
      toast.success("Reunião excluída");
      await load();
    } catch (e: any) {
      toast.error(e?.message ?? "Não foi possível excluir");
    }
  }

  async function quickStatus(m: Meeting, status: string) {
    try {
      await saveFn({ data: { accessToken: await token(), projectId, meeting: { status }, id: m.id } });
      await load();
    } catch (e: any) {
      toast.error(e?.message ?? "Não foi possível atualizar");
    }
  }

  if (projects.length === 0) {
    return <p className="text-[13px] text-muted-foreground py-4">Crie um projeto para este cliente antes de agendar reuniões.</p>;
  }

  const now = Date.now();
  const upcoming = meetings
    .filter((m) => new Date(m.scheduled_at).getTime() >= now && m.status !== "cancelada")
    .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));
  const past = meetings.filter((m) => !upcoming.includes(m));
  const set = (k: keyof Draft, v: string) => setEditing((e) => (e ? { ...e, draft: { ...e.draft, [k]: v } } : e));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {projects.length > 1 && (
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="h-9 max-w-[260px] px-2 text-[13px] border border-border rounded-md bg-white"
          >
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        )}
        <button
          onClick={() => setEditing({ id: null, draft: toDraft() })}
          className="ml-auto inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-ink text-white text-[12.5px] font-medium"
        >
          <Plus className="h-3.5 w-3.5" /> Agendar reunião
        </button>
      </div>

      {editing && (
        <div className="rounded-lg border border-border bg-secondary/40 p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-ink">{editing.id ? "Editar reunião" : "Nova reunião"}</span>
            <button onClick={() => setEditing(null)} className="p-1 text-muted-foreground hover:text-ink" aria-label="Fechar">
              <X className="h-4 w-4" />
            </button>
          </div>
          <input
            value={editing.draft.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Assunto (ex.: Apresentação do estudo preliminar)"
            className="w-full h-9 px-2.5 text-[13px] border border-border rounded-md bg-white"
          />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <input type="date" value={editing.draft.date} onChange={(e) => set("date", e.target.value)} className="h-9 px-2 text-[13px] border border-border rounded-md bg-white" />
            <input type="time" value={editing.draft.time} onChange={(e) => set("time", e.target.value)} className="h-9 px-2 text-[13px] border border-border rounded-md bg-white" />
            <select value={editing.draft.duration_min} onChange={(e) => set("duration_min", e.target.value)} className="h-9 px-2 text-[13px] border border-border rounded-md bg-white">
              {[15, 30, 45, 60, 90, 120, 180].map((n) => <option key={n} value={n}>{n} min</option>)}
            </select>
            <select value={editing.draft.status} onChange={(e) => set("status", e.target.value)} className="h-9 px-2 text-[13px] border border-border rounded-md bg-white">
              {STATUS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div className="flex gap-1.5">
            {MODES.map(({ value, label, Icon }) => (
              <button
                key={value}
                onClick={() => set("mode", value)}
                className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-md border text-[12.5px] ${
                  editing.draft.mode === value ? "border-primary bg-primary/10 text-primary" : "border-border bg-white text-muted-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" /> {label}
              </button>
            ))}
          </div>
          {editing.draft.mode === "presencial" && (
            <input value={editing.draft.location} onChange={(e) => set("location", e.target.value)} placeholder="Endereço / local" className="w-full h-9 px-2.5 text-[13px] border border-border rounded-md bg-white" />
          )}
          {editing.draft.mode === "online" && (
            <input value={editing.draft.link} onChange={(e) => set("link", e.target.value)} placeholder="Link da chamada (Meet, Zoom…)" className="w-full h-9 px-2.5 text-[13px] border border-border rounded-md bg-white" />
          )}
          <textarea value={editing.draft.notes} onChange={(e) => set("notes", e.target.value)} rows={2} placeholder="Pauta / observações" className="w-full px-2.5 py-2 text-[13px] border border-border rounded-md bg-white resize-y" />
          <div className="flex justify-end">
            <button onClick={save} disabled={saving} className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-md bg-primary text-primary-foreground text-[12.5px] font-semibold disabled:opacity-50">
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Salvar
            </button>
          </div>
        </div>
      )}

      {loading && meetings.length === 0 ? (
        <div className="flex items-center gap-2 text-[12.5px] text-muted-foreground py-4">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Carregando reuniões…
        </div>
      ) : meetings.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <CalendarClock className="h-6 w-6 mx-auto mb-2 opacity-60" />
          <p className="text-[13px]">Nenhuma reunião agendada.</p>
        </div>
      ) : (
        <>
          <MeetingList title="Próximas" items={upcoming} onEdit={(m) => setEditing({ id: m.id, draft: toDraft(m) })} onDelete={remove} onStatus={quickStatus} />
          <MeetingList title="Anteriores" items={past} onEdit={(m) => setEditing({ id: m.id, draft: toDraft(m) })} onDelete={remove} onStatus={quickStatus} muted />
        </>
      )}
    </div>
  );
}

function MeetingList({
  title, items, onEdit, onDelete, onStatus, muted,
}: {
  title: string;
  items: Meeting[];
  onEdit: (m: Meeting) => void;
  onDelete: (m: Meeting) => void;
  onStatus: (m: Meeting, status: string) => void;
  muted?: boolean;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">{title}</div>
      <ul className={`divide-y divide-border rounded-lg border border-border bg-white ${muted ? "opacity-80" : ""}`}>
        {items.map((m) => {
          const st = STATUS.find((s) => s.value === m.status) ?? STATUS[0];
          const mode = MODES.find((x) => x.value === m.mode) ?? MODES[0];
          const cs = m.client_status ? CLIENT_STATUS[m.client_status] : null;
          return (
            <li key={m.id} className="px-3 py-2.5 flex items-start gap-3">
              <mode.Icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[13.5px] font-medium text-ink truncate">{m.title}</span>
                  <span className={`text-[10.5px] px-1.5 py-0.5 rounded-full font-medium ${st.cls}`}>{st.label}</span>
                </div>
                <div className="text-[12px] text-muted-foreground flex flex-wrap gap-x-2">
                  <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {fmtWhen(m.scheduled_at)} · {m.duration_min} min</span>
                  {m.location && <span>· {m.location}</span>}
                  {m.link && (
                    <a href={m.link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">· abrir link</a>
                  )}
                </div>
                {cs && (
                  <div className={`text-[11.5px] mt-0.5 ${cs.cls}`}>
                    {cs.label}{m.client_note ? ` — “${m.client_note}”` : ""}
                  </div>
                )}
                {m.notes && <p className="text-[12px] text-muted-foreground mt-1 whitespace-pre-line line-clamp-3">{m.notes}</p>}
              </div>
              <div className="flex items-center shrink-0">
                {m.status === "agendada" && (
                  <button onClick={() => onStatus(m, "realizada")} className="p-1 text-muted-foreground hover:text-emerald-700" title="Marcar como realizada">
                    <Check className="h-3.5 w-3.5" />
                  </button>
                )}
                <button onClick={() => onEdit(m)} className="p-1 text-muted-foreground hover:text-ink" aria-label="Editar">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => onDelete(m)} className="p-1 text-muted-foreground hover:text-red-600" aria-label="Excluir">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
