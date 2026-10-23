import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Download, FileText, CheckCircle2, Loader2, Lock, Crown, Clock, ShoppingCart } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { externalSupabase } from "@/integrations/external-supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/conteudos/seu-negocio")({
  head: () => ({
    meta: [
      { title: "Materiais para o seu negócio | ArqHub" },
      {
        name: "description",
        content:
          "PDFs, planilhas e modelos prontos para arquitetos e engenheiros. Cadastre-se uma vez e baixe quantos quiser.",
      },
    ],
  }),
  component: SeuNegocioPage,
});

type Material = {
  id: string;
  title: string;
  description: string | null;
  type: string | null;
  cover_url: string | null;
  file_url: string | null;
  is_premium?: boolean | null;
  coming_soon?: boolean | null;
  sort_order?: number | null;
};

function SeuNegocioPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [logged, setLogged] = useState<boolean | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [{ data: userData }, { data: mats, error }] = await Promise.all([
          externalSupabase.auth.getUser(),
          externalSupabase
            .from("free_materials")
            .select("id,title,description,type,cover_url,file_url,is_premium,coming_soon,sort_order")
            .order("sort_order", { ascending: true }),
        ]);
        if (!alive) return;
        if (error) throw error;
        setLogged(!!userData.user);
        setMaterials((mats as Material[]) ?? []);
      } catch (e: any) {
        if (alive) toast.error(e?.message ?? "Erro ao carregar materiais.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const list = useMemo(() => materials, [materials]);

  async function handleDownload(m: Material) {
    if (m.coming_soon) {
      toast.message("Em breve — este material ainda não está disponível.");
      return;
    }
    if (!m.file_url) {
      toast.error("Arquivo indisponível.");
      return;
    }
    if (!logged) {
      toast.message("Faça login para baixar.");
      window.location.href = "/entrar";
      return;
    }
    setDownloading(m.id);
    try {
      window.open(m.file_url, "_blank", "noopener,noreferrer");
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="py-8 lg:py-10 bg-surface border-b border-border">
          <div className="mx-auto max-w-7xl px-6">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 t-caption text-muted-foreground hover:text-ink mb-2 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao site
            </Link>
            <p className="t-caption font-semibold tracking-[0.14em] text-primary uppercase mt-2">Seu negócio</p>
            <h1 className="mt-2 t-h1 max-w-3xl">
              Materiais e conteúdos para ajudar o{" "}
              <span className="text-primary">seu negócio a decolar</span>
            </h1>
            <p className="mt-3 t-body text-muted-foreground max-w-2xl">
              PDFs, planilhas e modelos prontos. Cadastre-se uma vez e baixe quantos quiser.
            </p>
          </div>
        </section>

        {/* GRID */}
        <section className="py-8 lg:py-10 bg-surface">
          <div className="mx-auto max-w-7xl px-6">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : list.length === 0 ? (
              <p className="text-center text-muted-foreground py-16">Nenhum material disponível no momento.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {list.map((m) => {
                  const soon = !!m.coming_soon;
                  const premium = !!m.is_premium;
                  return (
                    <article
                      key={m.id}
                      className="group flex gap-4 rounded-2xl border border-border bg-white p-4 sm:p-5 transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_44px_-16px_rgba(0,0,0,0.12)]"
                    >
                      <div className="relative h-[120px] w-[100px] shrink-0 overflow-hidden rounded-xl bg-secondary">
                        {m.cover_url ? (
                          <img
                            src={m.cover_url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <FileText className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                        <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                          {m.type === "planilha" ? "Planilha" : "PDF"}
                        </span>
                        {soon && (
                          <span className="absolute inset-0 flex items-center justify-center bg-black/40">
                            <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-ink">
                              <Clock className="h-3 w-3" /> Em breve
                            </span>
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1 flex flex-col">
                        <h3 className="text-[15px] font-semibold text-ink leading-snug">{m.title}</h3>
                        {m.description && (
                          <p className="mt-1.5 text-[13px] text-muted-foreground line-clamp-3">{m.description}</p>
                        )}
                        <div className="mt-auto pt-3 flex items-center gap-2">
                          {soon ? (
                            <span className="inline-flex items-center gap-1 text-[12px] text-muted-foreground">
                              <Clock className="h-3.5 w-3.5" /> Em breve
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => void handleDownload(m)}
                              disabled={downloading === m.id}
                              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-primary text-white text-[12.5px] font-medium hover:bg-primary/90 disabled:opacity-60"
                            >
                              {downloading === m.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Download className="h-3.5 w-3.5" />
                              )}
                              Baixar
                            </button>
                          )}
                          {premium && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-amber-700">
                              <Crown className="h-3 w-3" /> Premium
                            </span>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
