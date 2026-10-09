import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";

export const Route = createFileRoute("/conteudos/potencializador")({
  head: () => ({
    meta: [
      { title: "Potencializador — Matérias especiais | ArqHub" },
      {
        name: "description",
        content:
          "Matérias especiais e tendências para potencializar a gestão de obras e projetos: IA, sustentabilidade, tecnologia e o futuro do setor.",
      },
      { property: "og:title", content: "Potencializador — Matérias especiais | ArqHub" },
      {
        property: "og:description",
        content: "Matérias especiais sobre tendências em arquitetura e construção.",
      },
    ],
  }),
  component: Potencializador,
});

type Feature = {
  id: string;
  category: "Tendências" | "Projetos e Obras" | "Tecnologia" | "Marketing" | "Gestão" | "Vendas";
  title: string;
  excerpt: string;
  cover: string;
  featured?: boolean;
};

const features: Feature[] = [
  {
    id: "ia-financeiro",
    category: "Tendências",
    title: "O primeiro Agente de IA Financeiro da Construção Civil",
    excerpt:
      "Como a IA está transformando o controle financeiro de obras: lançamentos por foto, conciliação automática e previsão de fluxo de caixa.",
    cover:
      "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1600&q=80",
    featured: true,
  },
  {
    id: "regras-caixa",
    category: "Projetos e Obras",
    title: "Saiba tudo sobre as novas regras da Caixa e FGTS",
    excerpt:
      "As mudanças no financiamento habitacional e como elas afetam o seu pipeline de obras residenciais.",
    cover:
      "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "tcpo",
    category: "Gestão",
    title: "Entendendo a TCPO: como utilizar a Tabela de Composição de Preços para Orçamentos",
    excerpt:
      "Guia prático para usar a TCPO no dia a dia do escritório e ganhar precisão nos orçamentos.",
    cover:
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "ia-construcao",
    category: "Tecnologia",
    title: "Utilizando inteligência artificial na construção civil",
    excerpt:
      "Onde a IA já entrega resultado real: levantamento de quantitativos, programação de obra e atendimento ao cliente.",
    cover:
      "https://images.unsplash.com/photo-1535378917042-10a22c95931a?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "cub",
    category: "Projetos e Obras",
    title: "Aprenda sobre o CUB (Custo Unitário Básico) e aplique no seu escritório",
    excerpt:
      "O que é, como é calculado e quando faz sentido usar como referência de orçamento.",
    cover:
      "https://images.unsplash.com/photo-1581094288338-2314dddb7ece?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "relatorio-visita",
    category: "Projetos e Obras",
    title: "Como elaborar um relatório de visita técnica que protege o escritório",
    excerpt:
      "Modelo, estrutura e dicas para documentar visitas e evitar dores de cabeça jurídicas.",
    cover:
      "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "sustentabilidade",
    category: "Tendências",
    title: "Sustentabilidade na construção civil: o caminho para um planeta melhor",
    excerpt:
      "Materiais, certificações e práticas que já são exigidas pelos clientes premium em 2026.",
    cover:
      "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "automacao-predial",
    category: "Tecnologia",
    title: "Automação predial: um caminho de inovação e sustentabilidade",
    excerpt:
      "Do projeto à entrega: como integrar automação sem inflar o orçamento da obra.",
    cover:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "execucao-obras",
    category: "Projetos e Obras",
    title: "Execução de obras: importância, responsabilidades e boas práticas",
    excerpt:
      "O que o coordenador de obra precisa controlar de verdade para entregar no prazo.",
    cover:
      "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1200&q=80",
  },
];

const categories = [
  "Todos",
  "Tendências",
  "Projetos e Obras",
  "Tecnologia",
  "Marketing",
  "Gestão",
  "Vendas",
] as const;

