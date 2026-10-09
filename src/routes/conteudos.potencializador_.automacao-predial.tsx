import { createFileRoute } from "@tanstack/react-router";
import img1 from "@/assets/artigo-aut-1.jpg";
import img2 from "@/assets/artigo-aut-2.jpg";
import img3 from "@/assets/artigo-aut-3.jpg";
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

export const Route = createFileRoute("/conteudos/potencializador_/automacao-predial")({
  head: () => ({
    meta: [
      { title: "Automação predial: inovação e sustentabilidade integradas ao projeto | ArqHub" },
      { name: "description", content: "Do projeto à entrega: como integrar automação predial sem inflar o orçamento da obra." },
      { property: "og:title", content: "Automação predial: caminho de inovação e sustentabilidade" },
      { property: "og:description", content: "Protocolos, infraestrutura, valor agregado e os erros mais comuns ao especificar automação." },
      { property: "og:image", content: img1 },
    ],
  }),
  component: Artigo,
});

function Artigo() {
  return (
    <ArticleShell
      category="Tecnologia"
      readTime="10 min de leitura"
      reads="2.318"
      title="Automação predial: um caminho de inovação e sustentabilidade"
      subtitle="Do projeto à entrega: como integrar automação sem inflar o orçamento da obra."
    >
      <WideFigure
        src={img1}
        alt="Painel de controle smart home moderno em parede de interior minimalista"
        caption="A automação madura não aparece. Ela acontece em segundo plano e o usuário só percebe que tudo simplesmente funciona."
      />

      <Lead>
        Automação predial parou de ser luxo. Virou um sistema que valoriza o imóvel, reduz custo
        operacional e melhora a experiência do morador.
      </Lead>

      <P>
        O mercado brasileiro de automação residencial e predial cresce a dois dígitos ao ano,
        impulsionado pela queda de preço dos componentes, pela disseminação de assistentes de
        voz e por uma geração de moradores que já espera controlar luz, climatização e segurança
        pelo celular.
      </P>

      <Chapter num="1" title="Protocolos: a escolha que define tudo" />

      <FloatFigure
        src={img2}
        alt="Pessoa controlando iluminação da casa pelo smartphone em sala de estar"
        caption="Matter, KNX, Zigbee: escolher o protocolo na fase de projeto evita retrabalho caro depois."
        side="right"
      />

      <P>A primeira decisão técnica, e a mais subestimada, é o protocolo de comunicação:</P>
      <H3>KNX</H3>
      <P>
        Padrão internacional cabeado, robusto, ideal para obras de alto padrão e edifícios
        corporativos. Custo mais alto, mas confiabilidade industrial.
      </P>
      <H3>Zigbee / Z-Wave</H3>
      <P>
        Sem fio, baixo consumo, boa para retrofit. Funciona em malha, então cada dispositivo
        amplia o alcance da rede.
      </P>
      <H3>Matter</H3>
      <P>
        Padrão recente, suportado por Apple, Google, Amazon e Samsung. Promete interoperabilidade
        real entre marcas — algo que faltava no setor há anos.
      </P>
      <H3>Wi-Fi</H3>
      <P>
        Mais barato e popular, mas sobrecarrega a rede e tem pior latência. Use para
        dispositivos pontuais, não como espinha dorsal.
      </P>

      <Chapter num="2" title="A infraestrutura precisa estar no projeto" />

      <P>
        O maior erro em automação não é técnico — é cronológico. O cliente decide automatizar
        depois da estrutura pronta, e o que era para custar X passa a custar 3X. Quando a
        infraestrutura está prevista desde o projeto:
      </P>
      <List
        items={[
          "Eletrodutos com bitola para passar cabos extras no futuro",
          "Quadro elétrico dimensionado para módulos de automação",
          "Pontos de rede cabeada em locais estratégicos (TV, escritório, sala técnica)",
          "Caixa de passagem e sala técnica ventilada para central e roteadores",
          "Neutro em todas as caixas de interruptor (exigência de boa parte dos módulos smart)",
        ]}
      />

      <Chapter num="3" title="O que vale a pena automatizar" />

      <WideFigure
        src={img3}
        alt="Eletricista instalando fiação de automação em teto moderno"
        caption="Iluminação cênica, persianas, climatização e segurança formam o quarteto que entrega mais valor percebido."
      />

      <P>
        Nem tudo precisa ser automatizado. Os subsistemas que entregam maior retorno por real
        investido:
      </P>
      <List
        items={[
          "Iluminação cênica com cenas e dimerização",
          "Persianas e cortinas motorizadas (impacto enorme na percepção de luxo)",
          "Climatização integrada com sensores de presença",
          "Segurança: câmeras, sensores de abertura, sirenes",
          "Áudio multi-room",
          "Irrigação automatizada e portões",
        ]}
      />
      <Quote>
        Automatize o que melhora a vida diária. Tudo que vira novidade abandonada em três meses
        é dinheiro mal gasto.
      </Quote>

      <Chapter num="4" title="Automação e sustentabilidade andam juntas" />

      <P>
        Boa parte do retorno da automação não está no conforto — está na economia. Sensores de
        presença, termostatos inteligentes, monitoramento de consumo e desligamento automático
        de cargas em standby reduzem facilmente 15-25% do consumo elétrico de uma residência.
      </P>
      <P>
        Integrada à geração fotovoltaica, a automação pode ainda priorizar consumo nas horas de
        maior geração solar — esticando o payback do sistema.
      </P>

      <div className="mt-20 mb-8 clear-both">
        <span className="t-caption uppercase tracking-[0.2em] text-primary text-[11px] font-semibold">Conclusão</span>
        <h2 className="mt-3 font-display text-[28px] sm:text-[36px] leading-[1.15] tracking-[-0.01em] text-ink font-semibold border-b border-border pb-5">
          A automação certa é invisível
        </h2>
      </div>
      <P>
        Projetar com automação desde o início custa pouco e entrega muito. Especifique
        infraestrutura, escolha o protocolo certo, automatize só o que melhora a vida. Quando
        bem feita, ela some no fundo — e o cliente percebe apenas que sua casa simplesmente
        funciona.
      </P>
    </ArticleShell>
  );
}
