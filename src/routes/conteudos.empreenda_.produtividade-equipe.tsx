import { createFileRoute } from "@tanstack/react-router";
import img1 from "@/assets/artigo-produtividade-1.jpg";
import img2 from "@/assets/artigo-produtividade-2.jpg";
import img3 from "@/assets/artigo-produtividade-3.jpg";
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

export const Route = createFileRoute("/conteudos/empreenda_/produtividade-equipe")({
  head: () => ({
    meta: [
      { title: "Como organizar a equipe técnica e reduzir retrabalho no escritório | ArqHub" },
      {
        name: "description",
        content:
          "Rotinas, papéis claros e padronização: o caminho para um escritório de arquitetura que entrega no prazo e protege a margem.",
      },
      { property: "og:title", content: "Como organizar a equipe técnica e reduzir retrabalho" },
      {
        property: "og:description",
        content: "Padronização, BIM e processo: o que separa um escritório que escala de um que vive apagando incêndio.",
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
      category="Produtividade"
      readTime="9 min de leitura"
      reads="2.103"
      title="Como organizar a equipe técnica e reduzir retrabalho no escritório"
      subtitle="Rotinas, papéis e ferramentas para um escritório que entrega no prazo, sem caos — e sem comer a margem por dentro."
    >
      <WideFigure
        src={img1}
        alt="Equipe de arquitetos trabalhando em conjunto sobre plantas e laptops"
        caption="Equipe organizada não é a que trabalha mais. É a que refaz menos."
      />

      <Lead>
        Existe um custo dentro do escritório de arquitetura que quase nunca aparece na planilha
        financeira. Ele não tem nota fiscal, não tem código contábil, mas come silenciosamente a
        margem de todo projeto. Esse custo se chama <strong>retrabalho</strong>.
      </Lead>

      <P>
        É a prancha que foi para a obra na versão errada. A alteração combinada por áudio que
        ninguém atualizou no projeto. O detalhe que sai do executivo direto para a
        compatibilização — e volta. Cada uma dessas horas é cobrada uma vez, mas pagas duas ou
        três.
      </P>
      <Quote>
        A maioria dos escritórios não tem problema de demanda. Tem problema de operação.
      </Quote>

      <Chapter num="1" title="De onde vem o retrabalho" />
      <P>
        Pesquisas acadêmicas sobre padronização de processos em escritórios de arquitetura,
        somadas à experiência prática de empresas de gestão do setor, apontam quase sempre para
        as mesmas causas:
      </P>
      <List
        items={[
          "Briefing incompleto, com decisões deixadas para depois",
          "Ausência de templates e padrões de prancha",
          "Falta de uma rotina clara de revisão entre etapas",
          "Comunicação espalhada por vários canais",
          "Sobreposição de responsabilidades — todo mundo faz, ninguém aprova",
          "Falta de versionamento e rastreabilidade dos arquivos",
        ]}
      />
      <P>Nenhuma dessas causas é falta de talento. Todas são falta de processo.</P>

      <Chapter num="2" title="Definir papéis, não cargos" />
      <P>
        Em escritórios pequenos, todo mundo faz um pouco de tudo. Isso parece flexibilidade, mas
        é a principal causa de retrabalho. Antes de contratar mais gente, defina os papéis dentro
        de cada projeto:
      </P>
      <List
        items={[
          "Coordenador de projeto — quem decide e responde pelo cronograma",
          "Projetista — quem executa em CAD/BIM",
          "Revisor técnico — quem confere antes de sair do escritório",
          "Interlocutor com o cliente — quem alinha escopo e mudanças",
        ]}
      />
      <P>
        Esses papéis podem se acumular em uma mesma pessoa em escritórios pequenos. O que não
        pode é ficar ambíguo.
      </P>

      <Chapter num="3" title="Padronizar o jeito de entregar" />

      <FloatFigure
        src={img2}
        alt="Quadro Kanban com etapas e tarefas em um escritório de arquitetura"
        caption="Padronização não tira a criatividade. Ela libera tempo para que ela aconteça."
        side="right"
      />

      <P>Crie e mantenha vivos:</P>
      <List
        items={[
          "Template de prancha com legenda, carimbo e camadas padronizadas",
          "Checklist de saída por etapa (estudo, anteprojeto, executivo)",
          "Lista de verificação de compatibilização entre disciplinas",
          "Padrão de nomenclatura para arquivos e revisões",
          "Modelo de ata de reunião com decisões e responsáveis",
        ]}
      />
      <P>
        Pode parecer burocracia. Na prática, é o que permite que um projetista novo entregue algo
        aproveitável já no primeiro mês, sem depender da memória institucional do dono.
      </P>

      <Chapter num="4" title="Ritualizar a rotina" />
      <P>Três rituais simples mudam o jogo:</P>
      <H3>Reunião semanal de status (30 minutos)</H3>
      <P>
        Toda segunda. Cada projeto em andamento, em uma frase: o que avançou, o que travou, o que
        precisa de decisão. Nada de discussão técnica nesse momento. O objetivo é{" "}
        <strong>visibilidade</strong>.
      </P>
      <H3>Revisão entre pares antes de sair</H3>
      <P>
        Nenhum projeto sai do escritório sem passar por um par. Nem que seja por 15 minutos. Esse
        hábito sozinho derruba a maior parte dos erros bobos que viram retrabalho na obra.
      </P>
      <H3>Retrospectiva mensal</H3>
      <P>
        Uma vez por mês, a equipe responde três perguntas: o que funcionou, o que não funcionou,
        o que vamos mudar. É o que evita repetir o mesmo erro a cada projeto.
      </P>

      <Chapter num="5" title="Usar as ferramentas certas" />

      <WideFigure
        src={img3}
        alt="Arquiteto trabalhando em software BIM com dois monitores"
        caption="BIM não é só software. É um jeito de trabalhar que paga produtividade ao longo do projeto inteiro."
      />

      <P>
        A literatura sobre adoção de BIM em escritórios brasileiros é clara: o investimento
        inicial é alto, a curva de aprendizado é real, mas o ganho de produtividade aparece a
        partir do segundo ou terceiro projeto, especialmente em compatibilização e quantitativos.
      </P>
      <P>Além do BIM, um stack mínimo bem ajustado faz diferença:</P>
      <List
        items={[
          "Um lugar único para arquivos (não três pastas em três nuvens diferentes)",
          "Uma ferramenta de gestão de tarefas com responsável e prazo",
          "Apontamento de horas por projeto — sem isso você não sabe se está dando lucro",
          "CRM simples para o comercial não morar na cabeça do sócio",
        ]}
      />

      <Chapter num="6" title="Mensure o que importa" />
      <P>
        O que não é medido vira achismo. Os indicadores mais úteis em escritórios técnicos:
      </P>
      <List
        items={[
          "Horas previstas vs. horas reais por projeto",
          "% de horas em retrabalho",
          "Aderência ao cronograma por etapa",
          "Margem real por contrato (não só faturamento)",
        ]}
      />
      <P>
        Não precisa de dashboard sofisticado. Uma planilha bem mantida já mostra padrões em dois
        ou três meses.
      </P>

      <div className="mt-20 mb-8 clear-both">
        <span className="t-caption uppercase tracking-[0.2em] text-primary text-[11px] font-semibold">
          Conclusão
        </span>
        <h2 className="mt-3 font-display text-[28px] sm:text-[36px] leading-[1.15] tracking-[-0.01em] text-ink font-semibold border-b border-border pb-5">
          Refazer menos para entregar mais
        </h2>
      </div>

      <P>
        Reduzir retrabalho não é sobre trabalhar mais. É sobre criar um ambiente em que o
        trabalho certo aconteça da primeira vez. Papéis claros, padrões vivos, rituais simples e
        ferramentas adequadas. Essa combinação não custa caro — mas exige disciplina para
        implementar e manter.
      </P>
      <P>
        O retorno é direto: prazos cumpridos, margem preservada, equipe menos cansada e mais
        espaço para o sócio fazer o que ele deveria fazer desde o começo — pensar o negócio, e
        não apagar incêndio.
      </P>
    </ArticleShell>
  );
}
