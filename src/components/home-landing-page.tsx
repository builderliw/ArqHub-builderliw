import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { SiteHeader } from "@/components/site-header";
import { HomeRecursosSection } from "@/components/home-recursos-section";
import { HomeLandingRest } from "@/components/home-landing-rest";
import { SiteFooter } from "@/components/site-footer";
import {
  ArrowRight, Calendar, Monitor, Smartphone, Cloud,
  MessageSquare, FileText, CheckCircle2, BookOpen,
} from "lucide-react";
import heroAsset from "@/assets/hero-carnava.png.asset.json";
import portalClienteInterior from "@/assets/portal-cliente-interior.jpg";

export function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    import("@/lib/pwa-detect").then(({ isPwaStandalone }) => {
      if (isPwaStandalone()) {
        window.location.replace("/app");
      }
    });
  }, [navigate]);

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
                  className="group inline-flex items-center gap-2 px-6 h-12 bg-ink text-white rounded-lg text-[15px] font-medium hover:bg-black transition-all duration-150 shadow-[0_1px_0_0_rgb(255_255_255/0.08)_inset,0_2px_4px_0_rgb(0_0_0/0.10),0_8px_24px_-4px_rgb(0_0_0/0.18)] active:scale-[0.985]"
                >
                  Começar grátis
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform duration-150" strokeWidth={2} />
                </Link>
                <a
                  href="https://arqhub-academy.world"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2 px-6 h-12 bg-primary text-primary-foreground rounded-lg text-[15px] font-medium hover:bg-primary-dark transition-all duration-150 shadow-[0_1px_0_0_rgb(255_255_255/0.10)_inset,0_2px_4px_0_rgb(0_0_0/0.08),0_8px_24px_-6px_rgb(75_98_65/0.45)] active:scale-[0.985]"
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

        <button
          type="button"
          onClick={() => {
            const url = new URL(window.location.href);
            url.searchParams.set("install", "app");
            window.history.replaceState({}, "", url.toString());
            window.dispatchEvent(new Event("arqhub:install-now"));
          }}
          className="group relative block w-full overflow-hidden border-y border-primary/15 bg-gradient-to-r from-primary/10 via-primary/[0.04] to-primary/10 backdrop-blur-md transition-colors hover:from-primary/15 hover:via-primary/10 hover:to-primary/15"
          aria-label="Baixe o app ArqHub"
        >
          <div className="marquee relative py-1.5">
            <div className="marquee-track text-[13px] sm:text-sm font-medium tracking-wide text-foreground/85">
              {Array.from({ length: 6 }).map((_, i) => (
                <span key={i} className="mx-10 inline-flex items-center gap-3">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_10px_hsl(var(--primary))]" />
                  <span>
                    Baixe o app <span className="font-semibold text-foreground">ArqHub</span> e tenha a melhor plataforma de projetos na palma da mão
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                    clique aqui para baixar agora →
                  </span>
                </span>
              ))}
            </div>
          </div>
        </button>

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

        <section className="py-16 sm:py-20 lg:py-28 bg-[#F4F4F2]">
          <div className="mx-auto max-w-7xl px-5 sm:px-6 grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div className="relative order-1">
              <div className="relative rounded-2xl sm:rounded-[1.75rem] overflow-hidden shadow-[0_25px_70px_-30px_rgba(15,23,42,0.35)] ring-1 ring-black/5">
                <img
                  src={portalClienteInterior}
                  alt="Interior de projeto arquitetônico"
                  width={1280}
                  height={960}
                  loading="lazy"
                  className="w-full h-auto object-cover aspect-[4/3]"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent" />
              </div>

              <div className="md:absolute md:top-8 md:right-8 md:w-[270px] mt-4 md:mt-0 rounded-2xl bg-white/95 backdrop-blur-sm shadow-[0_15px_45px_-15px_rgba(15,23,42,0.25)] p-4 ring-1 ring-black/[0.04]">
                <div className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.18em] text-muted-foreground">
                  <MessageSquare className="h-3.5 w-3.5 text-primary" />
                  MENSAGEM DO CLIENTE
                </div>
                <p className="mt-2 text-sm text-[#3f3f3d] leading-snug">
                  "Adorei a versão da fachada. Aprovado para seguirmos!" — Mariana
                </p>
                <button type="button" className="mt-3 w-full text-xs font-semibold py-2 rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors">
                  Registrar aprovação
                </button>
              </div>

              <div className="md:absolute md:bottom-8 md:left-8 md:w-[230px] mt-3 md:mt-0 rounded-2xl bg-white/95 backdrop-blur-sm shadow-[0_15px_45px_-15px_rgba(15,23,42,0.25)] p-4 ring-1 ring-black/[0.04] flex items-center gap-3 md:block">
                <div className="h-9 w-9 shrink-0 md:hidden grid place-items-center rounded-full bg-primary/10">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-semibold tracking-[0.18em] text-muted-foreground">PRÓXIMA ETAPA</div>
                  <div className="mt-0.5 md:mt-1 text-sm font-bold text-[#3f3f3d] truncate">Reunião de aprovação</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Sex · 14h00</div>
                </div>
              </div>
            </div>

            <div className="order-2">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                PORTAL DO CLIENTE
              </div>
              <h2 className="mt-3 font-display text-[28px] sm:text-4xl lg:text-5xl font-semibold tracking-tight text-[#3f3f3d] leading-[1.1]">
                Uma experiência <span className="text-primary">à altura</span> do seu projeto.
              </h2>
              <p className="mt-4 text-[15px] text-[#5b5b54] leading-relaxed max-w-xl">
                Seu cliente acompanha o cronograma, aprova etapas, baixa documentos e conversa com sua equipe — tudo em uma interface que reflete o nível do seu escritório.
              </p>

              <div className="mt-7 sm:mt-8 grid sm:grid-cols-2 gap-2.5 sm:gap-3">
                {[
                  { icon: Calendar, label: "Cronograma vivo" },
                  { icon: FileText, label: "Documentos centralizados" },
                  { icon: MessageSquare, label: "Mensagens em contexto" },
                  { icon: CheckCircle2, label: "Aprovações registradas" },
                ].map((f) => (
                  <div
                    key={f.label}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white ring-1 ring-black/[0.05] text-sm font-medium text-[#3f3f3d]"
                  >
                    <span className="h-8 w-8 shrink-0 grid place-items-center rounded-lg bg-primary/10">
                      <f.icon className="h-4 w-4 text-primary" />
                    </span>
                    <span className="truncate">{f.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <HomeRecursosSection />
        <HomeLandingRest />
      </main>

      <SiteFooter />
    </div>
  );
}
