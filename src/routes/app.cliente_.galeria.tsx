import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  LayoutDashboard, FolderOpen, FileText, MessageSquare, Calendar,
  ClipboardCheck, ShoppingBag, BellRing, CalendarClock, Image as ImageIcon, Loader2, X, Images,
} from "lucide-react";
import { AppShell, type NavGroup } from "@/components/app-shell";
import { useClienteCronograma } from "@/hooks/use-cliente-cronograma";
import { externalSupabase } from "@/integrations/external-supabase/client";

export const Route = createFileRoute("/app/cliente_/galeria")({
  head: () => ({ meta: [{ title: "Galeria — ArqHub" }] }),
  component: GaleriaCliente,
});

const nav: NavGroup[] = [
  { label: "Interface", items: [{ to: "/app/cliente", label: "Início", icon: LayoutDashboard }, { to: "/app/cliente/meu-projeto", label: "Meu projeto", icon: FolderOpen }] },
  {
    label: "Acompanhamento",
    items: [
      { to: "/app/cliente/agenda", label: "Agenda", icon: CalendarClock },
      { to: "/app/cliente/aprovacoes", label: "Aprovações", icon: ClipboardCheck },
      { to: "/app/cliente/cronograma", label: "Cronograma", icon: Calendar },
      { to: "/app/cliente/documentos", label: "Documentos", icon: FolderOpen },
      { to: "/app/cliente/galeria", label: "Galeria", icon: Images },
      { to: "/app/cliente/produtos", label: "Produtos", icon: ShoppingBag },
    ],
  },
  {
    label: "Comunicação",
    items: [
      { to: "/app/cliente/mensagens", label: "Mensagens", icon: MessageSquare },
      { to: "/app/cliente/notificacoes", label: "Notificações", icon: BellRing },
    ],
  },
  { label: "Financeiro", items: [{ to: "/app/meus-pagamentos", label: "Meus pagamentos", icon: FileText }] },
];


type Photo = { id: string; album: string; storage_path: string; caption: string | null; created_at: string; signedUrl?: string };

function GaleriaCliente() {
  const { projeto, loading: loadingProj } = useClienteCronograma();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<Photo | null>(null);

  const load = useCallback(async () => {
    if (!projeto?.id) { setPhotos([]); return; }
    setLoading(true);
    const { data, error } = await externalSupabase
      .from("project_photos")
      .select("id, album, storage_path, caption, created_at")
      .eq("project_id", projeto.id)
      .order("created_at", { ascending: false });
    if (error) { setPhotos([]); setLoading(false); return; }
    const withUrls: Photo[] = [];
    for (const p of (data ?? []) as Photo[]) {
      const { data: s } = await externalSupabase.storage
        .from("project-photos").createSignedUrl(p.storage_path, 3600);
      withUrls.push({ ...p, signedUrl: s?.signedUrl });
    }
    setPhotos(withUrls);
    setLoading(false);
  }, [projeto?.id]);

  useEffect(() => { load(); }, [load]);

  return (
    <AppShell role="cliente" nav={nav} title="Galeria">
      <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-5">
        <header>
          <h1 className="text-[22px] font-semibold text-ink">Galeria</h1>
          <p className="text-[13px] text-muted-foreground">
            Fotos enviadas pelo escritório{projeto?.name ? ` · ${projeto.name}` : ""}
          </p>
        </header>

        {loadingProj || loading ? (
          <div className="text-[12.5px] text-muted-foreground"><Loader2 className="inline h-3.5 w-3.5 animate-spin mr-1" /> Carregando…</div>
        ) : photos.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-secondary/20 p-10 text-center text-[12.5px] text-muted-foreground">
            <ImageIcon className="h-6 w-6 mx-auto mb-2 opacity-50" />
            Nenhuma foto disponível ainda.
          </div>

        ) : (
          <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {photos.map((p) => (
              <li key={p.id}>
                <button
                  onClick={() => setPreview(p)}
                  className="block w-full relative rounded-lg overflow-hidden border border-border bg-secondary aspect-square group"
                >
                  {p.signedUrl ? (
                    <img src={p.signedUrl} alt={p.caption ?? ""} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="pt-2">
          <Link to="/app/cliente" className="text-[12.5px] text-primary hover:underline">← Voltar ao painel</Link>
        </div>
      </div>

      {preview && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <button
            onClick={() => setPreview(null)}
            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white inline-flex items-center justify-center"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
          {preview.signedUrl && (
            <img
              src={preview.signedUrl}
              alt={preview.caption ?? ""}
              className="max-h-[90vh] max-w-[92vw] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>
      )}
    </AppShell>
  );
}
