import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ArrowLeft, Eye, Star, BookOpen } from "lucide-react";
import { useState } from "react";
import img1 from "@/assets/artigo-ia-fin-1.jpg";
import img2 from "@/assets/artigo-ia-fin-2.jpg";
import img3 from "@/assets/artigo-ia-fin-3.jpg";
import img4 from "@/assets/artigo-ia-fin-4.jpg";
import img5 from "@/assets/artigo-ia-fin-5.jpg";

function StarRating() {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  return (
    <div className="flex items-center gap-2">
      <span className="t-caption uppercase tracking-wider text-muted-foreground text-[11px] mr-1">
        {submitted ? "Obrigado!" : "Avalie:"}
      </span>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={submitted}
            onClick={() => {
              setRating(star);
              setSubmitted(true);
            }}
            onMouseEnter={() => !submitted && setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="transition-transform hover:scale-110 focus:outline-none disabled:cursor-default"
            aria-label={`${star} estrelas`}
          >
            <Star
              className={`w-5 h-5 transition-colors ${
                star <= (hover || rating)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-muted-foreground/50"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export const Route = createFileRoute("/conteudos/potencializador_/ia-financeiro")({
  head: () => ({
    meta: [
      { title: "O primeiro Agente de IA Financeiro da Construção Civil | ArqHub" },
      {
        name: "description",
        content:
          "Como a IA está transformando o controle financeiro de obras: lançamentos por foto, conciliação automática e previsão de fluxo de caixa.",
      },
      { property: "og:title", content: "O primeiro Agente de IA Financeiro da Construção Civil" },
      {
        property: "og:description",
        content:
          "Lançamentos por foto, conciliação bancária automática, auditoria inteligente e previsão de caixa — a nova era da gestão financeira de obras.",
      },
      { property: "og:image", content: img1 },
      { property: "twitter:image", content: img1 },
    ],
  }),
  component: Artigo,
});

// Manual-style components
function P({ children }: { children: React.ReactNode }) {
  return <p className="t-body text-ink/85 leading-[1.85] mb-5">{children}</p>;
}
function Lead({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[19px] sm:text-[20px] leading-[1.7] text-ink/90 mb-6 font-light first-letter:text-[64px] first-letter:font-display first-letter:font-semibold first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:leading-[0.9] first-letter:text-primary">
      {children}
    </p>
  );
}
function Chapter({ num, title }: { num: string; title: string }) {
  return (
    <div className="mt-20 mb-8 clear-both">
      <div className="flex items-center gap-3 mb-3">
        <BookOpen className="w-4 h-4 text-primary" />
        <span className="t-caption uppercase tracking-[0.2em] text-primary text-[11px] font-semibold">
          Capítulo {num}
        </span>
      </div>
      <h2 className="font-display text-[28px] sm:text-[36px] leading-[1.15] tracking-[-0.01em] text-ink font-semibold border-b border-border pb-5">
        {title}
      </h2>
    </div>
  );
}
function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="t-h4 text-ink mt-8 mb-3">{children}</h3>;
}
function Quote({ children }: { children: React.ReactNode }) {
  return (
    <blockquote className="my-10 border-l-4 border-primary pl-6 py-1 text-ink/90 italic t-body-lg clear-both">
      {children}
    </blockquote>
  );
}
function List({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 mb-6 ml-1">
      {items.map((i) => (
        <li key={i} className="flex gap-3 t-body text-ink/85">
          <span className="mt-2.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
          <span>{i}</span>
        </li>
      ))}
    </ul>
  );
}
// Float-wrapped square image (text encaixa ao redor)
function FloatFigure({
  src,
  alt,
  caption,
  side = "right",
}: {
  src: string;
  alt: string;
  caption: string;
  side?: "left" | "right";
}) {
  return (
    <figure
      className={`my-4 sm:w-[42%] sm:max-w-[360px] ${
        side === "right" ? "sm:float-right sm:ml-8 sm:mr-0" : "sm:float-left sm:mr-8 sm:ml-0"
      } sm:mb-4 mb-8`}
    >
      <div className="overflow-hidden rounded-sm">
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="w-full h-auto object-cover aspect-square"
        />
      </div>
      <figcaption className="mt-3 text-[12px] text-muted-foreground leading-snug border-l-2 border-primary pl-3">
        {caption}
      </figcaption>
    </figure>
  );
}
// Full-width rectangular figure
function WideFigure({
  src,
  alt,
  caption,
  ratio = "16/9",
}: {
  src: string;
  alt: string;
  caption: string;
  ratio?: string;
}) {
  return (
    <figure className="my-12 clear-both">
      <div className="overflow-hidden rounded-sm">
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="w-full h-auto object-cover"
          style={{ aspectRatio: ratio }}
        />
      </div>
      <figcaption className="mt-3 text-[12.5px] text-muted-foreground leading-snug border-l-2 border-primary pl-3">
        {caption}
      </figcaption>
    </figure>
  );
}

function Artigo() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <article className="pt-10 lg:pt-14 pb-16">
          <div className="mx-auto max-w-7xl px-6">
            <div className="flex items-center gap-3 t-caption text-muted-foreground mb-6">
              <Link
                to="/conteudos/potencializador"
                className="inline-flex items-center gap-1.5 hover:text-ink transition-colors"
              >
                <ArrowLeft className="h-3 w-3" /> Potencializador
              </Link>
              <span className="text-border">·</span>
              <span className="uppercase tracking-[0.14em] text-primary font-semibold text-[11px]">
                Tendências
              </span>
              <span className="text-border">·</span>
              <span>12 min de leitura</span>
            </div>

            <h1 className="font-display text-[34px] sm:text-[46px] lg:text-[54px] leading-[1.05] tracking-[-0.02em] text-ink font-semibold">
              O primeiro Agente de IA Financeiro da Construção Civil
            </h1>

            <p className="mt-6 text-[19px] sm:text-[22px] leading-[1.5] text-muted-foreground font-light">
              Como a Inteligência Artificial está transformando o controle financeiro de obras.
            </p>

            <div className="mt-8 pb-8 mb-2 border-b border-border flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white font-semibold text-[13px]">
                  A
                </span>
                <div>
                  <div className="text-[13px] font-semibold text-ink">Equipe ArqHub</div>
                  <div className="text-[12px] text-muted-foreground">Publicado em junho de 2026</div>
                </div>
              </div>
              <div className="flex items-center gap-5">
                <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                  <Eye className="w-3.5 h-3.5" />
                  <span>
                    <span className="font-semibold text-ink">4.872</span> leituras
                  </span>
                </div>
                <StarRating />
              </div>
            </div>

            <WideFigure
              src={img1}
              alt="Robô humanoide sentado em banco usando laptop"
              caption="A nova geração de Agentes de IA atua como colaboradores digitais especializados no financeiro da obra."
              ratio="16/9"
            />

            <Lead>
              Durante décadas, o controle financeiro de obras foi baseado em planilhas, notas
              fiscais impressas, comprovantes espalhados em grupos de WhatsApp e lançamentos
              manuais realizados dias ou até semanas depois da despesa ocorrer.
            </Lead>

            <P>
              O resultado desse modelo é conhecido por qualquer profissional da construção civil:
              falta de visibilidade, atraso na tomada de decisão, estouros de orçamento, retrabalho
              administrativo e margens cada vez menores.
            </P>
            <P>
              Agora, uma nova geração de tecnologia começa a mudar esse cenário: os{" "}
              <strong>Agentes de IA Financeiros para Construção Civil</strong>.
            </P>
            <P>
              Mais do que um software de gestão, esses agentes funcionam como assistentes
              financeiros autônomos, capazes de interpretar documentos, realizar lançamentos
              automáticos, conciliar movimentações bancárias e prever problemas de caixa antes que
              eles aconteçam.
            </P>

            <H3>O que é um Agente de IA Financeiro?</H3>
            <P>
              Um Agente de IA Financeiro é um sistema inteligente que atua como um colaborador
              digital especializado no financeiro da obra. Em vez de apenas armazenar informações,
              ele interpreta dados, executa tarefas e sugere ações automaticamente.
            </P>
            <P>Na prática, ele consegue:</P>
            <List
              items={[
                "Ler notas fiscais e comprovantes",
                "Extrair valores, datas e fornecedores",
                "Classificar despesas automaticamente",
                "Atualizar centros de custo da obra",
                "Conciliar movimentações bancárias",
                "Detectar inconsistências financeiras",
                "Projetar fluxo de caixa futuro",
                "Alertar sobre riscos de estouro de orçamento",
              ]}
            />
            <Quote>
              A inteligência artificial deixa de ser uma ferramenta de consulta e passa a executar
              atividades operacionais que antes consumiam horas da equipe administrativa.
            </Quote>

            {/* CAPÍTULO 1 */}
            <Chapter num="1" title="Lançamentos financeiros por foto" />

            <FloatFigure
              src={img2}
              alt="Mestre de obras fotografando nota fiscal pelo celular no canteiro"
              caption="Do canteiro direto para o sistema: a câmera substitui a digitação."
              side="right"
            />

            <P>
              Imagine a seguinte situação: o mestre de obras compra materiais em uma loja de
              construção. Ao invés de guardar a nota fiscal para lançar posteriormente no sistema,
              ele simplesmente tira uma foto pelo celular e envia para o Agente Financeiro.
            </P>
            <P>Em poucos segundos, a IA:</P>
            <List
              items={[
                "Identifica o documento",
                "Reconhece os dados utilizando OCR avançado",
                "Extrai fornecedor, valor, data e categoria",
                "Relaciona a compra à obra correta",
                "Cria o lançamento financeiro automaticamente",
              ]}
            />
            <P>
              O que antes demandava vários minutos de digitação passa a ocorrer em segundos.
              Algumas soluções já utilizam esse conceito através de WhatsApp e aplicativos móveis,
              permitindo que a equipe de campo registre despesas diretamente do canteiro de obras.
            </P>

            <H3>Benefícios</H3>
            <List
              items={[
                "Redução de erros de digitação",
                "Registro financeiro em tempo real",
                "Menor dependência do administrativo",
                "Histórico completo e rastreável",
                "Maior aderência ao orçamento",
              ]}
            />

            {/* CAPÍTULO 2 */}
            <Chapter num="2" title="Conciliação bancária automática" />

            <WideFigure
              src={img3}
              alt="Dashboard financeiro em laptop com gráficos de conciliação bancária"
              caption="A IA cruza extratos, notas e ordens de compra automaticamente — humanos só revisam as exceções."
              ratio="16/9"
            />

            <P>
              Uma das tarefas mais demoradas da gestão financeira é conferir se os lançamentos
              realizados correspondem aos valores efetivamente pagos. Tradicionalmente, isso exige:
            </P>
            <List
              items={[
                "Baixar extratos",
                "Conferir comprovantes",
                "Cruzar dados manualmente",
                "Investigar divergências",
              ]}
            />
            <P>
              Com IA, esse processo muda completamente. Ao conectar a conta bancária da empresa,
              o agente monitora automaticamente todas as movimentações financeiras. Sempre que
              identifica um pagamento, ele procura correspondência entre nota fiscal, ordem de
              compra, fornecedor, centro de custo e categoria financeira.
            </P>
            <P>
              Quando encontra uma correspondência, realiza a conciliação automaticamente. Quando
              encontra uma inconsistência, gera um alerta para análise humana.
            </P>
            <Quote>
              Empresas deixam de gastar horas semanais revisando extratos e passam a trabalhar
              apenas sobre exceções e alertas relevantes.
            </Quote>

            {/* CAPÍTULO 3 */}
            <Chapter num="3" title="Previsão de fluxo de caixa da obra" />

            <FloatFigure
              src={img4}
              alt="Engenheiro analisando previsão de fluxo de caixa em tablet no canteiro"
              caption="Da contabilidade do passado para a antecipação do futuro."
              side="left"
            />

            <P>
              Talvez a funcionalidade mais poderosa dos Agentes Financeiros seja sua capacidade
              preditiva. Enquanto softwares tradicionais mostram apenas o passado, a IA consegue
              projetar o futuro financeiro da obra.
            </P>
            <P>Ela analisa cronograma físico e financeiro, histórico de compras, contratos em aberto, medições futuras, pagamentos recorrentes e ritmo de execução.</P>
            <P>Com base nesses dados, gera previsões como:</P>
            <List
              items={[
                "Quanto dinheiro será necessário nos próximos 30 dias?",
                "Quando ocorrerá o pico de desembolso?",
                "Qual obra apresenta maior risco financeiro?",
                "Quando o caixa ficará negativo?",
                "Qual fornecedor representa maior impacto financeiro?",
              ]}
            />
            <P>
              Pesquisas recentes na área de gestão de obras demonstram que técnicas avançadas de
              inteligência artificial e aprendizado de máquina conseguem otimizar fluxos
              financeiros e prever cenários de risco com maior precisão do que métodos
              tradicionais.
            </P>

            {/* CAPÍTULO 4 */}
            <Chapter num="4" title="Detecção automática de desvios e fraudes" />

            <P>
              Outro avanço importante é a capacidade da IA identificar padrões suspeitos. O agente
              pode detectar:
            </P>

            <H3>Pagamentos duplicados</H3>
            <P>Duas notas semelhantes registradas para o mesmo fornecedor.</P>

            <H3>Compras acima do padrão</H3>
            <P>Materiais adquiridos com preço muito superior à média histórica.</P>

            <H3>Desvios de orçamento</H3>
            <P>Categorias consumindo recursos acima do previsto.</P>

            <H3>Fornecedores com comportamento atípico</H3>
            <P>Aumento repentino na frequência ou volume de pagamentos.</P>

            <H3>Inconsistências documentais</H3>
            <P>Diferenças entre nota fiscal, pedido de compra e pagamento realizado.</P>

            <WideFigure
              src={img5}
              alt="Visualização abstrata de IA conectando documentos financeiros"
              caption="A auditoria inteligente identifica irregularidades antes que se transformem em prejuízo."
              ratio="16/9"
            />

            {/* CAPÍTULO 5 */}
            <Chapter num="5" title="O fim das planilhas na construção civil?" />

            <P>
              A planilha continuará existindo por muitos anos. Porém, seu papel está mudando.
              Antes, ela era a ferramenta principal de gestão. Agora, passa a ser apenas uma fonte
              complementar de consulta.
            </P>
            <P>A tendência é que o controle financeiro migre para sistemas inteligentes que:</P>
            <List
              items={[
                "Atualizam informações automaticamente",
                "Eliminam tarefas repetitivas",
                "Mantêm dados sincronizados",
                "Produzem análises em tempo real",
                "Aprendem continuamente com o histórico da empresa",
              ]}
            />
            <P>
              O mercado da construção civil vive uma transformação semelhante à que ocorreu em
              setores como logística, varejo e serviços financeiros nos últimos anos.
            </P>

            {/* CONCLUSÃO */}
            <div className="mt-20 mb-8 clear-both">
              <span className="t-caption uppercase tracking-[0.2em] text-primary text-[11px] font-semibold">
                Conclusão
              </span>
              <h2 className="mt-3 font-display text-[28px] sm:text-[36px] leading-[1.15] tracking-[-0.01em] text-ink font-semibold border-b border-border pb-5">
                Antecipar, não apenas registrar
              </h2>
            </div>

            <P>
              O primeiro Agente de IA Financeiro da Construção Civil representa uma mudança
              profunda na forma como obras são administradas. A lógica deixa de ser "registrar o
              que aconteceu" e passa a ser "antecipar o que vai acontecer".
            </P>
            <P>
              Com lançamentos por foto, conciliação automática, auditoria inteligente e previsão
              de fluxo de caixa, a gestão financeira deixa de ser um processo burocrático para se
              tornar uma ferramenta estratégica de proteção de margem.
            </P>
            <P>
              Nos próximos anos, escritórios de arquitetura, construtoras e empresas de engenharia
              que adotarem esse modelo terão uma vantagem competitiva significativa: mais
              controle, mais previsibilidade e decisões baseadas em dados em tempo real.
            </P>
            <Quote>
              A pergunta já não é se a IA fará parte da gestão financeira das obras. A pergunta é:
              quanto dinheiro sua empresa ainda está perdendo por não utilizá-la?
            </Quote>

            <div className="mt-16 pt-8 border-t border-border flex items-center justify-between">
              <Link
                to="/conteudos/potencializador"
                className="inline-flex items-center gap-2 t-caption text-muted-foreground hover:text-ink transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Voltar para Potencializador
              </Link>
              <StarRating />
            </div>
          </div>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
