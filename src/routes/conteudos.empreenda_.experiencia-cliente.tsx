import { createFileRoute } from "@tanstack/react-router";
import img1 from "@/assets/artigo-experiencia-1.jpg";
import img2 from "@/assets/artigo-experiencia-2.jpg";
import img3 from "@/assets/artigo-experiencia-3.jpg";
import {
  ArticleShell,
  Chapter,
  FloatFigure,
  Lead,
  List,
  P,
  Quote,
  WideFigure,
} from "@/components/manual-article";

export const Route = createFileRoute("/conteudos/empreenda_/experiencia-cliente")({
  head: () => ({
    meta: [
      { title: "Portal do cliente: por que escritórios que adotam ganham mais indicações | ArqHub" },
      {
        name: "description",
        content:
          "Transparência no acompanhamento da obra reduz ansiedade, evita ruído de WhatsApp e transforma cliente satisfeito em canal de vendas.",
      },
      { property: "og:title", content: "Portal do cliente: mais transparência, mais indicações" },
      {
        property: "og:description",
        content: "Como estruturar um portal do cliente que profissionaliza a entrega e gera indicação.",
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
      category="Experiência do cliente"
      readTime="8 min de leitura"
      reads="1.847"
      title="Portal do cliente: por que escritórios que adotam ganham mais indicações"
      subtitle="Transparência no acompanhamento da obra vira o seu maior canal de vendas. Veja como estruturar."
    >
      <WideFigure
        src={img1}
        alt="Arquiteto mostrando andamento da obra em um tablet para o cliente"
        caption="Acompanhar a obra deixou de ser um luxo. Hoje é parte do que o cliente espera ao contratar."
      />

      <Lead>
        Pergunte a qualquer arquiteto ou construtor qual é a mensagem mais comum no WhatsApp
        durante uma obra. A resposta vai ser quase sempre a mesma: <em>"e aí, como está
        andando?"</em>
      </Lead>

      <P>
        O cliente investiu uma quantia significativa de dinheiro, muitas vezes a poupança de uma
        vida inteira, e está ansioso. É natural. O problema não é a pergunta — é o que acontece
        quando ela não tem resposta organizada.
      </P>
      <Quote>
        A maior parte da insatisfação em obras não vem do prazo ou do orçamento. Vem da sensação
        de não saber o que está acontecendo.
      </Quote>

      <Chapter num="1" title="WhatsApp não é portal do cliente" />

      <FloatFigure
        src={img2}
        alt="Painel digital com timeline de obra, fotos e aprovações"
        caption="Um espaço único, com a sua marca, onde o cliente vê o que importa — sem precisar perguntar."
        side="right"
      />

      <P>
        Conversas se misturam. Versões de projeto se perdem. O cliente responde a um áudio de
        três semanas atrás como se fosse a versão atual. Um membro da equipe fala uma coisa,
        outro fala outra. Quando você percebe, virou um ruído difícil de desfazer.
      </P>
      <P>
        Esse cenário é tão comum que algumas empresas brasileiras de gestão para arquitetura,
        como Braxio e DOit, construíram produtos inteiros em torno dele. A constatação é a mesma:
        comunicação informal com cliente é um dos maiores geradores de retrabalho e insatisfação
        no setor.
      </P>

      <Chapter num="2" title="O que é, de fato, um portal do cliente" />
      <P>
        Portal do cliente é um ambiente digital onde o cliente acompanha tudo o que diz respeito
        ao projeto e à obra dele. Não é um app genérico. É um espaço com a sua identidade,
        organizado por etapas, com histórico preservado.
      </P>
      <P>O que costuma estar lá:</P>
      <List
        items={[
          "Status atual da obra ou do projeto",
          "Cronograma com etapas e datas previstas",
          "Fotos e vídeos semanais do andamento",
          "Documentos: contrato, ART/RRT, projetos aprovados",
          "Orçamento e aditivos, com aprovações registradas",
          "Linha do tempo de decisões e mudanças",
        ]}
      />

      <Chapter num="3" title="Por que isso vira indicação" />
      <P>
        Cliente satisfeito indica. Isso todo mundo sabe. O ponto menos óbvio é o que gera
        satisfação real. Em obras, a percepção de qualidade é construída muito mais pela{" "}
        <strong>jornada</strong> do que pelo produto final.
      </P>
      <P>
        Uma obra entregue no prazo, mas sem comunicação, deixa o cliente exausto. Uma obra com
        pequenos atrasos, mas com transparência, deixa o cliente confiante — e é dele que vem a
        próxima indicação.
      </P>
      <Quote>
        O portal não é só uma ferramenta de produtividade. É um instrumento de marketing boca a
        boca.
      </Quote>

      <Chapter num="4" title="Como começar sem reinventar a operação" />
      <P>
        Não precisa de um sistema sofisticado no primeiro dia. Comece com o mínimo viável:
      </P>
      <List
        items={[
          "Defina um único canal oficial de acompanhamento (não o WhatsApp pessoal)",
          "Padronize um relatório semanal com 3 a 5 fotos e um parágrafo de status",
          "Crie um cronograma visual simples, mesmo que seja em planilha compartilhada",
          "Registre toda alteração de escopo por escrito, com aceite do cliente",
          "Tenha um repositório único de documentos, organizado por pasta",
        ]}
      />
      <P>
        À medida que o volume cresce, vale migrar para uma ferramenta dedicada. O essencial é ter
        o processo antes da tecnologia.
      </P>

      <Chapter num="5" title="O efeito colateral: menos conflito jurídico" />
      <P>
        Quando tudo é registrado, escopo, prazo e mudanças param de virar discussão. A maior
        parte das brigas entre cliente e escritório em arquitetura e construção começa com a
        frase <em>"mas eu nunca concordei com isso"</em>. Um portal com histórico resolve isso
        silenciosamente, antes do problema acontecer.
      </P>

      <WideFigure
        src={img3}
        alt="Casal feliz recebendo as chaves da nova casa do arquiteto"
        caption="Cliente que confia no processo entrega a chave do próximo cliente."
      />

      <div className="mt-20 mb-8 clear-both">
        <span className="t-caption uppercase tracking-[0.2em] text-primary text-[11px] font-semibold">
          Conclusão
        </span>
        <h2 className="mt-3 font-display text-[28px] sm:text-[36px] leading-[1.15] tracking-[-0.01em] text-ink font-semibold border-b border-border pb-5">
          Cuidado registrado é confiança gerada
        </h2>
      </div>

      <P>
        Profissionalizar a entrega não é sobre adicionar complexidade. É sobre tirar a
        comunicação importante do lugar errado — o WhatsApp pessoal, o e-mail solto, a conversa
        de corredor — e colocar em um lugar onde ela existe, é encontrável e transmite cuidado.
      </P>
      <P>
        Escritórios que adotam essa prática não só reduzem retrabalho e desgaste. Eles
        transformam cada cliente entregue em um vendedor silencioso, recomendando o trabalho para
        amigos, familiares e colegas. E indicação, todo mundo já sabe, é o lead mais barato e
        mais qualificado que existe.
      </P>
    </ArticleShell>
  );
}
