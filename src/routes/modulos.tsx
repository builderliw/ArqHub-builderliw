import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Briefcase, Users, Calendar, DollarSign, MessageSquare, BarChart3, Sparkles, Building2 } from "lucide-react";

export const Route = createFileRoute("/modulos")({
  head: () => ({
    meta: [
      { title: "Módulos — ArqHub" },
      { name: "description", content: "Conheça os módulos da plataforma ArqHub: Projetos, Clientes, Equipe, Financeiro e mais." },
    ],
  }),
  component: ModulosPage,
});

const modulos = [
  { icon: Briefcase, title: "Projetos", desc: "Cronograma, etapas, documentos, fotos, produtos e aprovações em um só lugar." },
  { icon: Users, title: "Clientes", desc: "CRM completo com histórico, portal exclusivo e canal de mensagens dedicado." },
  { icon: Building2, title: "Escritório", desc: "Identidade, equipe, permissões e configurações do seu escritório." },
  { icon: Calendar, title: "Agenda", desc: "Reuniões com decisão do cliente, lembretes e integração com cronograma." },
  { icon: DollarSign, title: "Financeiro", desc: "Recebíveis, comprovantes, integração Mercado Pago e relatórios." },
  { icon: MessageSquare, title: "Mensagens", desc: "Chat por projeto entre escritório, equipe e cliente." },
  { icon: BarChart3, title: "Métricas & Relatórios", desc: "Indicadores de produtividade, financeiro e satisfação." },
  { icon: Sparkles, title: "IA", desc: "Assistentes para conteúdo, análises e automações do dia a dia.", premium: true },
];

function ModulosPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <SiteHeader />
      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-6 py-16">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← Voltar</Link>
          <h1 className="mt-6 font-display text-4xl md:text-5xl tracking-tight">Módulos</h1>
          <p className="mt-3 text-lg text-muted-foreground max-w-2xl">
            Ative apenas o que você precisa. Cada módulo foi pensado para um time real de arquitetura.
          </p>

          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {modulos.map((m) => (
              <div key={m.title} className="rounded-2xl border border-border bg-white p-6 relative">
                {m.premium && (
                  <span className="absolute top-4 right-4 text-[10px] font-semibold tracking-wider uppercase bg-primary/15 text-primary px-2 py-0.5 rounded-full">
                    Premium
                  </span>
                )}
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <m.icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-ink">{m.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{m.desc}</p>
              </div>
            ))}
          </div>

          <p className="mt-6 text-xs text-muted-foreground">
            O módulo de IA é exclusivo do plano Premium.
          </p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
