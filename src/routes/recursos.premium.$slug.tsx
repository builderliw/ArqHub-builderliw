import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import {
  Calculator,
  Ruler,
  ShoppingCart,
  CalendarClock,
  Check,
  ArrowRight,
  Sparkles,
  Zap,
  Target,
  LineChart,
  Download,
} from "lucide-react";
import type { ComponentType } from "react";
import { useEffect, useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { getPremiumFileUrl } from "@/lib/premium-files.functions";
import { externalSupabase } from "@/integrations/external-supabase/client";

type Step = { title: string; desc: string };
type UseCase = { title: string; desc: string };
type FAQ = { q: string; a: string };

type PremiumService = {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  intro: string;
  icon: ComponentType<{ className?: string }>;
  howItWorks: Step[];
  benefits: string[];
  useCases: UseCase[];
  example: { title: string; before: string; after: string };
  integrations: string[];
  faq: FAQ[];
};

const services: Record<string, PremiumService> = {
  "orcamentos-inteligentes": {
    slug: "orcamentos-inteligentes",
    title: "Orçamentos Inteligentes",
    tagline: "IA aplicada a custos",
    description:
      "Gere orçamentos precisos em minutos com IA que analisa histórico do escritório, tabelas de preços regionais (SINAPI/SBC) e o escopo do projeto.",
    intro:
      "O módulo de Orçamentos Inteligentes elimina a parte mais dolorosa do trabalho: montar composições de custo linha a linha. A IA lê o escopo do projeto, cruza com tabelas oficiais (SINAPI, SBC, TCPO) atualizadas e com o histórico real do seu escritório, e devolve um orçamento pronto — auditável, editável e com margem/BDI configuráveis. Você deixa de gastar dias em planilhas e passa a revisar propostas em minutos.",
    icon: Calculator,
    howItWorks: [
      { title: "1. Descreva o projeto", desc: "Informe metragem, tipologia (residencial, comercial, reforma), padrão de acabamento e localização. A IA entende o contexto pela descrição em linguagem natural." },
      { title: "2. IA calcula custos", desc: "Cruzamento com base histórica do escritório, SINAPI regional atualizada e composições TCPO. Cada item vem com fonte e justificativa." },
      { title: "3. Revise e ajuste", desc: "Edite composições, aplique margem por etapa, BDI, encargos sociais e insumos específicos. Cada linha é editável e rastreável." },
      { title: "4. Envie ao cliente", desc: "Exporte em PDF com identidade visual do escritório ou envie via portal do cliente para aprovação digital com registro auditável." },
    ],
    benefits: [
      "Reduz em até 80% o tempo de orçamentação",
      "Precisão baseada em histórico real do escritório",
      "Composições editáveis linha a linha",
      "SINAPI regional sempre atualizado",
      "Aprovação digital com trilha auditável",
      "Exportação em PDF, Excel e portal do cliente",
    ],
    useCases: [
      { title: "Anteprojeto rápido", desc: "Cliente pede uma estimativa 'para ontem'. Você entrega um orçamento defensável no mesmo dia." },
      { title: "Comparação de padrões", desc: "Gere versões econômica, média e alto padrão em segundos para o cliente decidir." },
      { title: "Reforma com escopo aberto", desc: "IA sugere composições típicas por ambiente (banheiro, cozinha, sala) e você refina." },
    ],
    example: {
      title: "Exemplo prático — reforma de 120m²",
      before: "Escritório levava 3 a 5 dias montando planilha, buscando preços e ajustando composições manualmente.",
      after: "Com IA: orçamento inicial em 4 minutos, revisão do arquiteto em 40 minutos, envio ao cliente no mesmo dia.",
    },
    integrations: ["Levantamento Quantitativo", "Planejamento de Obra", "Financeiro do escritório", "Portal do cliente"],
    faq: [
      { q: "A IA usa dados do meu escritório?", a: "Sim. Quanto mais orçamentos você aprova, mais precisa a IA fica para o seu perfil de projetos e sua região." },
      { q: "Posso usar sem SINAPI?", a: "Sim. Você pode carregar sua própria tabela de preços e o módulo usa ela como fonte primária." },
      { q: "O cliente vê minha margem?", a: "Não. O PDF enviado ao cliente mostra apenas o valor final por etapa; margem e BDI ficam no seu painel." },
    ],
  },
  "levantamento-quantitativo": {
    slug: "levantamento-quantitativo",
    title: "Levantamento Quantitativo",
    tagline: "Automação de medições",
    description:
      "Extraia quantitativos automaticamente a partir de plantas e projetos. A IA reconhece elementos e gera tabelas de áreas, volumes e materiais.",
    intro:
      "Medir planta com trena digital, contar tomada por tomada e passar tudo para planilha é o trabalho que ninguém gosta de fazer — e onde mais se perde dinheiro por erro de conta. O Levantamento Quantitativo lê a planta (PDF, DWG ou imagem), identifica automaticamente cada elemento e devolve uma tabela pronta com áreas, volumes e contagens por ambiente. Você valida, ajusta o que quiser e exporta direto para o orçamento.",
    icon: Ruler,
    howItWorks: [
      { title: "1. Envie a planta", desc: "PDF, DWG, IFC ou imagem em alta resolução. Aceita plantas de arquitetura, hidráulica, elétrica e estrutural." },
      { title: "2. IA identifica elementos", desc: "Paredes, aberturas (portas/janelas), pisos, forros, pontos elétricos, pontos hidráulicos e áreas molhadas são reconhecidos e classificados." },
      { title: "3. Quantitativo automático", desc: "Áreas em m², volumes em m³, perímetros lineares e contagem de itens organizados por ambiente e por tipo." },
      { title: "4. Valide e exporte", desc: "Confira visualmente cada elemento sobreposto na planta, ajuste o que precisar e envie direto para o módulo de Orçamentos ou baixe em Excel." },
    ],
    benefits: [
      "Elimina medições manuais demoradas",
      "Reduz erros de contagem em obra",
      "Integração direta com Orçamentos Inteligentes",
      "Validação visual sobre a própria planta",
      "Exportação em Excel, CSV e PDF",
      "Histórico versionado por revisão de projeto",
    ],
    useCases: [
      { title: "Orçamento a partir de PDF do arquiteto", desc: "Recebeu só o PDF? A IA extrai o quantitativo sem precisar do DWG original." },
      { title: "Comparar revisões de projeto", desc: "Nova revisão? O módulo destaca o que mudou (área que virou parede, ponto elétrico removido, etc)." },
      { title: "Contagem de acabamentos", desc: "Quantas louças, metais e revestimentos por ambiente — pronto para pedir cotação." },
    ],
    example: {
      title: "Exemplo prático — casa térrea 180m²",
      before: "Medição manual demorava 6 a 8 horas, com risco alto de erro em áreas molhadas e contagem de pontos elétricos.",
      after: "Com IA: quantitativo completo em 3 minutos, validação visual em 25 minutos, integração automática ao orçamento.",
    },
    integrations: ["Orçamentos Inteligentes", "Sugestão de Compras", "Planejamento de Obra"],
    faq: [
      { q: "Que formatos de planta são aceitos?", a: "PDF (com ou sem camadas), DWG, DXF, IFC e imagens em alta resolução (JPG/PNG)." },
      { q: "E se a IA errar uma medida?", a: "Você vê o elemento destacado sobre a planta e ajusta com um clique. A correção também retreina o modelo do seu escritório." },
      { q: "Funciona para projeto complementar?", a: "Sim — hidráulica, elétrica e estrutural são suportados. Cada disciplina gera seu próprio quantitativo." },
    ],
  },
  "sugestao-de-compras": {
    slug: "sugestao-de-compras",
    title: "Sugestão de Compras",
    tagline: "Materiais recomendados na hora certa",
    description:
      "A IA acompanha o cronograma da obra e sugere quando comprar cada material, considerando prazo de entrega, sequência construtiva e melhor preço.",
    intro:
      "Comprar cimento cedo demais entulha o canteiro; comprar tarde para a obra. Comprar cerâmica sem margem para reposição gera lote diferente na metade da obra. A Sugestão de Compras resolve o timing: cruza o cronograma, o quantitativo e o lead time de cada fornecedor, e avisa exatamente quando pedir cada material — com cotações comparadas e aprovação do cliente pelo portal.",
    icon: ShoppingCart,
    howItWorks: [
      { title: "1. Cronograma conectado", desc: "O módulo lê o Planejamento de Obra e a lista de materiais vinda do Levantamento Quantitativo automaticamente." },
      { title: "2. Alertas inteligentes", desc: "Notificação no momento certo: 'Comprar cerâmica em 5 dias — prazo de entrega de 3 semanas, chegada alinhada ao início do assentamento'." },
      { title: "3. Comparação de fornecedores", desc: "Cotações organizadas lado a lado com histórico de preços, prazo de entrega e avaliação de fornecedores parceiros." },
      { title: "4. Aprovação do cliente", desc: "Cliente recebe a lista pelo portal, aprova o valor e o pedido segue para o fornecedor com um clique." },
    ],
    benefits: [
      "Evita atrasos por material em falta",
      "Reduz custo com compras planejadas",
      "Fornecedores comparados automaticamente",
      "Aprovação transparente pelo cliente",
      "Histórico de preços para negociação futura",
      "Reduz estoque parado no canteiro",
    ],
    useCases: [
      { title: "Obra com várias frentes", desc: "IA ordena as compras para não misturar entregas de acabamento e estrutura no mesmo dia." },
      { title: "Material com lead time longo", desc: "Esquadria sob medida, mármore importado — o sistema avisa com semanas de antecedência." },
      { title: "Compra em lote", desc: "Sugere agrupar itens do mesmo fornecedor para negociar desconto por volume." },
    ],
    example: {
      title: "Exemplo prático — obra de 8 meses",
      before: "Comprador do escritório passava 4h/semana ligando para fornecedor e checando cronograma manualmente.",
      after: "Com IA: alertas automáticos, 3 cotações comparadas por item, aprovação do cliente pelo portal em minutos.",
    },
    integrations: ["Planejamento de Obra", "Levantamento Quantitativo", "Financeiro", "Portal do cliente"],
    faq: [
      { q: "Preciso cadastrar meus fornecedores?", a: "Recomendado, mas não obrigatório. Sem cadastro, a IA sugere fornecedores parceiros da rede ArqHub." },
      { q: "O cliente é obrigado a aprovar cada compra?", a: "Você define. Pode configurar aprovação por valor mínimo, por etapa ou apenas notificação." },
      { q: "Funciona para reforma pequena?", a: "Sim. Em obras curtas, o valor está mais na comparação de preços e menos no timing." },
    ],
  },
  "planejamento-de-obra": {
    slug: "planejamento-de-obra",
    title: "Planejamento de Obra",
    tagline: "Cronograma gerado automaticamente",
    description:
      "IA gera um cronograma físico-financeiro completo a partir do escopo do projeto, respeitando sequência construtiva e prazos realistas.",
    intro:
      "Cronograma no MS Project some da vida do arquiteto em duas semanas. O Planejamento de Obra monta um cronograma físico-financeiro em minutos, com sequência construtiva validada, curva S sincronizada ao financeiro e replanejamento automático quando uma etapa atrasa. Você acompanha pelo painel; o cliente acompanha pelo portal — ambos veem a mesma verdade.",
    icon: CalendarClock,
    howItWorks: [
      { title: "1. Escopo do projeto", desc: "Informe tipologia, metragem e etapas contratadas. Ou importe direto do módulo de Orçamentos Inteligentes." },
      { title: "2. Cronograma automático", desc: "IA monta a sequência lógica (fundação → estrutura → alvenaria → instalações → acabamentos) com durações realistas por etapa." },
      { title: "3. Curva S financeira", desc: "Distribuição de desembolsos ao longo do tempo, sincronizada com o módulo Financeiro para previsão de caixa." },
      { title: "4. Acompanhamento em tempo real", desc: "Marque etapas concluídas ou atrasadas — o cronograma e a curva S se recalculam automaticamente." },
    ],
    benefits: [
      "Cronograma pronto em minutos",
      "Sequência construtiva validada por IA",
      "Curva S integrada ao financeiro",
      "Replanejamento automático em atrasos",
      "Visão compartilhada com o cliente",
      "Marcos e aprovações auditáveis",
    ],
    useCases: [
      { title: "Contrato com marcos financeiros", desc: "Curva S alinha desembolsos do cliente com entregas físicas — sem discussão sobre 'quando pagar'." },
      { title: "Obra com equipe própria e terceiros", desc: "IA agrupa etapas por prestador e alerta sobrepostas incompatíveis." },
      { title: "Cliente ansioso", desc: "Portal mostra o cronograma atualizado. Fim das ligações 'como está a obra?'." },
    ],
    example: {
      title: "Exemplo prático — sobrado de 220m²",
      before: "Cronograma no Excel, atualizado a cada 3 semanas na melhor das hipóteses. Cliente sempre no escuro.",
      after: "Com IA: cronograma gerado em 6 minutos, atualizado em tempo real, curva S sincronizada ao financeiro.",
    },
    integrations: ["Orçamentos Inteligentes", "Sugestão de Compras", "Financeiro", "Diário de obra", "Portal do cliente"],
    faq: [
      { q: "E se o pedreiro atrasar uma etapa?", a: "Você marca o atraso no diário de obra. O cronograma e a curva S se recalculam e o cliente é notificado." },
      { q: "Posso editar o cronograma manualmente?", a: "Sim. Toda etapa é editável — arrasta a barra, muda duração, adiciona dependência." },
      { q: "Serve para obra pequena?", a: "Sim. A IA ajusta a granularidade — reforma de banheiro tem cronograma proporcional." },
    ],
  },
};

export const Route = createFileRoute("/recursos/premium/$slug")({
  loader: ({ params }) => {
    const service = services[params.slug];
    if (!service) throw notFound();
    return { service };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Recurso não encontrado" }, { name: "robots", content: "noindex" }] };
    const s = loaderData.service;
    return {
      meta: [
        { title: `${s.title} — ArqHub Premium` },
        { name: "description", content: `${s.tagline}. ${s.description}` },
        { property: "og:title", content: `${s.title} — ArqHub Premium` },
        { property: "og:description", content: s.description },
      ],
    };
  },
  component: PremiumServicePage,
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center">
      <p>Recurso não encontrado. <Link to="/recursos" className="text-primary underline">Voltar</Link></p>
    </div>
  ),
});

