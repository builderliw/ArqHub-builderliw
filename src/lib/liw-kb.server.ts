/**
 * Liw offline — responde com base de conhecimento embutida + busca textual
 * no Supabase (kb_chunks), sem depender de AI_API_KEY / embeddings.
 */

type KbEntry = {
  id: string;
  keywords: string[];
  /** Peso extra para matching (1 = normal) */
  weight?: number;
  answer: string;
};

const GREETINGS = /^(oi|ol[aá]|olaa+|hey|e a[ií]|bom dia|boa tarde|boa noite|hello|hi)\b/i;

const BUILTIN: KbEntry[] = [
  {
    id: "saudacao",
    keywords: ["oi", "olá", "ola", "hey", "bom dia", "boa tarde", "boa noite"],
    weight: 0.5,
    answer:
      "Olá! Eu sou a **Liw**, assistente do ArqHub. Posso falar sobre planos, portal do cliente, app, ferramentas e como a plataforma funciona. O que você precisa?",
  },
  {
    id: "o-que-e",
    keywords: [
      "o que é",
      "o que e",
      "oque é",
      "oque e",
      "arqhub",
      "plataforma",
      "para que serve",
      "sobre o arqhub",
    ],
    answer:
      "O **ArqHub** é uma plataforma brasileira de gestão para escritórios de arquitetura, engenharia e design. Reúne clientes, projetos, agenda, financeiro, equipe, mensagens e o **portal do cliente** em um só lugar.\n\nVeja os [planos](/planos) ou faça o [teste grátis de 14 dias](/cadastro).",
  },
  {
    id: "planos",
    keywords: [
      "plano",
      "planos",
      "preço",
      "preco",
      "valor",
      "mensalidade",
      "assinatura",
      "básico",
      "basico",
      "premium",
      "enterprise",
      "quanto custa",
    ],
    answer:
      "Temos três planos: **Básico**, **Premium** e **Enterprise**, com **14 dias de teste grátis** para novos escritórios.\n\n- **Básico** — gestão essencial do escritório\n- **Premium** — inclui ferramentas avançadas (orçamentos, levantamento, compras, planejamento)\n- **Enterprise** — para times maiores e necessidades sob medida\n\nValores e detalhes atualizados estão em [planos](/planos). Pagamento via **Pix** e **Mercado Pago**.",
  },
  {
    id: "trial",
    keywords: ["teste grátis", "teste gratis", "trial", "14 dias", "gratuito", "free", "experimentar"],
    answer:
      "Sim — novos escritórios têm **14 dias de teste grátis**, sem cartão no início do fluxo. Crie sua conta em [cadastro](/cadastro) e explore a plataforma.",
  },
  {
    id: "portal-cliente",
    keywords: [
      "portal",
      "cliente",
      "portal do cliente",
      "acompanhar projeto",
      "login cliente",
      "acesso do cliente",
    ],
    answer:
      "O **portal do cliente** dá a cada cliente do escritório um login próprio para acompanhar o projeto, etapas, documentos, galeria e trocar mensagens com o time.\n\nIdeal para reduzir WhatsApp solto e manter tudo organizado no ArqHub.",
  },
  {
    id: "app-pwa",
    keywords: ["app", "aplicativo", "instalar", "pwa", "celular", "mobile", "baixar app", "tela inicial"],
    answer:
      "O ArqHub funciona como **app (PWA)**: você instala no celular (Android/iOS) e abre com um toque.\n\nNo site, use [instalar](/instalar) ou o botão de instalar do navegador. No desktop aparece um QR code para abrir no celular.",
  },
  {
    id: "ferramentas-premium",
    keywords: [
      "ferramenta",
      "ferramentas",
      "orçamento",
      "orcamento",
      "levantamento",
      "quantitativo",
      "compras",
      "planejamento de obra",
      "premium",
    ],
    answer:
      "No **Premium/Enterprise** há ferramentas avançadas:\n\n- **Orçamentos Inteligentes**\n- **Levantamento Quantitativo**\n- **Sugestão de Compras**\n- **Planejamento de Obra**\n\nVeja a lista em [recursos](/recursos) e compare nos [planos](/planos).",
  },
  {
    id: "pagamento",
    keywords: ["pagamento", "pagar", "pix", "mercado pago", "cartão", "cartao", "cobrança", "cobranca"],
    answer:
      "A assinatura é paga via **Pix** e **Mercado Pago**. Depois da confirmação, o acesso ao painel é liberado e você recebe e-mail de confirmação.\n\nDúvidas de cobrança: [contato](/contato).",
  },
  {
    id: "cadastro-login",
    keywords: ["cadastrar", "cadastro", "criar conta", "entrar", "login", "senha", "acesso"],
    answer:
      "Para criar conta de escritório: [cadastro](/cadastro).\n\nJá tem conta? [Entrar](/entrar).\n\nClientes do escritório entram com o login que o profissional enviou (portal do cliente).",
  },
  {
    id: "conteudos",
    keywords: ["baixar", "conteúdo", "conteudo", "material", "gratuito", "ebook", "seu negócio", "seu negocio"],
    answer:
      "Materiais em [conteúdos / seu negócio](/conteudos/seu-negocio):\n\n- Itens **Gratuitos** baixam direto (sem cadastro)\n- Itens **Premium** só com plano Premium/Enterprise ativo\n\nNão há newsletter nem formulário de captura para esses downloads.",
  },
  {
    id: "equipe",
    keywords: ["equipe", "time", "colaborador", "funcionário", "funcionario", "convidar", "permissão", "permissao"],
    answer:
      "No painel do profissional você gerencia a **equipe** do escritório: convites, papéis e acesso aos projetos. A quantidade de acessos depende do [plano](/planos).",
  },
  {
    id: "projetos",
    keywords: ["projeto", "projetos", "obra", "etapas", "cronograma", "diário", "diario de obra"],
    answer:
      "No ArqHub cada **projeto** concentra etapas, cronograma, diário de obra, documentos, fotos, produtos, reuniões e chat com o cliente.\n\nO cliente vê a versão dele pelo **portal** — sem precisar de planilha paralela.",
  },
  {
    id: "financeiro",
    keywords: ["financeiro", "receita", "despesa", "fluxo de caixa", "faturamento"],
    answer:
      "O módulo **financeiro** ajuda o escritório a acompanhar receitas, despesas e visão por projeto. Detalhes e limites variam conforme o [plano](/planos).",
  },
  {
    id: "suporte",
    keywords: ["suporte", "ajuda", "humano", "atendimento", "falar com", "contato", "reclamação", "reclamacao"],
    answer:
      "Para suporte humano, use a página de [contato](/contato). Eu (Liw) ajudo com dúvidas sobre a plataforma e o funcionamento do ArqHub por aqui.",
  },
  {
    id: "academy",
    keywords: ["academy", "academia", "curso", "cursos", "aula", "treinamento"],
    answer:
      "A **ArqHub Academy** reúne conteúdos de capacitação ligados à gestão do escritório e ao uso da plataforma. Acesse pelo menu do site quando estiver disponível na sua conta.",
  },
];

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreEntry(queryNorm: string, entry: KbEntry): number {
  let score = 0;
  const weight = entry.weight ?? 1;
  for (const kw of entry.keywords) {
    const k = normalize(kw);
    if (!k) continue;
    if (queryNorm === k) score += 8 * weight;
    else if (queryNorm.includes(k)) score += 4 * weight;
    else {
      // tokens em comum
      const qTokens = new Set(queryNorm.split(" ").filter((t) => t.length > 2));
      const kTokens = k.split(" ").filter((t) => t.length > 2);
      for (const t of kTokens) if (qTokens.has(t)) score += 1.5 * weight;
    }
  }
  return score;
}

