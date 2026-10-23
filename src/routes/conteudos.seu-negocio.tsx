import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useOfficeStatus } from "@/hooks/use-office-status";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ArrowLeft, ArrowRight, Download, FileText, CheckCircle2, Loader2, Lock, Crown, Clock, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import {
  seuNegocioMaterials,
  CATEGORY_SEU_NEGOCIO,
  type SeuNegocioMaterial,
} from "@/lib/materiais-seu-negocio";
import { getMaterialFileUrl, listMaterialFiles } from "@/lib/material-files.functions";
import { externalSupabase } from "@/integrations/external-supabase/client";

export const Route = createFileRoute("/conteudos/seu-negocio")({
  head: () => ({
    meta: [
      { title: "Seu Negócio — PDFs e materiais grátis | ArqHub" },
      {
        name: "description",
        content:
          "PDFs, planilhas e modelos prontos para baixar gratuitamente: cronograma, diário de obra, SINAPI, prompts de IA e mais.",
      },
      { property: "og:title", content: "Seu Negócio — PDFs e materiais grátis | ArqHub" },
      {
        property: "og:description",
        content: "Materiais práticos para baixar e usar no seu escritório hoje.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SeuNegocioPage,
});

function typeLabel(t?: string | null) {
  if (!t) return "PDF";
  const v = t.toLowerCase();
  if (v.includes("planilha") || v.includes("xlsx") || v.includes("xls")) return "Planilha";
  if (v.includes("doc")) return "Documento";
  return "PDF";
}

function SeuNegocioPage() {
  const navigate = useNavigate();
  const { loggedIn, loading: statusLoading } = useOfficeStatus();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);

  async function onDownload(item: SeuNegocioMaterial) {
    if (item.comingSoon) {
      toast.message("Este material estará disponível em breve.");
      return;
    }
    if (statusLoading) return;
    if (!loggedIn) {
      setLoginOpen(true);
      return;
    }
    setDownloadingId(item.id);
    try {
      const url = await getMaterialFileUrl({
        data: { slug: item.slug ?? item.id, category: CATEGORY_SEU_NEGOCIO },
      });
      if (!url) {
        // fallback: list files
        const files = await listMaterialFiles({
          data: { category: CATEGORY_SEU_NEGOCIO },
        });
        const match = (files as any[])?.find(
          (f) => f?.slug === item.slug || f?.id === item.id || f?.name?.includes(item.id),
        );
        if (match?.url) {
          window.open(match.url, "_blank", "noopener,noreferrer");
        } else if (item.fileUrl) {
          window.open(item.fileUrl, "_blank", "noopener,noreferrer");
        } else {
          toast.error("Arquivo não encontrado.");
        }
        return;
      }
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      if (item.fileUrl) {
        window.open(item.fileUrl, "_blank", "noopener,noreferrer");
      } else {
        toast.error(e?.message ?? "Não foi possível baixar.");
      }
    } finally {
      setDownloadingId(null);
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
            <p className="t-caption font-semibold tracking-[0.14em] text-primary uppercase mt-2">
              Seu negócio
            </p>
            <h1 className="mt-2 t-h1 max-w-3xl">
              Materiais e conteúdos para ajudar o{" "}
              <span className="text-primary">seu negócio a decolar</span>
            </h1>
            <p className="mt-3 t-body text-muted-foreground max-w-2xl">
              PDFs, planilhas e modelos prontos. Cadastre-se uma vez e baixe quantos quiser.
            </p>
          </div>
        </section>

        <section className="py-8 lg:py-10 bg-surface">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {seuNegocioMaterials.map((item) => {
                const soon = !!item.comingSoon;
                const busy = downloadingId === item.id;
                return (
                  <article
                    key={item.id}
                    className="group flex gap-4 rounded-2xl border border-border bg-white p-4 sm:p-5 transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_44px_-16px_rgba(0,0,0,0.12)]"
                  >
                    <div className="relative h-[132px] w-[108px] shrink-0 overflow-hidden rounded-xl bg-secondary">
                      {item.coverUrl || item.cover ? (
                        <img
                          src={item.coverUrl || item.cover}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <FileText className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <span className="absolute left-2 top-2 inline-flex items-center rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                        {typeLabel(item.type)}
                      </span>
                      {soon && (
                        <span className="absolute inset-0 flex items-center justify-center bg-black/45">
                          <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-ink">
                            <Clock className="h-3 w-3" /> Em breve
                          </span>
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1 flex flex-col">
                      <h3 className="text-[15px] font-semibold leading-snug text-ink">{item.title}</h3>
                      {item.description && (
                        <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground line-clamp-3">
                          {item.description}
                        </p>
                      )}
                      <div className="mt-auto pt-3 flex items-center gap-2 flex-wrap">
                        {soon ? (
                          <span className="inline-flex items-center gap-1 text-[12px] text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" /> Em breve
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => void onDownload(item)}
                            disabled={busy}
                            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-primary text-white text-[12.5px] font-medium hover:bg-primary/90 disabled:opacity-60"
                          >
                            {busy ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Download className="h-3.5 w-3.5" />
                            )}
                            Baixar
                          </button>
                        )}
                        {item.premium && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700">
                            <Crown className="h-3 w-3" /> Premium
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />

      <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
        <DialogContent className="sm:max-w-md">
          <div className="space-y-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Lock className="h-5 w-5" />
            </div>
            <h3 className="text-[17px] font-semibold text-ink">Faça login para baixar</h3>
            <p className="text-[13.5px] text-muted-foreground leading-relaxed">
              Os materiais são gratuitos. Entre ou crie sua conta para liberar o download.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => navigate({ to: "/entrar" })}
                className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg bg-primary text-white text-[13px] font-medium"
              >
                Entrar <ArrowRight className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setLoginOpen(false)}
                className="h-10 px-4 rounded-lg border border-border text-[13px] font-medium text-ink"
              >
                Agora não
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
