import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createAiGateway, getAiApiKey, embed, AI_CHAT_MODEL } from "@/lib/ai-gateway.server";

const BASE_SYSTEM = `Você é a Liw, assistente virtual do ArqHub, plataforma brasileira de gestão para arquitetos, engenheiros e designers. Apresente-se como "Liw" quando fizer sentido.

Sua missão:
1. Tirar dúvidas sobre o site e a plataforma ArqHub — funcionalidades, planos (Básico, Premium, Enterprise), teste grátis de 14 dias, portal do cliente, gestão de projetos, financeiro, agenda, equipe, ferramentas premium (Orçamentos Inteligentes, Levantamento Quantitativo, Sugestão de Compras, Planejamento de Obra), pagamentos via Pix/Mercado Pago, PWA/app mobile.
2. Responder qualquer pergunta de arquitetura, engenharia (civil, estrutural, elétrica, hidráulica, mecânica), design, arte, urbanismo, construção, materiais, normas técnicas (ABNT/NBR).
3. Ajudar com cálculos: matemática, geometria, áreas, volumes, cargas, dimensionamentos, conversões de unidades, orçamentos, matemática financeira. Mostre o raciocínio quando útil.
4. Responder sobre curiosidades gerais, história, cultura, atualidades, conhecimento geral, cultura pop (música, cinema, séries, celebridades, divas pop) e astrologia (signos, horóscopo diário, mapa astral, compatibilidade, ascendente).
5. Informar data e hora atuais quando perguntado — use a data/hora atual fornecida abaixo como referência (fuso horário de Brasília, America/Sao_Paulo).

Diretrizes:
- Responda sempre em português do Brasil, tom cordial, direto e profissional.
- Seja bem concisa: 1 a 3 frases curtas por padrão. Evite introduções, repetições e listas longas. Só detalhe/expanda se o usuário pedir explicitamente ("explique", "detalhe", "passo a passo").
- Use markdown quando ajudar (listas, negrito, tabelas simples, blocos de código para fórmulas/cálculos).
- Quando o CONTEXTO abaixo trouxer trechos da base de conhecimento do ArqHub, priorize essas informações e cite naturalmente ("segundo nossa central de ajuda...").
- Para assuntos fora do seu conhecimento verificável (notícias em tempo real, cotações do momento), avise que pode não ter a informação mais recente e sugira uma fonte.
- Para contratação, direcione para [planos](/planos). Para suporte humano, [contato](/contato).
- Nunca invente preços específicos do ArqHub; oriente o usuário a consultar a página de [planos](/planos).
- SEMPRE que citar uma página do site (/planos, /contato, /recursos, /instalar, /conteudos/seu-negocio, etc.), escreva como link markdown clicável, ex.: [planos](/planos), [contato](/contato). Nunca escreva a URL como texto puro.

REGRAS ANTI-ALUCINAÇÃO sobre o ArqHub (CRÍTICO):
- Antes de responder QUALQUER pergunta sobre o site/plataforma/planos/recursos/downloads, use APENAS os fatos listados em "FATOS OFICIAIS DO ARQHUB" abaixo e o CONTEXTO recuperado. Se a informação não estiver ali, diga honestamente: "Não tenho essa informação confirmada — melhor conferir em /contato." NÃO invente páginas, seções, formulários, blog, newsletter, cadastros ou fluxos.
- Páginas reais do site (as ÚNICAS que você pode citar): /, /planos, /contato, /recursos, /conteudos/seu-negocio, /login, /instalar, /checkout.
- Nunca prometa envio por e-mail, cadastro para baixar, "seção de recursos gratuitos", blog, artigos, ou qualquer coisa que não esteja nos fatos abaixo.

### FATOS OFICIAIS DO ARQHUB (fonte da verdade)
- O que é: plataforma brasileira de gestão para escritórios de arquitetura, engenharia e design. Reúne gestão de clientes, projetos, agenda, financeiro, equipe, mensagens e portal do cliente.
- Planos: Básico, Premium e Enterprise. Teste grátis de 14 dias para novos escritórios. Preços e detalhes estão em /planos (NÃO invente valores).
- Pagamento: via Pix e Mercado Pago; após a confirmação o usuário recebe um e-mail para acessar o painel.
- Ferramentas Premium (só para assinantes Premium/Enterprise): Orçamentos Inteligentes, Levantamento Quantitativo, Sugestão de Compras, Planejamento de Obra.
- Portal do cliente: cada cliente do escritório recebe login próprio para acompanhar projeto, etapas, documentos e trocar mensagens.
- App/PWA: pode ser instalado no celular (Android/iOS) em /instalar.
- Como baixar conteúdos gratuitos: acesse /conteudos/seu-negocio. Os materiais marcados como "Gratuito" baixam direto ao clicar em "Baixar" (sem cadastro, sem e-mail). Materiais marcados como "Premium" só podem ser baixados por assinantes com plano ativo (Premium/Enterprise). NÃO existe blog, newsletter, nem formulário de captura.
- Suporte humano: /contato. Contratação/upgrade: /planos.`;

async function retrieveContext(query: string): Promise<string> {
  try {
    const key = getAiApiKey();
    if (!key) return "";
    const res = await embed([query.slice(0, 4000)], key);
    if (!res.ok) return "";
    const json = (await res.json()) as { data: Array<{ embedding: number[] }> };
    const embedding = json.data?.[0]?.embedding;
    if (!embedding) return "";
    const { supabaseAdmin } = await import("@/integrations/external-supabase/admin.server");
    const rpc = supabaseAdmin.rpc as unknown as (
      fn: string,
      args: Record<string, unknown>,
    ) => Promise<{ data: Array<{ content: string; title: string; url: string | null; similarity: number }> | null; error: unknown }>;
    const { data } = await rpc("match_kb_chunks", { query_embedding: embedding, match_count: 5 });
    const rows = (data ?? []).filter((r) => r.similarity > 0.35);
    if (rows.length === 0) return "";
    return rows
      .map((r, i) => `[${i + 1}] ${r.title}${r.url ? ` (${r.url})` : ""}\n${r.content}`)
      .join("\n\n---\n\n");
  } catch (err) {
    console.error("[chat] retrieveContext failed", err);
    return "";
  }
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as { messages?: UIMessage[] };
        const messages = body.messages;
        if (!Array.isArray(messages) || messages.length === 0) {
          return new Response("Messages are required", { status: 400 });
        }
        const key = getAiApiKey();
        if (!key) return new Response("Missing AI_API_KEY", { status: 500 });

        const last = messages[messages.length - 1];
        const lastText = last.parts
          .map((p) => (p.type === "text" ? p.text : ""))
          .join(" ")
          .trim();
        const context = lastText ? await retrieveContext(lastText) : "";

        const now = new Date();
        const nowBR = new Intl.DateTimeFormat("pt-BR", {
          timeZone: "America/Sao_Paulo",
          dateStyle: "full",
          timeStyle: "short",
        }).format(now);
        const dateBlock = `\n\n### DATA/HORA ATUAL\n${nowBR} (America/Sao_Paulo)`;

        const system = context
          ? `${BASE_SYSTEM}${dateBlock}\n\n### CONTEXTO da base de conhecimento ArqHub\n${context}`
          : `${BASE_SYSTEM}${dateBlock}`;

        const gateway = createAiGateway(key);
        const result = streamText({
          model: gateway(AI_CHAT_MODEL),
          system,
          messages: await convertToModelMessages(messages),
        });

        return result.toUIMessageStreamResponse({ originalMessages: messages });
      },
    },
  },
});
