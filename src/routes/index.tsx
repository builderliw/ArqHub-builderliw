import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowRight, BookOpen, Monitor, Smartphone, Cloud } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { HomeRecursosSection } from "@/components/home-recursos-section";
import heroAsset from "@/assets/hero-carnava.png.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ArqHub — Gestão para Arquitetura, Engenharia e Interiores" },
      {
        name: "description",
        content: "Gerencie projetos, clientes, obras e finanças em um único lugar.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  useEffect(() => {
    import("@/lib/pwa-detect").then(({ isPwaStandalone }) => {
      if (isPwaStandalone()) {
        window.location.replace("/app");
      }
    });
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />

      <main className="flex-1">
        <section className="relative overflow-hidden bg-background">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute inset-0 [background-image:linear-gradient(to_right,rgb(0_0_0/0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgb(0_0_0/0.035)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]" />
            <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[480px] w-[820px] rounded-full bg-primary/15 blur-[120px]" />
          </div>

          <div className="mx-auto max-w-7xl px-6 pt-10 pb-14 lg:pt-16 lg:pb-20 grid lg:grid-cols-[1fr_1.05fr] gap-10 lg:gap-16 items-center">
            <div className="max-w-[640px]">
              <h1 className="font-display text-[36px] sm:text-[44px] lg:text-[54px] leading-[1.05] tracking-[-0.025em] text-ink font-semibold text-balance">
                Gerencie seus <span className="text-primary">projetos</span>, unifique{" "}
                <span className="text-primary">obra</span> e <span className="text-primary">clientes</span> em um só lugar.
              </h1>
              <p className="mt-5 text-[15px] text-ink-muted leading-relaxed max-w-[520px] text-pretty">
                Projetos, clientes, documentos e financeiro organizados em uma única plataforma.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <Link
                  to="/cadastro"
                  className="group inline-flex items-center gap-2 px-6 h-12 bg-ink text-white rounded-lg text-[15px] font-medium hover:bg-black transition-all"
                >
                  Começar grátis
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" strokeWidth={2} />
                </Link>
                <a
                  href="https://arqhub-academy.world"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2 px-6 h-12 bg-primary text-primary-foreground rounded-lg text-[15px] font-medium hover:bg-primary-dark transition-all"
                >
                  <BookOpen className="h-4 w-4" strokeWidth={2} />
                  ArqHub Academy
                </a>
              </div>

              <div className="mt-8 pt-6 border-t border-border/70">
                <p className="text-[12.5px] text-muted-foreground mb-4">
                  Sem cartão de crédito · Cancele quando quiser
                </p>
                <div className="grid sm:grid-cols-3 gap-4">
                  {[
                    { icon: Monitor, title: "Sem instalar nada", desc: "Chrome, Safari ou Edge — sem setup." },
                    { icon: Smartphone, title: "Android & iOS", desc: "Instale como app pelo celular (PWA)." },
                    { icon: Cloud, title: "Dados em nuvem", desc: "Abriu no PC, já aparece no celular." },
                  ].map((f) => (
                    <div key={f.title} className="flex items-start gap-2.5">
                      <f.icon className="h-4 w-4 mt-0.5 text-primary shrink-0" strokeWidth={1.8} />
                      <div>
                        <div className="text-[13px] font-semibold text-ink leading-tight">{f.title}</div>
                        <div className="text-[12px] text-muted-foreground leading-snug mt-0.5">{f.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative w-full max-w-[720px] mx-auto lg:-mr-8">
                <img src={heroAsset.url} alt="Profissionais usando o ArqHub" className="w-full h-auto object-contain" />
              </div>
            </div>
          </div>
        </section>

        <section className="bg-primary text-white">
          <div className="mx-auto max-w-7xl px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { big: "14 dias", small: "Teste gratuito, sem cartão" },
              { big: "Web + App", small: "Desktop, Android e iOS" },
              { big: "Ilimitados", small: "Sem limites de projetos" },
              { big: "R$129,99", small: "Por mês, no plano básico" },
            ].map((i) => (
              <div key={i.big}>
                <div className="text-2xl md:text-3xl font-bold tracking-tight">{i.big}</div>
                <div className="mt-1 text-sm text-white/85">{i.small}</div>
              </div>
            ))}
          </div>
        </section>

        <HomeRecursosSection />

        <section className="py-16 bg-white">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <h2 className="font-display text-3xl font-semibold text-ink">Pronto para organizar o escritório?</h2>
            <p className="mt-3 text-muted-foreground">14 dias grátis. Sem cartão. Cancele quando quiser.</p>
            <Link
              to="/cadastro"
              className="mt-8 inline-flex items-center gap-2 px-6 h-12 bg-ink text-white rounded-lg text-[15px] font-medium hover:bg-black"
            >
              Começar grátis <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
