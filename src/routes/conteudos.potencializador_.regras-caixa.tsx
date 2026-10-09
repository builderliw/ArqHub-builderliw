import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ArrowLeft, Eye, Star, BookOpen } from "lucide-react";
import { useState } from "react";
import img1 from "@/assets/artigo-caixa-1.jpg";
import img2 from "@/assets/artigo-caixa-2.jpg";
import img3 from "@/assets/artigo-caixa-3.jpg";
import img4 from "@/assets/artigo-caixa-4.jpg";
import img5 from "@/assets/artigo-caixa-5.jpg";

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

export const Route = createFileRoute("/conteudos/potencializador_/regras-caixa")({
  head: () => ({
    meta: [
      { title: "Saiba tudo sobre as novas regras da Caixa e FGTS | ArqHub" },
      {
        name: "description",
        content:
          "Como as mudanças no financiamento habitacional da Caixa e do FGTS impactam diretamente o pipeline de obras residenciais.",
      },
      { property: "og:title", content: "Saiba tudo sobre as novas regras da Caixa e FGTS" },
      {
        property: "og:description",
        content:
          "Faixa 4, Classe Média, novo teto de R$ 600 mil e múltiplos financiamentos: o que muda para construtoras, incorporadoras e arquitetos.",
      },
      { property: "og:image", content: img1 },
      { property: "twitter:image", content: img1 },
    ],
  }),
  component: Artigo,
});

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
        <img src={src} alt={alt} loading="lazy" className="w-full h-auto object-cover aspect-square" />
      </div>
      <figcaption className="mt-3 text-[12px] text-muted-foreground leading-snug border-l-2 border-primary pl-3">
        {caption}
      </figcaption>
    </figure>
  );
}
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
        <img src={src} alt={alt} loading="lazy" className="w-full h-auto object-cover" style={{ aspectRatio: ratio }} />
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
              <Link to="/conteudos/potencializador" className="inline-flex items-center gap-1.5 hover:text-ink transition-colors">
                <ArrowLeft className="h-3 w-3" /> Potencializador
              </Link>
              <span className="text-border">·</span>
              <span className="uppercase tracking-[0.14em] text-primary font-semibold text-[11px]">Projetos e Obras</span>
              <span className="text-border">·</span>
              <span>11 min de leitura</span>
            </div>

            <h1 className="font-display text-[34px] sm:text-[46px] lg:text-[54px] leading-[1.05] tracking-[-0.02em] text-ink font-semibold">
              Saiba tudo sobre as novas regras da Caixa e FGTS
            </h1>

            <p className="mt-6 text-[19px] sm:text-[22px] leading-[1.5] text-muted-foreground font-light">
              Como as mudanças no financiamento habitacional podem impactar diretamente o seu pipeline de obras residenciais.
            </p>

            <div className="mt-8 pb-8 mb-2 border-b border-border flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white font-semibold text-[13px]">A</span>
                <div>
                  <div className="text-[13px] font-semibold text-ink">Equipe ArqHub</div>
                  <div className="text-[12px] text-muted-foreground">Publicado em junho de 2026</div>
                </div>
              </div>
              <div className="flex items-center gap-5">
                <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                  <Eye className="w-3.5 h-3.5" />
                  <span><span className="font-semibold text-ink">3.512</span> leituras</span>
                </div>
                <StarRating />
              </div>
            </div>

            <WideFigure
              src={img1}
              alt="Mão segurando smartphone com calculadora sobre projetos arquitetônicos"
              caption="Mais do que uma atualização bancária: as novas regras mudam o jogo do pipeline residencial."
              ratio="16/9"
            />

            <Lead>
              O mercado imobiliário brasileiro passou por uma das maiores atualizações dos últimos anos.
            </Lead>

            <P>
              As novas regras aprovadas pelo Conselho Curador do FGTS, somadas às alterações operacionais
              da Caixa Econômica Federal, ampliaram significativamente o acesso ao crédito habitacional e
              criaram novas oportunidades para construtoras, incorporadoras, arquitetos e empresas que
              atuam no segmento residencial.
            </P>
            <P>
              Embora a maioria das manchetes tenha focado no comprador final, existe uma consequência
              ainda mais importante para o setor da construção: o <strong>aumento potencial da demanda
              por novos empreendimentos residenciais</strong>.
            </P>
            <P>
              Para quem desenvolve projetos, vende imóveis ou gerencia obras, entender essas mudanças
              deixou de ser uma questão financeira e passou a ser uma questão estratégica.
            </P>

            {/* CAPÍTULO 1 */}
            <Chapter num="1" title="O que mudou na prática?" />

            <P>As alterações ocorreram em três frentes principais. A primeira: ampliação das faixas de renda atendidas.</P>
            <P>
              O Conselho Curador do FGTS aprovou a atualização dos limites de renda do programa
              habitacional, ampliando o número de famílias elegíveis ao financiamento.
            </P>

            <div className="my-8 overflow-hidden rounded-sm border border-border">
              <table className="w-full text-[14px]">
                <thead className="bg-surface">
                  <tr>
                    <th className="text-left p-3 font-semibold text-ink">Faixa</th>
                    <th className="text-left p-3 font-semibold text-ink">Limite Anterior</th>
                    <th className="text-left p-3 font-semibold text-primary">Novo Limite</th>
                  </tr>
                </thead>
                <tbody className="text-ink/85">
                  <tr className="border-t border-border"><td className="p-3">Faixa 1</td><td className="p-3">R$ 2.850</td><td className="p-3 font-semibold">R$ 3.200</td></tr>
                  <tr className="border-t border-border"><td className="p-3">Faixa 2</td><td className="p-3">R$ 4.700</td><td className="p-3 font-semibold">R$ 5.000</td></tr>
                  <tr className="border-t border-border"><td className="p-3">Faixa 3</td><td className="p-3">R$ 8.600</td><td className="p-3 font-semibold">R$ 9.600</td></tr>
                  <tr className="border-t border-border"><td className="p-3">Faixa 4</td><td className="p-3">R$ 12.000</td><td className="p-3 font-semibold">R$ 13.000</td></tr>
                </tbody>
              </table>
            </div>

            <P>
              A principal novidade foi a consolidação da <strong>Faixa 4</strong>, voltada à chamada
              classe média, permitindo que famílias com renda de até R$ 13 mil também tenham acesso a
              linhas financiadas com recursos do FGTS.
            </P>

            {/* CAPÍTULO 2 */}
            <Chapter num="2" title="O nascimento do 'Minha Casa Minha Vida da Classe Média'" />

            <FloatFigure
              src={img2}
              alt="Família brasileira de classe média em frente à nova casa segurando chaves"
              caption="Famílias antes excluídas do FGTS agora acessam o sonho da casa própria com condições competitivas."
              side="right"
            />

            <P>
              Historicamente, o FGTS era direcionado principalmente para famílias de baixa renda. Com a
              criação do Programa Classe Média, o governo abriu uma nova frente de financiamento para um
              público que estava ficando sem alternativas devido aos juros elevados do mercado tradicional.
            </P>
            <P>
              Na prática, isso significa que milhares de famílias que antes dependiam exclusivamente de
              financiamentos SBPE agora podem acessar condições mais competitivas.
            </P>
            <P>Para o mercado imobiliário, isso representa:</P>
            <List
              items={[
                "Mais compradores aptos a financiar",
                "Aumento do público-alvo de lançamentos",
                "Expansão da demanda por imóveis novos",
                "Maior velocidade de vendas em empreendimentos residenciais",
              ]}
            />

            {/* CAPÍTULO 3 */}
            <Chapter num="3" title="O teto dos imóveis também aumentou" />

            <WideFigure
              src={img3}
              alt="Vista aérea de condomínio horizontal residencial brasileiro"
              caption="Empreendimentos antes fora do enquadramento voltam a ser financiáveis pelo programa habitacional."
              ratio="16/9"
            />

            <P>
              Outra mudança relevante foi a atualização dos limites máximos financiáveis. O valor máximo
              dos imóveis elegíveis ao programa passou de <strong>R$ 500 mil para R$ 600 mil</strong> em
              determinadas modalidades, ampliando significativamente a oferta de unidades enquadradas nas
              regras habitacionais.
            </P>
            <P>
              Isso tem impacto direto em cidades onde a valorização imobiliária vinha expulsando
              empreendimentos do enquadramento dos programas habitacionais.
            </P>

            <H3>Antes</H3>
            <P>Muitos imóveis ficavam acima do limite.</P>
            <H3>Agora</H3>
            <P>Parte desses empreendimentos volta a ser financiável.</P>
            <H3>Resultado</H3>
            <P>Aumento do mercado potencial para construtoras e incorporadoras.</P>

            {/* CAPÍTULO 4 */}
            <Chapter num="4" title="Por que isso afeta seu pipeline de obras?" />

            <P>
              O pipeline de uma construtora depende diretamente da capacidade de financiamento dos
              compradores. Quando mais famílias conseguem aprovação bancária:
            </P>
            <List
              items={[
                "Mais imóveis são vendidos",
                "Mais lançamentos se tornam viáveis",
                "Mais projetos saem do papel",
                "Mais obras entram em execução",
                "Menor risco comercial dos empreendimentos",
              ]}
            />
            <Quote>
              Historicamente, existe uma correlação direta entre expansão do crédito habitacional e
              crescimento do volume de lançamentos residenciais. Quando o crédito aumenta, a construção
              civil responde.
            </Quote>

            {/* CAPÍTULO 5 */}
            <Chapter num="5" title="Caixa volta a permitir mais de um financiamento" />

            <FloatFigure
              src={img5}
              alt="Fachada de pequeno edifício residencial moderno brasileiro"
              caption="A liquidez do médio padrão volta a se fortalecer com a flexibilização do SBPE."
              side="left"
            />

            <P>
              Outra mudança importante ocorreu no Sistema Brasileiro de Poupança e Empréstimo (SBPE).
              Após um período de restrição iniciado em 2024, a Caixa voltou a permitir que clientes
              possuam mais de um financiamento imobiliário ativo simultaneamente.
            </P>
            <P>Essa decisão beneficia:</P>
            <List
              items={[
                "Investidores imobiliários",
                "Famílias que desejam trocar de imóvel sem vender o atual",
                "Compradores de imóveis para renda",
                "Proprietários que pretendem adquirir uma segunda unidade",
              ]}
            />
            <P>
              Embora não seja o principal motor do mercado habitacional popular, essa medida aumenta a
              liquidez do segmento de médio padrão e fortalece a absorção de novos empreendimentos.
            </P>

            {/* CAPÍTULO 6 */}
            <Chapter num="6" title="O FGTS ganha ainda mais relevância" />

            <P>
              O Fundo de Garantia continua sendo uma das principais ferramentas para aquisição da casa
              própria. Os recursos podem ser utilizados para:
            </P>

            <H3>Entrada do imóvel</H3>
            <P>Reduzindo a necessidade de capital próprio.</P>

            <H3>Amortização do saldo devedor</H3>
            <P>Diminuindo o prazo ou valor das parcelas.</P>

            <H3>Liquidação parcial do financiamento</H3>
            <P>Reduzindo significativamente o custo financeiro total.</P>

            <H3>Pagamento de prestações</H3>
            <P>Em situações específicas previstas nas regras do programa.</P>

            <Quote>
              Para o comprador, isso aumenta o poder de compra. Para construtoras e incorporadoras,
              significa aumento do público apto a fechar negócio.
            </Quote>

            {/* CAPÍTULO 7 */}
            <Chapter num="7" title="O que arquitetos e construtoras devem fazer agora?" />

            <WideFigure
              src={img4}
              alt="Arquiteto apresentando planta de casa para jovem casal em escritório"
              caption="Mais financiamento aprovado significa mais terrenos comprados — e mais projetos contratados."
              ratio="16/9"
            />

            <P>
              Muitas empresas ainda estão planejando lançamentos com base nas regras antigas. Isso pode
              gerar perda de oportunidades. As mudanças indicam um cenário favorável para:
            </P>

            <H3>Empreendimentos entre R$ 350 mil e R$ 600 mil</H3>
            <P>Faixa que tende a concentrar grande parte da nova demanda.</P>

            <H3>Condomínios horizontais</H3>
            <P>Especialmente em cidades médias.</P>

            <H3>Casas financiáveis</H3>
            <P>Segmento que historicamente possui alta demanda e baixa oferta.</P>

            <H3>Projetos compactos</H3>
            <P>Com ticket compatível às novas faixas de financiamento.</P>

            <H3>Oportunidade para escritórios de arquitetura</H3>
            <P>
              A ampliação do crédito não beneficia apenas construtoras. Arquitetos também tendem a ser
              impactados positivamente. Quando mais famílias conseguem financiamento:
            </P>
            <List
              items={[
                "Mais terrenos são adquiridos",
                "Mais projetos residenciais são contratados",
                "Mais reformas financiadas acontecem",
                "Mais construções unifamiliares entram em execução",
              ]}
            />

            {/* CAPÍTULO 8 */}
            <Chapter num="8" title="O que esperar para os próximos anos?" />

            <P>
              Os recursos do FGTS continuam sendo uma das principais fontes de financiamento habitacional
              do país. A criação da Faixa 4 e do Programa Classe Média sinaliza uma estratégia de
              ampliação do mercado financiável justamente em um momento de juros elevados e dificuldade
              de acesso ao crédito privado.
            </P>
            <P>
              Especialistas do setor já observam um movimento de reaquecimento gradual da demanda
              residencial, principalmente em empreendimentos enquadrados entre R$ 350 mil e R$ 600 mil,
              faixa diretamente beneficiada pelas novas regras.
            </P>

            {/* CONCLUSÃO */}
            <div className="mt-20 mb-8 clear-both">
              <span className="t-caption uppercase tracking-[0.2em] text-primary text-[11px] font-semibold">Conclusão</span>
              <h2 className="mt-3 font-display text-[28px] sm:text-[36px] leading-[1.15] tracking-[-0.01em] text-ink font-semibold border-b border-border pb-5">
                Um novo ciclo para a construção residencial
              </h2>
            </div>

            <P>
              As novas regras da Caixa e do FGTS representam muito mais do que uma atualização bancária.
              Elas ampliam o universo de compradores, fortalecem o financiamento habitacional e criam
              condições para um novo ciclo de crescimento da construção residencial.
            </P>
            <P>Para arquitetos, construtoras e incorporadoras, o principal recado é simples:</P>
            <Quote>
              Quem entender primeiro o impacto dessas mudanças conseguirá planejar lançamentos mais
              aderentes à nova realidade do crédito.
            </Quote>
            <P>
              E em um mercado onde a velocidade de venda determina a viabilidade do empreendimento,
              compreender as regras do financiamento pode ser tão importante quanto desenvolver um bom
              projeto.
            </P>

            <div className="mt-16 pt-8 border-t border-border flex items-center justify-between">
              <Link to="/conteudos/potencializador" className="inline-flex items-center gap-2 t-caption text-muted-foreground hover:text-ink transition-colors">
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