async function searchKbChunks(query: string): Promise<string | null> {
  try {
    const { supabaseAdmin } = await import("@/integrations/external-supabase/admin.server");
    const tokens = normalize(query)
      .split(" ")
      .filter((t) => t.length > 3)
      .slice(0, 5);
    if (tokens.length === 0) return null;

    // Busca textual simples nos trechos indexados (sem embedding)
    let q = supabaseAdmin
      .from("kb_chunks" as never)
      .select("content, source_id")
      .limit(6);

    // PostgREST: or(ilike) por token
    const orFilter = tokens.map((t) => `content.ilike.%${t}%`).join(",");
    const { data, error } = await (q as unknown as {
      or: (f: string) => Promise<{ data: Array<{ content: string }> | null; error: { message: string } | null }>;
    }).or(orFilter);

    if (error || !data?.length) return null;

    const snippets = data
      .map((r) => r.content?.trim())
      .filter(Boolean)
      .slice(0, 3);
    if (!snippets.length) return null;

    return snippets.map((s, i) => `(${i + 1}) ${s}`).join("\n\n");
  } catch {
    return null;
  }
}

function pickBuiltin(query: string): { entry: KbEntry; score: number } | null {
  const q = normalize(query);
  if (!q) return null;

  if (GREETINGS.test(query.trim())) {
    const g = BUILTIN.find((e) => e.id === "saudacao")!;
    return { entry: g, score: 100 };
  }

  let best: { entry: KbEntry; score: number } | null = null;
  for (const entry of BUILTIN) {
    const s = scoreEntry(q, entry);
    if (!best || s > best.score) best = { entry, score: s };
  }
  if (!best || best.score < 2.5) return null;
  return best;
}