function PremiumServicePage() {
  const { service } = Route.useLoaderData() as { service: PremiumService };
  const Icon = service.icon;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-primary/5 via-white to-white">
          <div className="max-w-6xl mx-auto px-6 py-16 md:py-20">
            <Link to="/recursos" className="text-sm text-muted-foreground hover:text-foreground">← Voltar para recursos</Link>
            <div className="mt-6 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-wider uppercase bg-primary text-white px-2.5 py-1 rounded-full">
                <Sparkles className="h-3 w-3" /> Premium
              </span>
              <span className="text-xs text-muted-foreground">{service.tagline}</span>
            </div>
            <div className="mt-6 flex items-start gap-5">
              <div className="h-14 w-14 shrink-0 rounded-2xl bg-primary text-white flex items-center justify-center">
                <Icon className="h-7 w-7" />
              </div>
              <div>
                <h1 className="font-display text-4xl md:text-5xl tracking-tight text-ink">{service.title}</h1>
                <p className="mt-3 text-lg text-muted-foreground max-w-2xl">{service.description}</p>
                <DownloadButton slug={service.slug} />
              </div>
            </div>
          </div>
        </section>

        {/* Introdução */}
        <section className="max-w-4xl mx-auto px-6 py-14">
          <div className="flex items-center gap-2 text-primary mb-3">
            <Zap className="h-4 w-4" />
            <span className="text-xs font-semibold tracking-wider uppercase">Por que existe</span>
          </div>
          <p className="text-base md:text-lg text-ink leading-relaxed">{service.intro}</p>
        </section>

        {/* Como funciona */}
        <section className="max-w-6xl mx-auto px-6 pb-16">
          <h2 className="font-display text-2xl md:text-3xl tracking-tight text-ink">Como funciona</h2>
          <p className="mt-2 text-sm text-muted-foreground">Do input ao entregável em quatro passos.</p>
          <div className="mt-8 grid sm:grid-cols-2 gap-5">
            {service.howItWorks.map((step) => (
              <div key={step.title} className="rounded-2xl border border-border bg-white p-6 hover:shadow-md transition-shadow">
                <h3 className="text-base font-semibold text-ink">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Exemplo prático */}
        <section className="max-w-6xl mx-auto px-6 pb-16">
          <div className="rounded-2xl border border-border overflow-hidden">
            <div className="bg-surface px-6 md:px-8 py-5 border-b border-border flex items-center gap-2">
              <LineChart className="h-4 w-4 text-primary" />
              <h2 className="font-display text-xl md:text-2xl tracking-tight text-ink">{service.example.title}</h2>
            </div>
            <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
              <div className="p-6 md:p-8">
                <div className="text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-2">Antes</div>
                <p className="text-sm text-ink leading-relaxed">{service.example.before}</p>
              </div>
              <div className="p-6 md:p-8 bg-primary/5">
                <div className="text-xs font-semibold tracking-wider uppercase text-primary mb-2">Com ArqHub</div>
                <p className="text-sm text-ink leading-relaxed">{service.example.after}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Casos de uso */}
        <section className="max-w-6xl mx-auto px-6 pb-16">
          <div className="flex items-center gap-2 text-primary mb-3">
            <Target className="h-4 w-4" />
            <span className="text-xs font-semibold tracking-wider uppercase">Casos de uso</span>
          </div>
          <h2 className="font-display text-2xl md:text-3xl tracking-tight text-ink">Onde faz a diferença no dia a dia</h2>
          <div className="mt-8 grid md:grid-cols-3 gap-5">
            {service.useCases.map((uc) => (
              <div key={uc.title} className="rounded-2xl border border-border bg-white p-6">
                <h3 className="text-base font-semibold text-ink">{uc.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{uc.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Benefícios */}
        <section className="max-w-6xl mx-auto px-6 pb-16">
          <div className="rounded-2xl border border-border bg-surface p-8 md:p-10">
            <h2 className="font-display text-2xl md:text-3xl tracking-tight text-ink">O que você ganha</h2>
            <ul className="mt-6 grid sm:grid-cols-2 gap-3">
              {service.benefits.map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <span className="h-6 w-6 shrink-0 rounded-full bg-primary/15 text-primary flex items-center justify-center">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-sm text-ink pt-0.5">{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Integrações */}
        <section className="max-w-6xl mx-auto px-6 pb-16">
          <h2 className="font-display text-2xl md:text-3xl tracking-tight text-ink">Integra com o resto do painel</h2>
          <p className="mt-2 text-sm text-muted-foreground">Este módulo conversa nativamente com:</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {service.integrations.map((i) => (
              <span key={i} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 text-xs text-ink">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" /> {i}
              </span>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-4xl mx-auto px-6 pb-16">
          <h2 className="font-display text-2xl md:text-3xl tracking-tight text-ink">Perguntas frequentes</h2>
          <Accordion type="single" collapsible className="mt-6">
            {service.faq.map((f, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border-b border-border">
                <AccordionTrigger className="py-4 text-base font-medium text-ink hover:no-underline text-left">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="pb-4 text-sm text-muted-foreground leading-relaxed">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* CTA */}
        <section className="max-w-6xl mx-auto px-6 pb-20">
          <div className="rounded-2xl bg-primary text-white p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h2 className="font-display text-2xl md:text-3xl">Disponível no plano Premium</h2>
              <p className="mt-2 text-white/80">Desbloqueie IA aplicada ao dia a dia do seu escritório.</p>
            </div>
            <Link to="/planos" className="inline-flex items-center gap-2 px-6 h-11 rounded-lg bg-white text-primary font-semibold hover:bg-white/90">
              Ver planos <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function DownloadButton({ slug }: { slug: string }) {
  const [state, setState] = useState<{ url: string | null; filename: string | null; loaded: boolean }>({
    url: null,
    filename: null,
    loaded: false,
  });
  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: sess } = await externalSupabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) throw new Error("no-session");
      return getPremiumFileUrl({
        data: { slug: slug as "orcamentos-inteligentes", accessToken: token },
      });
    })()
      .then((r) => alive && setState({ url: r.url, filename: r.filename, loaded: true }))
      .catch(() => alive && setState({ url: null, filename: null, loaded: true }));
    return () => {
      alive = false;
    };
  }, [slug]);
  if (!state.loaded || !state.url) return null;
  return (
    <a
      href={state.url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-5 inline-flex items-center gap-2 px-4 h-10 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors text-sm"
    >
      <Download className="h-4 w-4" />
      Baixar material {state.filename ? `(${state.filename})` : ""}
    </a>
  );
}
