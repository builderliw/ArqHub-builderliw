// Reconstruído em out/2026 (arquivo original perdido na migração da Lovable).
// Apresentações do projeto por fase (doc_kind "apres_*"). O cliente vê os
// arquivos em "Meu projeto", agrupados por nome-base: enviar de novo um arquivo
// com o mesmo nome (ou com sufixo de versão, ex.: "planta_v2.pdf") cria uma nova
// versão em vez de um item novo.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ExternalLink, FileText, Layers, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { externalSupabase } from "@/integrations/external-supabase/client";
import {
  createProfessionalDocumentRecord,
  deleteProfessionalDocument,
  listProfessionalDocuments,
  signProfessionalDocumentUrl,
} from "@/lib/profissional-project-data.functions";
import { formatShortDate } from "@/hooks/use-profissional-data";

export const PRESENTATION_KINDS = [
  { key: "apres_levantamento", label: "Levantamento e Análise" },
  { key: "apres_briefing", label: "Programa de Necessidades" },
  { key: "apres_preliminar", label: "Estudo Preliminar" },
  { key: "apres_anteprojeto", label: "Anteprojeto" },
  { key: "apres_legal", label: "Projeto Legal" },
  { key: "apres_executivo", label: "Projeto Executivo" },
  { key: "apres_render3d", label: "Renderizações 3D" },
  { key: "apres_modelo3d", label: "Visualizador 3D (.glb/.gltf)" },
] as const;

/**
 * Nome-base usado para agrupar versões de um mesmo arquivo.
 * "Planta Baixa_v2.pdf", "Planta Baixa - rev3.pdf" e "Planta Baixa (1).pdf"
 * viram todos "Planta Baixa".
 */
export function baseFileName(name: string): string {
  let s = String(name ?? "").trim();
  s = s.replace(/\.[a-z0-9]{1,6}$/i, ""); // extensão
  s = s.replace(/^\d{10,}_/, ""); // prefixo de timestamp do upload
  for (let i = 0; i < 2; i++) {
    s = s
      .replace(/\s*\(\d+\)$/, "") // "(1)"
      .replace(/(?:[\s_.-]+(?:v|r)|[\s_.-]*(?:ver|vers[aã]o|rev))\.?\s*\d+$/i, "") // "_v2", " rev3", "-versão 4"
      .replace(/[\s_.-]*(?:final|definitivo)$/i, "")
      .trim();
  }
  s = s.replace(/[_]+/g, " ").replace(/\s{2,}/g, " ").trim();
  return s || String(name ?? "Arquivo");
}

type Doc = {
  id: string;
  name: string;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  doc_kind?: string | null;
  created_at: string;
};

async function token() {
  const { data } = await externalSupabase.auth.getSession();
  const t = data.session?.access_token;
  if (!t) throw new Error("Sessão expirada. Entre novamente.");
  return t;
}

