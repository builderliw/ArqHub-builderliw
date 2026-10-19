// Reconstruído em out/2026 (arquivo original perdido na migração da Lovable).
// Página pública de planos. Preços e listas seguem a home (PlanosPreview) e o
// checkout (/checkout/$plano: mensal ou anual com 20% de desconto).
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Check, ChevronDown, Minus } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import {
  PLAN_FEATURE_MAP,
  PLAN_LIMITS,
  PLAN_MARKETING_FEATURES,
  limitLabel,
  type FeatureKey,
} from "@/lib/plan-features";

export const Route = createFileRoute("/planos")({
  head: () => ({
    meta: [
      { title: "Planos e preços — ArqHub" },
      {
        name: "description",
        content:
          "Planos Básico, Premium e Enterprise para escritórios de arquitetura, engenharia e interiores. Teste grátis por 14 dias.",
      },
    ],
  }),
  component: PlanosPage,
});

const PREMIUM_SLUG: Record<string, string> = {
  "Orçamentos Inteligentes (IA)": "orcamentos-inteligentes",
  "Levantamento Quantitativo": "levantamento-quantitativo",
  "Sugestão de Compras": "sugestao-de-compras",
  "Planejamento Automático": "planejamento-de-obra",
};

const PLANS = [
  {
    key: "basico" as const,
    name: "Básico",
    monthly: "R$ 129,99",
    annual: "R$ 1.247,90",
    annualMonthly: "R$ 103,99",
    features: [...PLAN_MARKETING_FEATURES.basico] as string[],
    cta: "Começar com Básico",
    popular: false,
  },
  {
    key: "premium" as const,
    name: "Premium",
    monthly: "R$ 249,99",
    annual: "R$ 2.399,90",
    annualMonthly: "R$ 199,99",
    features: [...PLAN_MARKETING_FEATURES.premium] as string[],
    cta: "Começar com Premium",
    popular: true,
  },
  {
    key: "enterprise" as const,
    name: "Enterprise",
    monthly: "Personalizado",
    annual: "Personalizado",
    annualMonthly: "Personalizado",
    features: [...PLAN_MARKETING_FEATURES.enterprise] as string[],
    cta: "Falar com vendas",
    popular: false,
  },
];

const FEATURE_LABELS: { key: FeatureKey; label: string }[] = [
  { key: "projetos", label: "Projetos e tarefas" },
  { key: "cronograma", label: "Cronograma e diário de obra" },
  { key: "financeiro", label: "Painel financeiro" },
  { key: "portais", label: "Portais para clientes" },
  { key: "documentos", label: "Documentos em nuvem" },
  { key: "modelos", label: "Modelos de documentos" },
  { key: "liw", label: "Assistente Liw" },
  { key: "relatorios", label: "Relatórios de projeto e financeiro" },
  { key: "ia", label: "Orçamentos inteligentes (IA)" },
  { key: "levantamento", label: "Levantamento quantitativo" },
  { key: "planejamento", label: "Planejamento automático" },
  { key: "compras", label: "Sugestão de compras" },
  { key: "papeis", label: "Papéis e permissões da equipe" },
  { key: "suporte", label: "Suporte" },
  { key: "suporte24h", label: "Suporte 24h" },
  { key: "integracoes", label: "Integrações customizadas" },
  { key: "api", label: "Integrações com API" },
  { key: "sla", label: "SLA dedicado" },
  { key: "treinamento", label: "Treinamento in-company" },
];

const FAQ = [
  {
    q: "Como funciona o teste grátis?",
    a: "São 14 dias com todos os recursos do Premium liberados, sem precisar de cartão. Ao final, você escolhe o plano que faz sentido para o seu escritório.",
  },
  {
    q: "Posso trocar de plano depois?",
    a: "Sim. Você pode migrar do Básico para o Premium (ou o contrário) quando quiser.",
  },
  {
    q: "Quais formas de pagamento são aceitas?",
    a: "PIX e cartão de crédito. No plano anual você tem 20% de desconto em relação ao mensal.",
  },
  {
    q: "Meus clientes pagam para usar o portal?",
    a: "Não. O portal do cliente faz parte da sua assinatura; cada plano inclui um número de portais para clientes VIPs.",
  },
  {
    q: "Como funciona o Enterprise?",
    a: "É um plano sob medida para escritórios maiores, com acessos ilimitados, integrações e SLA dedicado. Fale com nosso time para montar a proposta.",
  },
];

