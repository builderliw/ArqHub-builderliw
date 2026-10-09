import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ArrowLeft, ArrowRight, Eye, Star } from "lucide-react";
import { useState } from "react";
import img1 from "@/assets/artigo-consultiva-1.jpg";
import img2 from "@/assets/artigo-consultiva-2.jpg";
import img3 from "@/assets/artigo-consultiva-3.jpg";

function StarRating() {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  return (
    <div className="flex items-center gap-2">
      <span className="t-caption uppercase tracking-wider text-muted-foreground text-[11px] mr-1">
        {submitted ? "Obrigado!" : "Avalie:"}
      </span>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button key={star} type="button" disabled={submitted}
            onClick={() => { setRating(star); setSubmitted(true); }}
            onMouseEnter={() => !submitted && setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="transition-transform hover:scale-110 focus:outline-none disabled:cursor-default"
            aria-label={`${star} estrela${star > 1 ? "s" : ""}`}>
            <Star className={`w-5 h-5 transition-colors ${star <= (hover || rating) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/50"}`} />
          </button>
        ))}
      </div>
    </div>
  );
}

export const Route = createFileRoute("/conteudos/empreenda_/vendas-consultivas")({
  head: () => ({
    meta: [
      { title: "Vendas consultivas: como cobrar mais e ainda assim ser escolhido | ArqHub" },
      { name: "description", content: "O posicionamento de especialista que transforma a conversa de preço em conversa de valor — sem brigar por desconto." },
      { property: "og:title", content: "Vendas consultivas: como cobrar mais e ainda assim ser escolhido" },
      { property: "og:description", content: "Como conduzir uma venda consultiva em arquitetura e construção e parar de competir por preço." },
      { property: "og:image", content: img1 },
      { property: "twitter:image", content: img1 },
    ],
  }),
  component: Artigo,
});

function P({ children }: { children: React.ReactNode }) { return <p className="t-body text-ink/85 leading-[1.85] mb-5">{children}</p>; }
function H2({ children }: { children: React.ReactNode }) { return <h2 className="t-h2 text-ink mt-14 mb-5 scroll-mt-24">{children}</h2>; }
function H3({ children }: { children: React.ReactNode }) { return <h3 className="t-h3 text-ink mt-10 mb-4">{children}</h3>; }
function Quote({ children }: { children: React.ReactNode }) {
  return <blockquote className="my-8 border-l-4 border-primary pl-6 py-1 text-ink/90 italic t-body-lg">{children}</blockquote>;
}
function Figure({ src, alt, caption }: { src: string; alt: string; caption: string }) {
  return (
    <figure className="my-12">
      <div className="overflow-hidden rounded-sm">
        <img src={src} alt={alt} loading="lazy" className="w-full h-auto object-cover aspect-[16/9]" />
      </div>
      <figcaption className="mt-3 text-[12.5px] text-muted-foreground leading-snug border-l-2 border-primary pl-3">{caption}</figcaption>
    </figure>
  );
}
function List({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 mb-6 ml-1">
      {items.map((i) => (
        <li key={i} className="flex gap-3 t-body text-ink/85">
          <span className="mt-2.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
          <span>{i}</span>
        </li>
      ))}
    </ul>
  );
}

