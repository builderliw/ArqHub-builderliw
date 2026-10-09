import { createFileRoute } from "@tanstack/react-router";
import img1 from "@/assets/artigo-trafego-1.jpg";
import img2 from "@/assets/artigo-trafego-2.jpg";
import img3 from "@/assets/artigo-trafego-3.jpg";
import img4 from "@/assets/artigo-trafego-4.jpg";
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

export const Route = createFileRoute("/conteudos/empreenda_/trafego-pago")({
  head: () => ({
    meta: [
      { title: "Tráfego pago: comece pelo Google Ads e não pelo Instagram | ArqHub" },
      {
        name: "description",
        content:
          "Como usar Google Ads e Instagram Ads de forma estratégica para captar projetos e obras com previsibilidade.",
      },
      { property: "og:title", content: "Tráfego pago: comece pelo Google Ads" },
      {
        property: "og:description",
        content: "Demanda ativa x passiva: como distribuir investimento, escolher palavras e medir o que importa.",
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
      category="Captação de clientes"
      readTime="9 min de leitura"
      reads="3.412"
      title="Tráfego pago: comece pelo Google Ads e não pelo Instagram."
      subtitle="Como utilizar as plataformas de anúncio de forma estratégica para captar mais projetos e obras para o seu negócio."
    >
      <WideFigure
        src={img1}
        alt="Pessoa pesquisando no Google em um notebook"
        caption="No Google, o cliente já está procurando. No Instagram, ele só está passando o tempo."
      />

      <Lead>
        Quando um escritório de arquitetura ou uma empresa de construção decide investir em
        marketing digital, o caminho normalmente é o mesmo: impulsionar publicações no Instagram.
      </Lead>

      <P>
        A lógica parece simples. Se os clientes estão no Instagram, basta anunciar por lá para
        gerar mais contratos. Mas a realidade costuma ser bem diferente.
      </P>
      <P>
        Após investir centenas ou até milhares de reais em anúncios, muitos profissionais se
        frustram ao perceber que receberam curtidas, seguidores e mensagens sem potencial de
        contratação.
      </P>
      <P>
        Enquanto isso, existe uma plataforma capaz de gerar contatos muito mais qualificados
        desde o primeiro dia: o Google Ads.
      </P>
      <Quote>
        A principal diferença está na intenção de compra. O Instagram interrompe a atenção. O
        Google conecta sua empresa com quem já está procurando pelos seus serviços.
      </Quote>

      <Chapter num="1" title="O maior erro de quem começa a anunciar" />

      <H3>Situação 1: Instagram</H3>
      <P>
        Uma pessoa está assistindo vídeos, vendo fotos de viagens ou acompanhando a rotina de
        amigos. De repente aparece um anúncio: <em>"Projeto arquitetônico residencial em
        Brasília."</em>
      </P>
      <P>
        Ela pode até achar bonito. Mas provavelmente não está pensando em construir ou reformar
        naquele momento. Talvez salve a publicação. Talvez curta. Talvez nem perceba.
      </P>

      <H3>Situação 2: Google</H3>
      <P>Uma pessoa abre o navegador e pesquisa:</P>
      <List
        items={[
          "Arquiteto em Brasília",
          "Projeto de casa moderna",
          "Empresa de reforma residencial",
          "Projeto arquitetônico preço",
          "Gerenciamento de obra",
        ]}
      />
      <P>
        Essa pessoa já possui uma necessidade clara. Ela não foi interrompida. Ela está
        procurando uma solução. E é exatamente nesse momento que o Google Ads se torna
        extremamente poderoso.
      </P>
      <P>
        Segundo a Google, bilhões de pesquisas são realizadas diariamente em sua plataforma,
        muitas delas relacionadas à contratação de serviços locais e profissionais
        especializados.
      </P>

      <Chapter num="2" title="Demanda ativa x demanda passiva" />

      <FloatFigure
        src={img3}
        alt="Profissional comparando performance de Google Ads e Instagram Ads em um quadro"
        caption="Cada plataforma atua em uma etapa diferente da decisão de compra do cliente."
        side="right"
      />

      <H3>Google Ads = Demanda ativa</H3>
      <P>A pessoa já quer resolver um problema. Ela pesquisa:</P>
      <List
        items={[
          "Arquiteto para projeto residencial",
          "Engenheiro estrutural",
          "Reforma de apartamento",
          "Regularização de imóvel",
          "Projeto comercial",
        ]}
      />
      <P>Ela está procurando uma empresa para contratar.</P>

      <H3>Instagram Ads = Demanda passiva</H3>
      <P>
        A pessoa não necessariamente precisa do serviço. Ela está navegando por entretenimento.
        Seu anúncio aparece no meio do conteúdo. Por isso, a taxa de conversão costuma ser menor.
      </P>
      <P>
        Não significa que o Instagram não funciona — significa que ele deve ser utilizado em
        momentos diferentes da estratégia.
      </P>

      <Chapter num="3" title="O Google captura clientes no momento da decisão" />

      <WideFigure
        src={img4}
        alt="Casal analisando opções de projeto em um tablet"
        caption="O momento da pesquisa é o momento mais próximo da contratação."
      />

      <P>
        Imagine um casal que acabou de comprar um terreno. Eles dificilmente vão abrir o
        Instagram e escrever: <em>"Preciso de um arquiteto."</em>
      </P>
      <P>Mas certamente vão pesquisar no Google algo como:</P>
      <List
        items={[
          "Projeto de casa térrea",
          "Arquiteto especializado em residências",
          "Quanto custa um projeto arquitetônico",
          "Escritório de arquitetura próximo",
        ]}
      />
      <P>
        É nesse momento que sua empresa precisa aparecer. Segundo o Think with Google,
        consumidores utilizam mecanismos de busca justamente para pesquisar soluções, comparar
        opções e tomar decisões de compra.
      </P>
      <Quote>
        Quem pesquisa por um arquiteto no Google está, em geral, muito mais próximo da
        contratação do que quem apenas viu uma publicação no Instagram.
      </Quote>

      <Chapter num="4" title="O que anunciar no Google Ads" />
      <P>
        Um erro comum é criar anúncios genéricos. Quanto mais específico for o serviço
        anunciado, melhor.
      </P>

      <H3>Projeto residencial</H3>
      <List
        items={[
          "Projeto arquitetônico residencial",
          "Arquiteto para casa",
          "Projeto de casa moderna",
          "Projeto residencial em Brasília",
        ]}
      />

      <H3>Reformas</H3>
      <List
        items={[
          "Reforma de apartamento",
          "Reforma residencial",
          "Empresa de reforma",
          "Arquiteto para reforma",
        ]}
      />

      <H3>Gerenciamento de obras</H3>
      <List
        items={[
          "Gerenciamento de obra",
          "Acompanhamento de obra",
          "Fiscalização de obra",
          "Administração de construção",
        ]}
      />

      <H3>Projetos comerciais</H3>
      <List
        items={[
          "Projeto comercial",
          "Projeto para clínica",
          "Projeto para escritório",
          "Arquitetura corporativa",
        ]}
      />

      <Chapter num="5" title="O Instagram continua sendo importante" />
      <P>
        Se o Google costuma ser mais eficiente para gerar demanda imediata, qual o papel do
        Instagram? Construir confiança.
      </P>
      <P>O comportamento mais comum do cliente funciona assim:</P>
      <List
        items={[
          "Pesquisa no Google",
          "Encontra sua empresa",
          "Visita seu site",
          "Procura seu Instagram",
          "Analisa seus projetos",
          "Avalia sua credibilidade",
          "Entra em contato",
        ]}
      />
      <Quote>O Google gera a oportunidade. O Instagram ajuda a validar a decisão.</Quote>

      <Chapter num="6" title="Como distribuir seu investimento" />

      <FloatFigure
        src={img2}
        alt="Dashboard de Google Ads com métricas de conversão"
        caption="Acompanhe o que paga as contas: leads qualificados, reuniões e contratos — não curtidas."
        side="left"
      />

      <P>
        Para empresas que estão começando a investir em tráfego pago, uma divisão eficiente
        costuma ser:
      </P>
      <H3>70% — Google Ads</H3>
      <List items={["Geração de leads", "Solicitação de orçamento", "Captação de clientes"]} />
      <H3>30% — Instagram e Facebook</H3>
      <List
        items={[
          "Autoridade",
          "Reconhecimento de marca",
          "Fortalecimento da imagem",
          "Remarketing",
        ]}
      />

      <Chapter num="7" title="O erro de anunciar sem página de conversão" />
      <P>
        Outro problema frequente é investir em anúncios e direcionar o usuário para a página
        inicial do site. Imagine alguém pesquisando{" "}
        <em>"projeto arquitetônico para clínica odontológica"</em> e cair numa página genérica
        falando de todos os serviços. Isso reduz drasticamente a conversão.
      </P>
      <P>O ideal é criar páginas específicas para cada serviço. Por exemplo:</P>

      <H3>Página de Projeto Residencial</H3>
      <List
        items={[
          "Portfólio",
          "Diferenciais",
          "Depoimentos",
          "Processo de trabalho",
          "Formulário de contato",
        ]}
      />
      <H3>Página de Reforma</H3>
      <List
        items={[
          "Antes e depois",
          "Casos reais",
          "Prazo médio",
          "Benefícios",
          "Solicitação de orçamento",
        ]}
      />

      <Chapter num="8" title="Não compre seguidores. Compre intenção." />
      <P>Muitos empresários acompanham métricas como:</P>
      <List items={["Curtidas", "Alcance", "Visualizações", "Seguidores"]} />
      <P>Mas nenhuma dessas métricas paga as contas. O que realmente importa são:</P>
      <List
        items={[
          "Leads gerados",
          "Reuniões agendadas",
          "Propostas enviadas",
          "Contratos fechados",
          "Valor de obras captadas",
        ]}
      />
      <P>
        Uma campanha que gera dez seguidores pode ser muito mais valiosa do que outra que gera
        mil. Tudo depende da qualidade dos contatos.
      </P>

      <Chapter num="9" title="Tráfego pago é investimento, não custo" />
      <P>Imagine que sua empresa investiu R$ 1.500 em Google Ads. A campanha gerou:</P>
      <List
        items={["20 contatos", "8 reuniões", "3 propostas", "1 contrato de R$ 35.000"]}
      />
      <P>
        Nesse cenário, o investimento não custou R$ 1.500 — ele ajudou a gerar R$ 35.000 em
        receita. É essa lógica que diferencia empresas que crescem com marketing digital das que
        apenas impulsionam publicações sem estratégia.
      </P>

      <div className="mt-20 mb-8 clear-both">
        <span className="t-caption uppercase tracking-[0.2em] text-primary text-[11px] font-semibold">
          Conclusão
        </span>
        <h2 className="mt-3 font-display text-[28px] sm:text-[36px] leading-[1.15] tracking-[-0.01em] text-ink font-semibold border-b border-border pb-5">
          Google encontra. Instagram convence.
        </h2>
      </div>

      <P>
        Se o objetivo é captar mais projetos, obras e clientes de forma previsível, o Google Ads
        geralmente deve ser o primeiro canal de investimento para escritórios de arquitetura,
        engenharia e construção.
      </P>
      <P>
        O Instagram continua sendo extremamente importante, mas seu papel principal é fortalecer
        a marca, gerar confiança e manter relacionamento com o público.
      </P>
      <Quote>
        O Google encontra clientes prontos para contratar. O Instagram ajuda esses clientes a
        terem confiança para escolher você.
      </Quote>
      <P>
        Quando essas duas estratégias trabalham juntas, o resultado é um fluxo constante de
        oportunidades, mais previsibilidade comercial e uma base sólida para o crescimento do
        negócio.
      </P>
    </ArticleShell>
  );
}
