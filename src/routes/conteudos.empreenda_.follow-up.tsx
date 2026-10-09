import { createFileRoute } from "@tanstack/react-router";
import img1 from "@/assets/artigo-followup-1.jpg";
import img2 from "@/assets/artigo-followup-2.jpg";
import img3 from "@/assets/artigo-followup-3.jpg";
import img4 from "@/assets/artigo-followup-4.jpg";
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

export const Route = createFileRoute("/conteudos/empreenda_/follow-up")({
  head: () => ({
    meta: [
      { title: "Follow-up: a arte de transformar orçamento em contrato | ArqHub" },
      {
        name: "description",
        content:
          "Por que arquitetos perdem clientes depois de enviar a proposta — e como criar um processo de follow-up que fecha contratos.",
      },
      { property: "og:title", content: "Follow-up: a arte de transformar orçamento em contrato" },
      {
        property: "og:description",
        content: "Cadência, agregação de valor e CRM: como manter relacionamento sem virar inconveniente.",
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
      reads="2.512"
      title="Follow-up: a arte de transformar orçamento em contrato"
      subtitle="Por que a maioria dos arquitetos perde clientes depois de enviar a proposta — e como evitar isso."
    >
      <WideFigure
        src={img1}
        alt="Arquiteto enviando uma proposta por e-mail no escritório"
        caption="A proposta foi enviada. E agora? É exatamente nesse momento que a venda começa."
      />

      <Lead>
        Você faz uma reunião excelente. Entende as necessidades do cliente. Apresenta seu
        portfólio. Explica seu método de trabalho. Monta uma proposta completa. Envia o orçamento.
      </Lead>

      <P>E então... silêncio.</P>
      <P>
        Dias passam. Sem resposta. Você envia uma mensagem. Nada. Mais alguns dias. O cliente
        visualiza. Não responde. E, semanas depois, você descobre que ele contratou outro
        profissional.
      </P>
      <P>
        Se essa situação já aconteceu com você, saiba que não está sozinho. Esse é um dos maiores
        problemas comerciais enfrentados por escritórios de arquitetura, engenharia e empresas de
        construção.
      </P>
      <Quote>
        E quase sempre o motivo não é o preço. É a ausência de um processo de follow-up.
      </Quote>

      <Chapter num="1" title="O maior mito sobre vendas" />
      <P>
        Muitos profissionais acreditam que, depois de enviar um orçamento, a decisão está nas
        mãos do cliente. Por isso, assumem uma postura passiva. Pensam:{" "}
        <em>"agora é só esperar."</em>
      </P>
      <P>
        Mas o mercado funciona de forma diferente. Segundo pesquisas da Harvard Business Review,
        uma grande parte das vendas não acontece no primeiro contato comercial. Negócios
        complexos exigem múltiplas interações até que o cliente tome uma decisão.
      </P>
      <P>
        Isso é ainda mais verdadeiro em serviços de arquitetura e construção. Afinal, estamos
        falando de investimentos que envolvem dezenas ou centenas de milhares de reais. O cliente
        raramente decide imediatamente. Ele precisa de tempo — mas isso não significa que você
        deve desaparecer.
      </P>

      <Chapter num="2" title="O que é, de fato, follow-up" />
      <P>
        Follow-up é o acompanhamento realizado após uma reunião, apresentação ou envio de
        proposta. O objetivo não é pressionar o cliente. É ajudá-lo a tomar uma decisão.
      </P>
      <P>Na maioria das vezes, o cliente não responde por motivos simples:</P>
      <List
        items={[
          "Está ocupado",
          "Surgiram outras prioridades",
          "Precisa conversar com familiares",
          "Ainda está comparando propostas",
          "Possui dúvidas que não verbalizou",
          "Simplesmente esqueceu",
        ]}
      />
      <P>
        E quando você não faz acompanhamento, abre espaço para que outro profissional assuma a
        conversa.
      </P>

      <Chapter num="3" title="O erro mais comum dos arquitetos" />

      <FloatFigure
        src={img2}
        alt="Mensagens de follow-up em um celular"
        caption="Insistência diária parece desespero. Silêncio total parece descaso. O segredo está no equilíbrio."
        side="right"
      />

      <P>Imagine este cenário. Segunda-feira, você envia uma proposta.</P>
      <P>Na terça já manda: <em>"Conseguiu analisar?"</em></P>
      <P>Na quarta: <em>"Alguma novidade?"</em></P>
      <P>Na sexta: <em>"Conseguiu decidir?"</em></P>
      <P>
        Esse comportamento gera desconforto. Parece desespero. E reduz seu valor percebido. Por
        outro lado, existe o erro oposto: enviar a proposta e nunca mais entrar em contato.
        Nenhum dos extremos funciona.
      </P>

      <Chapter num="4" title="O cliente não compra quando recebe a proposta" />
      <P>
        Ele compra quando se sente seguro. Essa é uma diferença importante. Muitos profissionais
        acreditam que a proposta serve apenas para apresentar preço. Na realidade, ela serve para
        reduzir inseguranças.
      </P>
      <P>Antes de contratar, o cliente costuma pensar:</P>
      <List
        items={[
          "Será que escolhi o profissional certo?",
          "O investimento vale a pena?",
          "O prazo será cumprido?",
          "A obra ficará dentro do orçamento?",
          "Posso confiar nessa empresa?",
        ]}
      />
      <P>
        O follow-up é justamente o momento de responder essas dúvidas. Mesmo quando elas não são
        expressadas diretamente.
      </P>

      <Chapter num="5" title="O processo ideal de follow-up" />

      <H3>Primeiro contato: envio da proposta</H3>
      <P>
        Ao enviar o orçamento, evite mensagens genéricas. Em vez de apenas anexar o documento,
        contextualize.
      </P>
      <Quote>
        "Conforme nossa conversa, preparei uma proposta personalizada considerando suas
        necessidades e objetivos. Estou à disposição para esclarecer qualquer dúvida e ajudá-lo
        na melhor decisão para o projeto."
      </Quote>
      <P>Simples. Profissional. Sem pressão.</P>

      <H3>Segundo contato: 2 a 3 dias depois</H3>
      <P>Nesse momento, o objetivo não é cobrar resposta. É abrir diálogo.</P>
      <Quote>
        "Olá, tudo bem? Gostaria apenas de saber se conseguiu analisar a proposta e se existe
        algum ponto que eu possa esclarecer."
      </Quote>
      <P>Observe a diferença. Você não está pedindo uma decisão. Está oferecendo ajuda.</P>

      <H3>Terceiro contato: agregue valor</H3>
      <P>A maioria dos profissionais apenas pergunta: <em>"E aí, decidiu?"</em></P>
      <P>Você pode fazer muito melhor. Compartilhe conhecimento:</P>
      <List
        items={[
          "Um projeto semelhante",
          "Um estudo de caso",
          "Um artigo",
          "Um vídeo",
          "Um exemplo de resultado alcançado",
        ]}
      />
      <P>Isso reforça sua autoridade e mantém a conversa viva.</P>

      <Chapter num="6" title="O dinheiro está no acompanhamento" />
      <P>
        Diversos estudos de vendas mostram que grande parte dos contratos acontece após múltiplos
        contatos. Segundo dados frequentemente citados por organizações como Salesforce e
        consultorias especializadas em vendas B2B, muitos vendedores desistem antes que o cliente
        esteja pronto para decidir.
      </P>
      <P>
        Enquanto isso, profissionais consistentes continuam acompanhando de forma organizada. O
        resultado? Fecham mais contratos. Não porque possuem o menor preço, mas porque
        permanecem presentes durante a jornada de decisão.
      </P>

      <Chapter num="7" title="Como lidar com objeções" />
      <P>
        Uma objeção não significa rejeição. Na maioria dos casos, significa apenas que o cliente
        ainda não está convencido.
      </P>

      <H3>"Está caro"</H3>
      <P>
        O cliente nem sempre está falando de preço. Muitas vezes está falando de valor percebido.
        Explique:
      </P>
      <List
        items={[
          "O que está incluso",
          "Seu método de trabalho",
          "Os diferenciais",
          "Os riscos evitados",
          "Os benefícios gerados",
        ]}
      />

      <H3>"Vou pensar"</H3>
      <P>
        Normalmente significa: <em>"ainda não tenho informações suficientes para decidir."</em>{" "}
        Nesse caso, faça perguntas.
      </P>
      <Quote>"Existe algum ponto específico que esteja gerando dúvida?"</Quote>

      <H3>"Estou avaliando outras propostas"</H3>
      <P>
        É uma resposta totalmente natural. Evite tentar desqualificar concorrentes. Em vez disso,
        destaque seus diferenciais e mostre por que sua solução é adequada para aquele cliente.
      </P>

      <Chapter num="8" title="Utilize um CRM, mesmo que simples" />

      <FloatFigure
        src={img3}
        alt="Funil comercial e pipeline de vendas em um CRM"
        caption="Confiar na memória é o jeito mais rápido de perder negócios. Pipeline organizado vende mais."
        side="left"
      />

      <P>
        Um dos maiores erros é confiar na memória. Quando os contatos aumentam, fica impossível
        acompanhar tudo manualmente. Por isso, registre:
      </P>
      <List
        items={[
          "Data da reunião",
          "Data de envio da proposta",
          "Próximo contato",
          "Situação da negociação",
          "Principais dúvidas do cliente",
        ]}
      />
      <P>
        Pode ser uma planilha. Pode ser um sistema de CRM. O importante é ter organização.
        Empresas que acompanham seu funil comercial de forma estruturada tendem a apresentar
        taxas de conversão significativamente maiores.
      </P>

      <Chapter num="9" title="Quando desistir de um lead?" />
      <P>
        Nem todo cliente irá fechar contrato. E tudo bem. O objetivo do follow-up não é convencer
        qualquer pessoa — é identificar quem realmente possui potencial.
      </P>
      <P>
        Após algumas tentativas educadas de contato, você pode encerrar a negociação de forma
        profissional.
      </P>
      <Quote>
        "Entendo que este talvez não seja o momento ideal para avançarmos. Permanecemos à
        disposição caso o projeto seja retomado no futuro."
      </Quote>
      <P>Essa abordagem mantém a porta aberta para oportunidades futuras.</P>

      <Chapter num="10" title="O segredo não é insistir. É permanecer presente." />

      <WideFigure
        src={img4}
        alt="Aperto de mão fechando um contrato em frente a uma obra"
        caption="Quem fecha mais contratos não é quem faz a melhor apresentação — é quem mantém o relacionamento ao longo da decisão."
      />

      <P>
        Existe uma grande diferença entre insistência e acompanhamento. Insistência gera
        desconforto. Follow-up gera confiança.
      </P>
      <P>
        Os profissionais que mais fecham contratos não são necessariamente aqueles que fazem as
        melhores apresentações. São aqueles que mantêm relacionamento durante todo o processo de
        decisão. Porque o cliente raramente compra na primeira conversa — mas quase sempre compra
        de quem transmite segurança ao longo da jornada.
      </P>

      <div className="mt-20 mb-8 clear-both">
        <span className="t-caption uppercase tracking-[0.2em] text-primary text-[11px] font-semibold">
          Conclusão
        </span>
        <h2 className="mt-3 font-display text-[28px] sm:text-[36px] leading-[1.15] tracking-[-0.01em] text-ink font-semibold border-b border-border pb-5">
          A venda começa depois da proposta
        </h2>
      </div>

      <P>
        Enviar uma proposta não encerra uma venda. Na verdade, é nesse momento que a venda
        realmente começa. O follow-up é uma das ferramentas mais poderosas para aumentar a
        conversão de orçamentos em contratos, especialmente em mercados consultivos como
        arquitetura, engenharia e construção.
      </P>
      <P>
        Quando realizado de forma estratégica, ele ajuda o cliente a esclarecer dúvidas, reduz
        inseguranças, fortalece sua autoridade e mantém sua empresa presente durante a tomada de
        decisão.
      </P>
      <P>
        Se você sente que envia muitos orçamentos e fecha poucos contratos, talvez o problema não
        esteja na proposta. Talvez esteja na ausência de um processo consistente de acompanhamento.
      </P>
      <Quote>
        Porque, no final das contas, muitas vendas não são perdidas para o concorrente. Elas são
        perdidas para o silêncio.
      </Quote>
    </ArticleShell>
  );
}
