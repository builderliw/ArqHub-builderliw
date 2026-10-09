import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ArrowLeft, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/conteudos/empreenda")({
  head: () => ({
    meta: [
      { title: "Empreenda — Conteúdos exclusivos | ArqHub" },
      {
        name: "description",
        content:
          "Artigos exclusivos sobre gestão, captação de clientes, vendas e produtividade para escritórios de arquitetura e construção.",
      },
      { property: "og:title", content: "Empreenda — Conteúdos exclusivos | ArqHub" },
      {
        property: "og:description",
        content: "Artigos exclusivos para empreendedores de arquitetura e construção.",
      },
    ],
  }),
  component: Empreenda,
});

type Article = {
  id: string;
  category: "Gestão" | "Captação de clientes" | "Vendas" | "Experiência do cliente" | "Produtividade";
  title: string;
  excerpt: string;
  cover: string;
  author: string;
};

const articles: Article[] = [
  {
    id: "precificacao",
    category: "Gestão",
    title: "Precificação por projeto: como sair do achismo e ter margem real",
    excerpt:
      "Método prático para precificar projetos considerando horas, complexidade e margem desejada.",
    cover:
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80",
    author: "Equipe ArqHub",
  },
  {
    id: "trafego-pago",
    category: "Captação de clientes",
    title: "Tráfego pago: comece pelo Google Ads e não pelo Instagram.",
    excerpt:
      "Como utilizar as plataformas de anúncio de forma estratégica para captar mais projetos e obras para o seu negócio.",
    cover:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
    author: "Equipe ArqHub",
  },
  {
    id: "sair-do-operacional",
    category: "Gestão",
    title: "O dono no gargalo: como escalar um escritório de arquitetura sem depender de você",
    excerpt:
      "Quando o crescimento trava porque tudo passa por uma única pessoa, o problema não é demanda — é operação. Veja o caminho para mudar isso.",
    cover:
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80",
    author: "Equipe ArqHub",
  },
  {
    id: "marketing-digital",
    category: "Captação de clientes",
    title: "Marketing digital para arquitetos: o que está em alta em 2026",
    excerpt:
      "Estratégias práticas para gerar leads qualificados sem depender apenas de indicação.",
    cover:
      "https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?auto=format&fit=crop&w=1200&q=80",
    author: "Equipe ArqHub",
  },
  {
    id: "venda-solucoes",
    category: "Vendas",
    title: "Pare de vender projetos ou obras, venda soluções!",
    excerpt:
      "Como oferecer soluções para o seu cliente (e não apenas projetos ou obras) e agregar valor ao seu serviço.",
    cover:
      "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1200&q=80",
    author: "Equipe ArqHub",
  },
  {
    id: "follow-up",
    category: "Captação de clientes",
    title: "Follow-up: a arte de transformar orçamento em contrato",
    excerpt:
      "O que falar, quando e como — sem parecer chato — para fechar mais propostas.",
    cover:
      "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1200&q=80",
    author: "Equipe ArqHub",
  },
  {
    id: "experiencia-cliente",
    category: "Experiência do cliente",
    title: "Portal do cliente: por que escritórios que adotam ganham +30% de indicação",
    excerpt:
      "Transparência na obra vira o seu maior canal de vendas. Veja como estruturar.",
    cover:
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1200&q=80",
    author: "Equipe ArqHub",
  },
  {
    id: "produtividade-equipe",
    category: "Produtividade",
    title: "Como organizar a equipe técnica e reduzir retrabalho em 40%",
    excerpt:
      "Rotinas, papéis e ferramentas para um escritório que entrega no prazo, sem caos.",
    cover:
      "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80",
    author: "Equipe ArqHub",
  },
  {
    id: "vendas-consultivas",
    category: "Vendas",
    title: "Vendas consultivas: como cobrar mais e ainda assim ser escolhido",
    excerpt:
      "O posicionamento de especialista que transforma a conversa de preço em conversa de valor.",
    cover:
      "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
    author: "Equipe ArqHub",
  },
];

const categories = [
  "Todos",
  "Gestão",
  "Captação de clientes",
  "Vendas",
  "Experiência do cliente",
  "Produtividade",
] as const;

