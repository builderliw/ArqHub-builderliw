import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Blog — ArqHub" },
      { name: "description", content: "Conteúdos, dicas e novidades para escritórios de arquitetura." },
    ],
  }),
  component: BlogPage,
});

const posts = [
  { slug: "empreenda", title: "Empreenda — Gestão para escritórios", excerpt: "Trilha completa com vendas consultivas, marketing, follow-up e mais." },
  { slug: "potencializador", title: "Potencializador Técnico", excerpt: "Conteúdos sobre TCPO, CUB, execução de obras, IA e sustentabilidade." },
  { slug: "seu-negocio", title: "Seu Negócio", excerpt: "Estratégias para crescer e escalar seu escritório." },
];

function BlogPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <SiteHeader />
      <main className="flex-1">
        <section className="max-w-5xl mx-auto px-6 py-16">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← Voltar</Link>
          <h1 className="mt-6 font-display text-4xl md:text-5xl tracking-tight">Blog</h1>
          <p className="mt-3 text-lg text-muted-foreground max-w-2xl">
            Conteúdos para você empreender e crescer com mais clareza.
          </p>

          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <Link to="/conteudos/empreenda" className="rounded-2xl border border-border bg-white p-6 hover:shadow-md transition-shadow">
              <div className="text-[11px] font-semibold tracking-[0.18em] text-primary">TRILHA</div>
              <h3 className="mt-2 text-lg font-semibold text-ink">{posts[0].title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{posts[0].excerpt}</p>
            </Link>
            <Link to="/conteudos/potencializador" className="rounded-2xl border border-border bg-white p-6 hover:shadow-md transition-shadow">
              <div className="text-[11px] font-semibold tracking-[0.18em] text-primary">TRILHA</div>
              <h3 className="mt-2 text-lg font-semibold text-ink">{posts[1].title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{posts[1].excerpt}</p>
            </Link>
            <Link to="/conteudos/seu-negocio" className="rounded-2xl border border-border bg-white p-6 hover:shadow-md transition-shadow">
              <div className="text-[11px] font-semibold tracking-[0.18em] text-primary">TRILHA</div>
              <h3 className="mt-2 text-lg font-semibold text-ink">{posts[2].title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{posts[2].excerpt}</p>
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
