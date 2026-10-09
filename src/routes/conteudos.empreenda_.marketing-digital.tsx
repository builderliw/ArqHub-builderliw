import { createFileRoute } from "@tanstack/react-router";
import img1 from "@/assets/artigo-marketing-1.jpg";
import img2 from "@/assets/artigo-marketing-2.jpg";
import img3 from "@/assets/artigo-marketing-3.jpg";
import img4 from "@/assets/artigo-marketing-4.jpg";
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

export const Route = createFileRoute("/conteudos/empreenda_/marketing-digital")({
  head: () => ({
    meta: [
      { title: "Marketing digital para arquitetos: o que está em alta em 2026 | ArqHub" },
      {
        name: "description",
        content:
          "Estratégias práticas para gerar leads qualificados em arquitetura e construção sem depender apenas de indicação. Google Ads, Instagram, SEO e mais.",
      },
      { property: "og:title", content: "Marketing digital para arquitetos: o que está em alta em 2026" },
      {
        property: "og:description",
        content:
          "Como combinar Google Ads, Instagram, SEO e conteúdo para criar um fluxo previsível de clientes para o seu escritório.",
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
      readTime="10 min de leitura"
      reads="2.207"
      title="Marketing digital para arquitetos: o que está em alta em 2026"
      subtitle="Estratégias práticas para gerar leads qualificados sem depender apenas de indicação."
    >
      <WideFigure
        src={img1}
        alt="Smartphone com analytics de redes sociais e letras SOCIAL MEDIA"
        caption="Redes sociais são parte do marketing — não o marketing inteiro. A diferença muda tudo."
      />

      <Lead>
        Durante muitos anos, a principal fonte de clientes para arquitetos foi a indicação. Um
        cliente satisfeito indicava para um amigo, que indicava para um familiar, que indicava
        para um colega de trabalho. Esse modelo continua sendo extremamente valioso. Mas existe
        um problema: ele não é previsível.
      </Lead>

      <P>
        Você não controla quando a próxima indicação vai acontecer, quantas virão ou se elas
        serão suficientes para manter o fluxo de novos projetos. Por isso, cada vez mais
        escritórios estão investindo em marketing digital para criar uma geração constante de
        oportunidades comerciais.
      </P>
      <Quote>
        Em 2026, não basta publicar imagens bonitas de projetos e esperar que os clientes
        apareçam.
      </Quote>
      <P>
        O comportamento do consumidor mudou. Os algoritmos mudaram. A concorrência aumentou. E o
        marketing digital para arquitetos tornou-se muito mais estratégico. A pergunta é: o que
        realmente funciona?
      </P>

      <Chapter num="1" title="O primeiro erro: acreditar que marketing é apenas postar no Instagram" />

      <FloatFigure
        src={img3}
        alt="Arquiteto gravando conteúdo de bastidores em estúdio"
        caption="Curtidas não pagam boletos — contratos sim. O Instagram é canal, não estratégia."
        side="right"
      />

      <P>
        Muitos profissionais associam marketing digital exclusivamente às redes sociais. Mas
        marketing e redes sociais não são a mesma coisa. Marketing é o processo de atrair,
        relacionar e converter clientes. O Instagram é apenas um dos canais utilizados para isso.
      </P>
      <P>
        O problema é que inúmeros escritórios passam meses produzindo conteúdo sem possuir uma
        estratégia clara de geração de negócios. Publicam projetos. Mostram renderizações.
        Compartilham fotos de obras. Mas não criam um caminho para transformar visitantes em
        clientes.
      </P>
      <P>Resultado? Muitas curtidas. Poucos contratos.</P>

      <Chapter num="2" title="O cliente mudou a forma de contratar" />

      <P>
        Antes de contratar um arquiteto, a maioria das pessoas passa por uma jornada digital.
        Ela normalmente:
      </P>
      <List
        items={[
          "Pesquisa no Google",
          "Visita alguns sites",
          "Analisa redes sociais",
          "Compara portfólios",
          "Busca avaliações",
          "Entra em contato com alguns profissionais",
          "Agenda reuniões",
        ]}
      />
      <P>
        Ou seja, o cliente não escolhe apenas pelo projeto mais bonito. Ele escolhe pelo
        profissional que transmite mais confiança. Por isso, a presença digital precisa funcionar
        como um ecossistema completo.
      </P>

      <Chapter num="3" title="Google Ads continua sendo o canal mais eficiente" />

      <WideFigure
        src={img2}
        alt="Laptop mostrando resultados de busca no Google"
        caption="Enquanto redes sociais trabalham descoberta, o Google trabalha intenção. Essa é a diferença."
      />

      <P>Quando alguém pesquisa:</P>
      <List
        items={[
          "Arquiteto residencial em Brasília",
          "Projeto de casa moderna",
          "Arquiteto para reforma",
          "Projeto comercial para clínica",
          "Empresa de gerenciamento de obra",
        ]}
      />
      <P>
        essa pessoa já possui uma necessidade clara. Ela está procurando uma solução. Segundo a
        Google, bilhões de buscas são realizadas diariamente em sua plataforma, tornando os
        mecanismos de pesquisa um dos principais pontos de contato entre consumidores e empresas.
      </P>
      <P>
        Para escritórios de arquitetura, isso significa a possibilidade de aparecer exatamente
        quando o cliente está procurando contratar. Por esse motivo, o Google Ads continua sendo
        uma das estratégias mais eficientes para geração de leads qualificados.
      </P>

      <Chapter num="4" title="O Instagram deve gerar confiança, não apenas alcance" />

      <P>
        Muitos profissionais acreditam que precisam viralizar. Na prática, isso raramente gera
        clientes. Um vídeo com milhares de visualizações pode não gerar nenhum orçamento.
        Enquanto isso, uma publicação visualizada por poucas pessoas pode gerar um contrato de
        alto valor.
      </P>
      <P>
        O papel do Instagram em 2026 é muito mais relacionado à construção de autoridade. O
        cliente quer enxergar:
      </P>
      <List
        items={[
          "Quem está por trás do escritório",
          "Projetos executados",
          "Bastidores",
          "Processo de trabalho",
          "Diferenciais",
          "Depoimentos",
          "Resultados",
        ]}
      />
      <P>
        Quando alguém encontra seu escritório pelo Google, é muito comum visitar o Instagram
        antes de entrar em contato. Ele funciona como uma vitrine de credibilidade.
      </P>

      <Chapter num="5" title="Produza conteúdo que responda dúvidas reais" />

      <P>
        Um dos maiores erros dos arquitetos é criar conteúdo pensando apenas no que gostam de
        mostrar. O cliente, porém, está interessado em respostas. Ele pesquisa dúvidas como:
      </P>
      <List
        items={[
          "Quanto custa construir uma casa?",
          "Quanto custa um projeto arquitetônico?",
          "Vale a pena reformar ou construir?",
          "Como escolher um terreno?",
          "Quais são os erros mais comuns em uma obra?",
          "Quanto tempo leva para construir uma residência?",
        ]}
      />
      <P>
        Esse tipo de conteúdo costuma gerar muito mais interesse do que apenas publicar imagens
        de projetos. Porque ele resolve problemas. E quem resolve problemas gera confiança.
      </P>

      <Chapter num="6" title="Tenha um site profissional" />

      <FloatFigure
        src={img4}
        alt="Site profissional de escritório de arquitetura em um laptop"
        caption="Redes sociais você aluga. O seu site é o único canal que realmente pertence ao seu negócio."
        side="left"
      />

      <P>
        Muitos escritórios ainda dependem exclusivamente das redes sociais. Isso representa um
        risco. As plataformas mudam. Os algoritmos mudam. O alcance orgânico diminui.
      </P>
      <P>
        Seu site é o único canal que realmente pertence ao seu negócio. Além disso, ele transmite
        profissionalismo. Um bom site deve apresentar:
      </P>
      <List
        items={[
          "Portfólio",
          "Serviços",
          "Diferenciais",
          "Depoimentos",
          "Formulário de contato",
          "Informações sobre a empresa",
        ]}
      />
      <P>
        Mais importante ainda: ele deve facilitar a conversão. Ou seja, tornar simples o contato
        do cliente.
      </P>

      <Chapter num="7" title="Invista em SEO" />
      <P>
        SEO (<em>Search Engine Optimization</em>) é o conjunto de técnicas utilizadas para
        melhorar o posicionamento do site nos mecanismos de busca. Na prática, significa aparecer
        quando alguém procura seus serviços:
      </P>
      <List
        items={[
          "Arquiteto residencial",
          "Projeto comercial",
          "Reforma de apartamento",
          "Gerenciamento de obra",
        ]}
      />
      <P>
        Segundo estudos da HubSpot, empresas que investem em marketing de conteúdo e SEO
        conseguem gerar tráfego qualificado de forma contínua e sustentável. Embora os resultados
        não sejam imediatos como os anúncios pagos, o retorno costuma ser extremamente relevante
        no médio e longo prazo.
      </P>

      <Chapter num="8" title="Depoimentos e provas sociais" />
      <P>
        Arquitetura é uma compra baseada em confiança. O cliente está prestes a investir dezenas
        ou centenas de milhares de reais. Por isso, ele procura sinais que reduzam o risco da
        decisão.
      </P>
      <P>Depoimentos de clientes são uma das ferramentas mais poderosas para isso. Inclua:</P>
      <List items={["Avaliações", "Vídeos", "Relatos", "Antes e depois", "Estudos de caso"]} />
      <P>
        Quando potenciais clientes veem outras pessoas satisfeitas, a confiança aumenta — e a
        chance de conversão também.
      </P>

      <Chapter num="9" title="Construa uma base própria de contatos" />
      <P>
        Um dos maiores ativos de qualquer empresa é sua base de relacionamentos. Nem todo
        visitante está pronto para contratar hoje, mas muitos poderão contratar daqui a alguns
        meses. Por isso, vale a pena criar estratégias para captar contatos:
      </P>
      <List
        items={[
          "Newsletter",
          "Materiais educativos",
          "Guias para quem vai construir",
          "Checklist para reforma",
          "E-books",
        ]}
      />
      <P>Dessa forma, você mantém um relacionamento contínuo até o momento da decisão.</P>

      <Chapter num="10" title="O que não funciona mais em 2026" />
      <P>O mercado evoluiu. E algumas estratégias perderam eficiência.</P>

      <H3>Publicar apenas imagens bonitas</H3>
      <P>Projetos atraem atenção, mas raramente geram vendas sozinhos.</P>

      <H3>Comprar seguidores</H3>
      <P>Seguidores não significam clientes. Muitas vezes representam apenas métricas vazias.</P>

      <H3>Focar apenas em alcance</H3>
      <P>Visualizações não pagam boletos. Contratos sim.</P>

      <H3>Depender exclusivamente de indicação</H3>
      <P>Indicações são excelentes — mas não devem ser a única fonte de novos negócios.</P>

      <Chapter num="11" title="A fórmula que mais gera resultados hoje" />
      <P>Os escritórios que mais crescem costumam combinar quatro elementos:</P>
      <List
        items={[
          "Google Ads — para captar demanda existente",
          "Instagram — para gerar autoridade e confiança",
          "Site profissional — para converter visitantes em oportunidades",
          "Conteúdo estratégico — para educar o mercado e fortalecer a marca",
        ]}
      />
      <P>
        Quando esses pilares trabalham juntos, a geração de clientes deixa de ser um processo
        baseado na sorte e passa a ser um sistema previsível.
      </P>

      <div className="mt-20 mb-8 clear-both">
        <span className="t-caption uppercase tracking-[0.2em] text-primary text-[11px] font-semibold">
          Conclusão
        </span>
        <h2 className="mt-3 font-display text-[28px] sm:text-[36px] leading-[1.15] tracking-[-0.01em] text-ink font-semibold border-b border-border pb-5">
          Oportunidades reais, não seguidores
        </h2>
      </div>

      <P>
        O marketing digital para arquitetos em 2026 não se resume a postar fotos de projetos ou
        tentar viralizar nas redes sociais. Os profissionais que mais se destacam são aqueles que
        entendem a jornada completa do cliente e constroem uma presença digital capaz de atrair,
        educar, gerar confiança e converter oportunidades em contratos.
      </P>
      <P>
        Indicações continuarão sendo importantes — mas depender exclusivamente delas limita o
        crescimento do negócio. Ao investir em Google Ads, conteúdo educativo, SEO, site
        profissional e fortalecimento da autoridade digital, o escritório passa a gerar demanda
        de forma consistente e previsível.
      </P>
      <Quote>
        O verdadeiro objetivo do marketing não é ganhar seguidores. É criar oportunidades reais
        de negócio — e transformar essas oportunidades em projetos, obras e clientes satisfeitos.
      </Quote>
    </ArticleShell>
  );
}
