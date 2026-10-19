// Reconstruído em out/2026 (arquivo original perdido na migração da Lovable).
// Anotações do projeto (atas, decisões, observações), opcionalmente ligadas a
// uma etapa e opcionalmente visíveis ao cliente.
import { useCallback, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Eye, EyeOff, Loader2, NotebookPen, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { externalSupabase } from "@/integrations/external-supabase/client";
import {
  deleteProfessionalNote,
  listProfessionalNotes,
  saveProfessionalNote,
} from "@/lib/profissional-project-data.functions";
import { formatShortDate, todayISO } from "@/hooks/use-profissional-data";

type Note = {
  id: string;
  project_id: string;
  stage_id: string | null;
  meeting_id: string | null;
  title: string | null;
  body: string;
  visible_to_client: boolean;
  noted_on: string;
  created_at: string;
};

type Stage = { id: string; title: string; order_index: number };

type Draft = { title: string; body: string; stage_id: string; visible_to_client: boolean; noted_on: string };

const emptyDraft = (): Draft => ({ title: "", body: "", stage_id: "", visible_to_client: false, noted_on: todayISO() });

async function token() {
  const { data } = await externalSupabase.auth.getSession();
  const t = data.session?.access_token;
  if (!t) throw new Error("Sessão expirada. Entre novamente.");
  return t;
}

export function ProjectNotesManager({ projects }: { projects: { id: string; name: string }[] }) {
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [notes, setNotes] = useState<Note[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<{ id: string | null; draft: Draft } | null>(null);
  const [saving, setSaving] = useState(false);
  const listFn = useServerFn(listProfessionalNotes);
  const saveFn = useServerFn(saveProfessionalNote);
  const deleteFn = useServerFn(deleteProfessionalNote);

  useEffect(() => {
    if (!projects.find((p) => p.id === projectId)) setProjectId(projects[0]?.id ?? "");
  }, [projects, projectId]);

  const load = useCallback(async () => {
    if (!projectId) {
      setNotes([]);
      setStages([]);
      return;
    }
    setLoading(true);
    try {
      const r: any = await listFn({ data: { accessToken: await token(), projectId } });
      setNotes((r.notes ?? []) as Note[]);
      setStages((r.stages ?? []) as Stage[]);
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao carregar anotações");
    }
    setLoading(false);
  }, [projectId, listFn]);

  useEffect(() => {
    load();
  }, [load]);

  const stageTitle = useMemo(() => new Map(stages.map((s) => [s.id, s.title])), [stages]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter((n) => `${n.title ?? ""} ${n.body}`.toLowerCase().includes(q));
  }, [notes, query]);

  async function save() {
    if (!editing) return;
    const d = editing.draft;
    if (!d.body.trim()) {
      toast.error("Escreva a anotação");
      return;
    }
    setSaving(true);
    try {
      const note = {
        title: d.title.trim() || null,
        body: d.body.trim(),
        stage_id: d.stage_id || null,
        visible_to_client: d.visible_to_client,
        noted_on: d.noted_on || todayISO(),
      };
      await saveFn({ data: { accessToken: await token(), projectId, note, id: editing.id } });
      toast.success(editing.id ? "Anotação atualizada" : "Anotação salva");
      setEditing(null);
      await load();
    } catch (e: any) {
      toast.error(e?.message ?? "Não foi possível salvar");
    }
    setSaving(false);
  }

  async function remove(n: Note) {
    if (!confirm("Excluir esta anotação?")) return;
    try {
      await deleteFn({ data: { accessToken: await token(), projectId, id: n.id } });
      toast.success("Anotação excluída");
      await load();
    } catch (e: any) {
      toast.error(e?.message ?? "Não foi possível excluir");
    }
  }

  async function toggleVisible(n: Note) {
    try {
      await saveFn({ data: { accessToken: await token(), projectId, note: { visible_to_client: !n.visible_to_client }, id: n.id } });
      await load();
    } catch (e: any) {
      toast.error(e?.message ?? "Não foi possível atualizar");
    }
  }

  if (projects.length === 0) {
    return <p className="text-[13px] text-muted-foreground py-4">Crie um projeto para este cliente antes de registrar anotações.</p>;
  }

  const set = (k: keyof Draft, v: string | boolean) => setEditing((e) => (e ? { ...e, draft: { ...e.draft, [k]: v } } : e));

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
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar nas anotações…"
            className="w-full h-9 pl-8 pr-3 text-[13px] border border-border rounded-md bg-white"
          />
        </div>
        <button
          onClick={() => setEditing({ id: null, draft: emptyDraft() })}
          className="ml-auto inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-ink text-white text-[12.5px] font-medium"
        >
          <Plus className="h-3.5 w-3.5" /> Nova anotação
        </button>
      </div>

      {editing && (
        <div className="rounded-lg border border-border bg-secondary/40 p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-ink">{editing.id ? "Editar anotação" : "Nova anotação"}</span>
            <button onClick={() => setEditing(null)} className="p-1 text-muted-foreground hover:text-ink" aria-label="Fechar">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid sm:grid-cols-[1fr_auto_auto] gap-2">
            <input
              value={editing.draft.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Título (opcional)"
              className="h-9 px-2.5 text-[13px] border border-border rounded-md bg-white"
            />
            <select
              value={editing.draft.stage_id}
              onChange={(e) => set("stage_id", e.target.value)}
              className="h-9 px-2 text-[13px] border border-border rounded-md bg-white"
            >
              <option value="">Sem etapa</option>
              {stages.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
            </select>
            <input
              type="date"
              value={editing.draft.noted_on}
              onChange={(e) => set("noted_on", e.target.value)}
              className="h-9 px-2 text-[13px] border border-border rounded-md bg-white"
            />
          </div>
          <textarea
            value={editing.draft.body}
            onChange={(e) => set("body", e.target.value)}
            rows={5}
            placeholder="O que foi decidido, combinado ou observado…"
            className="w-full px-2.5 py-2 text-[13px] border border-border rounded-md bg-white resize-y"
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-[12.5px] text-ink">
              <input
                type="checkbox"
                checked={editing.draft.visible_to_client}
                onChange={(e) => set("visible_to_client", e.target.checked)}
              />
              Visível para o cliente
            </label>
            <button onClick={save} disabled={saving} className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-md bg-primary text-primary-foreground text-[12.5px] font-semibold disabled:opacity-50">
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Salvar
            </button>
          </div>
        </div>
      )}

      {loading && notes.length === 0 ? (
        <div className="flex items-center gap-2 text-[12.5px] text-muted-foreground py-4">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Carregando anotações…
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <NotebookPen className="h-6 w-6 mx-auto mb-2 opacity-60" />
          <p className="text-[13px]">{notes.length === 0 ? "Nenhuma anotação ainda." : "Nada encontrado."}</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((n) => (
            <li key={n.id} className="rounded-lg border border-border bg-white p-3">
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  {n.title && <div className="text-[13.5px] font-semibold text-ink">{n.title}</div>}
                  <div className="text-[11.5px] text-muted-foreground flex flex-wrap gap-x-2">
                    <span>{formatShortDate(n.noted_on)}</span>
                    {n.stage_id && stageTitle.get(n.stage_id) && <span>· {stageTitle.get(n.stage_id)}</span>}
                    {n.visible_to_client && <span className="text-primary">· visível ao cliente</span>}
                  </div>
                </div>
                <button
                  onClick={() => toggleVisible(n)}
                  className="p-1 text-muted-foreground hover:text-ink"
                  title={n.visible_to_client ? "Ocultar do cliente" : "Mostrar ao cliente"}
                >
                  {n.visible_to_client ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                </button>
                <button
                  onClick={() =>
                    setEditing({
                      id: n.id,
                      draft: {
                        title: n.title ?? "",
                        body: n.body,
                        stage_id: n.stage_id ?? "",
                        visible_to_client: n.visible_to_client,
                        noted_on: (n.noted_on ?? "").slice(0, 10) || todayISO(),
                      },
                    })
                  }
                  className="p-1 text-muted-foreground hover:text-ink"
                  aria-label="Editar"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => remove(n)} className="p-1 text-muted-foreground hover:text-red-600" aria-label="Excluir">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="mt-1.5 text-[13px] text-ink whitespace-pre-line">{n.body}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
