import { createFileRoute } from "@tanstack/react-router";
import img1 from "@/assets/artigo-tcpo-1.jpg";
import img2 from "@/assets/artigo-tcpo-2.jpg";
import img3 from "@/assets/artigo-tcpo-3.jpg";
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

export const Route = createFileRoute("/conteudos/potencializador_/tcpo")({
  head: () => ({
    meta: [
      { title: "Entendendo a TCPO: como usar a Tabela de Composição de Preços para Orçamentos | ArqHub" },
      { name: "description", content: "Guia prático para usar a TCPO no dia a dia do escritório e ganhar precisão nos orçamentos." },
      { property: "og:title", content: "Entendendo a TCPO" },
      { property: "og:description", content: "Como aplicar a TCPO em projetos reais e parar de orçar no escuro." },
      { property: "og:image", content: img1 },
    ],
  }),
  component: Artigo,
});

function Artigo() {
  return (
    <ArticleShell
      category="Gestão"
      readTime="10 min de leitura"
      reads="2.418"
      title="Entendendo a TCPO: como utilizar a Tabela de Composição de Preços para Orçamentos"
      subtitle="Guia prático para usar a TCPO no dia a dia do escritório e ganhar precisão nos orçamentos."
    >
      <WideFigure
        src={img1}
        alt="Planilha de composição de preços aberta em laptop com calculadora e projeto"
        caption="A TCPO é o dicionário oficial entre o projeto e o custo real da obra."
      />

      <Lead>
        Orçar uma obra sem uma base de composições é como cozinhar sem receita: até pode dar
        certo, mas o resultado raramente é o mesmo duas vezes.
      </Lead>

      <P>
        A TCPO — Tabela de Composição de Preços para Orçamentos — é a referência mais utilizada
        no Brasil para descrever o que entra em cada serviço da construção civil. Publicada
        originalmente pela Editora PINI e mantida até hoje como referência técnica do setor, ela
        define, para cada serviço, quais materiais, mão de obra e equipamentos são consumidos por
        unidade executada.
      </P>
      <P>
        Em outras palavras: a TCPO transforma "alvenaria de tijolo cerâmico" em uma lista clara
        de quantos tijolos, sacos de cimento, areia, hora de pedreiro e hora de servente são
        necessários para executar 1 m² desse serviço.
      </P>

      <Chapter num="1" title="O que é, de verdade, uma composição" />

      <FloatFigure
        src={img2}
        alt="Engenheiro analisando catálogo TCPO impresso em escritório"
        caption="Cada linha da TCPO é uma receita: insumos, coeficientes e a unidade de medida do serviço."
        side="right"
      />

      <P>
        Uma composição da TCPO é formada por três elementos principais:
      </P>
      <List
        items={[
          "Insumos (materiais, mão de obra, equipamentos)",
          "Coeficientes de consumo por unidade do serviço",
          "Unidade de medida do serviço (m², m³, m linear, unidade)",
        ]}
      />
      <P>
        Cada coeficiente representa quanto daquele insumo é consumido para executar uma unidade
        do serviço. É esse número que multiplica o preço de mercado e gera o custo real.
      </P>
      <Quote>
        A TCPO não diz quanto custa. Ela diz quanto consome. O preço você atualiza com a sua
        realidade local.
      </Quote>

      <Chapter num="2" title="Como aplicar no dia a dia do escritório" />

      <P>
        O fluxo padrão para usar a TCPO em um orçamento real tem cinco etapas:
      </P>
      <List
        items={[
          "Quantitativos: medir cada serviço do projeto (m², m³, peças)",
          "Composições: associar cada serviço a uma composição da TCPO",
          "Insumos: explodir a composição em materiais, mão de obra e equipamentos",
          "Preços: aplicar cotações locais atualizadas",
          "BDI: somar despesas indiretas e margem de lucro",
        ]}
      />

      <WideFigure
        src={img3}
        alt="Materiais de construção empilhados no canteiro de obras"
        caption="O coeficiente da TCPO multiplicado pela cotação local é o que separa um orçamento sério de um chute."
      />

      <H3>Erros mais comuns</H3>
      <List
        items={[
          "Usar coeficientes desatualizados sem revisar a versão da tabela",
          "Esquecer perdas, transportes verticais e improdutividade",
          "Aplicar a TCPO sem ajustar para a realidade da região da obra",
          "Não revisar a composição quando o projeto muda de especificação",
        ]}
      />

      <Chapter num="3" title="TCPO + planilha de cotações = orçamento real" />

      <P>
        A TCPO sozinha não fecha um orçamento. Ela precisa estar conectada a uma planilha viva
        de cotações de insumos — atualizada periodicamente com fornecedores reais, frete real e
        produtividade real da sua equipe.
      </P>
      <P>
        Escritórios que tratam a TCPO como base, mas constroem sua <strong>própria biblioteca de
        composições ajustadas</strong> ao longo do tempo, conseguem orçar com muito mais
        precisão. Cada obra entregue alimenta o histórico — e o histórico alimenta o próximo
        orçamento.
      </P>
      <Quote>
        A TCPO é o ponto de partida. O diferencial está em transformá-la na sua TCPO interna,
        calibrada por dados reais.
      </Quote>

      <div className="mt-20 mb-8 clear-both">
        <span className="t-caption uppercase tracking-[0.2em] text-primary text-[11px] font-semibold">
          Conclusão
        </span>
        <h2 className="mt-3 font-display text-[28px] sm:text-[36px] leading-[1.15] tracking-[-0.01em] text-ink font-semibold border-b border-border pb-5">
          Pare de orçar no escuro
        </h2>
      </div>
      <P>
        Usar a TCPO de forma sistemática é o primeiro passo para sair do orçamento por
        comparação e entrar no orçamento por composição. Mais previsibilidade, menos surpresas,
        margens reais. E, principalmente: defesa técnica clara para o cliente.
      </P>
    </ArticleShell>
  );
}
