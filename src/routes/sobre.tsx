import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Target, Heart, Zap } from "lucide-react";

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre — ArqHub" },
      { name: "description", content: "Conheça a missão, visão e valores da ArqHub — gestão premium para escritórios de arquitetura." },
    ],
  }),
  component: SobrePage,
});

function SobrePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <SiteHeader />
      <main className="flex-1">
        <section className="max-w-3xl mx-auto px-6 py-16">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← Voltar</Link>
          <h1 className="mt-6 font-display text-4xl md:text-5xl tracking-tight">Sobre a ArqHub</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Nascemos para resolver um problema real: escritórios de arquitetura entregam projetos
            incríveis, mas perdem tempo demais com planilhas, e-mails e ferramentas desconectadas.
            A ArqHub unifica gestão, comunicação e experiência do cliente em uma só plataforma.
          </p>

          <div className="mt-12 grid sm:grid-cols-3 gap-5">
            <div className="rounded-2xl border border-border p-6">
              <Target className="h-6 w-6 text-primary mb-3" />
              <h3 className="font-semibold text-ink">Missão</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Elevar a gestão dos escritórios de arquitetura no Brasil.
              </p>
            </div>
            <div className="rounded-2xl border border-border p-6">
              <Heart className="h-6 w-6 text-primary mb-3" />
              <h3 className="font-semibold text-ink">Valores</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Cliente no centro, design impecável, simplicidade e confiança.
              </p>
            </div>
            <div className="rounded-2xl border border-border p-6">
              <Zap className="h-6 w-6 text-primary mb-3" />
              <h3 className="font-semibold text-ink">Visão</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Ser o sistema operacional dos escritórios de arquitetura.
              </p>
            </div>
          </div>

          <div className="mt-12 prose prose-neutral max-w-none">
            <h2>Nossa história</h2>
            <p>
              A ArqHub foi criada por profissionais que viveram na prática a dor de gerir projetos
              de arquitetura com ferramentas genéricas. Combinamos décadas de experiência em
              arquitetura, gestão e tecnologia para construir a plataforma que sempre quisemos usar.
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
