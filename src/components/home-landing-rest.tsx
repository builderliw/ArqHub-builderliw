import { Link } from "@tanstack/react-router";
import {
  ArrowRight, Check, LayoutGrid, CheckSquare, Calendar,
  ClipboardList, Wallet, FolderOpen, Sparkles, Globe,
  QrCode, MessageSquare, FileText, CheckCircle2,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import bentoDashboard from "@/assets/bento-dashboard.webp";
import bentoAlertas from "@/assets/bento-alertas.webp";
import bentoDiario from "@/assets/bento-diario.webp";
import bentoRelatorios from "@/assets/bento-relatorios.webp";
import conteudoEmpreenda from "@/assets/conteudo-empreenda.jpg";
import conteudoPotencializador from "@/assets/conteudo-potencializador.jpg";
import conteudoSeuNegocio from "@/assets/conteudo-seu-negocio.jpg";
import { ChatPortalDemo } from "@/components/marketing/chat-portal-demo";
import { DiarioObraDemo } from "@/components/marketing/diario-obra-demo";
import { PlanosPreview } from "@/components/home-planos-preview";

const DEMO_OBRA_URL = "https://arqhub.site/obra/demo";

const modules = [
  { icon: LayoutGrid, title: "Projetos", slug: "projetos", desc: "Acompanhe ativos, concluídos, status e timeline em uma só visão.", details: "Centralize todos os projetos do escritório em um só lugar." },
  { icon: CheckSquare, title: "Tarefas", slug: "cronograma", desc: "Kanban com A Fazer, Em Andamento, Revisão e Concluído.", details: "Quadro Kanban arrastar-e-soltar com 4 colunas." },
  { icon: Calendar, title: "Cronograma", slug: "cronograma", desc: "Gantt visual com marcos, entregas e dependências.", details: "Gráfico de Gantt interativo para planejar fases do projeto." },
  { icon: ClipboardList, title: "Diário de Obra", slug: "projetos", desc: "Fotos, vídeos, observações e histórico completo.", details: "Registre o avanço da obra com fotos, vídeos e anotações datadas." },
  { icon: Wallet, title: "Financeiro", slug: "financeiro", desc: "Receitas, despesas, fluxo de caixa e rentabilidade por projeto.", details: "Controle receitas e despesas por projeto e geral." },
  { icon: FolderOpen, title: "Arquivos", slug: "projetos", desc: "PDF, DWG, DXF, imagens — tudo organizado por projeto.", details: "Repositório de arquivos por projeto." },
  { icon: Sparkles, title: "Inteligência Artificial", slug: "ia-arqhub", desc: "Orçamentos, levantamentos e planejamento automatizados. Exclusivo Premium.", details: "Recurso exclusivo do plano Premium.", premium: true },
  { icon: Globe, title: "Portfólio Digital", slug: "clientes", desc: "Página pública personalizada com seus melhores projetos.", details: "Página pública com seu domínio e identidade visual." },
];

export function HomeLandingRest() {
  return (
    <>
      <section className="py-20 lg:py-24 bg-[#F5F5F5]">
        <div className="mx-auto max-w-7xl px-6 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-[#3f3f3d] leading-[1.15]">
              Por que sair da planilha <span className="text-primary">agora?</span>
            </h2>
            <p className="mt-4 text-[15px] text-[#5b5b54] leading-relaxed">
              Cada projeto sem controle adequado custa entre 10% e 20% do orçamento em retrabalho e desvio. Com o ArqHub, você fecha essa brecha antes que ela apareça.
            </p>
            <ul className="mt-6 space-y-2.5 text-[14px] text-[#3f3f3d]">
              {[
                "Desvio de orçamento detectado antes de estourar",
                "Histórico de cada fase acessível do celular",
                "Cliente acompanha sem precisar ligar para você",
                "Equipe registra materiais e serviços no canteiro",
                "Relatórios prontos para assinar contratos",
                "14 dias para testar sem comprometer nada",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl bg-[#4A4A47] text-white p-8 shadow-xl">
            <div className="text-[11px] font-semibold tracking-[0.18em] uppercase text-white/60">
              O problema que resolvemos
            </div>
            <h3 className="mt-3 text-2xl font-semibold leading-snug">
              10–20% do orçamento perdido em projetos sem controle.
            </h3>
            <p className="mt-3 text-[14px] text-white/80 leading-relaxed">
              Desvio não aparece no final da obra — aparece fase a fase, compra a compra. O ArqHub foi criado para fechar essa brecha antes que ela vire prejuízo.
            </p>
            <ul className="mt-6 space-y-2 text-[13px] text-white/90">
              <li>14 dias de trial gratuito, sem cartão</li>
              <li>Projetos ilimitados num único plano</li>
              <li>PWA funciona no celular, sem App Store</li>
            </ul>
            <Link
              to="/cadastro"
              className="mt-6 inline-flex items-center gap-2 px-5 h-11 bg-primary text-white rounded-lg text-[14px] font-semibold hover:bg-primary-dark"
            >
              Começar grátis agora <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-14 lg:py-16 bg-[#F5F5F5]">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-2xl mx-auto">
            <div className="text-[11px] font-semibold tracking-[0.18em] uppercase text-primary">O aplicativo</div>
            <h2 className="mt-2 text-3xl md:text-4xl font-semibold tracking-tight text-[#3f3f3d]">
              Cada módulo pensado para o seu escritório
            </h2>
            <p className="mt-3 text-[15px] text-[#5b5b54]">
              Sem planilha. Sem WhatsApp. Sem confusão. Tudo no app, em tempo real.
            </p>
          </div>

          <div className="mt-10 grid lg:grid-cols-2 gap-5">
            <div className="rounded-2xl bg-white border border-black/5 p-5 shadow-sm">
              <div className="text-[13px] font-semibold text-ink">Dashboard financeiro</div>
              <p className="mt-1 text-[12.5px] text-muted-foreground">Receita total, despesas, lucro e margem por projeto em tempo real.</p>
              <div className="mt-4 rounded-xl overflow-hidden border border-border">
                <img src={bentoDashboard} alt="Dashboard" className="w-full h-auto" loading="lazy" />
              </div>
            </div>
            <div className="rounded-2xl bg-[#3f5c3a] text-white p-5 shadow-sm">
              <div className="text-[13px] font-semibold">Portal do cliente</div>
              <p className="mt-1 text-[12.5px] text-white/80">Chat direto entre escritório e cliente, com aprovações e etapas em tempo real.</p>
              <div className="mt-4">
                <ChatPortalDemo />
              </div>
            </div>
            <div className="rounded-2xl bg-white border border-black/5 p-5 shadow-sm">
              <div className="text-[13px] font-semibold text-ink">Diário de obra</div>
              <p className="mt-1 text-[12.5px] text-muted-foreground">Registre clima, efetivo, atividades e ocorrências por dia.</p>
              <div className="mt-4">
                <DiarioObraDemo />
              </div>
            </div>
            <div className="rounded-2xl bg-[#1d1d1b] text-white p-5 shadow-sm">
              <div className="text-[13px] font-semibold">Relatórios profissionais</div>
              <p className="mt-1 text-[12.5px] text-white/80">PDF e CSV por obra e período — prontos para apresentar ao cliente ou investidor.</p>
              <div className="mt-4 rounded-xl overflow-hidden">
                <img src={bentoRelatorios} alt="Relatórios" className="w-full h-auto" loading="lazy" />
              </div>
            </div>
          </div>

          <div className="mt-5 grid sm:grid-cols-3 gap-5">
            {[
              { img: bentoAlertas, title: "Portal público da obra", desc: "Link único para o cliente acompanhar fases, fotos e diário. Sem login. Sem dados financeiros." },
              { img: bentoDiario, title: "Mapa de obras", desc: "Visualize todas as obras em um mapa. Geolocalização automática ao registrar no canteiro." },
              { img: bentoAlertas, title: "Materiais e fornecedores", desc: "Registre compras com NF, fornecedor e fase. Rastreie tudo sem planilha." },
            ].map((c) => (
              <div key={c.title} className="rounded-2xl bg-white border border-black/5 p-5 shadow-sm">
                <div className="text-[14px] font-semibold text-ink">{c.title}</div>
                <p className="mt-1.5 text-[12.5px] text-muted-foreground leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 border-t border-border">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-[11px] font-semibold tracking-[0.18em] uppercase text-primary">Plataforma completa</div>
          <h2 className="mt-2 text-3xl md:text-4xl font-semibold tracking-tight text-[#3f3f3d] max-w-2xl">
            Tudo que seu escritório precisa, em um só lugar.
          </h2>
          <p className="mt-3 text-[15px] text-[#5b5b54] max-w-2xl">
            Do orçamento ao diário de obra, do cronograma ao portal do cliente — projetado para arquitetos, engenheiros e designers.
          </p>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {modules.map((m) => (
              <TooltipProvider key={m.title}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      to="/funcionalidades/$slug"
                      params={{ slug: m.slug }}
                      className="rounded-2xl border border-border bg-white p-5 hover:border-primary/30 transition-colors block"
                    >
                      <m.icon className="h-5 w-5 text-primary" strokeWidth={1.8} />
                      <div className="mt-3 text-[14px] font-semibold text-ink">{m.title}</div>
                      <p className="mt-1 text-[12.5px] text-muted-foreground leading-relaxed">{m.desc}</p>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-[12px]">{m.details}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-24 bg-[#4A4A47] text-white border-t border-border">
        <div className="mx-auto max-w-7xl px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight leading-[1.15]">
              Seu cliente acompanha sem precisar ligar pra você.
            </h2>
            <p className="mt-4 text-[15px] text-white/80 leading-relaxed">
              Gere um link único por obra e compartilhe com o cliente. Ao escanear o QR code ou clicar no link, ele é direcionado para uma página com fases, fotos e diário em tempo real — sem criar conta, sem ver dados financeiros.
            </p>
            <ul className="mt-6 space-y-2 text-[14px] text-white/90">
              {["Fases com % de avanço atualizado", "Diário de obra com clima e atividades", "Galeria de fotos da obra", "Sem acesso a dados financeiros ou contratos", "Funciona em qualquer celular, sem app"].map((x) => (
                <li key={x} className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  {x}
                </li>
              ))}
            </ul>
            <Link to="/cadastro" className="mt-8 inline-flex items-center gap-2 px-5 h-11 bg-primary text-white rounded-lg text-[14px] font-semibold hover:bg-primary-dark">
              Começar grátis <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="flex justify-center">
            <div className="bg-white rounded-2xl p-6 text-center shadow-xl max-w-sm w-full">
              <div className="text-[12px] text-muted-foreground mb-3">Escaneie para ver a visão do cliente ao vivo</div>
              <div className="inline-block p-3 bg-white rounded-xl">
                <QRCodeSVG value={DEMO_OBRA_URL} size={180} level="M" />
              </div>
              <div className="mt-3 text-[12px] text-muted-foreground">
                ou acesse pelo link{" "}
                <a href={DEMO_OBRA_URL} className="text-primary font-medium hover:underline" target="_blank" rel="noreferrer">
                  arqhub.site/obra/demo
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <PlanosPreview />

      <section className="py-20 bg-white border-t border-border">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-2xl mx-auto">
            <div className="text-[11px] font-semibold tracking-[0.18em] uppercase text-primary">Conteúdo gratuito</div>
            <h2 className="mt-2 text-3xl md:text-4xl font-semibold tracking-tight text-[#3f3f3d]">
              Materiais para você empreender melhor em arquitetura e construção
            </h2>
            <p className="mt-3 text-[15px] text-[#5b5b54]">
              Artigos, guias e planilhas produzidos pelo time ArqHub. Acesse de graça.
            </p>
          </div>
          <div className="mt-10 grid md:grid-cols-3 gap-6">
            {[
              { img: conteudoEmpreenda, tag: "Artigos", title: "Empreenda", desc: "Conteúdos exclusivos para crescer", href: "/conteudos/empreenda", cta: "Acessar artigos" },
              { img: conteudoPotencializador, tag: "Matérias", title: "Potencializador", desc: "Matérias especiais e tendências", href: "/conteudos/potencializador", cta: "Ler matérias" },
              { img: conteudoSeuNegocio, tag: "Downloads", title: "Seu negócio", desc: "PDFs e planilhas para baixar", href: "/conteudos/seu-negocio", cta: "Baixar materiais" },
            ].map((c) => (
              <Link key={c.title} to={c.href as any} className="group rounded-2xl border border-border overflow-hidden bg-white hover:border-primary/30 transition-colors">
                <div className="aspect-[16/10] overflow-hidden">
                  <img src={c.img} alt={c.title} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300" loading="lazy" />
                </div>
                <div className="p-5">
                  <div className="text-[10px] font-semibold tracking-[0.14em] uppercase text-muted-foreground">{c.tag}</div>
                  <div className="mt-1 text-[15px] font-semibold text-ink">{c.title}</div>
                  <p className="mt-1 text-[13px] text-muted-foreground">{c.desc}</p>
                  <span className="mt-3 inline-flex text-[13px] font-medium text-primary">{c.cta} →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
