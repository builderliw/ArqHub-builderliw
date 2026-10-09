import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { PLAN_MARKETING_FEATURES } from "@/lib/plan-features";
import { SiteFooter } from "@/components/site-footer";
import { QRCodeSVG } from "qrcode.react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  ArrowRight, Check, LayoutGrid, CheckSquare, Calendar,
  ClipboardList, Wallet, FolderOpen, Sparkles, Globe,
  QrCode, Monitor, Smartphone, Cloud,
  MessageSquare, FileText, CheckCircle2,

} from "lucide-react";
import heroAsset from "@/assets/hero-carnava.png.asset.json";
import bentoDashboard from "@/assets/bento-dashboard.webp";
import bentoAlertas from "@/assets/bento-alertas.webp";
import bentoDiario from "@/assets/bento-diario.webp";
import bentoRelatorios from "@/assets/bento-relatorios.webp";
import portalClienteInterior from "@/assets/portal-cliente-interior.jpg";
import ia1 from "@/assets/ia-1.jpg";
import ia2 from "@/assets/ia-2.jpg";
import ia3 from "@/assets/ia-3.jpg";
import ia4 from "@/assets/ia-4.jpg";
import conteudoEmpreenda from "@/assets/conteudo-empreenda.jpg";
import conteudoPotencializador from "@/assets/conteudo-potencializador.jpg";
import conteudoSeuNegocio from "@/assets/conteudo-seu-negocio.jpg";
import { Brain } from "lucide-react";
import { ChatPortalDemo } from "@/components/marketing/chat-portal-demo";
import { DiarioObraDemo } from "@/components/marketing/diario-obra-demo";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ArqHub — Gestão para Arquitetura, Engenharia e Interiores" },
      { name: "description", content: "Gerencie projetos, clientes, obras e finanças em um único lugar." },
    ],
  }),
  component: Home,
});

const modules = [
  { icon: LayoutGrid, title: "Projetos", slug: "projetos", desc: "Acompanhe ativos, concluídos, status e timeline em uma só visão.", details: "Centralize todos os projetos do escritório em um só lugar. Visualize status (ativo, em pausa, concluído), prazos, responsáveis e progresso. Filtre por cliente, fase ou período e tenha uma linha do tempo clara de tudo que está acontecendo." },
  { icon: CheckSquare, title: "Tarefas", slug: "cronograma", desc: "Kanban com A Fazer, Em Andamento, Revisão e Concluído.", details: "Quadro Kanban arrastar-e-soltar com 4 colunas. Atribua responsáveis, defina prazos, anexe arquivos e comente em cada tarefa. Ideal para coordenar equipe, terceirizados e entregas internas sem perder nada." },
  { icon: Calendar, title: "Cronograma", slug: "cronograma", desc: "Gantt visual com marcos, entregas e dependências.", details: "Gráfico de Gantt interativo para planejar fases do projeto. Defina marcos, dependências entre tarefas e datas de entrega. Veja atrasos em tempo real e ajuste o planejamento com poucos cliques." },
  { icon: ClipboardList, title: "Diário de Obra", slug: "projetos", desc: "Fotos, vídeos, observações e histórico completo.", details: "Registre o avanço da obra com fotos, vídeos e anotações datadas. Histórico cronológico completo, organizado por dia, com clima e equipe presente. Compartilhe direto com o cliente pelo portal." },
  { icon: Wallet, title: "Financeiro", slug: "financeiro", desc: "Receitas, despesas, fluxo de caixa e rentabilidade por projeto.", details: "Controle receitas e despesas por projeto e geral. Acompanhe fluxo de caixa, contas a pagar/receber e calcule a rentabilidade real de cada obra. Relatórios prontos para tomada de decisão." },
  { icon: FolderOpen, title: "Arquivos", slug: "projetos", desc: "PDF, DWG, DXF, imagens — tudo organizado por projeto.", details: "Repositório de arquivos por projeto: pranchas, memoriais, contratos, fotos e referências. Versões, pastas e busca rápida. Sem mais perder tempo procurando o último arquivo no WhatsApp ou e-mail." },
  { icon: Sparkles, title: "Inteligência Artificial", slug: "ia-arqhub", desc: "Orçamentos, levantamentos e planejamento automatizados. Exclusivo Premium.", details: "Agentes de IA que ajudam a gerar orçamentos, levantamentos quantitativos e planejamento de obra a partir de informações do projeto. Recurso exclusivo do plano Premium — disponível apenas para assinantes Premium e Enterprise.", premium: true },
  { icon: Globe, title: "Portfólio Digital", slug: "clientes", desc: "Página pública personalizada com seus melhores projetos.", details: "Página pública com seu domínio e identidade visual, exibindo seus melhores projetos. Atraia novos clientes mostrando o trabalho de forma profissional, sem precisar contratar um site à parte." },
];


