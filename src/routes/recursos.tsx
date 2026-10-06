import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import {
  LayoutDashboard, Users, Calendar, MessageSquare, FolderOpen,
  ShoppingBag, Receipt, BellRing, ClipboardCheck, Images, FileText, Sparkles,
  Calculator, Ruler, ShoppingCart, CalendarClock, ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/recursos")({
  head: () => ({
    meta: [
      { title: "Recursos — ArqHub" },
      { name: "description", content: "Conheça todos os recursos da plataforma ArqHub para gestão de escritórios de arquitetura." },
    ],
  }),
  component: RecursosPage,
});

const recursos = [
  { icon: LayoutDashboard, title: "Dashboard inteligente", desc: "Visão consolidada de projetos, prazos e indicadores em tempo real." },
  { icon: Users, title: "Gestão de clientes", desc: "Cadastro completo, histórico de interações e portal exclusivo para cada cliente." },
  { icon: Calendar, title: "Cronograma de projetos", desc: "Etapas, reuniões e marcos com aprovação digital pelo cliente." },
  { icon: MessageSquare, title: "Mensagens centralizadas", desc: "Comunicação direta com cliente e equipe dentro de cada projeto." },
  { icon: FolderOpen, title: "Documentos & arquivos", desc: "Upload, versionamento e fluxo de aprovação de documentos." },
  { icon: ShoppingBag, title: "Lista de produtos", desc: "Especificações, links de compra e controle do que o cliente já adquiriu." },
  { icon: Images, title: "Galeria de obra", desc: "Álbuns de fotos organizados por etapa da obra e consultoria." },
  { icon: ClipboardCheck, title: "Aprovações digitais", desc: "Cliente aprova etapas e documentos com um clique, com registro auditável." },
  { icon: BellRing, title: "Notificações push", desc: "Alertas em tempo real para cliente e equipe via web push." },
  { icon: Receipt, title: "Pagamentos & comprovantes", desc: "Integração com Mercado Pago, controle de recebíveis e comprovantes." },
  { icon: FileText, title: "Relatórios financeiros", desc: "DRE, fluxo de caixa e métricas por projeto e por cliente." },
  { icon: Sparkles, title: "IA integrada", desc: "Assistentes inteligentes para produtividade, conteúdos e análises.", premium: true },
];

const premiumServices = [
  { slug: "orcamentos-inteligentes", icon: Calculator, title: "Orçamentos Inteligentes", desc: "IA aplicada a custos. Gere orçamentos precisos em minutos com base no histórico do escritório." },
  { slug: "levantamento-quantitativo", icon: Ruler, title: "Levantamento Quantitativo", desc: "Automação de medições. Extraia áreas, volumes e materiais diretamente das plantas." },
  { slug: "sugestao-de-compras", icon: ShoppingCart, title: "Sugestão de Compras", desc: "Materiais recomendados na hora certa, sincronizados com o cronograma da obra." },
  { slug: "planejamento-de-obra", icon: CalendarClock, title: "Planejamento de Obra", desc: "Cronograma físico-financeiro gerado automaticamente pela IA." },
] as const;

function RecursosPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <SiteHeader />
      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-6 py-16">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← Voltar</Link>
          <h1 className="mt-6 font-display text-4xl md:text-5xl tracking-tight">Recursos da plataforma</h1>
          <p className="mt-3 text-lg text-muted-foreground max-w-2xl">
            Tudo que seu escritório precisa para entregar projetos com excelência e encantar clientes.
          </p>

          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {recursos.map((r) => (
              <div key={r.title} className="rounded-2xl border border-border bg-white p-6 hover:shadow-md transition-shadow relative">
                {r.premium && (
                  <span className="absolute top-4 right-4 text-[10px] font-semibold tracking-wider uppercase bg-primary/15 text-primary px-2 py-0.5 rounded-full">
                    Premium
                  </span>
                )}
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <r.icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-ink">{r.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{r.desc}</p>
              </div>
            ))}
          </div>

          {/* Serviços exclusivos Premium */}
          <div className="mt-20">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-wider uppercase bg-primary text-white px-2.5 py-1 rounded-full">
                <Sparkles className="h-3 w-3" /> Exclusivo Premium
              </span>
            </div>
            <h2 className="mt-3 font-display text-3xl tracking-tight">Ferramentas de IA</h2>
            <p className="mt-2 text-muted-foreground max-w-2xl">
              Acelere orçamentos, medições, compras e o planejamento da obra com inteligência artificial.
            </p>

            <div className="mt-8 grid sm:grid-cols-2 gap-5">
              {premiumServices.map((s) => (
                <Link
                  key={s.slug}
                  to="/recursos/premium/$slug"
                  params={{ slug: s.slug }}
                  className="group rounded-2xl border border-border bg-white p-6 hover:shadow-lg hover:border-primary/40 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 shrink-0 rounded-xl bg-primary text-white flex items-center justify-center">
                      <s.icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-ink">{s.title}</h3>
                      <p className="mt-1.5 text-sm text-muted-foreground">{s.desc}</p>
                      <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary group-hover:gap-2 transition-all">
                        Ver como funciona <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <p className="mt-8 text-xs text-muted-foreground">
            Recursos de IA estão disponíveis exclusivamente no plano Premium.
          </p>


          <div className="mt-16 rounded-2xl bg-primary text-white p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h2 className="font-display text-2xl md:text-3xl">Pronto para experimentar?</h2>
              <p className="mt-2 text-white/80">Comece grátis e descubra como a ArqHub transforma seu escritório.</p>
            </div>
            <Link to="/planos" className="inline-flex items-center gap-2 px-6 h-11 rounded-lg bg-white text-primary font-semibold hover:bg-white/90">
              Ver planos
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