const FALLBACK =
  "Não tenho essa informação confirmada na minha base agora. Posso ajudar com **planos**, **portal do cliente**, **app**, **cadastro** ou **ferramentas Premium**.\n\nPara suporte humano: [contato](/contato). Para contratar: [planos](/planos).";

/**
 * Gera resposta da Liw só com base de conhecimento (sem LLM).
 */
export async function answerFromKnowledge(userText: string): Promise<string> {
  const text = (userText || "").trim();
  if (!text) {
    return BUILTIN.find((e) => e.id === "saudacao")!.answer;
  }

  const hit = pickBuiltin(text);
  if (hit && hit.score >= 4) {
    return hit.entry.answer;
  }

  const fromDb = await searchKbChunks(text);
  if (fromDb) {
    const intro = hit
      ? `${hit.entry.answer}\n\n---\nTambém encontrei isto na base:\n\n`
      : "Encontrei isto na base de conhecimento do ArqHub:\n\n";
    return `${intro}${fromDb}`;
  }

  if (hit) return hit.entry.answer;
  return FALLBACK;
}

/**
 * Resposta no formato de stream compatível com o AI SDK (UI Message Stream),
 * para o useChat do front continuar funcionando sem mudança.
 */
export function toLocalUiMessageStream(answer: string, originalMessages: unknown[]): Response {
  const assistantId = `liw-local-${Date.now()}`;
  const textId = `txt-${Date.now()}`;

  // Protocolo mínimo do UI Message Stream (AI SDK v5+)
  const lines = [
    `data: ${JSON.stringify({ type: "start", messageId: assistantId })}\n\n`,
    `data: ${JSON.stringify({ type: "text-start", id: textId })}\n\n`,
    `data: ${JSON.stringify({ type: "text-delta", id: textId, delta: answer })}\n\n`,
    `data: ${JSON.stringify({ type: "text-end", id: textId })}\n\n`,
    `data: ${JSON.stringify({ type: "finish" })}\n\n`,
    `data: [DONE]\n\n`,
  ];

  const body = lines.join("");
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "x-vercel-ai-ui-message-stream": "v1",
      "x-arqhub-liw-mode": "knowledge",
    },
  });
}