function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    import("@/lib/pwa-detect").then(({ isPwaStandalone }) => {
      if (isPwaStandalone()) {
        window.location.replace("/app");
      }
    });
  }, [navigate]);


  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* HERO premium */}
        <section className="relative overflow-hidden bg-background">
          {/* Background grid + glow sutil */}
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute inset-0 [background-image:linear-gradient(to_right,rgb(0_0_0/0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgb(0_0_0/0.035)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]" />
            <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[480px] w-[820px] rounded-full bg-primary/15 blur-[120px]" />
          </div>

          <div className="mx-auto max-w-7xl px-6 pt-10 pb-14 lg:pt-16 lg:pb-20 grid lg:grid-cols-[1fr_1.05fr] gap-10 lg:gap-16 items-center">
            <div className="max-w-[640px]">
              
              <h1 className="font-display text-[36px] sm:text-[44px] lg:text-[54px] leading-[1.05] tracking-[-0.025em] text-ink font-semibold text-balance">
                Gerencie seus <span className="text-primary">projetos</span>, unifique <span className="text-primary">obra</span> e <span className="text-primary">clientes</span> em um só lugar.
              </h1>

              <p className="mt-5 text-[15px] text-ink-muted leading-relaxed max-w-[520px] text-pretty">
                Projetos, clientes, documentos e financeiro organizados em uma única plataforma.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <Link
                  to="/cadastro"
                  className="group inline-flex items-center gap-2 px-6 h-12 bg-ink text-white rounded-lg text-[15px] font-medium hover:bg-black transition-all duration-150 shadow-[0_1px_0_0_rgb(255_255_255/0.08)_inset,0_2px_4px_0_rgb(0_0_0/0.10),0_8px_24px_-4px_rgb(0_0_0/0.18)] active:scale-[0.985]"
                >
                  Começar grátis
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform duration-150" strokeWidth={2} />
                </Link>
              </div>

              <div className="mt-8 pt-6 border-t border-border/70">
                <p className="text-[12.5px] text-muted-foreground mb-4">
                  Sem cartão de crédito · Cancele quando quiser
                </p>
                <div className="grid sm:grid-cols-3 gap-4">
                  {[
                    { icon: Monitor, title: "Sem instalar nada", desc: "Chrome, Safari ou Edge — sem setup." },
                    { icon: Smartphone, title: "Android & iOS", desc: "Instale como app pelo celular (PWA)." },
                    { icon: Cloud, title: "Dados em nuvem", desc: "Abriu no PC, já aparece no celular." },
                  ].map((f) => (
                    <div key={f.title} className="flex items-start gap-2.5">
                      <f.icon className="h-4 w-4 mt-0.5 text-primary shrink-0" strokeWidth={1.8} />
                      <div>
                        <div className="text-[13px] font-semibold text-ink leading-tight">{f.title}</div>
                        <div className="text-[12px] text-muted-foreground leading-snug mt-0.5">{f.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative w-full max-w-[720px] mx-auto lg:-mr-8">
                <img
                  src={heroAsset.url}
                  alt="Profissionais usando o ArqHub"
                  className="w-full h-auto object-contain"
                />
              </div>
            </div>
          </div>
        </section>


        {/* LETREIRO GIRATÓRIO — BAIXAR APP */}
        <button
          type="button"
          onClick={() => {
            const url = new URL(window.location.href);
            url.searchParams.set("install", "app");
            window.history.replaceState({}, "", url.toString());
            // Tenta instalar direto (1 clique) via prompt nativo.
            // Se não houver prompt disponível, o listener abre o guia.
            window.dispatchEvent(new Event("arqhub:install-now"));
          }}
          className="group relative block w-full overflow-hidden border-y border-primary/15 bg-gradient-to-r from-primary/10 via-primary/[0.04] to-primary/10 backdrop-blur-md transition-colors hover:from-primary/15 hover:via-primary/10 hover:to-primary/15"
          aria-label="Baixe o app ArqHub"
        >
          <div className="marquee relative py-1.5">
            <div className="marquee-track text-[13px] sm:text-sm font-medium tracking-wide text-foreground/85">
              {Array.from({ length: 6 }).map((_, i) => (
                <span key={i} className="mx-10 inline-flex items-center gap-3">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_10px_hsl(var(--primary))]" />
                  <span>
                    Baixe o app <span className="font-semibold text-foreground">ArqHub</span> e tenha a melhor plataforma de projetos na palma da mão
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                    clique aqui para baixar agora →
                  </span>
                </span>
              ))}
            </div>
          </div>
        </button>

        {/* FAIXA DE DESTAQUE */}
        <section className="bg-primary text-white">
          <div className="mx-auto max-w-7xl px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { big: "14 dias", small: "Teste gratuito, sem cartão" },
              { big: "Web + App", small: "Desktop, Android e iOS" },
              { big: "Ilimitados", small: "Sem limites de projetos" },
              { big: "R$129,99", small: "Por mês, no plano básico" },
            ].map((i) => (
              <div key={i.big}>
                <div className="text-2xl md:text-3xl font-bold tracking-tight">{i.big}</div>
                <div className="mt-1 text-sm text-white/85">{i.small}</div>
              </div>
            ))}
          </div>
        </section>

        {/* PORTAL DO CLIENTE */}
        <section className="py-16 sm:py-20 lg:py-28 bg-[#F4F4F2]">
          <div className="mx-auto max-w-7xl px-5 sm:px-6 grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* IMAGEM com cards flutuantes (overlap só em md+) */}
            <div className="relative order-1">
              <div className="relative rounded-2xl sm:rounded-[1.75rem] overflow-hidden shadow-[0_25px_70px_-30px_rgba(15,23,42,0.35)] ring-1 ring-black/5">
                <img
                  src={portalClienteInterior}
                  alt="Interior de projeto arquitetônico"
                  width={1280}
                  height={960}
                  loading="lazy"
                  className="w-full h-auto object-cover aspect-[4/3]"
                />
                {/* gradiente sutil para dar profundidade */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent" />
              </div>

              {/* Card mensagem do cliente — desktop: flutuante; mobile: empilhado */}
              <div className="md:absolute md:top-8 md:right-8 md:w-[270px] mt-4 md:mt-0 rounded-2xl bg-white/95 backdrop-blur-sm shadow-[0_15px_45px_-15px_rgba(15,23,42,0.25)] p-4 ring-1 ring-black/[0.04]">
                <div className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.18em] text-muted-foreground">
                  <MessageSquare className="h-3.5 w-3.5 text-primary" />
                  MENSAGEM DO CLIENTE
                </div>
                <p className="mt-2 text-sm text-[#3f3f3d] leading-snug">
                  "Adorei a versão da fachada. Aprovado para seguirmos!" — Mariana
                </p>
                <button className="mt-3 w-full text-xs font-semibold py-2 rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors">
                  Registrar aprovação
                </button>
              </div>

              {/* Card próxima etapa */}
              <div className="md:absolute md:bottom-8 md:left-8 md:w-[230px] mt-3 md:mt-0 rounded-2xl bg-white/95 backdrop-blur-sm shadow-[0_15px_45px_-15px_rgba(15,23,42,0.25)] p-4 ring-1 ring-black/[0.04] flex items-center gap-3 md:block">
                <div className="h-9 w-9 shrink-0 md:hidden grid place-items-center rounded-full bg-primary/10">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-semibold tracking-[0.18em] text-muted-foreground">PRÓXIMA ETAPA</div>
                  <div className="mt-0.5 md:mt-1 text-sm font-bold text-[#3f3f3d] truncate">Reunião de aprovação</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Sex · 14h00</div>
                </div>
              </div>
            </div>

            {/* TEXTO */}
            <div className="order-2">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                PORTAL DO CLIENTE
              </div>
              <h2 className="mt-3 font-display text-[28px] sm:text-4xl lg:text-5xl font-semibold tracking-tight text-[#3f3f3d] leading-[1.1]">
                Uma experiência <span className="text-primary">à altura</span> do seu projeto.
              </h2>
              <p className="mt-4 text-[15px] text-[#5b5b54] leading-relaxed max-w-xl">
                Seu cliente acompanha o cronograma, aprova etapas, baixa documentos e conversa com sua equipe — tudo em uma interface que reflete o nível do seu escritório.
              </p>

              <div className="mt-7 sm:mt-8 grid sm:grid-cols-2 gap-2.5 sm:gap-3">
                {[
                  { icon: Calendar, label: "Cronograma vivo" },
                  { icon: FileText, label: "Documentos centralizados" },
                  { icon: MessageSquare, label: "Mensagens em contexto" },
                  { icon: CheckCircle2, label: "Aprovações registradas" },
                ].map((f) => (
                  <div
                    key={f.label}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white ring-1 ring-black/[0.05] text-sm font-medium text-[#3f3f3d]"
                  >
                    <span className="h-8 w-8 shrink-0 grid place-items-center rounded-lg bg-primary/10">
                      <f.icon className="h-4 w-4 text-primary" />
                    </span>

                    <span className="truncate">{f.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>


        {/* AGENTES DE IA */}
        <section className="py-20 lg:py-28 bg-white">
          <div className="mx-auto max-w-7xl px-6">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                INTELIGÊNCIA
              </div>
              <span className="text-[10px] font-semibold tracking-[0.18em] uppercase bg-primary/15 text-primary px-2.5 py-1 rounded-full">
                Exclusivo Premium
              </span>
            </div>
            <div className="mt-4 grid lg:grid-cols-2 gap-8 lg:gap-16 items-end">
              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-[#3f3f3d] leading-[1.1]">
                Agentes de IA para arquitetura,{" "}
                <span className="text-primary">com sobriedade.</span>
              </h2>
              <p className="text-[15px] text-[#5b5b54] leading-relaxed max-w-md">
                IA discreta, embutida no fluxo. Sem hype. Sem distração. Apenas tempo de volta para você projetar. Disponível apenas no plano Premium.
              </p>
            </div>

            <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                { title: "IA de Orçamento", desc: "Composições e custos calculados a partir do briefing.", to: "/app/profissional/ferramentas/orcamentos" },
                { title: "IA de Diário de Obra", desc: "Relatórios estruturados a partir de fotos e áudios.", to: "/app/profissional/ferramentas/diario" },
                { title: "IA Financeiro", desc: "Antecipa inadimplência e sugere reajustes.", to: "/app/profissional/ferramentas/financeiro" },
                { title: "IA de Compras", desc: "Cotações inteligentes com fornecedores parceiros.", to: "/app/profissional/ferramentas/compras" },
              ].map((a) => (
                <Link
                  key={a.title}
                  to={a.to}
                  className="group rounded-2xl bg-white border border-black/5 p-6 shadow-[0_2px_20px_-10px_rgba(0,0,0,0.15)] hover:border-primary/30 transition-all duration-200 block"
                >
                  <div className="flex items-start justify-between">
                    <div className="h-10 w-10 rounded-full bg-[#4A4A47] flex items-center justify-center group-hover:bg-primary transition-colors">
                      <Brain className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-[10px] font-semibold tracking-[0.18em] px-2.5 py-1 rounded-full bg-primary/15 text-primary">
                      ACESSAR
                    </span>
                  </div>
                  <h3 className="mt-8 font-display text-xl font-bold text-[#3f3f3d] group-hover:text-primary transition-colors">{a.title}</h3>
                  <p className="mt-2 text-sm text-[#5b5b54] leading-relaxed">{a.desc}</p>
                  <div className="mt-4 flex items-center gap-2 text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    IR PARA FERRAMENTA <ArrowRight className="h-3 w-3" />
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[ia1, ia2, ia3, ia4].map((src, i) => (
                <div key={i} className="rounded-xl overflow-hidden aspect-[4/5]">
                  <img
                    src={src}
                    alt=""
                    width={640}
                    height={800}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* POR QUE AGORA */}
        <section className="py-20 lg:py-24 bg-[#F5F5F5]">
          <div className="mx-auto max-w-7xl px-6 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-[#3f3f3d] leading-[1.15]">
                Por que sair da planilha <span className="text-primary">agora</span>?
              </h2>
              <p className="mt-4 text-[15px] text-[#5b5b54] leading-relaxed max-w-xl">
                Cada projeto sem controle adequado custa entre 10% e 20% do orçamento em retrabalho e desvio. Com o ArqHub, você fecha essa brecha antes que ela apareça.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  "Desvio de orçamento detectado antes de estourar",
                  "Histórico de cada fase acessível do celular",
                  "Cliente acompanha sem precisar ligar para você",
                  "Equipe registra materiais e serviços no canteiro",
                  "Relatórios prontos para assinar contratos",
                  "14 dias para testar sem comprometer nada",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3 text-[#3f3f3d]">
                    <Check className="h-5 w-5 mt-0.5 text-primary shrink-0" />
                    <span className="text-sm md:text-base">{t}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-[#949494] text-white rounded-2xl p-8 md:p-10 border border-white/5 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.35)]">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white mb-5">O problema que resolvemos</div>
              <h3 className="text-xl md:text-3xl font-semibold leading-[1.2] text-white">
                10–20% do orçamento perdido em projetos sem controle.
              </h3>
              <p className="mt-4 text-[15px] text-white leading-relaxed">
                Desvio não aparece no final da obra — aparece fase a fase, compra a compra. O ArqHub foi criado para fechar essa brecha antes que ela vire prejuízo.
              </p>

              <div className="my-7 h-px bg-white/20" />

              <ul className="space-y-3 text-sm md:text-base">
                <li><span className="font-bold text-white">14 dias</span> <span className="text-white">de trial gratuito, sem cartão</span></li>
                <li><span className="font-bold text-white">Projetos ilimitados</span> <span className="text-white">num único plano</span></li>
                <li><span className="font-bold text-white">PWA</span> <span className="text-white">funciona no celular, sem App Store</span></li>
              </ul>

              <Link
                to="/cadastro"
                className="mt-8 inline-flex w-full items-center justify-center gap-2 px-6 py-3.5 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors"
              >
                Começar grátis agora
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* BENTO — O APLICATIVO */}

        <section className="py-14 lg:py-16 bg-[#F5F5F5]">
          <div className="mx-auto max-w-7xl px-6">
            <div className="text-center mb-10">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary mb-2">O Aplicativo</div>
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-[#3f3f3d] leading-[1.15]">
                Cada módulo pensado<br />para o seu escritório
              </h2>
              <p className="mt-3 text-sm md:text-[15px] text-[#5b5b54] max-w-xl mx-auto">
                Sem planilha. Sem WhatsApp. Sem confusão. Tudo no app, em tempo real.
              </p>
            </div>

            {/* Linha 1 — retângulo + quadrado */}
            <div className="grid md:grid-cols-3 gap-5">
              <div className="md:col-span-2 bg-white rounded-2xl p-8 flex flex-col min-h-[420px]">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-primary mb-5">
                  <Wallet className="h-4 w-4" />
                </div>
                <h3 className="text-lg font-bold text-[#3f3f3d]">Dashboard financeiro</h3>
                <p className="mt-2 text-sm text-[#5b5b54] leading-relaxed max-w-xl">
                  Receita total, despesas, lucro e margem por projeto em tempo real. Gráfico de receita vs despesa dos últimos 6 meses.
                </p>
                <div className="mt-6 flex-1 rounded-lg overflow-hidden border border-[#D9D9D9] bg-[#F5F5F5] flex items-center justify-center p-3">
                  <img src={bentoDashboard} alt="Dashboard do escritório" loading="lazy" decoding="async" width={1024} height={768} className="block max-w-full max-h-full w-auto h-auto object-contain rounded-md shadow-sm" />
                </div>
              </div>

              <div className="bg-primary text-white rounded-2xl p-8 flex flex-col min-h-[420px]">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15 text-white mb-5">
                  <MessageSquare className="h-4 w-4" />
                </div>
                <h3 className="text-lg font-bold">Portal do cliente</h3>
                <p className="mt-2 text-sm text-white/85 leading-relaxed">
                  Chat direto entre escritório e cliente, com aprovações, arquivos e etapas em tempo real. Sem WhatsApp.
                </p>
                <div className="mt-6 flex-1 rounded-lg overflow-hidden bg-white/10 p-3 min-h-[260px]">
                  <ChatPortalDemo />
                </div>
              </div>
            </div>

            {/* Linha 2 — quadrado + retângulo */}
            <div className="mt-5 grid md:grid-cols-3 gap-5">
              <div className="bg-white rounded-2xl p-8 flex flex-col min-h-[620px]">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-primary mb-5">
                  <ClipboardList className="h-4 w-4" />
                </div>
                <h3 className="text-lg font-bold text-[#3f3f3d]">Diário de obra</h3>
                <p className="mt-2 text-sm text-[#5b5b54] leading-relaxed">
                  Registre clima, efetivo, atividades e ocorrências por dia. Histórico completo de cada obra ao toque.
                </p>
                <div className="mt-6 flex-1 rounded-lg overflow-hidden bg-gradient-to-br from-[#f5f5f2] to-[#eeeeea] min-h-[480px]">
                  <DiarioObraDemo />
                </div>
              </div>

              <div className="md:col-span-2 bg-[#4A4A47] text-white rounded-2xl p-8 flex flex-col min-h-[460px]">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white mb-5">
                  <FolderOpen className="h-4 w-4" />
                </div>
                <h3 className="text-lg font-bold">Relatórios profissionais</h3>
                <p className="mt-2 text-sm text-white/75 leading-relaxed max-w-xl">
                  PDF e CSV por obra e período. Curva S, fluxo de caixa e obras recentes — prontos para apresentar ao cliente ou investidor.
                </p>
                <ul className="mt-4 space-y-1.5 text-sm">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Curva S planejado vs realizado</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Fluxo de caixa mensal</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Exportação PDF e CSV</li>
                </ul>
                <div className="mt-6 flex-1 rounded-lg overflow-hidden bg-white/5">
                  <img src={bentoRelatorios} alt="Relatórios profissionais" loading="lazy" decoding="async" width={1280} height={768} className="block w-full h-full object-cover" />
                </div>
              </div>
            </div>


            {/* Linha 3 — três cards pequenos */}
            <div className="mt-5 grid md:grid-cols-3 gap-5">
              {[

                { icon: Globe, title: "Portal público da obra", desc: "Link único para o cliente acompanhar fases, fotos e diário. Sem login. Sem dados financeiros." },
                { icon: LayoutGrid, title: "Mapa de obras", desc: "Visualize todas as obras em um mapa. Geolocalização automática ao registrar no canteiro." },
                { icon: FolderOpen, title: "Materiais e fornecedores", desc: "Registre compras com NF, fornecedor e fase. Rastreie tudo sem planilha." },
              ].map((c) => (
                <div key={c.title} className="bg-white rounded-2xl p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-primary mb-4">
                    <c.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-[#3f3f3d]">{c.title}</h3>
                  <p className="mt-1.5 text-sm text-[#5b5b54] leading-relaxed">{c.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* MÓDULOS */}


        <section className="py-24 border-t border-border">
          <div className="mx-auto max-w-7xl px-6">
            <div className="max-w-2xl">
              <div className="text-xs font-semibold uppercase tracking-wider text-primary mb-3">Plataforma completa</div>
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
                Tudo que seu escritório precisa, em um só lugar.
              </h2>
              <p className="mt-3 text-[15px] text-muted-foreground">
                Do orçamento ao diário de obra, do cronograma ao portal do cliente — projetado para arquitetos, engenheiros e designers.
              </p>
            </div>
            <TooltipProvider delayDuration={150}>
              <div className="mt-12 grid gap-px bg-border rounded-2xl overflow-hidden md:grid-cols-2 lg:grid-cols-4">
                {modules.map((m) => (
                  <Tooltip key={m.title}>
                    <TooltipTrigger asChild>
                      <Link
                        to="/funcionalidades/$slug"
                        params={{ slug: m.slug }}
                        className="bg-white p-6 hover:bg-surface transition-colors block group"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-primary-dark mb-4">
                          <m.icon className="h-5 w-5" />
                        </div>
                        <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">{m.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{m.desc}</p>
                        <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                          Ver como funciona <ArrowRight className="h-3 w-3" />
                        </span>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs text-sm leading-relaxed p-4">
                      <p className="font-semibold mb-1">{m.title}</p>
                      <p>{m.details}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </TooltipProvider>
          </div>
        </section>


        {/* PORTAL DO CLIENTE */}
        <section className="py-20 lg:py-24 bg-[#4A4A47] text-white border-t border-border">
          <div className="mx-auto max-w-7xl px-6 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <h2 className="mt-4 text-3xl md:text-4xl font-semibold tracking-tight leading-[1.1] text-white">
                Seu cliente acompanha<br />
                <span className="text-white/90">sem precisar ligar pra você.</span>
              </h2>
              <p className="mt-4 text-[15px] text-white/70 leading-relaxed max-w-xl">
                Gere um link único por obra e compartilhe com o cliente. Ao escanear o QR code ou clicar no link, ele é direcionado para uma página com fases, fotos e diário em tempo real — sem criar conta, sem ver dados financeiros.
              </p>
              <ul className="mt-6 space-y-3 text-sm">
                <li className="flex items-center gap-3"><Check className="h-4 w-4 text-primary shrink-0" /> Fases com % de avanço atualizado</li>
                <li className="flex items-center gap-3"><Check className="h-4 w-4 text-primary shrink-0" /> Diário de obra com clima e atividades</li>
                <li className="flex items-center gap-3"><Check className="h-4 w-4 text-primary shrink-0" /> Galeria de fotos da obra</li>
                <li className="flex items-center gap-3"><Check className="h-4 w-4 text-primary shrink-0" /> Sem acesso a dados financeiros ou contratos</li>
                <li className="flex items-center gap-3"><Check className="h-4 w-4 text-primary shrink-0" /> Funciona em qualquer celular, sem app</li>
              </ul>
              <div className="mt-8">
                <Link
                  to="/cadastro"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition hover:bg-primary-dark"
                >
                  Começar grátis <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-[#3f3f3d] shadow-2xl">
                <p className="text-center text-sm text-[#5b5b54]">
                  Escaneie para ver a visão<br />do cliente ao vivo
                </p>
                <div className="mt-5 aspect-square rounded-xl border border-[#E5E5E5] bg-white p-4 flex items-center justify-center">
                  <QRCodeSVG
                    value="https://arqhub.world/obra/demo"
                    size={256}
                    level="M"
                    className="h-full w-full"
                  />
                </div>
                <p className="mt-5 text-center text-xs text-[#7a7a7a]">ou acesse pelo link</p>
                <Link
                  to="/obra/$slug"
                  params={{ slug: "demo" }}
                  className="mt-1 block text-center text-sm font-medium text-primary underline underline-offset-4 hover:text-primary-dark"
                >
                  arqhub.app/obra/demo
                </Link>
              </div>
              <p className="mt-4 text-center text-xs text-white/50 max-w-xs">
                Demonstração com obra fictícia — veja fases, fotos e diário exatamente como o cliente vê.
              </p>
            </div>
          </div>
        </section>

        {/* PLANOS PREVIEW */}
        <PlanosPreview />


        {/* CONTEÚDO GRATUITO */}
        <section className="py-20 lg:py-28 bg-surface border-t border-border">
          <div className="mx-auto max-w-6xl px-5 sm:px-6">
            <div className="text-center max-w-2xl mx-auto">
              <div className="t-eyebrow text-primary mb-2">Conteúdo gratuito</div>
              <h2 className="t-h2">
                Materiais para você empreender melhor em arquitetura e construção
              </h2>
              <p className="mt-3 t-body text-muted-foreground">
                Artigos, guias e planilhas produzidos pelo time ArqHub. Acesse de graça.
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {[
                {
                  to: "/conteudos/empreenda" as const,
                  eyebrow: "Empreenda",
                  title: "Conteúdos exclusivos para crescer",
                  desc: "Artigos sobre gestão, captação de clientes, vendas e produtividade no escritório.",
                  cta: "Acessar artigos",
                  image: conteudoEmpreenda,
                  tag: "Artigos",
                },
                {
                  to: "/conteudos/potencializador" as const,
                  eyebrow: "Potencializador",
                  title: "Matérias especiais e tendências",
                  desc: "Conteúdos aprofundados sobre tecnologia, IA, sustentabilidade e o futuro do setor.",
                  cta: "Ler matérias",
                  image: conteudoPotencializador,
                  tag: "Matérias",
                },
                {
                  to: "/conteudos/seu-negocio" as const,
                  eyebrow: "Seu Negócio",
                  title: "PDFs e planilhas para baixar",
                  desc: "Modelos prontos: cronograma, diário de obra, SINAPI, prompts de IA e muito mais.",
                  cta: "Baixar materiais",
                  image: conteudoSeuNegocio,
                  tag: "Downloads",
                },
              ].map((c) => (
                <Link
                  key={c.to}
                  to={c.to}
                  className="group relative flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-black/[0.06] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_-20px_rgba(15,23,42,0.25)] hover:ring-black/10"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                    <img
                      src={c.image}
                      alt={c.title}
                      width={1024}
                      height={640}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/0 to-transparent" />
                    <span className="absolute top-3 left-3 inline-flex items-center rounded-full bg-white/95 backdrop-blur px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink shadow-sm">
                      {c.tag}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col p-6">
                    <div className="t-eyebrow text-primary">{c.eyebrow}</div>
                    <h3 className="mt-2 t-h4 text-ink leading-snug">{c.title}</h3>
                    <p className="mt-2 t-body-sm text-muted-foreground leading-relaxed">{c.desc}</p>
                    <div className="mt-5 inline-flex items-center gap-1.5 t-label text-ink pt-4 border-t border-border/60 mt-auto">
                      {c.cta}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

      </main>

      <SiteFooter />
    </div>
  );
}

function PlanosPreview() {
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

        {/* Toggle Mensal / Anual */}
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
            <span className="text-[10px] font-bold bg-primary/15 text-primary px-1.5 py-0.5 rounded-full">
              -20%
            </span>
          </button>
        </div>

        <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-3 gap-6 text-left max-w-5xl mx-auto">
          {plans.map((p) => {
            const dark = p.popular;
            const isCustom = p.monthly === "Personalizado";
            const isEnterprise = p.name === "Enterprise";
            return (
              <div
                key={p.name}
                className={`rounded-2xl p-8 relative flex flex-col min-h-[560px] ${
                  dark ? "bg-[#4A4A47] text-white" : "bg-white border border-border"
                }`}
              >
                {p.popular && (
                  <div className="absolute -top-3 right-6 px-3 py-1 rounded-full bg-primary text-white text-xs font-semibold">
                    Pacote completo
                  </div>
                )}
                <div className={`text-sm font-semibold ${dark ? "text-white/60" : "text-muted-foreground"}`}>
                  {p.name}
                </div>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className={`font-bold font-display ${isCustom ? "text-3xl" : "text-4xl"}`}>
                    {annual ? p.annualMonthly : p.monthly}
                  </span>
                  {!isCustom && (
                    <span className={dark ? "text-white/60" : "text-muted-foreground"}>/mês</span>
                  )}
                </div>
                <p className={`mt-2 text-sm ${dark ? "text-white/60" : "text-muted-foreground"}`}>
                  {isCustom
                    ? "Sob consulta"
                    : annual
                    ? `${p.annual} cobrado anualmente`
                    : "Cobrado mensalmente"}
                </p>
                <ul className="mt-6 space-y-3 text-sm">
                  {p.features.map((f) => {
                    const premiumSlug: Record<string, string> = {
                      "Orçamentos Inteligentes (IA)": "orcamentos-inteligentes",
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

