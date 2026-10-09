import { createFileRoute } from "@tanstack/react-router";
import img1 from "@/assets/artigo-operacional-1.jpg";
import img2 from "@/assets/artigo-operacional-2.jpg";
import img3 from "@/assets/artigo-operacional-3.jpg";
import img4 from "@/assets/artigo-operacional-4.jpg";
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

export const Route = createFileRoute("/conteudos/empreenda_/sair-do-operacional")({
  head: () => ({
    meta: [
      { title: "O dono no gargalo: como escalar sem depender de você | ArqHub" },
      {
        name: "description",
        content:
          "Como sair do operacional e construir um escritório de arquitetura que continua funcionando sem o dono no centro de tudo.",
      },
      { property: "og:title", content: "O dono no gargalo: como escalar sem depender de você" },
      {
        property: "og:description",
        content: "Processos, indicadores, delegação, tecnologia e equipe — os 7 pilares de um escritório escalável.",
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
      readTime="8 min de leitura"
      reads="2.847"
      title="O dono no gargalo: como escalar um escritório de arquitetura sem depender de você"
      subtitle="Quando o crescimento trava porque tudo passa por uma única pessoa, o problema não é demanda. É operação."
    >
      <WideFigure
        src={img1}
        alt="Arquiteto e engenheiro analisando projetos no canteiro de obras"
        caption="Sem processo, o crescimento vira sobrecarga: o operacional consome o estratégico."
      />

      <Lead>
        Você passa o dia respondendo mensagens, resolvendo problemas de obra, cobrando
        fornecedores, fazendo reuniões, revisando projetos, enviando propostas e tentando
        encontrar tempo para prospectar novos clientes?
      </Lead>

      <P>Se a resposta for sim, você não está sozinho.</P>
      <P>
        Essa é a realidade da maioria dos escritórios de arquitetura, engenharia e empresas de
        construção que chegam a um ponto crítico: o negócio cresce, mas o dono continua sendo o
        centro de tudo.
      </P>
      <Quote>
        Chega um momento em que não importa quantos clientes entram. A empresa simplesmente não
        consegue crescer porque toda a operação depende de uma única pessoa.
      </Quote>
      <P>
        Enquanto você está ocupado resolvendo problemas do dia a dia, deixa de fazer aquilo que
        realmente impulsiona o crescimento:
      </P>
      <List
        items={[
          "Desenvolver novos negócios",
          "Fechar contratos maiores",
          "Criar parcerias estratégicas",
          "Melhorar a rentabilidade",
          "Planejar o futuro da empresa",
        ]}
      />
      <P>A boa notícia é que existe um caminho para sair desse ciclo.</P>

      <Chapter num="1" title="O ciclo do apagador de incêndios" />
      <P>A maioria dos profissionais passa por um ciclo parecido:</P>
      <List
        items={[
          "Conquista mais clientes",
          "Aumenta a quantidade de projetos",
          "Aumenta a quantidade de problemas",
          "Trabalha mais horas",
          "Fica sem tempo para crescer",
          "O crescimento trava",
        ]}
      />
      <P>
        Parece contraditório, mas muitas empresas não param de crescer por falta de clientes.
        Elas param de crescer por excesso de dependência do próprio fundador.
      </P>
      <P>
        Segundo estudos do Sebrae, um dos principais fatores que limitam o crescimento das
        pequenas empresas é justamente a ausência de processos e gestão estruturada.
      </P>
      <Quote>O problema não está na demanda. Está na operação.</Quote>

      <Chapter num="2" title="Organize os processos antes de contratar mais pessoas" />

      <FloatFigure
        src={img2}
        alt="Equipe colaborando com processos estruturados"
        caption="Quando todos seguem o mesmo fluxo, a empresa ganha velocidade e previsibilidade."
        side="right"
      />

      <H3>O erro mais comum</H3>
      <P>
        Muitos empresários acreditam que a solução é contratar mais funcionários. Na prática,
        isso costuma gerar mais confusão. Se a empresa não possui processos claros, você apenas
        multiplica o caos.
      </P>
      <P>
        Imagine: um cliente solicita uma alteração de projeto. A mensagem chega por WhatsApp,
        alguém anota em um papel, outro colaborador salva uma versão diferente do arquivo e a
        obra continua utilizando informações desatualizadas. Resultado: retrabalho, atrasos e
        prejuízo.
      </P>

      <H3>Como resolver</H3>
      <P>Documente o passo a passo das atividades mais importantes da empresa.</P>
      <H3>Processo Comercial</H3>
      <List
        items={[
          "Recebimento do lead",
          "Reunião de diagnóstico",
          "Envio da proposta",
          "Negociação",
          "Assinatura do contrato",
          "Início do projeto",
        ]}
      />
      <H3>Processo de Projeto</H3>
      <List
        items={[
          "Briefing",
          "Estudo preliminar",
          "Anteprojeto",
          "Compatibilização",
          "Projeto executivo",
          "Entrega",
        ]}
      />

      <Chapter num="3" title="Pare de olhar apenas para o faturamento" />
      <P>
        Muitos escritórios sabem exatamente quanto faturaram no mês. Mas não sabem quanto
        realmente lucraram. E existe uma enorme diferença entre essas duas coisas.
      </P>
      <P>
        Imagine um projeto vendido por R$ 20.000. Parece excelente. Mas depois aparecem horas
        extras, revisões intermináveis, custos administrativos, deslocamentos, retrabalho e
        gastos não previstos. No final, aquele projeto pode ter gerado uma margem muito menor do
        que parecia.
      </P>

      <WideFigure
        src={img3}
        alt="Gráfico de crescimento e indicadores financeiros"
        caption="Faturamento cresce, mas o lucro real é o que diz se o negócio está saudável."
      />

      <P>Por isso, acompanhe indicadores como:</P>
      <List
        items={[
          "Margem de lucro",
          "Ticket médio",
          "Fluxo de caixa",
          "Custos por projeto",
          "Taxa de conversão comercial",
          "Produtividade da equipe",
        ]}
      />
      <P>
        Segundo estudos da Fundação Getulio Vargas, empresas que utilizam indicadores financeiros
        para tomada de decisão apresentam maior capacidade de crescimento e sustentabilidade.
      </P>

      <Chapter num="4" title="Aprenda a delegar sem perder o controle" />
      <Quote>"Se eu não fizer, ninguém faz direito."</Quote>
      <P>
        Essa mentalidade funciona quando a empresa tem poucos clientes. Quando ela cresce, o
        próprio fundador se torna o maior gargalo. Delegar não significa abandonar
        responsabilidades. Significa criar sistemas que permitam acompanhar resultados sem
        executar cada tarefa pessoalmente.
      </P>
      <H3>Você deve focar em</H3>
      <List
        items={[
          "Estratégia",
          "Crescimento",
          "Relacionamento com clientes",
          "Desenvolvimento de parcerias",
          "Decisões importantes",
        ]}
      />
      <H3>Sua equipe deve focar em</H3>
      <List
        items={[
          "Operação",
          "Execução",
          "Processos repetitivos",
          "Rotinas administrativas",
        ]}
      />

      <Chapter num="5" title="Use tecnologia para eliminar tarefas repetitivas" />
      <P>Imagine quantas horas são desperdiçadas semanalmente com:</P>
      <List
        items={[
          "Procurar arquivos",
          "Atualizar planilhas",
          "Cobrar informações",
          "Enviar mensagens",
          "Fazer relatórios",
          "Organizar documentos",
        ]}
      />
      <P>
        Agora imagine tudo isso centralizado em um único ambiente. É exatamente por isso que as
        empresas mais eficientes investem em sistemas de gestão.
      </P>

      <Chapter num="6" title="Transforme projetos em processos previsíveis" />
      <P>
        Toda obra possui imprevistos. Mas nem todo atraso é inevitável. Grande parte dos
        problemas acontece por falta de planejamento e controle. Faça algumas perguntas:
      </P>
      <List
        items={[
          "O cronograma está atualizado?",
          "Todos conhecem suas responsabilidades?",
          "Existe aprovação formal das etapas?",
          "As mudanças de escopo estão registradas?",
          "Os prazos são monitorados constantemente?",
        ]}
      />
      <P>
        Segundo o Project Management Institute, empresas com processos maduros de gestão de
        projetos apresentam melhores índices de prazo, orçamento e qualidade.
      </P>

      <Chapter num="7" title="Construa uma equipe forte" />
      <P>
        Nenhuma empresa cresce sozinha. O crescimento sustentável acontece quando existe uma
        equipe preparada para assumir responsabilidades.
      </P>
      <List
        items={[
          "Treinamento contínuo",
          "Metas claras",
          "Processos documentados",
          "Comunicação eficiente",
          "Feedback constante",
        ]}
      />

      <Chapter num="8" title="Atue como empresário, não apenas como técnico" />

      <FloatFigure
        src={img4}
        alt="Empresário com visão estratégica"
        caption="A diferença entre executar tarefas e construir uma empresa."
        side="left"
      />

      <P>
        Muitos arquitetos e engenheiros construíram suas carreiras por sua excelência técnica.
        Mas administrar uma empresa exige competências diferentes.
      </P>
      <P>O empresário precisa dedicar tempo para:</P>
      <List
        items={[
          "Planejamento estratégico",
          "Desenvolvimento comercial",
          "Posicionamento de mercado",
          "Inovação",
          "Gestão financeira",
          "Expansão do negócio",
        ]}
      />

      <Chapter num="9" title="Faça o teste: sua empresa funciona sem você?" />
      <P>Imagine que você precise se afastar por 30 dias. O que aconteceria?</P>
      <H3>Cenário 1</H3>
      <List
        items={[
          "Clientes ficam sem resposta",
          "Projetos param",
          "Obras atrasam",
          "O financeiro trava",
          "A equipe fica perdida",
        ]}
      />
      <P>
        Nesse caso, você não possui uma empresa. Você possui um emprego extremamente exigente.
      </P>
      <H3>Cenário 2</H3>
      <List
        items={[
          "Os projetos continuam",
          "Os clientes recebem atendimento",
          "A equipe executa as atividades",
          "Os indicadores são acompanhados",
          "A operação segue funcionando",
        ]}
      />
      <P>Nesse caso, você está construindo um negócio escalável.</P>

      <div className="mt-20 mb-8 clear-both">
        <span className="t-caption uppercase tracking-[0.2em] text-primary text-[11px] font-semibold">
          Conclusão
        </span>
        <h2 className="mt-3 font-display text-[28px] sm:text-[36px] leading-[1.15] tracking-[-0.01em] text-ink font-semibold border-b border-border pb-5">
          Construa uma empresa, não um emprego
        </h2>
      </div>

      <P>
        O verdadeiro crescimento não acontece quando você trabalha mais horas. Ele acontece
        quando você cria processos, desenvolve pessoas, utiliza tecnologia e constrói uma
        estrutura capaz de funcionar além da sua presença diária.
      </P>
      <P>
        Empresas de arquitetura e construção que conseguem fazer essa transição conquistam algo
        muito mais valioso do que apenas aumento de faturamento: previsibilidade, lucratividade,
        qualidade de vida e capacidade real de crescimento.
      </P>
      <Quote>
        O objetivo não é que o negócio dependa cada vez mais de você. É construir uma empresa
        que continue crescendo mesmo quando você estiver focado no próximo passo da sua visão.
      </Quote>
    </ArticleShell>
  );
}
