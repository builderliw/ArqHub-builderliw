import { createFileRoute } from "@tanstack/react-router";
import img1 from "@/assets/artigo-sus-1.jpg";
import img2 from "@/assets/artigo-sus-2.jpg";
import img3 from "@/assets/artigo-sus-3.jpg";
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

export const Route = createFileRoute("/conteudos/potencializador_/sustentabilidade")({
  head: () => ({
    meta: [
      { title: "Sustentabilidade na construção civil: o caminho para um planeta melhor | ArqHub" },
      { name: "description", content: "Materiais, certificações e práticas sustentáveis que já são exigidas pelos clientes premium em 2026." },
      { property: "og:title", content: "Sustentabilidade na construção civil" },
      { property: "og:description", content: "LEED, AQUA, materiais de baixo carbono, gestão de resíduos: o panorama atual da construção sustentável." },
      { property: "og:image", content: img1 },
    ],
  }),
  component: Artigo,
});

function Artigo() {
  return (
    <ArticleShell
      category="Tendências"
      readTime="12 min de leitura"
      reads="3.421"
      title="Sustentabilidade na construção civil: o caminho para um planeta melhor"
      subtitle="Materiais, certificações e práticas que já são exigidas pelos clientes premium em 2026."
    >
      <WideFigure
        src={img1}
        alt="Edifício residencial moderno com fachada verde e painéis solares"
        caption="A construção responde por cerca de 38% das emissões globais de CO₂. Mudar isso virou agenda obrigatória."
      />

      <Lead>
        Sustentabilidade deixou de ser diferencial de marketing. Em 2026, ela é exigência
        contratual, requisito de financiamento e critério de venda.
      </Lead>

      <P>
        Segundo o relatório Global Status Report for Buildings and Construction (UNEP), o setor
        da construção civil responde por cerca de 38% das emissões globais de CO₂, considerando
        operação e ciclo de vida dos materiais. No Brasil, esse impacto se soma ao consumo de
        água, à geração de resíduos e ao consumo energético — colocando o setor no centro da
        agenda ambiental.
      </P>

      <Chapter num="1" title="As certificações que estão valendo dinheiro" />

      <FloatFigure
        src={img2}
        alt="Mãos segurando amostras de materiais sustentáveis - cortiça, bambu, madeira reciclada"
        caption="Materiais de baixo carbono saíram da curadoria boutique e entraram no orçamento padrão."
        side="right"
      />

      <P>As três certificações que dominam o mercado brasileiro hoje:</P>
      <H3>LEED (Leadership in Energy and Environmental Design)</H3>
      <P>
        Mais conhecida internacionalmente. Avalia em sete categorias e classifica em
        Certificado, Prata, Ouro e Platina. Aceita em concorrências internacionais e valoriza
        bem o ativo imobiliário.
      </P>
      <H3>AQUA-HQE</H3>
      <P>
        Adaptação francesa para o contexto brasileiro. Foco em desempenho ambiental, conforto,
        saúde e gestão. Muito usada em edificações residenciais e corporativas.
      </P>
      <H3>EDGE (IFC/Banco Mundial)</H3>
      <P>
        Voltada para mercados emergentes. Mais acessível para projetos de menor porte e
        habitação. Exige no mínimo 20% de economia em energia, água e materiais.
      </P>

      <Chapter num="2" title="Materiais de baixo impacto" />

      <P>
        O conceito de <strong>energia incorporada</strong> ganhou peso no projeto. Hoje, o
        arquiteto especifica não só pelo desempenho do material, mas também pelo CO₂ embutido
        em sua produção. Algumas categorias em alta:
      </P>
      <List
        items={[
          "Madeira engenheirada certificada (CLT, glulam) substituindo estruturas metálicas",
          "Cimento Portland com adições (LC3, escória de alto forno) com até 40% menos CO₂",
          "Tijolos solo-cimento e blocos de terra compactada",
          "Pisos e revestimentos com conteúdo reciclado pós-consumo",
          "Tintas e selantes com baixo COV (compostos orgânicos voláteis)",
        ]}
      />

      <Chapter num="3" title="Eficiência energética e hídrica" />

      <WideFigure
        src={img3}
        alt="Telhado com painéis solares e sistema de captação de água em casa brasileira"
        caption="Painéis fotovoltaicos, reuso de águas cinzas e ventilação cruzada já são padrão em projetos médios."
      />

      <P>
        Soluções passivas e ativas que viraram padrão de mercado, mesmo fora de certificação
        formal:
      </P>
      <List
        items={[
          "Geração fotovoltaica on-grid integrada ao projeto elétrico",
          "Aquecimento solar para água quente residencial",
          "Reuso de águas cinzas para irrigação e descarga",
          "Captação de água de chuva com tratamento",
          "Iluminação 100% LED com sensores de presença",
          "Esquadrias de alto desempenho térmico e acústico",
          "Ventilação cruzada e iluminação natural priorizadas no partido",
        ]}
      />

      <Chapter num="4" title="Gestão de resíduos no canteiro" />

      <P>
        A Resolução CONAMA 307 e a NBR 15.112 obrigam o Plano de Gerenciamento de Resíduos da
        Construção Civil (PGRCC) em obras de médio e grande porte. Na prática, escritórios sérios:
      </P>
      <List
        items={[
          "Segregam resíduos por classe (A, B, C, D) já no canteiro",
          "Mantêm contrato com empresas licenciadas de coleta",
          "Documentam destinação com CTR (Controle de Transporte de Resíduos)",
          "Reaproveitam concreto e alvenaria em sub-bases internas",
        ]}
      />
      <Quote>
        Obra sustentável não é a que planta árvore no terreno. É a que reduz, reutiliza e
        comprova o destino do que sobra.
      </Quote>

      <div className="mt-20 mb-8 clear-both">
        <span className="t-caption uppercase tracking-[0.2em] text-primary text-[11px] font-semibold">Conclusão</span>
        <h2 className="mt-3 font-display text-[28px] sm:text-[36px] leading-[1.15] tracking-[-0.01em] text-ink font-semibold border-b border-border pb-5">
          O cliente premium de 2026 paga mais por menos impacto
        </h2>
      </div>
      <P>
        A sustentabilidade virou critério de mercado. Escritórios que dominam certificações,
        materiais de baixo carbono e gestão de resíduos cobram mais — e fecham mais. O custo de
        ignorar essa agenda já é maior do que o de incorporá-la.
      </P>
    </ArticleShell>
  );
}