function Empreenda() {
  const [filter, setFilter] = useState<(typeof categories)[number]>("Todos");
  const visible = filter === "Todos" ? articles : articles.filter((a) => a.category === filter);

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
            <div className="t-eyebrow text-primary mb-3">Empreenda</div>
            <h1 className="t-h1 max-w-3xl">
              Te ajudamos a construir um negócio de arquitetura e construção de{" "}
              <span className="text-primary">sucesso</span>
            </h1>
            <p className="mt-4 t-body text-muted-foreground max-w-2xl">
              Conteúdos exclusivos feitos pelo time ArqHub para empreendedores de arquitetura
              e construção civil.
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

        {/* CONTENT */}
        <section className="py-12 lg:py-16">
          <div className="mx-auto max-w-7xl px-6">
            {/* Grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

              {visible.map((a) => {
                const cardInner = (
                  <>
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img
                        src={a.cover}
                        alt={a.title}
                        loading="lazy"
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-[600ms] ease-out group-hover:scale-[1.04]"
                      />
                      <span className="absolute top-3 left-3 t-caption bg-white/90 backdrop-blur text-ink px-2.5 py-1 rounded-full">
                        {a.category}
                      </span>
                    </div>
                    <div className="p-5">
                      <h3 className="t-h4 text-ink line-clamp-2">{a.title}</h3>
                      <p className="mt-2 t-body-sm text-muted-foreground line-clamp-3">{a.excerpt}</p>
                      <div className="mt-4 t-caption text-muted-foreground">{a.author}</div>
                    </div>
                  </>
                );
                const cls =
                  "group block overflow-hidden rounded-2xl bg-white border border-border transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.18)]";
                if (a.id === "sair-do-operacional") {
                  return (
                    <Link key={a.id} to="/conteudos/empreenda/sair-do-operacional" className={cls}>
                      {cardInner}
                    </Link>
                  );
                }
                if (a.id === "trafego-pago") {
                  return (
                    <Link key={a.id} to="/conteudos/empreenda/trafego-pago" className={cls}>
                      {cardInner}
                    </Link>
                  );
                }
                if (a.id === "venda-solucoes") {
                  return (
                    <Link key={a.id} to="/conteudos/empreenda/venda-solucoes" className={cls}>
                      {cardInner}
                    </Link>
                  );
                }
                if (a.id === "follow-up") {
                  return (
                    <Link key={a.id} to="/conteudos/empreenda/follow-up" className={cls}>
                      {cardInner}
                    </Link>
                  );
                }
                if (a.id === "marketing-digital") {
                  return (
                    <Link key={a.id} to="/conteudos/empreenda/marketing-digital" className={cls}>
                      {cardInner}
                    </Link>
                  );
                }
                if (a.id === "precificacao") {
                  return (
                    <Link key={a.id} to="/conteudos/empreenda/precificacao" className={cls}>
                      {cardInner}
                    </Link>
                  );
                }
                if (a.id === "experiencia-cliente") {
                  return (
                    <Link key={a.id} to="/conteudos/empreenda/experiencia-cliente" className={cls}>
                      {cardInner}
                    </Link>
                  );
                }
                if (a.id === "produtividade-equipe") {
                  return (
                    <Link key={a.id} to="/conteudos/empreenda/produtividade-equipe" className={cls}>
                      {cardInner}
                    </Link>
                  );
                }
                if (a.id === "vendas-consultivas") {
                  return (
                    <Link key={a.id} to="/conteudos/empreenda/vendas-consultivas" className={cls}>
                      {cardInner}
                    </Link>
                  );
                }
                return (
                  <article key={a.id} className={cls}>
                    {cardInner}
                  </article>
                );
              })}

            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-12 bg-surface border-t border-border">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <h2 className="t-h3">Quer aplicar tudo isso no seu escritório?</h2>
            <p className="mt-2 t-body text-muted-foreground">
              Teste o ArqHub grátis por 14 dias.
            </p>
            <Link
              to="/cadastro"
              className="mt-5 inline-flex items-center gap-1.5 px-5 h-11 bg-primary text-white rounded-lg t-label hover:bg-primary-dark transition-colors"
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