function Artigo() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <article className="pt-10 lg:pt-14 pb-16">
          <div className="mx-auto max-w-7xl px-6">
            <div className="flex items-center gap-3 t-caption text-muted-foreground mb-6">
              <Link to="/conteudos/empreenda" className="inline-flex items-center gap-1.5 hover:text-ink transition-colors">
                <ArrowLeft className="h-3 w-3" /> Empreenda
              </Link>
              <span className="text-border">·</span>
              <span className="uppercase tracking-[0.14em] text-primary font-semibold text-[11px]">Vendas</span>
              <span className="text-border">·</span>
              <span>10 min de leitura</span>
            </div>

            <h1 className="font-display text-[34px] sm:text-[44px] lg:text-[52px] leading-[1.08] tracking-[-0.02em] text-ink font-semibold">
              Vendas consultivas: como cobrar mais e ainda assim ser escolhido
            </h1>

            <p className="mt-6 text-[19px] sm:text-[21px] leading-[1.55] text-muted-foreground font-light">
              O posicionamento de especialista que transforma a conversa de preço em conversa de
              valor.
            </p>

            <div className="mt-8 pb-8 mb-2 border-b border-border flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white font-semibold text-[13px]">A</span>
                <div>
                  <div className="text-[13px] font-semibold text-ink">Equipe ArqHub</div>
                  <div className="text-[12px] text-muted-foreground">Publicado em junho de 2026</div>
                </div>
              </div>
              <div className="flex items-center gap-5">
                <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                  <Eye className="w-3.5 h-3.5" />
                  <span><span className="font-semibold text-ink">2.689</span> leituras</span>
                </div>
                <StarRating />
              </div>
            </div>

            <Figure
              src={img1}
              alt="Arquiteta em reunião consultiva ouvindo o cliente atentamente"
              caption="Vender mais começa por ouvir melhor. Quem pergunta conduz, quem só apresenta concorre por preço."
            />

            <P>
              Existe uma diferença gritante entre um arquiteto que apresenta orçamento e um
              arquiteto que conduz uma venda consultiva. O primeiro entrega um número. O segundo
              entrega contexto, segurança e um caminho. Os dois podem cobrar valores parecidos. Mas
              só um costuma fechar.
            </P>
            <P>
              No mercado atual, talento técnico não basta para vender. Especialistas como o
              episódio "Como Vender Arquitetura" do podcast Papo de Vendedor e materiais do
              Arquiteto Expert vêm batendo na mesma tecla: arquitetura se vende por <strong>
              processo consultivo</strong>, não por catálogo.
            </P>
            <Quote>
              Quando o cliente entende valor, o preço deixa de ser o critério principal.
            </Quote>

            <H2>Por que o cliente acha "caro"</H2>
            <P>
              Quase nunca é o preço em si. É a falta de referência para comparar. Quando o cliente
              não enxerga o que está sendo entregue, o único parâmetro que sobra é o número.
            </P>
            <P>O cliente que diz "está caro" geralmente está dizendo uma destas três coisas:</P>
            <List items={[
              "Não entendi o que está incluso",
              "Não entendi o que eu evito ao contratar você",
              "Não confio o suficiente para investir esse valor agora",
            ]} />
            <P>
              Nenhuma dessas objeções se resolve com desconto. Todas se resolvem com método
              comercial.
            </P>

            <H2>Os 5 passos da venda consultiva em arquitetura</H2>

            <H3>1. Diagnóstico antes de proposta</H3>
            <P>
              A primeira reunião não é para falar de você. É para entender o cliente. Estilo de
              vida, rotina, frustrações com a casa atual, expectativa de prazo, referências
              visuais, faixa de investimento. Quem pergunta bem, vende bem.
            </P>
            <P>Perguntas que mudam a conversa:</P>
            <List items={[
              "O que precisa estar resolvido para esse projeto ser um sucesso para você?",
              "O que te incomoda hoje no espaço que você tem?",
              "Já viveu uma experiência ruim com algum profissional de arquitetura? O que foi?",
              "Como você pretende usar esse espaço daqui a 5 anos?",
              "Qual é a sua faixa de investimento, considerando projeto e obra?",
            ]} />

            <H3>2. Apresentar o método, não o portfólio</H3>
            <P>
              Portfólio é prova social. Importante, mas insuficiente. O que diferencia é o
              <strong> processo</strong>: como você conduz do briefing até a entrega, quantas
              reuniões, quais etapas, o que o cliente recebe em cada uma.
            </P>
            <P>
              Cliente compra previsibilidade. Mostrar o seu método em uma página é mais poderoso
              que mostrar dez projetos lindos sem contexto.
            </P>

            <H3>3. Posicionar pela transformação, não pelo entregável</H3>

            <Figure
              src={img2}
              alt="Arquiteto e cliente apertando as mãos fechando um negócio"
              caption="Cliente que entendeu o valor não pede desconto. Pede a próxima etapa."
            />

            <P>
              Ninguém compra "projeto executivo". As pessoas compram:
            </P>
            <List items={[
              "Uma casa que faz sentido para a vida que eu quero ter",
              "Uma obra sem surpresas no orçamento",
              "Confiança para tomar decisões caras sem se arrepender",
              "Um espaço comercial que ajuda meu negócio a vender mais",
              "Tempo — não ter que aprender sobre obra no caminho",
            ]} />
            <P>
              Reescreva a sua proposta inteira nessa chave. O que muda na vida do cliente é o que
              ele está pagando.
            </P>

            <H3>4. Antecipar objeções, não esperar por elas</H3>
            <P>
              Toda venda em arquitetura passa pelas mesmas três objeções: preço, prazo e confiança.
              Em vez de fugir delas, traga para a mesa.
            </P>
            <Quote>
              "Esse valor pode parecer alto comparado a outros orçamentos que você está vendo. Quero
              te mostrar exatamente o que está incluso e o que costuma ficar de fora em propostas
              mais baratas."
            </Quote>
            <P>
              Isso é maturidade comercial. E desarma o cliente, que esperava ter que brigar.
            </P>

            <H3>5. Fechar com próximo passo concreto</H3>
            <P>
              Vendas em arquitetura morrem por falta de próximo passo. Toda reunião comercial
              precisa terminar com algo agendado: nova reunião, envio da proposta com data,
              assinatura, visita ao terreno.
            </P>

            <H2>Como apresentar a proposta</H2>
            <P>
              Materiais do Arquiteto Expert sobre orçamentos comerciais sugerem uma estrutura que
              funciona bem na prática:
            </P>
            <List items={[
              "Contexto do cliente — mostra que você escutou",
              "Escopo detalhado por etapa — o que está incluso e o que não está",
              "Método e cronograma — como acontece, com prazos",
              "Investimento — valor total, condições, validade",
              "Próximos passos — o que acontece se ele aceitar hoje",
            ]} />
            <P>
              Evite PDF de uma página com preço no final. Apresente a proposta — de preferência
              presencialmente ou por vídeo — em vez de só enviar.
            </P>

            <H2>O preço entra por último</H2>

            <Figure
              src={img3}
              alt="Proposta de arquitetura premium sobre mesa com amostras de materiais"
              caption="Quando o valor está claro, o preço deixa de ser a primeira coisa que o cliente lê."
            />

            <P>
              Falar de preço cedo demais é o erro mais comum. Funciona assim: enquanto o valor não
              estiver construído, qualquer número parece alto. Depois que o cliente enxerga o que
              está comprando, o mesmo número parece justo.
            </P>
            <P>
              A regra prática: nunca mande preço por WhatsApp antes de uma conversa. Nunca envie
              proposta sem antes ter ouvido o cliente. Nunca aceite "manda um valor base que depois
              a gente conversa" — esse caminho leva ao descontão.
            </P>

            <H2>Quando vale dar desconto</H2>
            <P>
              Quase nunca. Desconto destrói posicionamento e ensina o cliente a negociar. Se
              precisar ceder, ceda em <strong>escopo</strong>, não em preço. Tire alguma coisa.
              Mude a condição de pagamento. Ofereça uma etapa extra. Mas mantenha o valor por hora
              ou o valor por projeto.
            </P>
            <P>
              Cliente que só fecha com desconto é o cliente que vai pedir desconto a obra inteira.
            </P>

            <H2>Conclusão</H2>
            <P>
              Vender mais e melhor não exige ser mais agressivo. Exige ser mais consultivo. Ouvir
              antes de falar. Diagnosticar antes de propor. Apresentar método antes de portfólio.
              Conduzir o cliente pela jornada de decisão em vez de empurrar uma proposta.
            </P>
            <P>
              Quem faz isso para de competir por preço e começa a ser escolhido pelo valor. E é só
              dessa posição que dá para construir um escritório lucrativo, sustentável e que não
              dependa de heroísmo do dono para fechar contratos.
            </P>

            <div className="mt-16 pt-8 border-t border-border">
              <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-3">Referências</div>
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                Super Vendedores · Arquiteto Expert · Arquiteto Curitiba · Harvard Business
                Review · SPIN Selling · Consultative Selling
              </p>
            </div>

            <div className="mt-12 p-8 bg-surface border border-border rounded-2xl text-center">
              <h3 className="t-h3 text-ink">Quer um processo comercial que fecha mais?</h3>
              <p className="mt-2 t-body text-muted-foreground">Teste o ArqHub grátis por 14 dias e organize leads, propostas e follow-ups em um só lugar.</p>
              <Link to="/cadastro" className="mt-5 inline-flex items-center gap-1.5 px-5 h-11 bg-primary text-white rounded-lg t-label hover:bg-primary-dark transition-colors">
                Começar grátis <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