function PlanosPage() {
  const [annual, setAnnual] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />

      <main className="flex-1">
        <section className="pt-14 pb-20 bg-surface border-b border-border">
          <div className="mx-auto max-w-5xl px-6 text-center">
            <div className="text-[11px] font-semibold tracking-[0.18em] text-primary">PLANOS</div>
            <h1 className="mt-2 text-3xl md:text-4xl font-semibold tracking-tight text-ink">
              Comece grátis. Escolha quando estiver pronto.
            </h1>
            <p className="mt-3 text-[15px] text-muted-foreground">
              14 dias com todos os recursos do Premium, sem cartão de crédito.
            </p>

            <div className="mt-8 inline-flex items-center gap-1 p-1 rounded-full bg-white border border-border">
              <button
                onClick={() => setAnnual(false)}
                className={`px-5 py-2 text-sm font-semibold rounded-full transition-colors ${
                  !annual ? "bg-[#4A4A47] text-white" : "text-muted-foreground hover:text-ink"
                }`}
              >
                Mensal
              </button>
              <button
                onClick={() => setAnnual(true)}
                className={`px-5 py-2 text-sm font-semibold rounded-full transition-colors inline-flex items-center gap-1.5 ${
                  annual ? "bg-[#4A4A47] text-white" : "text-muted-foreground hover:text-ink"
                }`}
              >
                Anual
                <span className="text-[10px] font-bold bg-primary/15 text-primary px-1.5 py-0.5 rounded-full">-20%</span>
              </button>
            </div>

            <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
              {PLANS.map((p) => {
                const dark = p.popular;
                const isEnterprise = p.key === "enterprise";
                return (
                  <div
                    key={p.key}
                    className={`rounded-2xl p-8 relative flex flex-col min-h-[540px] ${
                      dark ? "bg-[#4A4A47] text-white" : "bg-white border border-border"
                    }`}
                  >
                    {p.popular && (
                      <div className="absolute -top-3 right-6 px-3 py-1 rounded-full bg-primary text-white text-xs font-semibold">
                        Pacote completo
                      </div>
                    )}
                    <div className={`text-sm font-semibold ${dark ? "text-white/60" : "text-muted-foreground"}`}>{p.name}</div>
                    <div className="mt-3 flex items-baseline gap-1">
                      <span className={`font-bold font-display ${isEnterprise ? "text-3xl" : "text-4xl"}`}>
                        {annual ? p.annualMonthly : p.monthly}
                      </span>
                      {!isEnterprise && <span className={dark ? "text-white/60" : "text-muted-foreground"}>/mês</span>}
                    </div>
                    <p className={`mt-2 text-sm ${dark ? "text-white/60" : "text-muted-foreground"}`}>
                      {isEnterprise ? "Sob consulta" : annual ? `${p.annual} cobrado anualmente` : "Cobrado mensalmente"}
                    </p>
                    <ul className="mt-6 space-y-3 text-sm">
                      {p.features.map((f) => {
                        const slug = PREMIUM_SLUG[f];
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
                          className="block text-center py-3 rounded-lg font-semibold transition-colors border border-border hover:bg-secondary"
                        >
                          {p.cta}
                        </Link>
                      ) : (
                        <>
                          <Link
                            to="/checkout/$plano"
                            params={{ plano: p.key }}
                            search={{ freq: annual ? "yearly" : "monthly" }}
                            className={`block text-center py-3 rounded-lg font-semibold transition-colors ${
                              dark ? "bg-primary hover:bg-primary-dark" : "border border-border hover:bg-secondary"
                            }`}
                          >
                            {p.cta}
                          </Link>
                          <Link
                            to="/cadastro"
                            className={`mt-3 block text-center text-xs transition-colors ${
                              dark ? "text-white/60 hover:text-white" : "text-muted-foreground hover:text-primary"
                            }`}
                          >
                            Teste grátis
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="mx-auto max-w-5xl px-6">
            <h2 className="text-2xl font-semibold tracking-tight text-ink text-center">Compare os planos</h2>
            <div className="mt-8 overflow-x-auto rounded-xl border border-border bg-white">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="text-left font-semibold text-ink px-4 py-3">Recurso</th>
                    {PLANS.map((p) => (
                      <th key={p.key} className="font-semibold text-ink px-4 py-3 text-center w-[18%]">{p.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border">
                    <td className="px-4 py-2.5 text-ink">Acessos escritório/equipe</td>
                    {PLANS.map((p) => (
                      <td key={p.key} className="px-4 py-2.5 text-center tabular-nums">{limitLabel(PLAN_LIMITS[p.key].seats)}</td>
                    ))}
                  </tr>
                  <tr className="border-b border-border">
                    <td className="px-4 py-2.5 text-ink">Portais para clientes VIPs</td>
                    {PLANS.map((p) => (
                      <td key={p.key} className="px-4 py-2.5 text-center tabular-nums">{limitLabel(PLAN_LIMITS[p.key].portals)}</td>
                    ))}
                  </tr>
                  {FEATURE_LABELS.map((f) => (
                    <tr key={f.key} className="border-b border-border last:border-0">
                      <td className="px-4 py-2.5 text-ink">{f.label}</td>
                      {PLANS.map((p) => (
                        <td key={p.key} className="px-4 py-2.5 text-center">
                          {PLAN_FEATURE_MAP[p.key].includes(f.key) ? (
                            <Check className="h-4 w-4 text-primary inline" aria-label="Incluso" />
                          ) : (
                            <Minus className="h-4 w-4 text-muted-foreground/50 inline" aria-label="Não incluso" />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="pb-20">
          <div className="mx-auto max-w-3xl px-6">
            <h2 className="text-2xl font-semibold tracking-tight text-ink text-center">Perguntas frequentes</h2>
            <div className="mt-8 divide-y divide-border rounded-xl border border-border bg-white">
              {FAQ.map((item) => (
                <FaqItem key={item.q} q={item.q} a={item.a} />
              ))}
            </div>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Ainda com dúvidas?{" "}
              <Link to="/contato" className="text-primary hover:underline">Fale com a gente</Link>.
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
        aria-expanded={open}
      >
        <span className="text-[15px] font-medium text-ink">{q}</span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <p className="px-5 pb-4 -mt-1 text-sm text-muted-foreground">{a}</p>}
    </div>
  );
}
