import { createFileRoute } from "@tanstack/react-router";
import img1 from "@/assets/artigo-precificacao-1.jpg";
import img2 from "@/assets/artigo-precificacao-2.jpg";
import img3 from "@/assets/artigo-precificacao-3.jpg";
import img4 from "@/assets/artigo-precificacao-4.jpg";
import {
  ArticleShell,
  Chapter,
  FloatFigure,
  Lead,
  List,
  P,
  Quote,
  WideFigure,
} from "@/components/manual-article";

export const Route = createFileRoute("/conteudos/empreenda_/precificacao")({
  head: () => ({
    meta: [
      { title: "Precificação por projeto: como sair do achismo e ter margem real | ArqHub" },
      {
        name: "description",
        content:
          "Método prático para precificar projetos de arquitetura considerando horas, complexidade e margem de lucro.",
      },
      { property: "og:title", content: "Precificação por projeto: sair do achismo e ter margem real" },
      {
        property: "og:description",
        content: "Calcule custo da hora, tempo do projeto, complexidade e margem — e pare de orçar no escuro.",
      },
      { property: "og:image", content: img1 },
      { property: "twitter:image", content: img1 },
    ],
  }),
  component: Artigo,
});

function Artigo() {
  return (
    <ArticleShell
      backTo="/conteudos/empreenda"
      backLabel="Empreenda"
      category="Gestão"
      readTime="10 min de leitura"
      reads="3.184"
      title="Precificação por projeto: como sair do achismo e ter margem real"
      subtitle="Um método simples para precificar projetos considerando horas, complexidade e lucro desejado."
    >
      <WideFigure
        src={img1}
        alt="Mesa de arquiteto com documentos financeiros, calculadora e planilhas"
        caption="Precificar não é adivinhar. É calcular — com método, custos reais e margem planejada."
      />

      <Lead>
        Uma das maiores dificuldades de arquitetos e engenheiros não é conseguir clientes. É
        saber quanto cobrar.
      </Lead>

      <P>
        Muitos profissionais definem seus preços com base em referências de mercado, concorrentes
        ou simplesmente no famoso "feeling". O problema é que essa prática pode levar a dois
        cenários perigosos:
      </P>
      <List
        items={[
          "Cobrar caro demais e perder oportunidades",
          "Cobrar barato demais e trabalhar sem lucro",
        ]}
      />
      <Quote>
        A verdade é que precificação não deve ser baseada em achismo. Ela deve ser baseada em
        números.
      </Quote>

      <Chapter num="1" title="O erro mais comum" />
      <P>
        Imagine um projeto residencial de 200m². Você pesquisa o mercado e descobre que outros
        profissionais estão cobrando entre R$ 12.000 e R$ 18.000. Então decide cobrar R$ 14.000.
      </P>
      <P>Mas surge uma pergunta: esse valor realmente gera lucro para sua empresa?</P>
      <P>
        Muitas vezes a resposta é não. Porque o preço foi definido olhando para fora, quando
        deveria ser calculado olhando para dentro do negócio.
      </P>

      <Chapter num="2" title="Descubra o valor da sua hora" />

      <FloatFigure
        src={img2}
        alt="Arquiteto analisando custos operacionais em planilha no laptop"
        caption="Antes de pensar em preço de venda, é preciso conhecer o custo real de cada hora trabalhada."
        side="right"
      />

      <P>
        Antes de precificar qualquer projeto, você precisa saber quanto custa sua operação. Some
        todos os custos mensais:
      </P>
      <List
        items={[
          "Salários",
          "Aluguel",
          "Softwares",
          "Internet",
          "Energia",
          "Marketing",
          "Impostos",
          "Pró-labore",
        ]}
      />
      <P>
        <strong>Exemplo:</strong> Custos mensais de R$ 20.000. Agora divida pelas horas
        produtivas da equipe. Suponha 160 horas/mês. O custo operacional por hora será de{" "}
        <strong>R$ 125 por hora</strong>.
      </P>
      <Quote>Esse é o valor mínimo necessário para manter a empresa funcionando.</Quote>

      <Chapter num="3" title="Estime o tempo do projeto" />
      <P>Agora calcule quantas horas serão necessárias. Exemplo:</P>
      <List
        items={[
          "Briefing: 4 horas",
          "Estudo preliminar: 12 horas",
          "Anteprojeto: 15 horas",
          "Projeto executivo: 25 horas",
          "Reuniões e revisões: 8 horas",
        ]}
      />
      <P>
        <strong>Total: 64 horas.</strong>
      </P>

      <Chapter num="4" title="Calcule o custo real do projeto" />

      <WideFigure
        src={img3}
        alt="Calculadora sobre plantas arquitetônicas com anotações de cálculo"
        caption="64 horas x R$ 125 = R$ 8.000. Esse é o custo. Ainda não é o preço de venda."
      />

      <P>
        Multiplique as horas pelo valor da hora: 64 × 125 = 8.000. Custo operacional do projeto:{" "}
        <strong>R$ 8.000</strong>.
      </P>
      <P>
        Atenção: esse ainda não é o preço de venda. É apenas o custo para executar o serviço.
      </P>

      <Chapter num="5" title="Adicione sua margem de lucro" />
      <P>
        Agora entra o lucro. Suponha que você deseja uma margem de 30%. O cálculo é: 8.000 × 1,3
        = 10.400.
      </P>
      <P>
        Preço final: <strong>R$ 10.400</strong>. Agora sim existe uma margem planejada.
      </P>

      <Chapter num="6" title="Considere a complexidade" />
      <P>
        Nem todos os projetos possuem o mesmo nível de dificuldade. Um projeto residencial padrão
        é diferente de:
      </P>
      <List
        items={[
          "Clínica médica",
          "Restaurante",
          "Loja em shopping",
          "Projeto corporativo",
          "Residência de alto padrão",
        ]}
      />
      <P>Por isso, é recomendável aplicar fatores de complexidade:</P>
      <List
        items={[
          "Complexidade baixa — multiplicador 1,0",
          "Complexidade média — multiplicador 1,2",
          "Complexidade alta — multiplicador 1,5",
        ]}
      />
      <P>
        <strong>Exemplo:</strong> projeto calculado em R$ 10.400 com complexidade alta — 10.400 ×
        1,5 = 15.600. Preço sugerido: <strong>R$ 15.600</strong>.
      </P>

      <Chapter num="7" title="Pare de precificar apenas por metro quadrado" />
      <P>
        Cobrar exclusivamente por metro quadrado pode ser perigoso. Dois projetos com a mesma
        metragem podem exigir esforços completamente diferentes.
      </P>
      <P>
        Por exemplo: uma casa térrea de 250m² e uma clínica médica de 250m². Mesma área.
        Complexidade totalmente diferente. Por isso, a metragem pode ser um indicador, mas não
        deve ser o único critério.
      </P>

      <Chapter num="8" title="Crie uma tabela interna" />
      <P>Uma prática muito eficiente é criar uma tabela própria do escritório. Exemplo:</P>
      <List
        items={[
          "Residencial simples: 40 a 60h",
          "Residencial alto padrão: 80 a 120h",
          "Comercial: 70 a 100h",
          "Clínica: 100 a 150h",
        ]}
      />
      <P>Com o tempo, suas estimativas ficam cada vez mais precisas.</P>

      <Chapter num="9" title="O preço deve gerar lucro" />

      <FloatFigure
        src={img4}
        alt="Arquiteto apresentando proposta com tabela de preços para clientes em escritório moderno"
        caption="Faturamento alto não significa lucro. O preço certo é o que sustenta a operação e ainda deixa margem."
        side="left"
      />

      <P>
        Muitos escritórios faturam bastante e ainda assim enfrentam dificuldades financeiras.
        Isso acontece porque faturamento não significa lucro.
      </P>
      <P>A pergunta mais importante não é: "quanto o mercado está cobrando?"</P>
      <Quote>
        A pergunta correta é: "quanto preciso cobrar para executar esse projeto com qualidade e
        atingir minha margem desejada?"
      </Quote>

      <div className="mt-20 mb-8 clear-both">
        <span className="t-caption uppercase tracking-[0.2em] text-primary text-[11px] font-semibold">
          Conclusão
        </span>
        <h2 className="mt-3 font-display text-[28px] sm:text-[36px] leading-[1.15] tracking-[-0.01em] text-ink font-semibold border-b border-border pb-5">
          Da tentativa e erro ao método
        </h2>
      </div>

      <P>
        Precificar projetos não precisa ser um processo baseado em tentativa e erro. Quando você
        conhece seus custos, calcula suas horas, considera a complexidade e define uma margem
        clara de lucro, passa a tomar decisões muito mais seguras.
      </P>
      <P>O resultado é simples:</P>
      <List
        items={[
          "Mais previsibilidade financeira",
          "Menos projetos deficitários",
          "Maior rentabilidade",
          "Crescimento sustentável",
        ]}
      />
      <P>
        Porque, no final das contas, um projeto bem vendido não é aquele que fecha rapidamente. É
        aquele que gera lucro real para a empresa.
      </P>
    </ArticleShell>
  );
}
