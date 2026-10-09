import { createFileRoute } from "@tanstack/react-router";
import img1 from "@/assets/artigo-exec-1.jpg";
import img2 from "@/assets/artigo-exec-2.jpg";
import img3 from "@/assets/artigo-exec-3.jpg";
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

export const Route = createFileRoute("/conteudos/potencializador_/execucao-obras")({
  head: () => ({
    meta: [
      { title: "Execução de obras: importância, responsabilidades e boas práticas | ArqHub" },
      { name: "description", content: "O que o coordenador de obra precisa controlar de verdade para entregar no prazo e com qualidade." },
      { property: "og:title", content: "Execução de obras: o que controlar para entregar no prazo" },
      { property: "og:description", content: "Planejamento, controle de qualidade, segurança, comunicação: o quadrante que define o sucesso da obra." },
      { property: "og:image", content: img1 },
    ],
  }),
  component: Artigo,
});

function Artigo() {
  return (
    <ArticleShell
      category="Projetos e Obras"
      readTime="11 min de leitura"
      reads="2.945"
      title="Execução de obras: importância, responsabilidades e boas práticas"
      subtitle="O que o coordenador de obra precisa controlar de verdade para entregar no prazo."
    >
      <WideFigure
        src={img1}
        alt="Supervisor de obras coordenando equipe em canteiro"
        caption="Obra entregue no prazo não é sorte. É o resultado direto do controle diário das quatro variáveis críticas."
      />

      <Lead>
        Todo projeto excelente vira uma obra medíocre se a execução não for controlada. E toda
        execução é controlada por quatro variáveis: prazo, custo, qualidade e segurança.
      </Lead>

      <P>
        O coordenador de obras é o elo entre o projeto e a realidade. Ele traduz pranchas em
        ações, decisões em entregas e imprevistos em soluções. Quando faz bem, a obra termina
        sem ruído. Quando faz mal, a obra vira processo.
      </P>

      <Chapter num="1" title="Planejamento: o terreno do sucesso" />

      <FloatFigure
        src={img2}
        alt="Pedreiro assentando tijolos com cuidado em parede"
        caption="Sem cronograma com caminho crítico claro, toda obra atrasa. A pergunta é só quanto."
        side="right"
      />

      <P>
        Antes da primeira pá de cal, o planejamento já decidiu metade do resultado. O coordenador
        precisa ter, no mínimo:
      </P>
      <List
        items={[
          "Cronograma físico-financeiro com caminho crítico identificado",
          "Plano de ataque por etapa com sequência executiva clara",
          "Quadro de recursos (mão de obra, equipamentos, materiais) por semana",
          "Plano de logística do canteiro (acesso, descarga, estocagem)",
          "Cronograma de entrega de projetos complementares e ARTs",
        ]}
      />
      <Quote>
        Obra que começa sem cronograma com caminho crítico definido sempre atrasa. A pergunta é
        só quanto.
      </Quote>

      <Chapter num="2" title="Controle de qualidade no canteiro" />

      <P>
        Qualidade não é etapa final — é processo. Boas práticas que separam obras profissionais
        de obras amadoras:
      </P>
      <H3>FVS — Ficha de Verificação de Serviço</H3>
      <P>
        Checklist por etapa, assinado pelo encarregado, antes de liberar o serviço seguinte.
        Alvenaria não recebe revestimento sem FVS aprovada.
      </P>
      <H3>Recebimento de materiais</H3>
      <P>
        Conferência por nota, lote e amostra. Cimento fora do prazo, aço sem certificado e
        cerâmica fora do tom comprometem etapas inteiras.
      </P>
      <H3>Inspeção de serviços críticos</H3>
      <P>
        Fundações, impermeabilizações, instalações embutidas: tudo o que será encoberto exige
        registro fotográfico antes do fechamento.
      </P>

      <Chapter num="3" title="Segurança não é negociável" />

      <P>
        A NR-18 e o conjunto de normas regulamentadoras definem o piso. O coordenador sério vai
        além:
      </P>
      <List
        items={[
          "DDS (Diálogo Diário de Segurança) em todo início de turno",
          "Treinamento de novos colaboradores antes da liberação para o canteiro",
          "EPIs fornecidos, fiscalizados e substituídos quando danificados",
          "PCMAT atualizado e visível",
          "Análise preliminar de risco para serviços não rotineiros",
        ]}
      />
      <P>
        Acidente em obra não é só drama humano — é parada de obra, multa, processo trabalhista e
        impacto direto na imagem do escritório.
      </P>

      <Chapter num="4" title="Comunicação e medições" />

      <WideFigure
        src={img3}
        alt="Cronograma de obra em forma de Gantt chart em monitor de escritório"
        caption="Reunião semanal de obra com pauta, ata e ações datadas é o que separa coordenação de improvisação."
      />

      <P>
        Reuniões semanais com ata, medições mensais com memorial e relatórios fotográficos
        quinzenais são o tripé que mantém todos os envolvidos alinhados: cliente, empreiteiro,
        gerenciadora, projetistas e fornecedores.
      </P>
      <List
        items={[
          "Reunião semanal de obra com pauta fixa e ata distribuída",
          "Medição mensal com boletim de medição assinado pelas partes",
          "Relatório fotográfico quinzenal com etapas concluídas",
          "WhatsApp NÃO é canal oficial — use-o para urgência, e-mail para registro",
        ]}
      />

      <H3>Não-conformidades e ações corretivas</H3>
      <P>
        Toda obra tem desvio. A diferença está em como ele é tratado. Registre a NC, defina
        ação corretiva com responsável e prazo, acompanhe até o encerramento. Sem isso, o desvio
        vira passivo.
      </P>

      <div className="mt-20 mb-8 clear-both">
        <span className="t-caption uppercase tracking-[0.2em] text-primary text-[11px] font-semibold">Conclusão</span>
        <h2 className="mt-3 font-display text-[28px] sm:text-[36px] leading-[1.15] tracking-[-0.01em] text-ink font-semibold border-b border-border pb-5">
          Obra bem coordenada é obra que termina sem barulho
        </h2>
      </div>
      <P>
        Projeto, prazo, custo, qualidade e segurança não competem entre si — eles se sustentam
        mutuamente. O coordenador que entende isso entrega obras que ninguém comenta porque
        simplesmente deram certo. E é justamente esse silêncio que vira contrato para a
        próxima obra.
      </P>
    </ArticleShell>
  );
}
