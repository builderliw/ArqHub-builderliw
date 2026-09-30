# ArqHub — Guia de migração (Lovable → GitHub + Vercel)

Stack: TanStack Start (React 19 + SSR) · Vite 7 · Tailwind 4 · Nitro · Supabase `yknwdpyaevodvonvhadt`.

## 0. ANTES de tudo (com o site ainda na Lovable)

As imagens abaixo hoje são servidas pelo CDN da Lovable (`/__l5e/...`) e somem quando o projeto sair de lá:

```sh
bash scripts/baixar-imagens-lovable.sh
```

Confira que `public/media/` ficou com 18 arquivos e `public/og-image.webp` existe. Faça o commit deles.

Anote também, nos **Secrets** da Lovable, os valores atuais de: `EXTERNAL_SUPABASE_SERVICE_ROLE_KEY`, `MERCADOPAGO_*`, `VAPID_PUBLIC_RAW`, `VAPID_PRIVATE_JWK`, `ADMIN_EMAILS`.

## 1. Rodar local

```sh
npm install        # o .npmrc já liga legacy-peer-deps
npm run dev
npm run build
```

Node 20+ (recomendado 22).

## 2. Variáveis de ambiente

Veja `.env.example`. Resumo:

| Variável | Para quê |
|---|---|
| `EXTERNAL_SUPABASE_SERVICE_ROLE_KEY` | Operações de servidor no Supabase (nunca no navegador) |
| `ADMIN_EMAILS` | E-mails com acesso ao painel admin |
| `MERCADOPAGO_ACCESS_TOKEN` / `MERCADOPAGO_PUBLIC_KEY` / `MERCADOPAGO_WEBHOOK_SECRET` | Pagamentos |
| `VAPID_PUBLIC_RAW` / `VAPID_PRIVATE_JWK` | Notificações push (copiar da Lovable, não gerar novas) |
| `RESEND_API_KEY` / `EMAIL_FROM` / `EMAIL_REPLY_TO` / `SITE_URL` | E-mails transacionais e e-mails do Admin → E-mails (substitui a fila da Lovable) |
| `AI_API_KEY` (+ `AI_BASE_URL`, `AI_CHAT_MODEL`, `AI_EMBEDDING_MODEL`) | Chat da Liw e base de conhecimento (substitui `LOVABLE_API_KEY`) |

## 3. Vercel

1. New Project → importar o repositório do GitHub.
2. Framework: *Other*. Build: `npm run build`. Install: `npm install`.
3. Cadastrar as variáveis do passo 2 (Production e Preview).
4. Adicionar também a env `NITRO_PRESET=vercel` (sem ela o build sai no formato Cloudflare, o padrão da Lovable).

## 4. Banco

Nada precisa ser recriado: o banco `yknwdpyaevodvonvhadt` já está em produção.
- `sql/arqhub-supabase-unico.sql` — referência / recriação das tabelas auxiliares (idempotente, sem Academy).
- `sql/opcional-remover-academy.sql` — apaga as tabelas da Academy. Rodar só depois do corte.

Supabase → Authentication → URL Configuration: Site URL `https://arqhub.world` e redirects `https://arqhub.world/**` e `https://*.vercel.app/**`.

## 5. Serviços externos

- **Resend**: criar conta, verificar o domínio (ex.: `arqhub.world`) no DNS, usar um remetente desse domínio em `EMAIL_FROM`.
- **IA**: criar chave (ex.: Google AI Studio). Depois, no admin → Base de conhecimento, **reindexar** as fontes (os vetores antigos foram gerados pelo gateway da Lovable).
- **Mercado Pago**: webhook em `https://arqhub.world/api/public/mp-webhook`.
- **Google OAuth** (no Supabase): confirmar domínio autorizado.

## 6. Corte (go-live)

1. Testar tudo na URL `*.vercel.app`: home, cadastro, login (escritório/cliente/admin), checkout, chat da Liw, upload de documento, push.
2. Vercel → Domains → adicionar `arqhub.world` e `www.arqhub.world`; ajustar DNS conforme indicado.
3. Aguardar propagação e testar de novo em produção.
4. Só então desligar/despublicar o projeto na Lovable.
