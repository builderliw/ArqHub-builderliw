import { createFileRoute } from "@tanstack/react-router";
import img1 from "@/assets/artigo-rv-1.jpg";
import img2 from "@/assets/artigo-rv-2.jpg";
import img3 from "@/assets/artigo-rv-3.jpg";
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

export const Route = createFileRoute("/conteudos/potencializador_/relatorio-visita")({
  head: () => ({
    meta: [
      { title: "Relatório de visita técnica que protege o escritório | ArqHub" },
      { name: "description", content: "Modelo, estrutura e dicas para documentar visitas técnicas e evitar dores de cabeça jurídicas." },
      { property: "og:title", content: "Relatório de visita técnica que protege o escritório" },
      { property: "og:description", content: "Como estruturar relatórios de visita que valem como prova e protegem você juridicamente." },
      { property: "og:image", content: img1 },
    ],
  }),
  component: Artigo,
});

function Artigo() {
  return (
    <ArticleShell
      category="Projetos e Obras"
      readTime="10 min de leitura"
      reads="2.756"
      title="Como elaborar um relatório de visita técnica que protege o escritório"
      subtitle="Modelo, estrutura e dicas para documentar visitas e evitar dores de cabeça jurídicas."
    >
      <WideFigure
        src={img1}
        alt="Arquiteto inspecionando canteiro de obras com prancheta e capacete"
        caption="Visita sem relatório é visita que nunca aconteceu — pelo menos é assim que a Justiça enxerga."
      />

      <Lead>
        Toda visita técnica é uma decisão registrada. E toda decisão não registrada se torna,
        cedo ou tarde, uma responsabilidade não comprovada.
      </Lead>

      <P>
        O relatório de visita técnica (RVT) é o documento mais subestimado da gestão de obras.
        Quando bem feito, ele protege o escritório, alinha expectativas e vira prova em
        eventuais discussões com cliente, construtor ou seguradora. Quando malfeito (ou
        inexistente), abre flanco para responsabilização civil e perda de honorários.
      </P>

      <Chapter num="1" title="A estrutura mínima de um RVT" />

      <FloatFigure
        src={img2}
        alt="Mão escrevendo em caderno de relatório de visita no canteiro"
        caption="Datado, assinado, fotografado: o RVT começa antes da visita e termina no e-mail de envio."
        side="right"
      />

      <P>Todo relatório de visita técnica robusto contém, no mínimo:</P>
      <List
        items={[
          "Dados da obra (endereço, contrato, ART/RRT vinculada)",
          "Data, hora de chegada e hora de saída",
          "Pessoas presentes (cliente, mestre, fornecedor)",
          "Etapa da obra no momento da visita",
          "Itens verificados em checklist objetivo",
          "Não-conformidades encontradas (com foto)",
          "Recomendações com prazo e responsável",
          "Próximos passos e data da próxima visita",
          "Assinatura do responsável técnico",
        ]}
      />

      <Chapter num="2" title="Por que o registro fotográfico é decisivo" />

      <WideFigure
        src={img3}
        alt="Arquiteto fotografando fissura em parede de canteiro para relatório"
        caption="Foto com data, geolocalização e legenda no relatório vale como prova técnica."
      />

      <P>
        Fotos são o coração do RVT moderno. Câmeras de celular já registram metadados (data,
        hora, GPS) que dão valor probatório à imagem. Boas práticas:
      </P>
      <List
        items={[
          "Tire fotos de contexto antes de fotos de detalhe",
          "Inclua uma referência de escala (régua, trena) em fotos de patologia",
          "Numere as fotos e referencie-as no texto do relatório",
          "Mantenha o original no servidor do escritório, não só no celular",
        ]}
      />

      <Chapter num="3" title="O que NÃO escrever em um RVT" />

      <P>
        Tão importante quanto o que entra é o que <strong>não</strong> entra. Evite:
      </P>
      <H3>Opinião pessoal sem fundamento técnico</H3>
      <P>"Achei o serviço mal feito" não tem peso. "Junta de assentamento com largura média de 18 mm, fora do especificado (10 mm)" tem.</P>
      <H3>Promessas de prazo ou custo que não são suas</H3>
      <P>Nunca registre prazo do empreiteiro como se fosse compromisso seu.</P>
      <H3>Atribuição de culpa</H3>
      <P>Descreva fatos. Conclusões de responsabilidade são para perícia, não para RVT.</P>

      <Chapter num="4" title="Como entregar o relatório" />

      <P>
        O RVT deve ser enviado por canal rastreável — e-mail é o padrão de mercado. Boas práticas
        que evitam problemas:
      </P>
      <List
        items={[
          "Envie em até 48 horas após a visita",
          "Use sempre o mesmo modelo e numeração sequencial",
          "Anexe em PDF, não em editor aberto",
          "Solicite confirmação de recebimento ao cliente",
          "Arquive cópia em pasta digital com backup",
        ]}
      />
      <Quote>
        E-mail enviado é responsabilidade transferida. Visita sem relatório é responsabilidade
        que continua sua.
      </Quote>

      <div className="mt-20 mb-8 clear-both">
        <span className="t-caption uppercase tracking-[0.2em] text-primary text-[11px] font-semibold">Conclusão</span>
        <h2 className="mt-3 font-display text-[28px] sm:text-[36px] leading-[1.15] tracking-[-0.01em] text-ink font-semibold border-b border-border pb-5">
          Documentar não é burocracia. É blindagem.
        </h2>
      </div>
      <P>
        O bom RVT separa o profissional que entrega projeto do profissional que entrega
        confiança. Crie um modelo padrão, treine sua equipe e nunca saia de uma obra sem
        registrar o que viu. Seu eu do futuro agradece.
      </P>
    </ArticleShell>
  );
}
