import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Upload, Loader2, Trash2, Image as ImageIcon } from "lucide-react";
import { externalSupabase } from "@/integrations/external-supabase/client";
import { toast } from "sonner";
import { createProfessionalPhotoRecord, deleteProfessionalPhoto, listProfessionalPhotos } from "@/lib/profissional-project-data.functions";

const DEFAULT_ALBUM = "obra";

type Photo = { id: string; project_id: string; album: string; storage_path: string; caption: string | null; created_at: string; signedUrl?: string };

export function ProjectPhotosManager({ projects }: { projects: { id: string; name: string }[] }) {
  const [projectId, setProjectId] = useState<string>(projects[0]?.id ?? "");
  const album = DEFAULT_ALBUM;
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const listPhotos = useServerFn(listProfessionalPhotos);
  const createPhoto = useServerFn(createProfessionalPhotoRecord);
  const deletePhoto = useServerFn(deleteProfessionalPhoto);

  useEffect(() => { if (!projectId && projects[0]) setProjectId(projects[0].id); }, [projects, projectId]);

  const load = useCallback(async () => {
    if (!projectId) { setPhotos([]); return; }
    setLoading(true);
    const { data: sess } = await externalSupabase.auth.getSession();
    const token = sess.session?.access_token;
    if (!token) { setLoading(false); toast.error("Sessão expirada"); return; }
    try {
      const r = await listPhotos({ data: { accessToken: token, projectId } });
      setPhotos((r.photos ?? []) as Photo[]);
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao carregar fotos");
      setPhotos([]);
    }
    setLoading(false);
  }, [projectId, listPhotos]);

  useEffect(() => { load(); }, [load]);

  async function handleFiles(files: FileList | null) {
    if (!files || !projectId) return;
    setBusy(true);
    for (const file of Array.from(files)) {
      try {
        if (!file.type.startsWith("image/")) { toast.error(`${file.name}: não é imagem`); continue; }
        const safe = file.name.replace(/[^\w.\-]/g, "_");
        const path = `${projectId}/${album}/${Date.now()}_${safe}`;
        const up = await externalSupabase.storage
          .from("project-photos").upload(path, file, { contentType: file.type });
        if (up.error) throw up.error;
        const { data: sess } = await externalSupabase.auth.getSession();
        const token = sess.session?.access_token;
        if (!token) throw new Error("Sessão expirada");
        try {
          await createPhoto({ data: { accessToken: token, projectId, photo: { album, storage_path: path } } });
        } catch (e) {
          await externalSupabase.storage.from("project-photos").remove([path]);
          throw e;
        }
      } catch (e: any) { toast.error(e?.message ?? "Falha"); }
    }
    setBusy(false);
    if (fileRef.current) fileRef.current.value = "";
    load();
  }

  async function remove(p: Photo) {
    if (!confirm("Remover foto?")) return;
    const { data: sess } = await externalSupabase.auth.getSession();
    const token = sess.session?.access_token;
    if (!token) { toast.error("Sessão expirada"); return; }
    try { await deletePhoto({ data: { accessToken: token, projectId: p.project_id, id: p.id } }); load(); }
    catch (e: any) { toast.error(e?.message ?? "Erro ao remover"); }
  }

  const visible = photos.filter((p) => !String(p.caption ?? "").startsWith("Diário de obra:"));

  if (projects.length === 0) {
    return <div className="rounded-xl border border-dashed border-border bg-secondary/20 p-8 text-center text-[12.5px] text-muted-foreground">Crie um projeto para enviar fotos.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="ipt h-9 max-w-[260px]">
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <label className={`inline-flex items-center gap-1.5 px-3 h-9 rounded-md bg-ink text-white text-[12.5px] font-medium cursor-pointer ${busy ? "opacity-60 pointer-events-none" : ""}`}>
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          Enviar fotos
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
        </label>
      </div>

      {loading ? (
        <div className="text-[12.5px] text-muted-foreground"><Loader2 className="inline h-3.5 w-3.5 animate-spin mr-1" /> Carregando…</div>
      ) : visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-secondary/20 p-8 text-center text-[12.5px] text-muted-foreground">
          <ImageIcon className="h-5 w-5 mx-auto mb-2 opacity-50" />
          Nenhuma foto enviada ainda.
        </div>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {visible.map((p) => (
            <li key={p.id} className="relative group rounded-lg overflow-hidden border border-border bg-secondary aspect-square">
              {p.signedUrl ? (
                <img src={p.signedUrl} alt="" className="w-full h-full object-cover" />
              ) : <div className="w-full h-full flex items-center justify-center"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>}
              <button onClick={() => remove(p)}
                className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition bg-white/90 hover:bg-white text-red-600 rounded p-1.5">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <style>{`.ipt{border:1px solid hsl(var(--border));border-radius:.5rem;padding:0 .65rem;font-size:13px;background:#fff;outline:none}.ipt:focus{border-color:hsl(var(--primary))}`}</style>
    </div>
  );
}
