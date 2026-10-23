import { Link } from "@tanstack/react-router";

const ITEMS = [
  {
    title: "Orçamentos Inteligentes",
    desc: "IA aplicada a custos e composições do projeto.",
    slug: "orcamentos-inteligentes",
  },
  {
    title: "Levantamento Quantitativo",
    desc: "Automação de medições e quantitativos.",
    slug: "levantamento-quantitativo",
  },
  {
    title: "Sugestão de Compras",
    desc: "Materiais na hora certa, com fornecedores.",
    slug: "sugestao-de-compras",
  },
  {
    title: "Planejamento de Obra",
    desc: "Cronograma automático alinhado ao projeto.",
    slug: "planejamento-de-obra",
  },
] as const;

/** Seção da home: Recursos Premium (no lugar de Agentes de IA). */
export function HomeRecursosSection() {
  return (
    <section className="py-20 lg:py-28 bg-white">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            RECURSOS
          </div>
          <span className="text-[10px] font-semibold tracking-[0.18em] uppercase bg-primary/15 text-primary px-2.5 py-1 rounded-full">
            Exclusivo Premium
          </span>
        </div>
        <div className="mt-4 grid lg:grid-cols-2 gap-8 lg:gap-16 items-end">
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-[#3f3f3d] leading-[1.1]">
            Ferramentas premium para o{" "}
            <span className="text-primary">seu escritório.</span>
          </h2>
          <p className="text-[15px] text-[#5b5b54] leading-relaxed max-w-md">
            Recursos exclusivos do plano Premium: orçamentos, quantitativos, compras e planejamento de obra —
            integrados ao fluxo do projeto.
          </p>
        </div>

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {ITEMS.map((a) => (
            <Link
              key={a.title}
              to="/recursos/premium/$slug"
              params={{ slug: a.slug }}
              className="group rounded-2xl bg-white border border-black/5 p-6 shadow-[0_2px_20px_-10px_rgba(0,0,0,0.15)] hover:border-primary/30 transition-all duration-200 block"
            >
              <div className="flex items-start justify-between">
                <div className="h-10 w-10 rounded-full bg-[#4A4A47] flex items-center justify-center group-hover:bg-primary transition-colors">
                  <span className="text-white text-sm font-semibold">R</span>
                </div>
                <span className="text-[10px] font-semibold tracking-[0.14em] uppercase text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  Acessar
                </span>
              </div>
              <h3 className="mt-5 text-[16px] font-semibold text-[#1d1d1b]">{a.title}</h3>
              <p className="mt-1.5 text-[13px] text-[#5b5b54] leading-relaxed">{a.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
