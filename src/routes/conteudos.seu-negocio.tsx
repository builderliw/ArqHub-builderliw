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
  loader: async () => {
    try {
      const files = await listMaterialFiles({ data: { category: CATEGORY_SEU_NEGOCIO } });
      const accessMap: Record<string, "free" | "subscriber"> = {};
      for (const f of (files as any[]) ?? []) {
        const key = f?.slug ?? f?.id ?? f?.name;
        if (!key) continue;
        accessMap[key] = f?.subscriber_only ? "subscriber" : "free";
        // also map by material id when name contains it
        for (const m of seuNegocioMaterials) {
          if (String(key).includes(m.id) || m.id === key) {
            accessMap[m.id] = f?.subscriber_only ? "subscriber" : "free";
          }
        }
      }
      // default known free materials as free if listed in static data
      for (const m of seuNegocioMaterials) {
        if (!accessMap[m.id]) accessMap[m.id] = "free";
      }
      return { accessMap };
    } catch {
      const accessMap: Record<string, "free" | "subscriber"> = {};
      for (const m of seuNegocioMaterials) accessMap[m.id] = "free";
      return { accessMap };
    }
  },
  component: SeuNegocio,
});

function SeuNegocio() {
  const navigate = useNavigate();
  const office = useOfficeStatus();
  const isSubscriber = office.status === "active";
  const [selected, setSelected] = useState<SeuNegocioMaterial | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ nome: "", email: "", telefone: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { accessMap } = Route.useLoaderData();
  const filesLoaded = true;

  function validate() {
    const e: Record<string, string> = {};
    if (form.nome.trim().length < 2) e.nome = "Informe seu nome completo.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "E-mail inválido.";
    const digits = form.telefone.replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 11) e.telefone = "Telefone inválido (DDD + número).";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate() || !selected) return;
    setLoading(true);
    try {
      const { data: sess } = await externalSupabase.auth.getSession();
      const accessToken = sess.session?.access_token;
      const res = await getMaterialFileUrl({
        data: { category: CATEGORY_SEU_NEGOCIO, slug: selected.id, accessToken },
      });
      if ((res as any).restricted) {
        toast.error("Este material é exclusivo para assinantes. Assine um plano para baixar.");
        setLoading(false);
        return;
      }
      if (!(res as any).url) {
        toast.error("Este material ainda não está disponível. Tente novamente em breve.");
        setLoading(false);
        return;
      }
      setDownloadUrl((res as any).url);
      setSubmitted(true);
      window.open((res as any).url, "_blank");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao gerar link de download.");
    } finally {
      setLoading(false);
    }
  }

  function openMaterial(m: SeuNegocioMaterial) {
    const access = accessMap[m.id];
    if (!access) {
      toast.message("Este material estará disponível em breve.");
      return;
    }
    if (access === "subscriber" && !isSubscriber) {
      toast.error("Material exclusivo para assinantes.");
      navigate({ to: "/planos" as any });
      return;
    }
    setSelected(m);
    setSubmitted(false);
    setDownloadUrl(null);
    setForm({ nome: "", email: "", telefone: "" });
    setErrors({});
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

        <section className="py-8 lg:py-10 bg-surface">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {seuNegocioMaterials.map((m) => {
                const isSubOnly = accessMap[m.id] === "subscriber";
                const comingSoon = filesLoaded && !accessMap[m.id];
                return (
                  <article
                    key={m.id}
                    className={`group grid grid-cols-[140px_1fr] gap-5 rounded-2xl bg-white border border-border p-5 transition-all ${
                      comingSoon
                        ? "opacity-90"
                        : "hover:-translate-y-0.5 hover:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.18)]"
                    }`}
                  >
                    <div className="relative overflow-hidden rounded-lg bg-ink aspect-[3/4]">
                      <img
                        src={m.cover}
                        alt={m.title}
                        loading="lazy"
                        className={`absolute inset-0 h-full w-full object-cover transition-transform duration-[600ms] ${
                          comingSoon ? "opacity-40 grayscale" : "opacity-70 group-hover:scale-[1.04]"
                        }`}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/30 to-transparent" />
                      <div className="absolute top-2 left-2 inline-flex items-center gap-1 t-caption text-white">
                        <FileText className="h-3 w-3" /> {m.format}
                      </div>
                      <div
                        className={`absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full shadow-md ring-1 ${
                          comingSoon
                            ? "bg-slate-200 text-slate-700 ring-slate-300"
                            : isSubOnly
                              ? "bg-amber-400 text-amber-950 ring-amber-300"
                              : "bg-emerald-500 text-white ring-emerald-300"
                        }`}
                        title={comingSoon ? "Em breve" : isSubOnly ? "Exclusivo para assinantes" : "Download gratuito"}
                      >
                        {comingSoon ? (
                          <Clock className="h-3.5 w-3.5" />
                        ) : isSubOnly ? (
                          <Crown className="h-3.5 w-3.5" />
                        ) : (
                          <Download className="h-3.5 w-3.5" />
                        )}
                      </div>
                      <div className="absolute bottom-2 left-2 right-2">
                        <p className="text-[12px] font-semibold text-white leading-snug line-clamp-2">{m.title}</p>
                      </div>
                    </div>

                    <div className="min-w-0 flex flex-col">
                      <h3 className="text-[15px] font-semibold text-ink leading-snug">{m.title}</h3>
                      <p className="mt-1.5 text-[13px] text-muted-foreground leading-relaxed line-clamp-4">
                        {m.description}
                      </p>
                      <div className="mt-auto pt-3">
                        {comingSoon ? (
                          <span className="inline-flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" /> Em breve
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openMaterial(m)}
                            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-primary text-white text-[12.5px] font-medium hover:bg-primary/90"
                          >
                            <Download className="h-3.5 w-3.5" /> Baixar
                          </button>
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

      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          {selected && !submitted && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <h3 className="text-[17px] font-semibold text-ink">Baixar material</h3>
                <p className="mt-1 text-[13px] text-muted-foreground">{selected.title}</p>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-[12px] font-medium text-ink">Nome completo</label>
                  <input
                    value={form.nome}
                    onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                    className="mt-1 w-full h-10 rounded-lg border border-border px-3 text-[13px] outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  {errors.nome && <p className="mt-1 text-[11px] text-red-600">{errors.nome}</p>}
                </div>
                <div>
                  <label className="text-[12px] font-medium text-ink">E-mail</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="mt-1 w-full h-10 rounded-lg border border-border px-3 text-[13px] outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  {errors.email && <p className="mt-1 text-[11px] text-red-600">{errors.email}</p>}
                </div>
                <div>
                  <label className="text-[12px] font-medium text-ink">Telefone</label>
                  <input
                    value={form.telefone}
                    onChange={(e) => setForm((f) => ({ ...f, telefone: e.target.value }))}
                    className="mt-1 w-full h-10 rounded-lg border border-border px-3 text-[13px] outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="(00) 00000-0000"
                  />
                  {errors.telefone && <p className="mt-1 text-[11px] text-red-600">{errors.telefone}</p>}
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-lg bg-primary text-white text-[13px] font-medium hover:bg-primary/90 disabled:opacity-60 inline-flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {loading ? "Gerando link..." : "Baixar agora"}
              </button>
            </form>
          )}
          {selected && submitted && (
            <div className="space-y-3 text-center py-2">
              <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-[17px] font-semibold text-ink">Download liberado</h3>
              <p className="text-[13px] text-muted-foreground">
                Se o download não iniciou, use o botão abaixo.
              </p>
              {downloadUrl && (
                <a
                  href={downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg bg-primary text-white text-[13px] font-medium"
                >
                  <Download className="h-4 w-4" /> Baixar arquivo
                </a>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
