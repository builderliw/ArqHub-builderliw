import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Lock, Sparkles, ShieldCheck, FileSignature, Loader2 } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { LaudoTecnicoTool } from "@/components/laudo-tecnico-tool";
import { externalSupabase } from "@/integrations/external-supabase/client";
import { LAUDO_TIPOS } from "@/lib/laudo-tecnico";

export const Route = createFileRoute("/conteudos/laudo-tecnico")({
  head: () => ({
    meta: [
      { title: "Gerador de Laudo Técnico de Imóveis | ArqHub" },
      {
        name: "description",
        content:
          "Ferramenta gratuita para quem emite laudo técnico: modelo preenchível, checklist de vistoria e manual para vender o serviço e se credenciar em bancos.",
      },
      { property: "og:title", content: "Gerador de Laudo Técnico de Imóveis | ArqHub" },
      {
        property: "og:description",
        content: "Modelo preenchível, checklist de vistoria e manual de mercado para laudos técnicos de imóveis.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LaudoTecnicoPage,
});

function LaudoTecnicoPage() {
  const [logged, setLogged] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await externalSupabase.auth.getUser();
      if (alive) setLogged(!!data.user);
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="py-8 lg:py-10 bg-surface border-b border-border">
          <div className="mx-auto max-w-7xl px-6">
            <Link
              to="/conteudos/seu-negocio"
              className="inline-flex items-center gap-1.5 t-caption text-muted-foreground hover:text-ink mb-2 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Voltar para conteúdos
            </Link>
            <h1 className="mt-3 t-h1 max-w-3xl">
              Gerador de <span className="text-primary">Laudo Técnico de Imóveis</span>
            </h1>
            <p className="mt-2 t-body text-muted-foreground max-w-2xl">
              Regularização, financiamento, compra e venda, vistoria cautelar, locação e inspeção predial. Preencha o
              modelo, marque o checklist da vistoria e baixe o laudo em PDF ou Word.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3 max-w-3xl">
              <Feature icon={<FileSignature className="h-4 w-4" />} title="Modelo preenchível">
                Campos guiados como no contrato do painel profissional.
              </Feature>
              <Feature icon={<ShieldCheck className="h-4 w-4" />} title="Checklist de vistoria">
                O que observar no imóvel, por sistema construtivo.
              </Feature>
              <Feature icon={<Sparkles className="h-4 w-4" />} title="Manual do serviço">
                Como precificar, onde ofertar e como se credenciar em bancos.
              </Feature>
            </div>
          </div>
        </section>

        <section className="py-8 lg:py-10">
          <div className="mx-auto max-w-7xl px-6">
            {logged === null && (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}

            {logged === false && (
              <div className="space-y-6">
                <div className="rounded-2xl border border-border bg-white p-5 sm:p-6">
                  <h2 className="t-h3 text-ink">Como funciona a ferramenta</h2>
                  <p className="mt-2 t-body-sm text-muted-foreground max-w-3xl">
                    Você escolhe a finalidade do laudo, preenche um modelo guiado (identificação, responsável técnico,
                    dados do imóvel, descrição técnica, avaliação de valor e conclusão), marca em campo o checklist de
                    vistoria, envia as fotos e gera o documento pronto em PDF ou Word — tudo o que for preenchido e
                    marcado entra automaticamente no laudo.
                  </p>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {LAUDO_TIPOS.map((t) => (
                      <article key={t.id} className="rounded-lg border border-border bg-surface p-4">
                        <h3 className="text-sm font-semibold text-ink">{t.nome}</h3>
                        <p className="mt-1.5 t-body-sm text-muted-foreground">{t.resumo}</p>
                        <p className="mt-2 text-[12.5px] text-muted-foreground">
                          <strong className="text-ink">Normas:</strong> {t.normas.join("; ")}
                        </p>
                      </article>
                    ))}
                  </div>
                  <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                    {[
                      "Modelo preenchível com campos guiados por seção",
                      "Checklist de vistoria por sistema construtivo, com observações",
                      "Upload de fotos da vistoria com legenda e registro fotográfico no PDF",
                      "Pré-visualização do laudo antes de baixar",
                      "Exportação em PDF e Word",
                      "Manual de precificação, oferta do serviço e credenciamento em bancos",
                    ].map((i) => (
                      <li key={i} className="flex gap-2 t-body-sm text-muted-foreground">
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                        <span>{i}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mx-auto max-w-xl rounded-2xl border border-border bg-white p-8 text-center">
                  <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Lock className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="mt-4 t-h3 text-ink">Para usar a ferramenta, entre com e-mail e senha</h2>
                  <p className="mt-2 t-body-sm text-muted-foreground">
                    O gerador de laudo, o checklist e o envio de fotos são liberados apenas para quem tem login no
                    ArqHub. Criar a conta é gratuito.
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-3">
                    <Link
                      to="/entrar/$role"
                      params={{ role: "escritorio" }}
                      className="inline-flex items-center gap-1.5 h-11 px-5 rounded-lg bg-primary text-white t-label hover:bg-primary-dark"
                    >
                      Entrar com e-mail e senha <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link
                      to="/cadastro"
                      className="inline-flex items-center gap-1.5 h-11 px-5 rounded-lg border border-border bg-white t-label hover:bg-secondary"
                    >
                      Criar conta grátis
                    </Link>
                  </div>
                </div>
              </div>
            )}


            {logged === true && <LaudoTecnicoTool />}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function Feature({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <div className="flex items-center gap-2 text-primary">{icon}</div>
      <div className="mt-2 text-sm font-semibold text-ink">{title}</div>
      <p className="mt-1 text-[12.5px] text-muted-foreground">{children}</p>
    </div>
  );
}
