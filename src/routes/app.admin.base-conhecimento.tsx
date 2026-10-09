import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BookOpen, Trash2, Plus, Loader2, Link as LinkIcon, FileText } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { adminNav } from "@/lib/nav-admin";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { externalSupabase } from "@/integrations/external-supabase/client";
import { addKbSource, deleteKbSource, listKbSources } from "@/lib/kb-admin.functions";

export const Route = createFileRoute("/app/admin/base-conhecimento")({
  head: () => ({ meta: [{ title: "Base de Conhecimento — Admin" }] }),
  component: KBAdmin,
});

async function getToken() {
  const { data } = await externalSupabase.auth.getSession();
  const t = data.session?.access_token;
  if (!t) throw new Error("Sessão expirada");
  return t;
}

type Source = {
  id: string;
  title: string;
  source_type: "text" | "url" | "file";
  url: string | null;
  category: string | null;
  chunk_count: number;
  created_at: string;
};

function KBAdmin() {
  const [rows, setRows] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<"text" | "url">("text");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");

  async function refresh() {
    try {
      const accessToken = await getToken();
      const data = await listKbSources({ data: { accessToken } });
      setRows(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao listar");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return toast.error("Informe um título");
    if (tab === "text" && !content.trim()) return toast.error("Cole o conteúdo");
    if (tab === "url" && !url.trim()) return toast.error("Informe a URL");
    setBusy(true);
    try {
      const accessToken = await getToken();
      const res = await addKbSource({
        data: {
          accessToken,
          title: title.trim(),
          category: category.trim() || null,
          source_type: tab,
          content: tab === "text" ? content : undefined,
          url: tab === "url" ? url.trim() : undefined,
        },
      });
      toast.success(`Indexado em ${res.chunk_count} trechos`);
      setTitle("");
      setContent("");
      setUrl("");
      setCategory("");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao indexar");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Remover esta fonte da base de conhecimento?")) return;
    try {
      const accessToken = await getToken();
      await deleteKbSource({ data: { accessToken, id } });
      toast.success("Removido");
      setRows((r) => r.filter((s) => s.id !== id));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao remover");
    }
  }

  return (
    <AppShell role="admin" nav={adminNav} title="Base de Conhecimento">
      <div className="max-w-5xl mx-auto space-y-6 py-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-ink">Base de Conhecimento</h2>
            <p className="text-sm text-muted-foreground">
              Adicione textos e páginas do site. O assistente do ArqHub usará como contexto ao responder.
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="rounded-2xl border border-border bg-white p-5 space-y-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTab("text")}
              className={`px-3 h-9 rounded-md text-sm font-medium inline-flex items-center gap-1.5 ${tab === "text" ? "bg-primary text-white" : "bg-secondary text-foreground"}`}
            >
              <FileText className="h-4 w-4" /> Texto
            </button>
            <button
              type="button"
              onClick={() => setTab("url")}
              className={`px-3 h-9 rounded-md text-sm font-medium inline-flex items-center gap-1.5 ${tab === "url" ? "bg-primary text-white" : "bg-secondary text-foreground"}`}
            >
              <LinkIcon className="h-4 w-4" /> Página (URL)
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título (ex: Como funciona o portal do cliente)"
              className="h-10 rounded-md border border-border bg-white px-3 text-sm"
            />
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Categoria (opcional)"
              className="h-10 rounded-md border border-border bg-white px-3 text-sm"
            />
          </div>

          {tab === "text" ? (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Cole aqui o texto (FAQ, tutorial, manual, política, etc.)"
              rows={8}
              className="w-full rounded-md border border-border bg-white p-3 text-sm"
            />
          ) : (
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://arqhub.world/ajuda/primeiros-passos"
              className="w-full h-10 rounded-md border border-border bg-white px-3 text-sm"
            />
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              {busy ? "Indexando..." : "Adicionar à base"}
            </Button>
          </div>
        </form>

        <div className="rounded-2xl border border-border bg-white">
          <div className="px-5 py-3 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ink">Fontes indexadas ({rows.length})</h3>
          </div>
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> Carregando...
            </div>
          ) : rows.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Nenhuma fonte ainda. Comece adicionando um texto ou URL acima.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {rows.map((s) => (
                <li key={s.id} className="px-5 py-3 flex items-center gap-4">
                  <div className="h-8 w-8 rounded-md bg-secondary flex items-center justify-center text-muted-foreground shrink-0">
                    {s.source_type === "url" ? <LinkIcon className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{s.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {s.category ? `${s.category} · ` : ""}
                      {s.chunk_count} trecho{s.chunk_count === 1 ? "" : "s"}
                      {s.url ? ` · ${s.url}` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(s.id)}
                    className="h-8 w-8 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive flex items-center justify-center"
                    aria-label="Remover"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AppShell>
  );
}
