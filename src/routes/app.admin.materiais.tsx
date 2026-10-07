import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  FileText, Upload, Trash2, Download,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { adminNav } from "@/lib/nav-admin";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { externalSupabase } from "@/integrations/external-supabase/client";
import {
  listMaterialFiles,
  createMaterialUploadUrl,
  registerMaterialFile,
  deleteMaterialFile,
  getMaterialFileUrl,
  setMaterialAccessLevel,
} from "@/lib/material-files.functions";
import { seuNegocioMaterials, CATEGORY_SEU_NEGOCIO } from "@/lib/materiais-seu-negocio";
import { Lock, Unlock } from "lucide-react";

async function getAccessToken(): Promise<string> {
  const { data } = await externalSupabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Sessão expirada. Faça login novamente.");
  return token;
}

export const Route = createFileRoute("/app/admin/materiais")({
  head: () => ({ meta: [{ title: "Materiais Seu Negócio — Admin" }] }),
  component: MateriaisAdmin,
});


type FileRow = {
  category: string;
  slug: string;
  filename: string;
  storage_path: string;
  size: number | null;
  content_type: string | null;
  access_level?: "free" | "subscriber";
  updated_at: string;
};

function formatSize(n: number | null) {
  if (!n) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

function MateriaisAdmin() {
  const [files, setFiles] = useState<Record<string, FileRow>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  async function refresh() {
    try {
      const res = await listMaterialFiles({ data: { category: CATEGORY_SEU_NEGOCIO } });
      const map: Record<string, FileRow> = {};
      for (const f of res.items as FileRow[]) map[f.slug] = f;
      setFiles(map);
    } catch (e) {
      toast.error("Erro ao carregar arquivos");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleUpload(slug: string, file: File) {
    setBusy(slug);
    try {
      const accessToken = await getAccessToken();
      const { signedUrl, path } = await createMaterialUploadUrl({
        data: { accessToken, category: CATEGORY_SEU_NEGOCIO, slug, filename: file.name },
      });
      const upload = await fetch(signedUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type || "application/octet-stream" },
      });
      if (!upload.ok) throw new Error(`Upload falhou (${upload.status})`);
      await registerMaterialFile({
        data: {
          accessToken,
          category: CATEGORY_SEU_NEGOCIO,
          slug,
          filename: file.name,
          storage_path: path,
          size: file.size,
          content_type: file.type || undefined,
        },
      });
      toast.success("Arquivo enviado");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha no upload");
    } finally {
      setBusy(null);
    }
  }

  async function handleDelete(slug: string) {
    if (!confirm("Remover este arquivo?")) return;
    setBusy(slug);
    try {
      const accessToken = await getAccessToken();
      await deleteMaterialFile({ data: { accessToken, category: CATEGORY_SEU_NEGOCIO, slug } });
      toast.success("Arquivo removido");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao remover");
    } finally {
      setBusy(null);
    }
  }

  async function handleDownload(slug: string) {
    try {
      const { url } = await getMaterialFileUrl({
        data: { category: CATEGORY_SEU_NEGOCIO, slug },
      });
      if (url) window.open(url, "_blank");
    } catch {
      toast.error("Falha ao gerar link");
    }
  }

  async function handleToggleAccess(slug: string, current: "free" | "subscriber" | undefined) {
    const next: "free" | "subscriber" = current === "subscriber" ? "free" : "subscriber";
    setBusy(slug);
    try {
      const accessToken = await getAccessToken();
      await setMaterialAccessLevel({
        data: { accessToken, category: CATEGORY_SEU_NEGOCIO, slug, access_level: next },
      });
      toast.success(next === "subscriber" ? "Marcado como assinantes" : "Marcado como gratuito");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao atualizar");
    } finally {
      setBusy(null);
    }
  }


  return (
    <AppShell role="admin" nav={adminNav} title="Materiais Seu Negócio — arquivos">
      <div className="mb-6">
        <h2 className="text-[22px] font-semibold tracking-tight text-ink">Materiais gratuitos (Seu Negócio)</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Faça upload dos arquivos (PDF, planilha, modelo) que aparecem em /conteudos/seu-negocio. O botão "Baixar gratuitamente" na página pública libera o arquivo após o usuário preencher o formulário.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {seuNegocioMaterials.map((r) => {
          const file = files[r.id];
          return (
            <div key={r.id} className="bg-white border border-border rounded-xl p-5">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-[14px] font-semibold text-ink line-clamp-2">{r.title}</h3>
                  <p className="text-[11.5px] text-muted-foreground truncate">{r.format} · {r.id}</p>
                </div>
              </div>

              <div className="mt-4 rounded-lg border border-border bg-secondary/30 p-3 text-[12.5px]">
                {loading ? (
                  <span className="text-muted-foreground">Carregando…</span>
                ) : file ? (
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-medium text-ink truncate">{file.filename}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {formatSize(file.size)} · atualizado {new Date(file.updated_at).toLocaleDateString("pt-BR")}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => handleDownload(r.id)} className="p-1.5 rounded hover:bg-white text-muted-foreground hover:text-ink" title="Baixar">
                        <Download className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(r.id)} disabled={busy === r.id} className="p-1.5 rounded hover:bg-white text-muted-foreground hover:text-red-600 disabled:opacity-50" title="Remover">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <span className="text-muted-foreground">Nenhum arquivo enviado.</span>
                )}
              </div>

              {file && (
                <button
                  onClick={() => handleToggleAccess(r.id, file.access_level)}
                  disabled={busy === r.id}
                  className={`mt-3 w-full inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-[12px] font-medium transition-colors disabled:opacity-50 ${
                    file.access_level === "subscriber"
                      ? "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
                      : "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                  }`}
                >
                  {file.access_level === "subscriber" ? (
                    <><Lock className="h-3.5 w-3.5" /> Apenas assinantes · clique para tornar gratuito</>
                  ) : (
                    <><Unlock className="h-3.5 w-3.5" /> Gratuito · clique para restringir a assinantes</>
                  )}
                </button>
              )}

              <UploadButton slug={r.id} busy={busy === r.id} onUpload={(f) => handleUpload(r.id, f)} />
            </div>

          );
        })}
      </div>
    </AppShell>
  );
}

function UploadButton({ slug, busy, onUpload }: { slug: string; busy: boolean; onUpload: (f: File) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="mt-3">
      <input
        ref={ref}
        type="file"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onUpload(f);
          e.target.value = "";
        }}
      />
      <Button variant="outline" size="sm" className="w-full" disabled={busy} onClick={() => ref.current?.click()}>
        <Upload className="h-4 w-4 mr-2" />
        {busy ? "Enviando…" : "Enviar arquivo"}
      </Button>
      <p className="mt-1.5 text-[10.5px] text-muted-foreground">Substitui o arquivo atual de {slug}.</p>
    </div>
  );
}
