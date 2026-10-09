import { createFileRoute } from "@tanstack/react-router";
import img1 from "@/assets/artigo-cub-1.jpg";
import img2 from "@/assets/artigo-cub-2.jpg";
import img3 from "@/assets/artigo-cub-3.jpg";
import {
  ArticleShell,
  Chapter,
  FloatFigure,
  H3,
  Lead,
  List,
  P,
  Quote,
  WideFigure,
} from "@/components/manual-article";

export const Route = createFileRoute("/conteudos/potencializador_/cub")({
  head: () => ({
    meta: [
      { title: "CUB (Custo Unitário Básico): o que é e como aplicar no escritório | ArqHub" },
      { name: "description", content: "Entenda como o CUB é calculado, quando ele faz sentido como referência e seus limites no orçamento real." },
      { property: "og:title", content: "Aprenda sobre o CUB e aplique no seu escritório" },
      { property: "og:description", content: "Indicador oficial divulgado mensalmente pelos Sinduscons, o CUB é referência — não orçamento. Saiba a diferença." },
      { property: "og:image", content: img1 },
    ],
  }),
  component: Artigo,
});

function Artigo() {
  return (
    <ArticleShell
      category="Projetos e Obras"
      readTime="9 min de leitura"
      reads="2.187"
      title="Aprenda sobre o CUB (Custo Unitário Básico) e aplique no seu escritório"
      subtitle="O que é, como é calculado e quando faz sentido usar como referência de orçamento."
    >
      <WideFigure
        src={img1}
        alt="Relatório de custo unitário básico em mesa de escritório com óculos"
        caption="Divulgado mensalmente pelos Sinduscons estaduais, o CUB é o termômetro oficial da construção brasileira."
      />

      <Lead>
        Todo mês, os Sinduscons estaduais divulgam um número que move o mercado da construção
        civil: o CUB.
      </Lead>

      <P>
        O <strong>Custo Unitário Básico de Construção</strong> é um indicador criado pela
        Lei 4.591/64 e regulamentado pela NBR 12.721. Calculado por Sinduscons estaduais com
        base em projetos-padrão (residenciais, comerciais, populares), ele expressa o custo por
        metro quadrado de obra em uma região e mês específicos.
      </P>
      <P>
        É <strong>referência</strong>, não orçamento. E entender essa diferença é o que separa
        o profissional que usa o CUB bem de quem se queima com ele.
      </P>

      <Chapter num="1" title="Como o CUB é calculado" />

      <FloatFigure
        src={img2}
        alt="Arquiteto calculando orçamento residencial com calculadora e plantas"
        caption="O CUB cobre materiais, mão de obra, despesas administrativas e EPI — mas não tudo."
        side="right"
      />

      <P>
        O CUB resulta da pesquisa de preços de insumos representativos junto a fornecedores e
        do levantamento de mão de obra praticada na região. A NBR 12.721 padroniza os
        projetos-padrão usados como base: residenciais (R-1, R-8, R-16), comerciais (CAL, CSL)
        e populares (PIS, PP).
      </P>
      <P>O CUB inclui:</P>
      <List
        items={[
          "Materiais de construção representativos",
          "Mão de obra com encargos sociais",
          "Despesas administrativas da obra",
          "Equipamentos de proteção individual (EPI)",
        ]}
      />
      <P>O CUB NÃO inclui:</P>
      <List
        items={[
          "Terreno",
          "Fundações especiais",
          "Elevadores e equipamentos",
          "Impostos, BDI, lucro e comissões",
          "Projetos, taxas e licenciamentos",
          "Ligações definitivas e paisagismo",
        ]}
      />

      <Chapter num="2" title="Quando o CUB faz sentido" />

      <WideFigure
        src={img3}
        alt="Edifício residencial em construção com tapumes e andaimes"
        caption="Estimativas iniciais, viabilidade e comparativos: aí o CUB brilha. Orçamento final, jamais."
      />

      <P>O CUB é excelente para:</P>
      <List
        items={[
          "Estimativa preliminar de viabilidade (fase de estudo)",
          "Comparação entre regiões e padrões construtivos",
          "Base para revisão de contratos com correção monetária",
          "Indicador de variação de custo mês a mês",
        ]}
      />
      <Quote>
        Se você está apresentando uma estimativa para o cliente no primeiro encontro, o CUB
        ajuda. Se você está fechando contrato, ele atrapalha.
      </Quote>

      <Chapter num="3" title="Os erros mais comuns" />

      <H3>1. Confundir CUB com custo final</H3>
      <P>
        O CUB cobre, em média, 70-80% do custo total de uma obra real. Faltam fundações
        especiais, equipamentos, BDI, projetos. Quem orça com CUB puro entrega obra deficitária.
      </P>
      <H3>2. Usar o padrão errado</H3>
      <P>
        Aplicar CUB R-1 baixo padrão em uma obra de alto padrão (ou vice-versa) gera distorções
        enormes. Cada projeto-padrão tem especificações próprias.
      </P>
      <H3>3. Ignorar o sindicato regional</H3>
      <P>
        O CUB varia significativamente entre estados. Use sempre o do Sinduscon da região onde a
        obra será executada — nunca uma "média Brasil".
      </P>

      <div className="mt-20 mb-8 clear-both">
        <span className="t-caption uppercase tracking-[0.2em] text-primary text-[11px] font-semibold">Conclusão</span>
        <h2 className="mt-3 font-display text-[28px] sm:text-[36px] leading-[1.15] tracking-[-0.01em] text-ink font-semibold border-b border-border pb-5">
          CUB é régua. Orçamento é projeto.
        </h2>
      </div>
      <P>
        Use o CUB para estimativas, comparações e reajustes. Para o orçamento que vai virar
        contrato, monte composições reais, com cotações locais e BDI calibrado. O CUB é o ponto
        de partida — não a linha de chegada.
      </P>
    </ArticleShell>
  );
}
