import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Check } from "lucide-react";
import { PLAN_MARKETING_FEATURES } from "@/lib/plan-features";

export function PlanosPreview() {
  const [annual, setAnnual] = useState(false);

  const plans = [
    {
      name: "Básico",
      monthly: "R$ 129,99",
      annual: "R$ 1.247,90",
      annualMonthly: "R$ 103,99",
      features: [...PLAN_MARKETING_FEATURES.basico],
      cta: "Começar com Básico",
      popular: false,
    },
    {
      name: "Premium",
      monthly: "R$ 249,99",
      annual: "R$ 2.399,90",
      annualMonthly: "R$ 199,99",
      features: [...PLAN_MARKETING_FEATURES.premium],
      cta: "Começar com Premium",
      popular: true,
    },
    {
      name: "Enterprise",
      monthly: "Personalizado",
      annual: "Personalizado",
      annualMonthly: "Personalizado",
      features: [...PLAN_MARKETING_FEATURES.enterprise],
      cta: "Falar com vendas",
      popular: false,
    },
  ];

  return (
    <section className="py-24 bg-surface border-t border-border">
      <div className="mx-auto max-w-5xl px-6 text-center">
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
          Comece grátis. Escolha quando estiver pronto.
        </h2>
        <p className="mt-3 text-[15px] text-muted-foreground">
          Teste todos os recursos sem compromisso.
        </p>

        <div className="mt-8 inline-flex items-center gap-1 p-1 rounded-full bg-white border border-border">
          <button
            type="button"
            onClick={() => setAnnual(false)}
            className={`px-5 py-2 text-sm font-semibold rounded-full transition-colors ${
              !annual ? "bg-[#4A4A47] text-white" : "text-muted-foreground hover:text-ink"
            }`}
          >
            Mensal
          </button>
          <button
            type="button"
            onClick={() => setAnnual(true)}
            className={`px-5 py-2 text-sm font-semibold rounded-full transition-colors inline-flex items-center gap-1.5 ${
              annual ? "bg-[#4A4A47] text-white" : "text-muted-foreground hover:text-ink"
            }`}
          >
            Anual
            <span className="text-[10px] font-bold bg-primary/15 text-primary px-1.5 py-0.5 rounded-full">
              -20%
            </span>
          </button>
        </div>

        <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-3 gap-6 text-left max-w-5xl mx-auto">
          {plans.map((p) => {
            const dark = p.popular;
            const isEnterprise = p.name === "Enterprise";
            const price = annual ? p.annualMonthly : p.monthly;
            const period = isEnterprise ? "" : annual ? "/mês no anual" : "/mês";
            return (
              <div
                key={p.name}
                className={`rounded-2xl p-6 border flex flex-col ${
                  dark
                    ? "bg-[#1d1d1b] text-white border-[#1d1d1b] shadow-xl"
                    : "bg-white border-border"
                }`}
              >
                {p.popular && (
                  <span className="text-[10px] font-bold tracking-wider uppercase text-primary mb-2">
                    Mais popular
                  </span>
                )}
                <h3 className="text-lg font-semibold">{p.name}</h3>
                <div className="mt-3">
                  <span className="text-3xl font-bold tracking-tight">{price}</span>
                  {period && (
                    <span className={`text-sm ${dark ? "text-white/60" : "text-muted-foreground"}`}>
                      {" "}
                      {period}
                    </span>
                  )}
                </div>
                {annual && !isEnterprise && (
                  <p className={`mt-1 text-xs ${dark ? "text-white/50" : "text-muted-foreground"}`}>
                    Cobrado {p.annual}/ano
                  </p>
                )}
                <ul className={`mt-6 space-y-2.5 text-sm ${dark ? "text-white/80" : "text-foreground/80"}`}>
                  {p.features.map((f: string) => {
                    const premiumSlug: Record<string, string> = {
                      "Orçamentos Inteligentes": "orcamentos-inteligentes",
                      "Levantamento Quantitativo": "levantamento-quantitativo",
                      "Sugestão de Compras": "sugestao-de-compras",
                      "Planejamento Automático": "planejamento-de-obra",
                    };
                    const slug = premiumSlug[f];
                    return (
                      <li key={f} className="flex gap-2">
                        <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        {slug ? (
                          <Link
                            to="/recursos/premium/$slug"
                            params={{ slug }}
                            className={`underline-offset-2 hover:underline ${dark ? "text-white" : "text-ink"}`}
                          >
                            {f}
                          </Link>
                        ) : (
                          <span>{f}</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
                <div className="mt-auto pt-8">
                  {isEnterprise ? (
                    <Link
                      to="/cadastro/enterprise"
                      className={`block text-center py-3 rounded-lg font-semibold transition-colors ${
                        dark ? "bg-primary hover:bg-primary-dark" : "border border-border hover:bg-secondary"
                      }`}
                    >
                      {p.cta}
                    </Link>
                  ) : (
                    <Link
                      to="/checkout/$plano"
                      params={{ plano: p.name === "Premium" ? "premium" : "basico" }}
                      search={{ freq: annual ? "yearly" : "monthly" }}
                      className={`block text-center py-3 rounded-lg font-semibold transition-colors ${
                        dark ? "bg-primary hover:bg-primary-dark" : "border border-border hover:bg-secondary"
                      }`}
                    >
                      {p.cta}
                    </Link>
                  )}
                  {!isEnterprise && (
                    <Link
                      to="/cadastro"
                      className={`mt-3 block text-center text-xs transition-colors ${
                        dark ? "text-white/60 hover:text-white" : "text-muted-foreground hover:text-primary"
                      }`}
                    >
                      Teste grátis
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
