import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ChevronDown } from "lucide-react";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — ArqHub" },
      { name: "description", content: "Perguntas frequentes sobre a plataforma ArqHub." },
    ],
  }),
  component: FaqPage,
});

const faqs = [
  { q: "Quanto custa a ArqHub?", a: "Temos planos mensais e anuais. Veja todos os valores na página de Planos." },
  { q: "Posso testar antes de assinar?", a: "Sim. Oferecemos período de teste gratuito para você experimentar todos os recursos." },
  { q: "Meus clientes precisam pagar para acessar o portal?", a: "Não. O portal do cliente é incluído no seu plano sem custo adicional para os clientes." },
  { q: "Como funciona o pagamento?", a: "Aceitamos cartão de crédito e PIX via Mercado Pago. Cobrança automática e renovação simples." },
  { q: "Posso cancelar a qualquer momento?", a: "Sim. Não há fidelidade. Você pode cancelar pelo painel a qualquer momento." },
  { q: "Meus dados estão seguros?", a: "Sim. Usamos infraestrutura na nuvem com criptografia, backups diários e conformidade com a LGPD." },
  { q: "Posso migrar dados de outro sistema?", a: "Sim. Nossa equipe te ajuda na migração de clientes, projetos e arquivos." },
  { q: "Tem aplicativo mobile?", a: "A ArqHub é um PWA: funciona em qualquer celular pelo navegador, com notificações push e instalação na tela inicial." },
];

function FaqPage() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <SiteHeader />
      <main className="flex-1">
        <section className="max-w-3xl mx-auto px-6 py-16">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← Voltar</Link>
          <h1 className="mt-6 font-display text-4xl md:text-5xl tracking-tight">Perguntas frequentes</h1>
          <p className="mt-3 text-lg text-muted-foreground">Dúvidas comuns sobre a ArqHub.</p>

          <div className="mt-10 divide-y divide-border border border-border rounded-2xl overflow-hidden bg-white">
            {faqs.map((f, i) => (
              <button
                key={i}
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full text-left px-5 py-4 hover:bg-secondary/30 transition-colors"
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="font-medium text-ink">{f.q}</span>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open === i ? "rotate-180" : ""}`} />
                </div>
                {open === i && <p className="mt-2 text-sm text-muted-foreground">{f.a}</p>}
              </button>
            ))}
          </div>

          <div className="mt-8 text-sm text-muted-foreground">
            Ainda com dúvidas? <Link to="/contato" className="text-primary hover:underline">Fale com a gente</Link>.
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
