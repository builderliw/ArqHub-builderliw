import { createFileRoute } from "@tanstack/react-router";
import img1 from "@/assets/artigo-solucoes-1.jpg";
import img2 from "@/assets/artigo-solucoes-2.jpg";
import img3 from "@/assets/artigo-solucoes-3.jpg";
import img4 from "@/assets/artigo-solucoes-4.jpg";
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

export const Route = createFileRoute("/conteudos/empreenda_/venda-solucoes")({
  head: () => ({
    meta: [
      { title: "Pare de vender projetos ou obras, venda soluções! | ArqHub" },
      {
        name: "description",
        content:
          "Como aumentar o valor percebido oferecendo soluções (e não apenas projetos ou obras) para o cliente final.",
      },
      { property: "og:title", content: "Pare de vender projetos. Venda soluções." },
      {
        property: "og:description",
        content: "Da característica técnica ao benefício real: como reposicionar sua oferta e sair da guerra de preço.",
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
      category="Vendas"
      readTime="8 min de leitura"
      reads="1.984"
      title="Pare de vender projetos ou obras, venda soluções!"
      subtitle="Como oferecer soluções para o seu cliente (e não apenas projetos ou obras) e aumentar o valor percebido dos seus serviços."
    >
      <WideFigure
        src={img1}
        alt="Arquiteto apresentando soluções para um casal de clientes"
        caption="O cliente não compra uma planta. Compra a casa que ela representa."
      />

      <Lead>
        Uma das maiores dificuldades enfrentadas por arquitetos, engenheiros e empresas de
        construção não está na qualidade técnica dos seus projetos. Está na forma como eles são
        apresentados ao mercado.
      </Lead>

      <P>
        Muitos profissionais passam anos aperfeiçoando suas habilidades, estudando normas,
        softwares, materiais e processos construtivos. Porém, quando chega o momento de vender,
        acabam cometendo um erro que reduz drasticamente o valor percebido do seu trabalho:
      </P>
      <P>
        <strong>Eles vendem projetos.</strong> Ou pior: vendem metros quadrados, desenhos
        técnicos, plantas baixas e acompanhamento de obra.
      </P>
      <Quote>
        Nenhum cliente acorda pela manhã pensando: "Hoje eu preciso comprar um projeto
        executivo." O que ele quer é resolver um problema.
      </Quote>

      <Chapter num="1" title="O cliente não compra um projeto" />
      <P>
        Imagine que um casal acabou de adquirir um terreno. Ao procurar um arquiteto, eles
        dizem: <em>"Queremos fazer nossa casa."</em> Mas será que eles realmente querem comprar
        um projeto?
      </P>
      <P>Não. O que eles querem é:</P>
      <List
        items={[
          "Segurança para investir suas economias",
          "Uma casa confortável para a família",
          "Aproveitamento inteligente do terreno",
          "Economia na construção",
          "Ambientes funcionais",
          "Valorização do imóvel",
          "Menos dores de cabeça durante a obra",
        ]}
      />
      <P>
        O projeto é apenas o meio para alcançar esse objetivo. A solução é o que realmente
        importa.
      </P>

      <Chapter num="2" title="Duas abordagens, dois resultados" />

      <P>
        A diferença entre uma proposta aceita e uma descartada raramente está no preço. Está na
        forma como o serviço é apresentado. Compare as duas abordagens abaixo e observe o
        impacto que cada uma gera no cliente.
      </P>


      <H3>Abordagem 1 — Característica</H3>
      <Quote>
        "Desenvolvemos projetos arquitetônicos residenciais completos, incluindo planta baixa,
        fachadas, cortes, detalhamentos e projeto executivo."
      </Quote>
      <P>
        Tecnicamente está correto. Mas para a maioria dos clientes isso não desperta emoção nem
        gera percepção de valor. Soa como uma lista de entregáveis — algo que o cliente não sabe
        avaliar e, por isso, reduz tudo a uma única variável: o preço.
      </P>

      <H3>Abordagem 2 — Benefício</H3>
      <Quote>
        "Ajudamos famílias a construir a casa dos seus sonhos com mais segurança,
        previsibilidade de custos e menos erros durante a obra."
      </Quote>
      <P>
        A segunda fala sobre resultado. Conecta o serviço ao benefício desejado. Benefícios
        vendem muito mais do que características técnicas, porque tocam no que o cliente
        realmente busca: tranquilidade, economia e o sonho realizado.
      </P>

      <Chapter num="3" title="Pessoas compram transformação" />
      <P>
        Quando alguém contrata um arquiteto, não está comprando desenhos. Está comprando a
        transformação de um terreno vazio em um lar.
      </P>
      <P>
        Quando contrata uma empresa de reforma, não está comprando mão de obra. Está comprando
        conforto, valorização do imóvel e qualidade de vida.
      </P>
      <P>
        Quando contrata gerenciamento de obra, não está comprando relatórios. Está comprando
        tranquilidade.
      </P>

      <Chapter num="4" title="O que o cliente realmente está comprando?" />

      <H3>Projeto Residencial</H3>
      <P><strong>Você acha que vende:</strong></P>
      <List items={["Planta baixa", "Fachadas", "Cortes", "Projeto executivo"]} />
      <P><strong>Ele acha que está comprando:</strong></P>
      <List items={["Segurança", "Conforto", "Funcionalidade", "Economia", "Qualidade de vida"]} />

      <H3>Reforma</H3>
      <P><strong>Você acha que vende:</strong></P>
      <List items={["Projeto", "Mão de obra", "Cronograma"]} />
      <P><strong>Ele acha que está comprando:</strong></P>
      <List items={["Modernização", "Bem-estar", "Valorização patrimonial", "Menos problemas"]} />

      <H3>Gerenciamento de obra</H3>
      <P><strong>Você acha que vende:</strong></P>
      <List items={["Fiscalização", "Relatórios", "Controle técnico"]} />
      <P><strong>Ele acha que está comprando:</strong></P>
      <List
        items={[
          "Tranquilidade",
          "Controle financeiro",
          "Cumprimento de prazo",
          "Menos desperdício",
        ]}
      />

      <H3>Projeto comercial</H3>
      <P><strong>Você acha que vende:</strong></P>
      <List items={["Layout", "Compatibilização", "Detalhamento"]} />
      <P><strong>Ele acha que está comprando:</strong></P>
      <List
        items={[
          "Mais vendas",
          "Melhor experiência para seus clientes",
          "Fortalecimento da marca",
          "Diferenciação da concorrência",
        ]}
      />

      <Chapter num="5" title="O preço deixa de ser o centro da conversa" />

      <WideFigure
        src={img2}
        alt="Família feliz em uma casa finalizada"
        caption="O que o cliente leva para casa não é o PDF do projeto — é a vida construída ali."
      />

      <P>
        Quando você vende apenas um projeto, a comparação é simples. O cliente olha três
        propostas e pergunta: <em>"Qual é a mais barata?"</em>
      </P>
      <P>Mas quando você vende uma solução completa, a conversa muda para:</P>
      <List
        items={[
          "Quem me transmite mais segurança?",
          "Quem entende melhor meu problema?",
          "Quem consegue me entregar o resultado que procuro?",
          "Quem reduz meus riscos?",
        ]}
      />
      <P>O preço continua importante. Mas deixa de ser o único critério de decisão.</P>

      <Chapter num="6" title="Como transformar seus serviços em soluções" />
      <P>Comece pela forma de apresentar.</P>

      <H3>Ao invés de…</H3>
      <Quote>"Projeto arquitetônico completo."</Quote>
      <P><strong>Experimente:</strong></P>
      <Quote>
        "Planejamos sua construção para evitar desperdícios, aproveitar melhor os espaços e
        proporcionar mais conforto para sua família."
      </Quote>

      <H3>Ao invés de…</H3>
      <Quote>"Gerenciamento de obra."</Quote>
      <P><strong>Experimente:</strong></P>
      <Quote>
        "Acompanhamos sua obra para que você tenha mais controle sobre custos, prazos e qualidade
        da execução."
      </Quote>

      <H3>Ao invés de…</H3>
      <Quote>"Projeto comercial."</Quote>
      <P><strong>Experimente:</strong></P>
      <Quote>
        "Criamos ambientes que fortalecem sua marca e proporcionam uma experiência diferenciada
        para seus clientes."
      </Quote>

      <Chapter num="7" title="Clientes valorizam previsibilidade" />
      <P>
        Uma das maiores dores de quem constrói ou reforma é a incerteza. Eles têm medo de:
      </P>
      <List
        items={[
          "Gastar mais do que o previsto",
          "Sofrer atrasos",
          "Contratar fornecedores errados",
          "Fazer escolhas equivocadas",
          "Ter problemas durante a execução",
        ]}
      />
      <P>
        Por isso, uma das soluções mais valiosas que um profissional pode oferecer é
        previsibilidade. Quando você mostra processos claros, cronogramas definidos e
        acompanhamento estruturado, está entregando muito mais do que um projeto. Está entregando
        confiança. E confiança tem valor.
      </P>

      <Chapter num="8" title="Soluções geram relacionamentos de longo prazo" />

      <FloatFigure
        src={img4}
        alt="Aperto de mão entre arquiteto e cliente em frente a uma obra"
        caption="Quem vende solução continua presente em todas as próximas decisões do cliente."
        side="left"
      />

      <P>
        Quem vende apenas um projeto normalmente encerra o relacionamento após a entrega. Quem
        vende soluções continua presente durante toda a jornada do cliente. Isso abre
        oportunidades para:
      </P>
      <List
        items={[
          "Gerenciamento de obra",
          "Consultorias",
          "Projetos complementares",
          "Reformas futuras",
          "Indicações",
          "Novos negócios",
        ]}
      />

      <Chapter num="9" title="O mercado mudou" />
      <P>
        Durante muitos anos, a principal diferenciação dos profissionais estava na capacidade
        técnica. Hoje isso continua sendo fundamental — mas não é suficiente.
      </P>
      <P>
        O cliente moderno busca experiência, praticidade, confiança e resultados. Quer alguém
        que simplifique um processo complexo, assuma responsabilidades e ofereça clareza num
        momento repleto de decisões importantes.
      </P>

      <Chapter num="10" title="Faça este exercício" />
      <P>
        Analise seu site, suas redes sociais ou sua proposta comercial. Você está falando sobre:
      </P>
      <List
        items={[
          "Plantas",
          "Cortes",
          "Fachadas",
          "Memorial descritivo",
          "Compatibilização",
          "Cronogramas",
        ]}
      />
      <P>Ou sobre:</P>
      <List
        items={[
          "Segurança",
          "Economia",
          "Conforto",
          "Tranquilidade",
          "Valorização do imóvel",
          "Qualidade de vida",
          "Crescimento do negócio do cliente",
        ]}
      />
      <P>
        Se a maior parte da sua comunicação estiver focada apenas em aspectos técnicos, existe
        uma enorme oportunidade de melhorar sua percepção de valor.
      </P>

      <div className="mt-20 mb-8 clear-both">
        <span className="t-caption uppercase tracking-[0.2em] text-primary text-[11px] font-semibold">
          Conclusão
        </span>
        <h2 className="mt-3 font-display text-[28px] sm:text-[36px] leading-[1.15] tracking-[-0.01em] text-ink font-semibold border-b border-border pb-5">
          Resultado vende mais que técnica
        </h2>
      </div>

      <P>
        Projetos, obras, plantas e relatórios são importantes — mas não são o que o cliente
        realmente deseja. O que ele procura é alguém capaz de resolver problemas, reduzir riscos
        e ajudá-lo a alcançar um objetivo.
      </P>
      <P>
        Os profissionais mais valorizados do mercado não vendem apenas arquitetura ou
        construção. Vendem segurança. Vendem tranquilidade. Vendem qualidade de vida. Vendem
        previsibilidade. Vendem resultados.
      </P>
      <Quote>
        Ninguém compra uma planta baixa. As pessoas compram a vida que desejam construir através
        dela.
      </Quote>
    </ArticleShell>
  );
}
