// Reconstruído em out/2026 (arquivo original perdido na migração da Lovable).
// Gerencia as etapas de um projeto: criar, editar status/progresso/prazos,
// ordenar, excluir, ver aprovações do cliente e anexar documentos por etapa.
import { useRef, useState } from "react";
import {
  ArrowDown, ArrowUp, Check, ChevronDown, ChevronRight, Eye, EyeOff, FileText,
  Loader2, MessageCircle, Paperclip, Plus, Trash2, X,
} from "lucide-react";
import { toast } from "sonner";
import {
  createStage,
  deleteDocument,
  deleteStage,
  getDocumentSignedUrl,
  toggleDocumentVisibility,
  updateStage,
  uploadStageDocument,
  useProjectStagesAdmin,
  type AdminApproval,
  type AdminStage,
} from "@/hooks/use-project-stages-admin";
import { formatShortDate } from "@/hooks/use-profissional-data";

export const STAGE_STATUS: { value: string; label: string; cls: string }[] = [
  { value: "todo", label: "Não iniciada", cls: "bg-secondary text-muted-foreground" },
  { value: "in_progress", label: "Em andamento", cls: "bg-amber-50 text-amber-800" },
  { value: "review", label: "Aguardando cliente", cls: "bg-orange-50 text-orange-800" },
  { value: "done", label: "Concluída", cls: "bg-emerald-50 text-emerald-800" },
];

function statusMeta(s: string) {
  const v = s === "completed" ? "done" : s;
  return STAGE_STATUS.find((x) => x.value === v) ?? STAGE_STATUS[0];
}

const APPROVAL_META: Record<AdminApproval["status"], { label: string; cls: string; Icon: typeof Check }> = {
  approved: { label: "Aprovada", cls: "text-emerald-700 bg-emerald-50", Icon: Check },
  changes_requested: { label: "Ajustes pedidos", cls: "text-amber-700 bg-amber-50", Icon: MessageCircle },
  rejected: { label: "Rejeitada", cls: "text-red-700 bg-red-50", Icon: X },
};

const dateInput = (iso: string | null) => (iso ? iso.slice(0, 10) : "");

