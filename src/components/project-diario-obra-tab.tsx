import { useCallback, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Trash2, CloudSun, Camera, X, Loader2, Pencil } from "lucide-react";
import { externalSupabase } from "@/integrations/external-supabase/client";
import { deleteProfessionalDiaryEntry, listProfessionalDiaryEntries, saveProfessionalDiaryEntry } from "@/lib/profissional-project-data.functions";
import { toast } from "sonner";

type Projeto = { id: string; name: string };

type Atividade = { id: string; descricao: string; status: "pendente" | "andamento" | "concluida" };

type Entry = {
  id: string;
  date: string; // yyyy-mm-dd
  weather: string;
  photos: string[]; // dataURLs
  atividades: Atividade[];
  observacao: string;
};

const STATUS_LABEL: Record<Atividade["status"], string> = {
  pendente: "Pendente",
  andamento: "Em andamento",
  concluida: "Concluída",
};

const WEEKDAYS = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

function formatDateBr(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const dt = new Date(y, m - 1, d);
  return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y} · ${WEEKDAYS[dt.getDay()]}`;
}

function legacyStorageKey(projectId: string) {
  return `arqhub.diario_obra.${projectId}`;
}

async function dataUrlToFile(dataUrl: string, index: number) {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], `diario-${Date.now()}-${index}.jpg`, { type: blob.type || "image/jpeg" });
}

export function ProjectDiarioObraTab({ projects }: { projects: Projeto[] }) {
  const [projectId, setProjectId] = useState<string>(projects[0]?.id ?? "");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editEntry, setEditEntry] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(false);
  const listEntries = useServerFn(listProfessionalDiaryEntries);
  const saveEntry = useServerFn(saveProfessionalDiaryEntry);
  const deleteEntry = useServerFn(deleteProfessionalDiaryEntry);

  useEffect(() => {
    if (!projectId && projects[0]) setProjectId(projects[0].id);
  }, [projects, projectId]);

  const load = useCallback(async () => {
    if (!projectId) { setEntries([]); return; }
    setLoading(true);
    try {
      const { data: sess } = await externalSupabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) throw new Error("Sessão expirada");
      const r = await listEntries({ data: { accessToken: token, projectId } });
      const serverEntries = (r.entries ?? []) as Entry[];
      setEntries(serverEntries);
      if (serverEntries.length === 0) {
        const raw = localStorage.getItem(legacyStorageKey(projectId));
        const legacy = raw ? (JSON.parse(raw) as Entry[]) : [];
        if (legacy.length > 0) {
          for (const item of legacy) {
            const files = await Promise.all((item.photos ?? []).map((src, i) => dataUrlToFile(src, i)));
            await saveDiaryEntry({ ...item, id: crypto.randomUUID(), photos: [] }, files);
          }
          localStorage.removeItem(legacyStorageKey(projectId));
          return;
        }
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao carregar diário");
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [projectId, listEntries]);

  useEffect(() => { load(); }, [load]);

  async function removeEntry(id: string) {
    if (!confirm("Excluir este registro do diário?")) return;
    try {
      const { data: sess } = await externalSupabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) throw new Error("Sessão expirada");
      await deleteEntry({ data: { accessToken: token, projectId, id } });
      await load();
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao excluir registro");
    }
  }

  async function saveDiaryEntry(entry: Entry, files: File[]) {
    const { data: sess } = await externalSupabase.auth.getSession();
    const token = sess.session?.access_token;
    if (!token) throw new Error("Sessão expirada");
    const photoPaths: string[] = [];
    for (const file of files) {
      const safe = file.name.replace(/[^\w.\-]/g, "_");
      const path = `${projectId}/diario/${entry.id}/${Date.now()}_${safe}`;
      const up = await externalSupabase.storage.from("project-photos").upload(path, file, { contentType: file.type });
      if (up.error) throw up.error;
      photoPaths.push(path);
    }
    try {
      await saveEntry({ data: { accessToken: token, projectId, entry: { ...entry, photoPaths } } });
      toast.success(editEntry ? "Registro atualizado" : "Registro salvo no painel do cliente");
      setShowForm(false);
      setEditEntry(null);
      await load();
    } catch (e) {
      if (photoPaths.length > 0) await externalSupabase.storage.from("project-photos").remove(photoPaths);
      throw e;
    }
  }

  if (projects.length === 0) {
    return <div className="text-sm text-muted-foreground">Cadastre um projeto para usar o diário de obra.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className="h-9 px-3 text-[13px] border border-border rounded-md bg-white"
        >
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <button
          onClick={() => { setEditEntry(null); setShowForm(true); }}
          className="inline-flex items-center gap-1.5 px-3 h-9 bg-ink text-white rounded-md text-[13px] font-medium hover:bg-black"
        >
          <Plus className="h-3.5 w-3.5" /> Novo registro
        </button>
      </div>

      {loading ? (
        <div className="text-[12.5px] text-muted-foreground inline-flex items-center gap-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Carregando diário…
        </div>
      ) : entries.length === 0 ? (
        <div className="text-sm text-muted-foreground border border-dashed border-border rounded-lg p-6 text-center">
          Nenhum registro de diário ainda.
        </div>
      ) : (
        <ul className="space-y-3">
          {entries
            .slice()
            .sort((a, b) => b.date.localeCompare(a.date))
            .map((e) => (
              <li key={e.id} className="border border-border rounded-lg p-4 bg-white">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[13px] font-semibold text-ink">{formatDateBr(e.date)}</div>
                    {e.weather && (
                      <div className="mt-1 inline-flex items-center gap-1 text-[12px] text-muted-foreground">
                        <CloudSun className="h-3.5 w-3.5" /> {e.weather}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { setEditEntry(e); setShowForm(true); }}
                      className="p-1.5 text-muted-foreground hover:text-ink rounded-md hover:bg-secondary"
                      title="Editar"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => removeEntry(e.id)}
                      className="p-1.5 text-muted-foreground hover:text-red-600 rounded-md hover:bg-secondary"
                      title="Excluir"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {e.photos.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {e.photos.map((src, i) => (
                      <img key={i} src={src} alt={`Foto ${i + 1}`} className="h-20 w-full object-cover rounded-md border border-border" />
                    ))}
                  </div>
                )}

                {e.atividades.length > 0 && (
                  <div className="mt-3 space-y-1">
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Atividades</div>
                    <ul className="text-[13px] text-ink space-y-1">
                      {e.atividades.map((a) => (
                        <li key={a.id} className="flex items-center justify-between gap-3">
                          <span>{a.descricao}</span>
                          <span className={`text-[11px] px-2 py-0.5 rounded-full ${
                            a.status === "concluida" ? "bg-green-100 text-green-700"
                              : a.status === "andamento" ? "bg-amber-100 text-amber-700"
                              : "bg-secondary text-muted-foreground"
                          }`}>{STATUS_LABEL[a.status]}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {e.observacao && (
                  <div className="mt-3">
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Observação</div>
                    <p className="text-[13px] text-ink whitespace-pre-wrap">{e.observacao}</p>
                  </div>
                )}
              </li>
            ))}
        </ul>
      )}

      {showForm && projectId && (
        <DiarioForm
          initial={editEntry}
          onClose={() => { setShowForm(false); setEditEntry(null); }}
          onSave={saveDiaryEntry}
        />
      )}
    </div>
  );
}

function DiarioForm({ onClose, onSave, initial }: { onClose: () => void; onSave: (e: Entry, files: File[]) => Promise<void>; initial?: Entry | null }) {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const isEdit = !!initial;
  const [date, setDate] = useState(initial?.date ?? today);
  const [weather, setWeather] = useState(initial?.weather ?? "");
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [atividades, setAtividades] = useState<Atividade[]>(initial?.atividades ?? []);
  const [novaAtividade, setNovaAtividade] = useState("");
  const [observacao, setObservacao] = useState(initial?.observacao ?? "");
  const [saving, setSaving] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files) return;
    const arr = Array.from(files).filter((f) => f.type.startsWith("image/")).slice(0, 10);
    const reads = await Promise.all(arr.map((f) => new Promise<string>((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(String(r.result));
      r.onerror = rej;
      r.readAsDataURL(f);
    })));
    setPhotos((p) => [...p, ...reads].slice(0, 20));
    setPhotoFiles((p) => [...p, ...arr].slice(0, 20));
  }

  function addAtividade() {
    if (!novaAtividade.trim()) return;
    setAtividades((a) => [...a, { id: crypto.randomUUID(), descricao: novaAtividade.trim(), status: "pendente" }]);
    setNovaAtividade("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        id: initial?.id ?? crypto.randomUUID(),
        date, weather, photos: [], atividades, observacao,
      }, photoFiles);
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao salvar registro");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full sm:max-w-xl sm:rounded-xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <h3 className="text-[14px] font-semibold text-ink">{isEdit ? "Editar registro de diário" : "Novo registro de diário"}</h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded-md hover:bg-secondary"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Data</label>
              <input required type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="mt-1 w-full h-10 px-3 text-[13px] border border-border rounded-md" />
              {date && <div className="mt-1 text-[11px] text-muted-foreground">{formatDateBr(date)}</div>}
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Previsão do tempo</label>
              <input value={weather} onChange={(e) => setWeather(e.target.value)} placeholder="Ex: Ensolarado, 28°C"
                className="mt-1 w-full h-10 px-3 text-[13px] border border-border rounded-md" />
            </div>
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1">
              <Camera className="h-3 w-3" /> Fotos do dia
            </label>
            <div className="mt-1">
              <label className="inline-flex items-center gap-1.5 px-3 h-9 bg-secondary text-ink rounded-md text-[13px] font-medium hover:bg-secondary/70 cursor-pointer">
                <Camera className="h-3.5 w-3.5" />
                {photos.length > 0 ? `Adicionar mais fotos (${photos.length})` : "Enviar fotos"}
                <input type="file" accept="image/*" multiple onChange={(e) => handleFiles(e.target.files)} className="hidden" />
              </label>
            </div>
            {photos.length > 0 && (
              <div className="mt-2 grid grid-cols-4 gap-2">
                {photos.map((p, i) => (
                  <div key={i} className="relative">
                    <img src={p} alt="" className="h-16 w-full object-cover rounded-md border border-border" />
                    <button type="button" onClick={() => { setPhotos((arr) => arr.filter((_, idx) => idx !== i)); setPhotoFiles((arr) => arr.filter((_, idx) => idx !== i)); }}
                      className="absolute -top-1 -right-1 bg-white border border-border rounded-full p-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Atividades do dia</label>
            <div className="mt-1 flex gap-2">
              <input value={novaAtividade} onChange={(e) => setNovaAtividade(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addAtividade(); } }}
                placeholder="Descreva uma atividade" className="flex-1 h-10 px-3 text-[13px] border border-border rounded-md" />
              <button type="button" onClick={addAtividade}
                className="px-3 h-10 bg-secondary text-ink rounded-md text-[13px] font-medium hover:bg-secondary/70">Adicionar</button>
            </div>
            {atividades.length > 0 && (
              <ul className="mt-2 space-y-1">
                {atividades.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-2 px-2 py-1.5 border border-border rounded-md">
                    <span className="text-[13px] text-ink flex-1">{a.descricao}</span>
                    <select value={a.status} onChange={(e) => setAtividades((arr) => arr.map((x) => x.id === a.id ? { ...x, status: e.target.value as Atividade["status"] } : x))}
                      className="h-8 px-2 text-[12px] border border-border rounded">
                      <option value="pendente">Pendente</option>
                      <option value="andamento">Em andamento</option>
                      <option value="concluida">Concluída</option>
                    </select>
                    <button type="button" onClick={() => setAtividades((arr) => arr.filter((x) => x.id !== a.id))}
                      className="p-1 text-muted-foreground hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Observação</label>
            <textarea value={observacao} onChange={(e) => setObservacao(e.target.value)} rows={3}
              className="mt-1 w-full px-3 py-2 text-[13px] border border-border rounded-md" />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border bg-secondary/30">
          <button type="button" onClick={onClose} className="px-3 h-9 text-[13px] text-muted-foreground hover:text-ink rounded-md hover:bg-secondary">Cancelar</button>
          <button type="submit" disabled={saving} className="inline-flex items-center gap-1.5 px-4 h-9 bg-ink text-white rounded-md text-[13px] font-medium hover:bg-black disabled:opacity-60">
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />} {isEdit ? "Salvar alterações" : "Salvar registro"}
          </button>
        </div>
      </form>
    </div>
  );
}