function Potencializador() {
  const [filter, setFilter] = useState<(typeof categories)[number]>("Todos");
  const visible = filter === "Todos" ? features : features.filter((f) => f.category === filter);
  const hero = features.find((f) => f.featured) ?? features[0];
  const rest = visible.filter((f) => f.id !== hero.id);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        {/* HERO */}
        <section className="py-14 lg:py-20 bg-surface border-b border-border">
          <div className="mx-auto max-w-7xl px-6">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 t-caption text-muted-foreground hover:text-ink mb-4 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao site
            </Link>
            <div className="t-eyebrow text-primary mb-3">Potencializador</div>
            <h1 className="t-h1 max-w-3xl">
              Conteúdos para potencializar o seu negócio e a sua gestão de obras e projetos
            </h1>
            <p className="mt-4 t-body text-muted-foreground max-w-2xl">
              Matérias especiais, tendências e análises do time ArqHub para você ficar à frente do mercado.
            </p>

            {/* Filtros */}
            <div className="mt-8 flex flex-wrap gap-2">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setFilter(c)}
                  className={`t-label px-4 py-1.5 rounded-full border transition-colors ${
                    filter === c
                      ? "bg-ink text-white border-ink"
                      : "bg-white text-muted-foreground border-border hover:text-ink hover:border-ink/30"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURED */}
        {filter === "Todos" && (
          <section className="py-12 bg-surface">
            <div className="mx-auto max-w-7xl px-6">
              <Link
                to="/conteudos/potencializador/ia-financeiro"
                className="block group"
              >
                <article className="grid md:grid-cols-2 overflow-hidden rounded-2xl bg-white border border-border shadow-[0_8px_30px_-12px_rgba(0,0,0,0.12)] transition-all group-hover:shadow-[0_16px_50px_-16px_rgba(0,0,0,0.2)]">
                  <div className="relative aspect-[4/3] md:aspect-auto bg-secondary overflow-hidden">
                    <img
                      src={hero.cover}
                      alt={hero.title}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-[600ms] group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="p-8 lg:p-10 flex flex-col justify-center">
                    <div className="t-eyebrow text-primary">{hero.category} · Destaque</div>
                    <h2 className="mt-3 t-h2 text-ink">{hero.title}</h2>
                    <p className="mt-3 t-body text-muted-foreground">{hero.excerpt}</p>
                    <div className="mt-5 t-caption text-muted-foreground">by Equipe ArqHub</div>
                  </div>
                </article>
              </Link>
            </div>
          </section>
        )}

        {/* GRID */}
        <section className="py-12 lg:py-16">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((f) => {
                const cardInner = (
                  <>
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img
                        src={f.cover}
                        alt={f.title}
                        loading="lazy"
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-[600ms] ease-out group-hover:scale-[1.04]"
                      />
                    </div>
                    <div className="p-5">
                      <div className="t-caption text-primary">{f.category}</div>
                      <h3 className="mt-1 t-h4 text-ink line-clamp-2">{f.title}</h3>
                      <p className="mt-2 t-body-sm text-muted-foreground line-clamp-3">{f.excerpt}</p>
                      <div className="mt-4 flex items-center justify-between t-caption text-muted-foreground">
                        <span>by Equipe ArqHub</span>
                      </div>
                    </div>
                  </>
                );
                const cls =
                  "group overflow-hidden rounded-2xl bg-white border border-border transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.18)]";
                const linkMap: Record<string, string> = {
                  "ia-financeiro": "/conteudos/potencializador/ia-financeiro",
                  "regras-caixa": "/conteudos/potencializador/regras-caixa",
                  "tcpo": "/conteudos/potencializador/tcpo",
                  "ia-construcao": "/conteudos/potencializador/ia-construcao",
                  "cub": "/conteudos/potencializador/cub",
                  "relatorio-visita": "/conteudos/potencializador/relatorio-visita",
                  "sustentabilidade": "/conteudos/potencializador/sustentabilidade",
                  "automacao-predial": "/conteudos/potencializador/automacao-predial",
                  "execucao-obras": "/conteudos/potencializador/execucao-obras",
                };
                if (linkMap[f.id]) {
                  return (
                    <Link key={f.id} to={linkMap[f.id]} className={cls}>
                      {cardInner}
                    </Link>
                  );
                }
                return (
                  <article key={f.id} className={cls}>
                    {cardInner}
                  </article>
                );
              })}
            </div>
          </div>
        </section>

      </main>
      <SiteFooter />
    </div>
  );
}
