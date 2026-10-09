import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useOfficeStatus } from "@/hooks/use-office-status";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ArrowLeft, ArrowRight, Download, FileText, CheckCircle2, Loader2, Lock, Crown, Clock, ShoppingCart, Sparkles } from "lucide-react";
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
    ],
  }),
  loader: async () => {
    try {
      const res = await listMaterialFiles({ data: { category: CATEGORY_SEU_NEGOCIO } });
      const map: Record<string, "free" | "subscriber"> = {};
      for (const f of res.items as Array<{ slug: string; access_level?: "free" | "subscriber" }>) {
        map[f.slug] = f.access_level ?? "free";
      }
      return { accessMap: map };
    } catch {
      return { accessMap: {} as Record<string, "free" | "subscriber"> };
    }
  },
  component: SeuNegocio,
  errorComponent: ({ error }) => (
    <div className="p-8 text-center t-body" role="alert">
      {error instanceof Error ? error.message : "Erro ao carregar materiais."}
    </div>
  ),
  notFoundComponent: () => <div className="p-8 text-center t-body">Nada encontrado.</div>,
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
      if (res.restricted) {
        toast.error("Este material é exclusivo para assinantes. Assine um plano para baixar.");
        setLoading(false);
        return;
      }
      if (!res.url) {
        toast.error("Este material ainda não está disponível. Tente novamente em breve.");
        setLoading(false);
        return;
      }
      setDownloadUrl(res.url);
      setSubmitted(true);
      window.open(res.url, "_blank");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao gerar link");
    } finally {
      setLoading(false);
    }
  }

  function closeDialog() {
    setSelected(null);
    setSubmitted(false);
    setDownloadUrl(null);
    setForm({ nome: "", email: "", telefone: "" });
    setErrors({});
  }


  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        {/* HERO */}
        <section className="py-8 lg:py-10 bg-surface border-b border-border">
          <div className="mx-auto max-w-7xl px-6">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 t-caption text-muted-foreground hover:text-ink mb-2 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao site
            </Link>
            <div className="t-eyebrow text-primary mb-2">Seu Negócio</div>
            <h1 className="t-h1 max-w-3xl">
              Materiais e conteúdos para ajudar o <span className="text-primary">seu negócio a decolar</span>
            </h1>
            <p className="mt-2 t-body text-muted-foreground max-w-2xl">
              PDFs, planilhas e modelos prontos. Cadastre-se uma vez e baixe quantos quiser.
            </p>
          </div>
        </section>

        {/* NOVIDADE: FERRAMENTA DE LAUDO TÉCNICO */}
        <section className="py-6 bg-surface">
          <div className="mx-auto max-w-7xl px-6">
            <Link
              to="/conteudos/laudo-tecnico"
              className="group block rounded-2xl border border-primary/30 bg-white p-6 sm:p-7 transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_44px_-16px_rgba(75,98,65,0.35)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-2xl">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 t-caption font-semibold text-primary">
                    <Sparkles className="h-3.5 w-3.5" /> Grande novidade · Ferramenta
                  </span>
                  <h2 className="mt-3 t-h3 text-ink">Gerador de Laudo Técnico de Imóveis</h2>
                  <p className="mt-2 t-body-sm text-muted-foreground">
                    Para quem emite laudo de regularização, financiamento, compra e venda, vistoria cautelar, locação ou
                    inspeção predial. Modelo preenchível, checklist do que observar no imóvel e manual de como e onde
                    oferecer o serviço — incluindo credenciamento em bancos e editais.
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 h-11 px-5 rounded-lg bg-primary text-white t-label shrink-0">
                  Abrir ferramenta <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
              <p className="mt-3 t-caption text-muted-foreground">
                Disponível para quem tem login na plataforma.
              </p>
            </Link>
          </div>
        </section>




        {/* GRID */}
        <section className="py-8 lg:py-10 bg-surface">
          <div className="mx-auto max-w-7xl px-6">

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-2">
              {seuNegocioMaterials.map((m) => {
                const isSubOnly = accessMap[m.id] === "subscriber";
                const comingSoon = filesLoaded && !accessMap[m.id];
                return (
                <article
                  key={m.id}
                  className={`group grid grid-cols-[140px_1fr] gap-5 rounded-2xl bg-white border border-border p-5 transition-all ${comingSoon ? "opacity-90" : "hover:-translate-y-0.5 hover:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.18)]"}`}
                >
                  <div className="relative overflow-hidden rounded-lg bg-ink aspect-[3/4]">
                    <img
                      src={m.cover}
                      alt={m.title}
                      loading="lazy"
                      className={`absolute inset-0 h-full w-full object-cover transition-transform duration-[600ms] ${comingSoon ? "opacity-40 grayscale" : "opacity-70 group-hover:scale-[1.04]"}`}
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
                      aria-label={comingSoon ? "Em breve" : isSubOnly ? "Exclusivo para assinantes" : "Download gratuito"}
                    >
                      {comingSoon ? <Clock className="h-3.5 w-3.5" /> : isSubOnly ? <Crown className="h-3.5 w-3.5" /> : <Download className="h-3.5 w-3.5" />}
                    </div>
                    {comingSoon && (
                      <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 text-center">
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 t-caption font-semibold text-ink shadow">
                          <Clock className="h-3 w-3" /> Em breve
                        </span>
                      </div>
                    )}
                    <div className="absolute bottom-2 left-2 right-2 t-caption font-semibold text-white line-clamp-3">
                      {m.title}
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <h3 className="t-h4 text-ink line-clamp-2">{m.title}</h3>
                    <p className="mt-2 t-body-sm text-muted-foreground line-clamp-4">{m.description}</p>
                    <div className="mt-auto pt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                      <button
                        disabled={comingSoon}
                        onClick={() => {
                          if (comingSoon) return;
                          if (isSubOnly && !isSubscriber) {
                            navigate({ to: "/planos" });
                            return;
                          }
                          setSelected(m);
                        }}
                        className={`inline-flex items-center gap-1.5 t-label transition-all rounded-md px-2 py-1 ${
                          comingSoon
                            ? "text-muted-foreground cursor-not-allowed"
                            : isSubOnly
                              ? "text-amber-700 hover:text-amber-900 hover:bg-amber-100 hover:shadow-[0_0_16px_rgba(251,191,36,0.45)]"
                              : "text-primary hover:text-primary-dark hover:bg-primary/10"
                        }`}
                      >
                        {comingSoon ? (
                          <><Clock className="h-4 w-4" /> Em breve</>
                        ) : isSubOnly ? (
                          isSubscriber ? (
                            <><Crown className="h-4 w-4" /> Baixar (assinante)</>
                          ) : (
                            <><Lock className="h-4 w-4" /> Assinar para baixar</>
                          )
                        ) : (
                          <><Download className="h-4 w-4" /> Baixar gratuitamente</>
                        )}
                      </button>

                      {!comingSoon && isSubOnly && !isSubscriber && (
                        <Link
                          to="/comprar-material/$slug"
                          params={{ slug: m.id }}
                          className="group relative inline-flex items-center gap-1.5 rounded-full bg-ink px-3.5 py-2 t-caption font-semibold text-white shadow-[0_4px_14px_-4px_rgba(0,0,0,0.35)] hover:shadow-[0_6px_20px_-6px_rgba(75,98,65,0.45)] transition-all"
                        >
                          <ShoppingCart className="relative h-3.5 w-3.5" />
                          <span className="relative">Comprar avulso R$ 29,90</span>
                        </Link>
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

      {/* LEAD DIALOG */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="max-w-md p-0 overflow-hidden bg-white border-border">
          {selected && !submitted && (
            <div className="p-7">
              <div className="t-eyebrow text-primary">Download gratuito</div>
              <h3 className="mt-2 t-h3 text-ink">{selected.title}</h3>
              <p className="mt-2 t-body-sm text-muted-foreground">
                Preencha seus dados para liberar o download. É grátis.
              </p>

              <form onSubmit={handleSubmit} className="mt-5 space-y-3">
                <div>
                  <label className="t-caption font-semibold text-foreground/70">Nome completo</label>
                  <input
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    maxLength={100}
                    className="mt-1 w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="Seu nome"
                  />
                  {errors.nome && <p className="mt-1 text-xs text-red-600">{errors.nome}</p>}
                </div>
                <div>
                  <label className="t-caption font-semibold text-foreground/70">E-mail</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    maxLength={255}
                    className="mt-1 w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="seu@email.com"
                  />
                  {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                </div>
                <div>
                  <label className="t-caption font-semibold text-foreground/70">Telefone (WhatsApp)</label>
                  <input
                    type="tel"
                    value={form.telefone}
                    onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                    maxLength={20}
                    className="mt-1 w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="(00) 00000-0000"
                  />
                  {errors.telefone && <p className="mt-1 text-xs text-red-600">{errors.telefone}</p>}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 inline-flex items-center justify-center gap-1.5 h-11 bg-primary text-white rounded-lg t-label hover:bg-primary-dark transition-colors disabled:opacity-70"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Liberar download <ArrowRight className="h-4 w-4" /></>}
                </button>

                <p className="t-caption text-muted-foreground text-center">
                  Ao baixar, você concorda em receber novidades e promoções da ArqHub.
                </p>
              </form>
            </div>
          )}

          {selected && submitted && (
            <div className="p-7 text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mt-4 t-h3 text-ink">Download liberado!</h3>
              <p className="mt-2 t-body-sm text-muted-foreground">
                Se o download não iniciar automaticamente, clique no botão abaixo.
              </p>
              {downloadUrl && (
                <a
                  href={downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex items-center gap-1.5 px-5 h-10 bg-ink text-white rounded-lg t-label hover:bg-black transition-colors"
                >
                  <Download className="h-4 w-4" /> Baixar agora
                </a>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <SiteFooter />
    </div>
  );
}
