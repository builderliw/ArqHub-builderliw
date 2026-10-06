import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

// Gateway de IA genérico (qualquer API compatível com OpenAI).
// Antes: Lovable AI Gateway (LOVABLE_API_KEY). Agora configurável por env:
//   AI_API_KEY          -> chave do provedor (obrigatória)
//   AI_BASE_URL         -> padrão: API OpenAI-compatível do Google Gemini
//   AI_CHAT_MODEL       -> modelo do chat da Liw
//   AI_EMBEDDING_MODEL  -> modelo de embeddings da base de conhecimento
export const AI_BASE_URL = (
  process.env.AI_BASE_URL || "https://generativelanguage.googleapis.com/v1beta/openai"
).replace(/\/$/, "");
export const AI_CHAT_MODEL = process.env.AI_CHAT_MODEL || "gemini-2.5-flash";
export const AI_EMBEDDING_MODEL = process.env.AI_EMBEDDING_MODEL || "gemini-embedding-001";

export function getAiApiKey(): string | undefined {
  return process.env.AI_API_KEY;
}

export function createAiGateway(apiKey: string) {
  return createOpenAICompatible({
    name: "arqhub-ai",
    baseURL: AI_BASE_URL,
    apiKey,
  });
}

export async function embed(inputs: string[], apiKey: string) {
  return fetch(`${AI_BASE_URL}/embeddings`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: AI_EMBEDDING_MODEL, input: inputs }),
  });
}