export function ProjectPresentationManager({ projects }: { projects: { id: string; name: string }[] }) {
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [kind, setKind] = useState<string>(PRESENTATION_KINDS[0].key);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const listFn = useServerFn(listProfessionalDocuments);
  const createFn = useServerFn(createProfessionalDocumentRecord);
  const signFn = useServerFn(signProfessionalDocumentUrl);
  const deleteFn = useServerFn(deleteProfessionalDocument);

  useEffect(() => {
    if (!projects.find((p) => p.id === projectId)) setProjectId(projects[0]?.id ?? "");
  }, [projects, projectId]);

  const load = useCallback(async () => {
    if (!projectId) {
      setDocs([]);
      return;
    }
    setLoading(true);
    try {
      const r: any = await listFn({ data: { accessToken: await token(), projectId } });
      setDocs(((r.documents ?? []) as Doc[]).filter((d) => d.doc_kind?.startsWith("apres_")));
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao carregar apresentações");
    }
    setLoading(false);
  }, [projectId, listFn]);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const d of docs) if (d.doc_kind) m[d.doc_kind] = (m[d.doc_kind] ?? 0) + 1;
    return m;
  }, [docs]);

  const groups = useMemo(() => {
    const map = new Map<string, Doc[]>();
    for (const d of docs.filter((x) => x.doc_kind === kind)) {
      const b = baseFileName(d.name);
      if (!map.has(b)) map.set(b, []);
      map.get(b)!.push(d);
    }
    return Array.from(map.entries())
      .map(([base, versions]) => ({ base, versions: versions.sort((a, b) => a.created_at.localeCompare(b.created_at)) }))
      .sort((a, b) => b.versions[b.versions.length - 1].created_at.localeCompare(a.versions[a.versions.length - 1].created_at));
  }, [docs, kind]);

  async function handleFiles(files: FileList | null) {
    if (!files?.length || !projectId) return;
    setBusy(true);
    for (const file of Array.from(files)) {
      const safe = file.name.replace(/[^\w.\-]/g, "_");
      const path = `${projectId}/${Date.now()}_${safe}`;
      try {
        const up = await externalSupabase.storage
          .from("project-documents")
          .upload(path, file, { contentType: file.type || undefined, upsert: false });
        if (up.error) throw up.error;
        try {
          await createFn({
            data: {
              accessToken: await token(),
              projectId,
              document: {
                name: file.name,
                storage_path: path,
                mime_type: file.type || null,
                size_bytes: file.size,
                visible_to_client: true,
                requires_approval: false,
                approval_status: "none",
                doc_kind: kind,
              },
            },
          });
        } catch (e) {
          await externalSupabase.storage.from("project-documents").remove([path]);
          throw e;
        }
        toast.success(`Enviado: ${file.name}`);
      } catch (e: any) {
        toast.error(e?.message ?? `Falha ao enviar ${file.name}`);
      }
    }
    setBusy(false);
    if (fileRef.current) fileRef.current.value = "";
    load();
  }

  async function open(d: Doc) {
    try {
      const r: any = await signFn({ data: { accessToken: await token(), projectId, id: d.id } });
      window.open(r.url, "_blank", "noopener");
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao abrir");
    }
  }

  async function remove(d: Doc) {
    if (!confirm(`Remover “${d.name}”?`)) return;
    try {
      await deleteFn({ data: { accessToken: await token(), projectId, id: d.id } });
      load();
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao remover");
    }
  }

  if (projects.length === 0) {
    return <p className="text-[13px] text-muted-foreground py-4">Crie um projeto para este cliente antes de enviar apresentações.</p>;
  }

  const accept = kind === "apres_modelo3d" ? ".glb,.gltf" : "image/*,application/pdf,.glb,.gltf";

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
          onClick={() => fileRef.current?.click()}
          disabled={busy || !projectId}
          className="ml-auto inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-ink text-white text-[12.5px] font-medium disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />} Enviar arquivos
        </button>
        <input ref={fileRef} type="file" multiple accept={accept} hidden onChange={(e) => handleFiles(e.target.files)} />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {PRESENTATION_KINDS.map((k) => (
          <button
            key={k.key}
            onClick={() => setKind(k.key)}
            className={`h-8 px-2.5 rounded-full border text-[12px] ${
              kind === k.key ? "border-primary bg-primary/10 text-primary font-medium" : "border-border bg-white text-muted-foreground hover:text-ink"
            }`}
          >
            {k.label}
            {counts[k.key] ? <span className="ml-1 tabular-nums">· {counts[k.key]}</span> : null}
          </button>
        ))}
      </div>

      <p className="text-[11.5px] text-muted-foreground">
        Para criar uma nova versão, envie o arquivo com o mesmo nome (ou com “_v2”, “_v3”…). O cliente vê sempre a mais recente e pode navegar pelas anteriores.
      </p>

      {loading && docs.length === 0 ? (
        <div className="flex items-center gap-2 text-[12.5px] text-muted-foreground py-4">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Carregando…
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Layers className="h-6 w-6 mx-auto mb-2 opacity-60" />
          <p className="text-[13px]">Nenhum arquivo nesta fase.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {groups.map((g) => (
            <li key={g.base} className="rounded-lg border border-border bg-white">
              <div className="px-3 py-2 border-b border-border flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-[13.5px] font-medium text-ink truncate">{g.base}</span>
                <span className="ml-auto text-[11px] text-muted-foreground">
                  {g.versions.length} {g.versions.length === 1 ? "versão" : "versões"}
                </span>
              </div>
              <ul className="divide-y divide-border">
                {[...g.versions].reverse().map((d, i) => (
                  <li key={d.id} className="px-3 py-1.5 flex items-center gap-2 text-[12.5px]">
                    <span className="w-8 shrink-0 text-muted-foreground tabular-nums">v{g.versions.length - i}</span>
                    <span className="truncate text-ink">{d.name}</span>
                    <span className="text-muted-foreground shrink-0">· {formatShortDate(d.created_at)}</span>
                    {i === 0 && <span className="text-[10.5px] px-1.5 rounded-full bg-primary/10 text-primary shrink-0">atual</span>}
                    <button onClick={() => open(d)} className="ml-auto p-1 text-muted-foreground hover:text-ink" aria-label="Abrir">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => remove(d)} className="p-1 text-muted-foreground hover:text-red-600" aria-label="Remover">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
