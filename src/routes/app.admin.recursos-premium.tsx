import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  LayoutDashboard, Users, CreditCard, Shield, Activity, AlertCircle,
  FileText, Bell, Building2, MessageSquare, Sparkles, Upload, Trash2, Download,
  Calculator, Ruler, ShoppingCart, CalendarClock, BookOpen,
} from "lucide-react";
import { AppShell, type NavGroup } from "@/components/app-shell";
import { adminNav } from "@/lib/nav-admin";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  listPremiumFiles,
  createPremiumUploadUrl,
  registerPremiumFile,
  deletePremiumFile,
  getPremiumFileUrl,
} from "@/lib/premium-files.functions";
import { externalSupabase } from "@/integrations/external-supabase/client";


export const Route = createFileRoute("/app/admin/recursos-premium")({
  head: () => ({ meta: [{ title: "Recursos Premium — Admin" }] }),
  component: RecursosPremiumAdmin,
});


const recursos = [
  { slug: "orcamentos-inteligentes", title: "Orçamentos Inteligentes", icon: Calculator },
  { slug: "levantamento-quantitativo", title: "Levantamento Quantitativo", icon: Ruler },
  { slug: "sugestao-de-compras", title: "Sugestão de Compras", icon: ShoppingCart },
  { slug: "planejamento-de-obra", title: "Planejamento de Obra", icon: CalendarClock },
] as const;

type FileRow = {
  slug: string;
  filename: string;
  storage_path: string;
  size: number | null;
  content_type: string | null;
  updated_at: string;
};

function formatSize(n: number | null) {
  if (!n) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

function RecursosPremiumAdmin() {
  const [files, setFiles] = useState<Record<string, FileRow>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  async function refresh() {
    try {
      const res = await listPremiumFiles();
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
      const { signedUrl, path } = await createPremiumUploadUrl({
        data: { slug: slug as (typeof recursos)[number]["slug"], filename: file.name },
      });
      const upload = await fetch(signedUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type || "application/octet-stream" },
      });
      if (!upload.ok) throw new Error(`Upload falhou (${upload.status})`);
      await registerPremiumFile({
        data: {
          slug: slug as (typeof recursos)[number]["slug"],
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
      await deletePremiumFile({ data: { slug: slug as (typeof recursos)[number]["slug"] } });
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
      const { data: sess } = await externalSupabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) {
        toast.error("Sessão expirada. Entre novamente.");
        return;
      }
      const { url } = await getPremiumFileUrl({
        data: { slug: slug as (typeof recursos)[number]["slug"], accessToken: token },
      });
      if (url) window.open(url, "_blank");
    } catch (e) {
      toast.error("Falha ao gerar link");
    }
  }

  return (
    <AppShell role="admin" nav={adminNav} title="Recursos Premium — arquivos">
      <div className="mb-6">
        <h2 className="text-[22px] font-semibold tracking-tight text-ink">Arquivos dos Recursos Premium</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Faça upload de um arquivo (PDF, documento, imagem) para cada recurso premium. O arquivo ficará disponível para download na página pública do recurso.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recursos.map((r) => {
          const Icon = r.icon;
          const file = files[r.slug];
          return (
            <div key={r.slug} className="bg-white border border-border rounded-xl p-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-[14px] font-semibold text-ink">{r.title}</h3>
                  <p className="text-[11.5px] text-muted-foreground truncate">/recursos/premium/{r.slug}</p>
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
                      <button
                        onClick={() => handleDownload(r.slug)}
                        className="p-1.5 rounded hover:bg-white text-muted-foreground hover:text-ink"
                        title="Baixar"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(r.slug)}
                        disabled={busy === r.slug}
                        className="p-1.5 rounded hover:bg-white text-muted-foreground hover:text-red-600 disabled:opacity-50"
                        title="Remover"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <span className="text-muted-foreground">Nenhum arquivo enviado.</span>
                )}
              </div>

              <UploadButton slug={r.slug} busy={busy === r.slug} onUpload={(f) => handleUpload(r.slug, f)} />
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}

function UploadButton({
  slug,
  busy,
  onUpload,
}: {
  slug: string;
  busy: boolean;
  onUpload: (f: File) => void;
}) {
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
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        disabled={busy}
        onClick={() => ref.current?.click()}
      >
        <Upload className="h-4 w-4 mr-2" />
        {busy ? "Enviando…" : "Enviar arquivo"}
      </Button>
      <p className="mt-1.5 text-[10.5px] text-muted-foreground">Substitui o arquivo atual de {slug}.</p>
    </div>
  );
}
