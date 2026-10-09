import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Upload, FileText, Loader2, Trash2, ExternalLink, ShieldCheck, Clock, Check, X } from "lucide-react";
import { externalSupabase } from "@/integrations/external-supabase/client";
import { toast } from "sonner";
import { createProfessionalDocumentRecord, deleteProfessionalDocument, listProfessionalDocuments, signProfessionalDocumentUrl } from "@/lib/profissional-project-data.functions";

type Doc = {
  id: string;
  name: string;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  visible_to_client: boolean;
  requires_approval?: boolean;
  approval_status?: string;
  approval_note?: string | null;
  doc_kind?: string | null;
  created_at: string;
};

const KINDS = ["orçamento", "contrato", "planta", "memorial", "outros"];

function humanSize(n: number | null) {
  if (!n) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function ProjectDocumentsManager({ projects }: { projects: { id: string; name: string }[] }) {
  const [projectId, setProjectId] = useState<string>(projects[0]?.id ?? "");
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [docKind, setDocKind] = useState<string>("orçamento");
  const fileRef = useRef<HTMLInputElement>(null);
  const listDocuments = useServerFn(listProfessionalDocuments);
  const createDocument = useServerFn(createProfessionalDocumentRecord);
  const signDocument = useServerFn(signProfessionalDocumentUrl);
  const deleteDocument = useServerFn(deleteProfessionalDocument);

  useEffect(() => { if (!projectId && projects[0]) setProjectId(projects[0].id); }, [projects, projectId]);

  const load = useCallback(async () => {
    if (!projectId) { setDocs([]); return; }
    setLoading(true);
    const { data: sess } = await externalSupabase.auth.getSession();
    const token = sess.session?.access_token;
    if (!token) { setLoading(false); toast.error("Sessão expirada"); return; }
    try {
      const r = await listDocuments({ data: { accessToken: token, projectId } });
      setDocs((r.documents ?? []) as Doc[]);
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao carregar documentos");
    }
    setLoading(false);
  }, [projectId, listDocuments]);

  useEffect(() => { load(); }, [load]);

  async function handleFiles(files: FileList | null) {
    if (!files || !projectId) return;
    setBusy(true);
    for (const file of Array.from(files)) {
      try {
        const safe = file.name.replace(/[^\w.\-]/g, "_");
        const path = `${projectId}/${Date.now()}_${safe}`;
        const up = await externalSupabase.storage
          .from("project-documents")
          .upload(path, file, { contentType: file.type, upsert: false });
        if (up.error) throw up.error;
        const { data: sess } = await externalSupabase.auth.getSession();
        const token = sess.session?.access_token;
        if (!token) throw new Error("Sessão expirada");
        const payload: any = {
          project_id: projectId,
          name: file.name,
          storage_path: path,
          mime_type: file.type || null,
          size_bytes: file.size,
          visible_to_client: true,
          requires_approval: requiresApproval,
          approval_status: requiresApproval ? "pending" : "none",
          doc_kind: docKind,
        };
        try {
          await createDocument({ data: { accessToken: token, projectId, document: payload } });
        } catch (e) {
          await externalSupabase.storage.from("project-documents").remove([path]);
          throw e;
        }
        toast.success(`Enviado: ${file.name}`);
      } catch (e: any) {
        toast.error(e?.message ?? "Falha ao enviar");
      }
    }
    setBusy(false);
    if (fileRef.current) fileRef.current.value = "";
    load();
  }

  async function openDoc(d: Doc) {
    const { data: sess } = await externalSupabase.auth.getSession();
    const token = sess.session?.access_token;
    if (!token) { toast.error("Sessão expirada"); return; }
    try {
      const r = await signDocument({ data: { accessToken: token, projectId, id: d.id } });
      window.open(r.url, "_blank");
    } catch (e: any) { toast.error(e?.message ?? "Erro ao abrir"); }
  }

  async function removeDoc(d: Doc) {
    if (!confirm(`Remover "${d.name}"?`)) return;
    const { data: sess } = await externalSupabase.auth.getSession();
    const token = sess.session?.access_token;
    if (!token) { toast.error("Sessão expirada"); return; }
    try { await deleteDocument({ data: { accessToken: token, projectId, id: d.id } }); load(); }
    catch (e: any) { toast.error(e?.message ?? "Erro ao remover"); }
  }

  if (projects.length === 0) {
    return <Empty>Crie um projeto para este cliente antes de enviar documentos.</Empty>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="ipt h-9 max-w-[260px]">
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={docKind} onChange={(e) => setDocKind(e.target.value)} className="ipt h-9">
          {KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
        </select>
        <label className="inline-flex items-center gap-2 text-[12.5px] text-ink px-2.5 h-9 rounded-md border border-border bg-white">
          <input type="checkbox" checked={requiresApproval} onChange={(e) => setRequiresApproval(e.target.checked)} />
          <ShieldCheck className="h-3.5 w-3.5 text-amber-600" /> Precisa de aprovação do cliente
        </label>
        <label className={`inline-flex items-center gap-1.5 px-3 h-9 rounded-md bg-ink text-white text-[12.5px] font-medium cursor-pointer ${busy ? "opacity-60 pointer-events-none" : ""}`}>
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          Enviar arquivos
          <input ref={fileRef} type="file" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
        </label>
      </div>

      {loading ? (
        <div className="text-[12.5px] text-muted-foreground inline-flex items-center gap-2"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Carregando…</div>
      ) : docs.length === 0 ? (
        <Empty>Nenhum documento enviado para este projeto.</Empty>
      ) : (
        <ul className="divide-y divide-border border border-border rounded-lg bg-white">
          {docs.map((d) => (
            <li key={d.id} className="flex items-center gap-3 p-3">
              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[13px] font-medium text-ink truncate">{d.name}</span>
                  {d.doc_kind && <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground">{d.doc_kind}</span>}
                  {d.requires_approval && <ApprovalBadge status={d.approval_status ?? "pending"} />}
                </div>
                <div className="text-[11px] text-muted-foreground">{humanSize(d.size_bytes)} · {new Date(d.created_at).toLocaleString("pt-BR")}</div>
              </div>
              <button onClick={() => openDoc(d)} className="text-muted-foreground hover:text-ink p-1.5" title="Abrir"><ExternalLink className="h-3.5 w-3.5" /></button>
              <button onClick={() => removeDoc(d)} className="text-red-600 hover:bg-red-50 rounded p-1.5" title="Remover"><Trash2 className="h-3.5 w-3.5" /></button>
            </li>
          ))}
        </ul>
      )}
      <style>{`.ipt{border:1px solid hsl(var(--border));border-radius:.5rem;padding:0 .65rem;font-size:13px;background:#fff;outline:none}.ipt:focus{border-color:hsl(var(--primary))}`}</style>
    </div>
  );
}

function ApprovalBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; icon: any }> = {
    pending: { label: "Aguardando aprovação", cls: "bg-amber-100 text-amber-700", icon: Clock },
    approved: { label: "Aprovado", cls: "bg-emerald-100 text-emerald-700", icon: Check },
    rejected: { label: "Rejeitado", cls: "bg-red-100 text-red-700", icon: X },
    changes_requested: { label: "Ajustes", cls: "bg-blue-100 text-blue-700", icon: Clock },
    none: { label: "—", cls: "bg-secondary text-muted-foreground", icon: Clock },
  };
  const c = map[status] ?? map.pending;
  const Ico = c.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full ${c.cls}`}>
      <Ico className="h-2.5 w-2.5" /> {c.label}
    </span>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-secondary/20 p-8 text-center text-[12.5px] text-muted-foreground">
      {children}
    </div>
  );
}
