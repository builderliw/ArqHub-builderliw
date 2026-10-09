import { createFileRoute } from "@tanstack/react-router";
import img1 from "@/assets/artigo-iac-1.jpg";
import img2 from "@/assets/artigo-iac-2.jpg";
import img3 from "@/assets/artigo-iac-3.jpg";
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

export const Route = createFileRoute("/conteudos/potencializador_/ia-construcao")({
  head: () => ({
    meta: [
      { title: "Utilizando inteligência artificial na construção civil | ArqHub" },
      { name: "description", content: "Onde a IA já entrega resultado real na construção: quantitativos, programação, atendimento e produtividade." },
      { property: "og:title", content: "Utilizando IA na construção civil" },
      { property: "og:description", content: "Aplicações práticas de IA que já estão gerando ganho de produtividade em escritórios e canteiros." },
      { property: "og:image", content: img1 },
    ],
  }),
  component: Artigo,
});

function Artigo() {
  return (
    <ArticleShell
      category="Tecnologia"
      readTime="11 min de leitura"
      reads="3.964"
      title="Utilizando inteligência artificial na construção civil"
      subtitle="Onde a IA já entrega resultado real: levantamento de quantitativos, programação de obra e atendimento ao cliente."
    >
      <WideFigure
        src={img1}
        alt="Vista aérea de canteiro de obras com sobreposição de interface de IA"
        caption="A IA já saiu do hype. Hoje ela coordena cronogramas, lê plantas e analisa progresso real de obra."
      />

      <Lead>
        Durante anos, a inteligência artificial foi tratada como promessa distante para a
        construção civil. Em 2026, ela já é ferramenta de trabalho.
      </Lead>

      <P>
        A diferença é que parou de ser um discurso sobre o futuro e virou prática diária em
        escritórios de arquitetura, construtoras e incorporadoras de todos os tamanhos. O que
        antes demorava dias agora acontece em minutos — e, mais importante: com menos erro.
      </P>

      <Chapter num="1" title="Levantamento automático de quantitativos" />

      <FloatFigure
        src={img2}
        alt="Arquiteto usando software BIM com sugestões de IA em monitor grande"
        caption="Modelos BIM lidos por IA extraem quantitativos em minutos, com rastreabilidade por elemento."
        side="right"
      />

      <P>
        Esse é, talvez, o caso de uso mais maduro. Plugins acoplados ao Revit, ArchiCAD e
        plataformas BIM em nuvem leem o modelo, identificam elementos construtivos e geram
        quantitativos detalhados — alvenaria, esquadrias, revestimentos, instalações.
      </P>
      <P>
        O ganho não está só na velocidade, está na <strong>rastreabilidade</strong>: cada
        quantitativo se conecta de volta ao elemento que o gerou. Quando o projeto muda, o
        orçamento atualiza junto.
      </P>

      <Chapter num="2" title="Programação e cronograma de obra" />

      <P>
        Modelos de IA conseguem analisar histórico de obras anteriores e propor cronogramas
        realistas com base em produtividade real da equipe, sazonalidade e dependências entre
        serviços. Ferramentas como ALICE Technologies, Doxel e plataformas integradas a BIM 4D
        já permitem simular múltiplos cenários e identificar o caminho crítico com muito mais
        precisão do que planilhas estáticas.
      </P>
      <List
        items={[
          "Detecção automática de conflitos entre serviços",
          "Recomendação de sequência ótima de execução",
          "Alertas preditivos de atraso antes que ele aconteça",
          "Simulação de impacto de chuvas, faltas e atrasos de insumo",
        ]}
      />

      <Chapter num="3" title="Acompanhamento de obra por imagem" />

      <WideFigure
        src={img3}
        alt="Drone sobrevoando canteiro de obras ao pôr do sol"
        caption="Drones e câmeras fixas alimentam IAs que comparam o construído com o planejado."
      />

      <P>
        Drones com voo programado e câmeras instaladas no canteiro alimentam modelos de visão
        computacional que comparam o estado real da obra com o modelo BIM. O sistema identifica
        o que foi executado, o que está atrasado e onde há divergência entre projeto e execução.
      </P>
      <Quote>
        A medição deixa de ser uma vistoria semanal subjetiva e vira um relatório automático e
        auditável.
      </Quote>

      <Chapter num="4" title="Atendimento ao cliente e pré-venda" />

      <P>
        Chatbots e agentes de IA bem treinados estão assumindo o primeiro contato com leads:
        qualificam o cliente, agendam reunião, respondem dúvidas frequentes e enviam material
        institucional. Para escritórios de arquitetura, isso libera o sócio para focar nas
        reuniões que realmente importam.
      </P>
      <H3>Geração de imagens e estudos preliminares</H3>
      <P>
        Ferramentas como Midjourney, Stable Diffusion e plugins de IA acoplados a softwares de
        modelagem permitem gerar referências visuais, estudos de fachada e moodboards em
        minutos. Bem usado, vira acelerador criativo — não substitui o projeto, mas encurta a
        ponte entre o briefing e a primeira proposta visual.
      </P>

      <div className="mt-20 mb-8 clear-both">
        <span className="t-caption uppercase tracking-[0.2em] text-primary text-[11px] font-semibold">Conclusão</span>
        <h2 className="mt-3 font-display text-[28px] sm:text-[36px] leading-[1.15] tracking-[-0.01em] text-ink font-semibold border-b border-border pb-5">
          A IA não substitui o profissional — substitui o profissional que não usa IA
        </h2>
      </div>
      <P>
        Quem entender primeiro como integrar IA nos processos do escritório vai entregar mais,
        com menos custo, e ainda assim cobrar mais caro. A pergunta não é mais "se" — é "onde
        começar".
      </P>
    </ArticleShell>
  );
}