export function ProjectStagesManager({ projectId }: { projectId: string }) {
  const { loading, error, stages, approvals, documents, refresh } = useProjectStagesAdmin(projectId);
  const [newTitle, setNewTitle] = useState("");
  const [newEnd, setNewEnd] = useState("");
  const [adding, setAdding] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  async function run(fn: () => Promise<unknown>, ok?: string) {
    try {
      await fn();
      if (ok) toast.success(ok);
      await refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "Não foi possível salvar");
    }
  }

  async function handleAdd() {
    const title = newTitle.trim();
    if (!title) return;
    setAdding(true);
    const nextOrder = stages.reduce((m, s) => Math.max(m, s.order_index ?? 0), -1) + 1;
    await run(
      () => createStage({ project_id: projectId, title, order_index: nextOrder, end_at: newEnd || null }),
      "Etapa criada",
    );
    setNewTitle("");
    setNewEnd("");
    setAdding(false);
  }

  async function move(stage: AdminStage, dir: -1 | 1) {
    const i = stages.findIndex((s) => s.id === stage.id);
    const other = stages[i + dir];
    if (!other) return;
    await run(async () => {
      await updateStage(stage.id, { order_index: other.order_index });
      await updateStage(other.id, { order_index: stage.order_index });
    });
  }

  if (loading && stages.length === 0) {
    return (
      <div className="flex items-center gap-2 text-[12.5px] text-muted-foreground py-6">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Carregando etapas…
      </div>
    );
  }

  const done = stages.filter((s) => statusMeta(s.status).value === "done").length;

  return (
    <div className="space-y-4">
      {error && <p className="text-[12.5px] text-red-600">{error}</p>}

      {stages.length > 0 && (
        <div className="flex items-center gap-3">
          <div className="h-1.5 flex-1 rounded-full bg-secondary overflow-hidden">
            <div className="h-full bg-primary" style={{ width: `${Math.round((done / stages.length) * 100)}%` }} />
          </div>
          <span className="text-[12px] text-muted-foreground tabular-nums">
            {done}/{stages.length} concluídas
          </span>
        </div>
      )}

      {stages.length === 0 ? (
        <p className="text-[13px] text-muted-foreground">Nenhuma etapa ainda. Crie a primeira abaixo.</p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border bg-white">
          {stages.map((s, i) => (
            <StageRow
              key={s.id}
              stage={s}
              index={i}
              total={stages.length}
              allStages={stages}
              approvals={approvals[s.id] ?? []}
              docs={documents[s.id] ?? []}
              open={openId === s.id}
              onToggle={() => setOpenId(openId === s.id ? null : s.id)}
              onMove={(d) => move(s, d)}
              run={run}
              projectId={projectId}
            />
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-border p-3">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Nova etapa (ex.: Estudo preliminar)"
          className="flex-1 min-w-[200px] h-9 px-3 text-[13px] border border-border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <label className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
          Prazo
          <input
            type="date"
            value={newEnd}
            onChange={(e) => setNewEnd(e.target.value)}
            className="h-9 px-2 text-[13px] border border-border rounded-md bg-white"
          />
        </label>
        <button
          onClick={handleAdd}
          disabled={adding || !newTitle.trim()}
          className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md bg-ink text-white text-[13px] font-medium disabled:opacity-50"
        >
          {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} Adicionar
        </button>
      </div>
    </div>
  );
}

function StageRow({
  stage: s, index, total, allStages, approvals, docs, open, onToggle, onMove, run, projectId,
}: {
  stage: AdminStage;
  index: number;
  total: number;
  allStages: AdminStage[];
  approvals: AdminApproval[];
  docs: { id: string; name: string; storage_path: string; visible_to_client: boolean; created_at: string }[];
  open: boolean;
  onToggle: () => void;
  onMove: (dir: -1 | 1) => void;
  run: (fn: () => Promise<unknown>, ok?: string) => Promise<void>;
  projectId: string;
}) {
  const meta = statusMeta(s.status);
  const latest = approvals[0];
  const [title, setTitle] = useState(s.title);
  const [description, setDescription] = useState(s.description ?? "");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const save = (patch: Partial<AdminStage>, ok?: string) => run(() => updateStage(s.id, patch), ok);

  function changeStatus(value: string) {
    const patch: Partial<AdminStage> = { status: value };
    if (value === "done") patch.progress = 100;
    if (value === "todo" && (s.progress ?? 0) === 100) patch.progress = 0;
    save(patch);
  }

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      await run(() => uploadStageDocument({ project_id: projectId, stage_id: s.id, file }), `${file.name} enviado`);
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function openDoc(path: string) {
    try {
      window.open(await getDocumentSignedUrl(path), "_blank", "noopener");
    } catch (e: any) {
      toast.error(e?.message ?? "Não foi possível abrir o arquivo");
    }
  }

  return (
    <li className="px-3 py-2.5">
      <div className="flex items-center gap-2">
        <button onClick={onToggle} className="text-muted-foreground hover:text-ink" aria-label="Detalhes">
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
        <div className="min-w-0 flex-1">
          <div className="text-[13.5px] font-medium text-ink truncate">{s.title}</div>
          <div className="text-[11.5px] text-muted-foreground flex flex-wrap gap-x-2">
            {s.end_at && <span>prazo {formatShortDate(s.end_at)}</span>}
            {docs.length > 0 && <span>· {docs.length} arquivo(s)</span>}
            {latest && (
              <span className={`px-1.5 rounded ${APPROVAL_META[latest.status].cls}`}>
                {APPROVAL_META[latest.status].label}
              </span>
            )}
          </div>
        </div>
        <select
          value={meta.value}
          onChange={(e) => changeStatus(e.target.value)}
          className={`h-7 rounded-md px-2 text-[12px] font-medium border-0 ${meta.cls}`}
          aria-label="Status da etapa"
        >
          {STAGE_STATUS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <div className="flex items-center">
          <button onClick={() => onMove(-1)} disabled={index === 0} className="p-1 text-muted-foreground hover:text-ink disabled:opacity-30" aria-label="Subir">
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => onMove(1)} disabled={index === total - 1} className="p-1 text-muted-foreground hover:text-ink disabled:opacity-30" aria-label="Descer">
            <ArrowDown className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {open && (
        <div className="mt-3 ml-6 grid gap-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="grid gap-1 text-[12px] text-muted-foreground">
              Título
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => title.trim() && title !== s.title && save({ title: title.trim() })}
                className="h-9 px-2.5 text-[13px] text-ink border border-border rounded-md bg-white"
              />
            </label>
            <label className="grid gap-1 text-[12px] text-muted-foreground">
              Depende de
              <select
                value={s.depends_on ?? ""}
                onChange={(e) => save({ depends_on: e.target.value || null })}
                className="h-9 px-2 text-[13px] text-ink border border-border rounded-md bg-white"
              >
                <option value="">— nenhuma —</option>
                {allStages.filter((o) => o.id !== s.id).map((o) => (
                  <option key={o.id} value={o.id}>{o.title}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-[12px] text-muted-foreground">
              Início
              <input
                type="date"
                defaultValue={dateInput(s.start_at)}
                onChange={(e) => save({ start_at: e.target.value || null })}
                className="h-9 px-2 text-[13px] text-ink border border-border rounded-md bg-white"
              />
            </label>
            <label className="grid gap-1 text-[12px] text-muted-foreground">
              Prazo
              <input
                type="date"
                defaultValue={dateInput(s.end_at)}
                onChange={(e) => save({ end_at: e.target.value || null })}
                className="h-9 px-2 text-[13px] text-ink border border-border rounded-md bg-white"
              />
            </label>
          </div>

          <label className="grid gap-1 text-[12px] text-muted-foreground">
            Progresso: <span className="text-ink font-medium tabular-nums">{s.progress ?? 0}%</span>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              defaultValue={s.progress ?? 0}
              onMouseUp={(e) => save({ progress: Number((e.target as HTMLInputElement).value) })}
              onTouchEnd={(e) => save({ progress: Number((e.target as HTMLInputElement).value) })}
              onKeyUp={(e) => save({ progress: Number((e.target as HTMLInputElement).value) })}
              className="accent-[var(--color-primary)]"
            />
          </label>

          <label className="grid gap-1 text-[12px] text-muted-foreground">
            Descrição (visível ao cliente)
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => description !== (s.description ?? "") && save({ description: description || null })}
              rows={2}
              className="px-2.5 py-2 text-[13px] text-ink border border-border rounded-md bg-white resize-y"
            />
          </label>

          {approvals.length > 0 && (
            <div>
              <div className="text-[12px] font-medium text-ink mb-1">Respostas do cliente</div>
              <ul className="space-y-1">
                {approvals.map((a) => {
                  const m = APPROVAL_META[a.status];
                  return (
                    <li key={a.id} className="text-[12px] flex items-start gap-2">
                      <span className={`inline-flex items-center gap-1 px-1.5 rounded ${m.cls}`}>
                        <m.Icon className="h-3 w-3" /> {m.label}
                      </span>
                      <span className="text-muted-foreground">
                        {a.client_name} · {formatShortDate(a.created_at)}
                        {a.note ? ` — “${a.note}”` : ""}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[12px] font-medium text-ink">Arquivos da etapa</span>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-1 text-[12px] text-primary hover:underline disabled:opacity-50"
              >
                {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Paperclip className="h-3 w-3" />} Anexar
              </button>
              <input ref={fileRef} type="file" multiple hidden onChange={(e) => onFiles(e.target.files)} />
            </div>
            {docs.length === 0 ? (
              <p className="text-[12px] text-muted-foreground">Nenhum arquivo.</p>
            ) : (
              <ul className="space-y-1">
                {docs.map((d) => (
                  <li key={d.id} className="flex items-center gap-2 text-[12.5px]">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <button onClick={() => openDoc(d.storage_path)} className="truncate text-ink hover:underline text-left">
                      {d.name}
                    </button>
                    <button
                      onClick={() => run(() => toggleDocumentVisibility(d.id, !d.visible_to_client))}
                      className="ml-auto p-1 text-muted-foreground hover:text-ink"
                      title={d.visible_to_client ? "Visível ao cliente" : "Oculto do cliente"}
                    >
                      {d.visible_to_client ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      onClick={() => confirm(`Excluir ${d.name}?`) && run(() => deleteDocument(d), "Arquivo excluído")}
                      className="p-1 text-muted-foreground hover:text-red-600"
                      aria-label="Excluir arquivo"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => confirm(`Excluir a etapa “${s.title}”?`) && run(() => deleteStage(s.id), "Etapa excluída")}
              className="inline-flex items-center gap-1 text-[12px] text-red-600 hover:underline"
            >
              <Trash2 className="h-3 w-3" /> Excluir etapa
            </button>
          </div>
        </div>
      )}
    </li>
  );
}
