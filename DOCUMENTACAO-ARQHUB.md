# ArqHub — Documentação Técnica Completa

Documento de referência para manutenção, migração e hospedagem do site/plataforma ArqHub em qualquer infraestrutura.

- Domínios atuais: https://arqhub.world · https://www.arqhub.world
- Versão do documento: 20/08/2026

---

## 1. Visão geral do produto

ArqHub é uma plataforma SaaS para escritórios de arquitetura, engenharia, design de interiores e urbanismo. Componentes principais:

| Módulo | Descrição |
| --- | --- |
| Site institucional | Home, planos, recursos, funcionalidades, conteúdos, blog, FAQ, contato, páginas legais |
| Painel Profissional (escritório) | Dashboard, clientes, projetos, agenda da semana, financeiro, mensagens, relatórios, equipe, diário de obra, escritório/portfólio |
| Portal do Cliente | Meu projeto (apresentação), cronograma, aprovações, documentos, galeria, produtos, mensagens, diário, notificações |
| Painel Admin | Usuários, planos, pagamentos, materiais, downloads, logs/telemetria, alertas de trial, base de conhecimento, suporte, erros |
| Ferramentas Premium | Orçamentos (IA), Levantamento quantitativo, Sugestão de compras, Planejamento de obra |
| Liw (assistente IA) | Chat flutuante com RAG sobre base de conhecimento do site |
| Materiais / Conteúdos | Downloads gratuitos e exclusivos para assinantes + venda avulsa (R$ 29,90) |
| PWA | Instalação em iOS/Android, service worker, push notifications |

---

## 2. Stack técnica

- **Framework:** TanStack Start v1 (React 19 + SSR + server functions)
- **Build:** Vite 7
- **Roteamento:** TanStack Router (file-based em `src/routes`, árvore gerada em `src/routeTree.gen.ts`)
- **Dados/estado:** TanStack Query 5
- **Estilo:** Tailwind CSS v4 (via `src/styles.css`, tokens semânticos) + shadcn/ui + Radix + framer-motion
- **Backend:** Supabase (Postgres + Auth + Storage) — dois projetos, ver §5
- **IA:** AI Gateway (chat da Liw e base de conhecimento; provedor configurável por `AI_*`) via `src/lib/ai-gateway.server.ts`
- **Pagamentos:** Mercado Pago (Pix/cartão) — checkout + webhook
- **E-mails:** React Email + provedor transacional (`src/lib/email-templates/*`)
- **PDF/Docs:** jspdf, docx (relatórios, laudos, comprovantes)
- **Runtime de produção:** Edge/Worker (Cloudflare Workers compatível). Node APIs limitadas: sem `child_process`, `sharp`, `puppeteer`.

### Scripts

```bash
bun install
bun run dev          # desenvolvimento (porta 8080)
bun run build        # build de produção
bun run preview      # servir build
bun run lint         # eslint
bun run test         # vitest
```

---

## 3. Estrutura de pastas

```
src/
  routes/              # páginas (file-based routing) + api/
  components/          # UI: app-shell, dashboard/, marketing/, ui/ (shadcn)
  hooks/               # use-profissional-data, use-office-metrics, use-cliente-data, ...
  lib/                 # server functions (*.functions.ts), helpers, e-mails
  integrations/
    supabase/          # client, client.server, auth-middleware, auth-attacher, types (gerados)
    external-supabase/ # projeto Supabase legado de auth/clientes
  styles.css           # tokens de design e tema
  router.tsx  start.ts  server.ts   # bootstrap TanStack Start
supabase/manual-migrations/   # SQLs avulsos (schema, RLS, GRANTs)
public/                # manifest.webmanifest, sw.js
```

Regras importantes:
- Nunca editar `src/routeTree.gen.ts` nem os arquivos gerados em `src/integrations/supabase/` (`client.ts`, `client.server.ts`, `auth-middleware.ts`, `auth-attacher.ts`, `types.ts`).
- Lógica de servidor interna: `createServerFn` em arquivos `*.functions.ts`.
- Endpoints HTTP públicos: `src/routes/api/public/*` (bypass de auth; validar assinatura no handler).

---

## 4. Mapa de rotas

### Site público
`/` · `/planos` · `/recursos` · `/recursos/premium/$slug` · `/funcionalidades/$slug` · `/modulos` · `/portfolio` · `/portal-cliente` · `/blog` · `/sobre` · `/contato` · `/faq` · `/ajuda` (+ `primeiros-passos`, `configuracao`, `portal-cliente`, `suporte`) · `/videos` · `/instalar` · `/abrir-chrome` · `/termos` · `/privacidade` · `/lgpd` · `/escritorio/$slug` (página pública do escritório) · `/obra/$slug` (apresentação de projeto)

### Conteúdos / ferramentas gratuitas
`/conteudos/seu-negocio` · `/conteudos/empreenda` (+ 9 artigos) · `/conteudos/potencializador` (+ 9 artigos) · `/conteudos/laudo-tecnico` (gerador de laudo NBR 14653)

### Autenticação e cadastro
`/entrar` · `/entrar/$role` (`escritorio` | `cliente` | `admin`) · `/cadastro` · `/cadastro/enterprise` · `/esqueci-senha` · `/redefinir-senha` · `/auth/callback` · `/onboarding`

### Pagamentos
`/checkout/$plano` · `/pagamento/$paymentId` · `/comprovante/$paymentId` · `/comprar-material/$slug` · `/confirmacao-material/$paymentId` · `/app/meus-pagamentos`

### Painel Profissional (`/app/profissional`)
`index` (dashboard) · `clientes` · `projetos` · `cronograma` (agenda da semana) · `financeiro` · `mensagens` · `relatorios` · `equipe` · `escritorio` · `diario-obra` · `metricas` · `ia` · `bem-vindo` · `ferramentas/orcamentos` · `ferramentas/levantamento` · `ferramentas/compras` · `ferramentas/planejamento`

### Portal do Cliente (`/app/cliente`)
`meu-projeto` · `cronograma` · `agenda` · `aprovacoes` · `documentos` · `galeria` · `produtos` · `mensagens` · `diario` · `notificacoes`

### Admin (`/app/admin`)
`index` · `usuarios` · `planos` · `pagamentos` · `materiais` · `downloads` · `recursos-premium` · `empresas` · `enterprise` · `permissoes` · `logs` · `erros` · `alertas` · `trial-alertas` · `base-conhecimento` · `suporte` · `configuracoes`

### API HTTP
- `POST /api/chat` — streaming do assistente Liw
- `POST /api/public/mp-webhook` — webhook do Mercado Pago (valida assinatura HMAC)

---

## 5. Banco de dados

Há **um único projeto Supabase**: `https://yknwdpyaevodvonvhadt.supabase.co`
(`src/integrations/external-supabase/`). Auth, dados do app, materiais, pagamentos,
telemetria, base de conhecimento, push e e-mails ficam todos nele.

### Tabelas auxiliares (schema `public`, ver `sql/arqhub-supabase-unico.sql`)

```
article_reads             download_events          email_send_log
email_send_state          email_unsubscribe_tokens enterprise_requests
kb_chunks                 kb_sources               material_files
material_purchases        notification_preferences office_members
offices                   payment_events           plan_notification_settings
platform_settings         premium_recurso_files    projects
push_subscriptions        support_messages         suppressed_emails
```

Convenções obrigatórias em qualquer nova tabela:

```sql
CREATE TABLE public.<t> (...);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.<t> TO authenticated;
GRANT ALL ON public.<t> TO service_role;
-- GRANT SELECT ... TO anon;  apenas se houver policy para anon
ALTER TABLE public.<t> ENABLE ROW LEVEL SECURITY;
CREATE POLICY ... ;
```

- RLS habilitada em todas as tabelas; escopo por `office_id` (helper `has_office_access`) ou `auth.uid()`.
- Papéis nunca ficam na tabela de perfil — usar tabela dedicada + função `security definer` (`has_role`).
- SQL consolidado em `sql/arqhub-supabase-unico.sql` (idempotente); SQLs avulsos em `supabase/manual-migrations/`.

### Storage
Buckets para logos/capas de escritório, fotos de obra, documentos de projeto, apresentações, materiais e arquivos premium. Leitura pública **desativada** nos buckets sensíveis; downloads passam por server function que valida assinatura/permissão.

---

## 6. Autenticação e autorização

- Login unificado em `/entrar` com escolha de perfil (profissional / cliente / admin).
- Sessão persistida em `localStorage` (`src/lib/session.ts`) + Supabase session (`storageKey: arqhub.external-supabase.auth`), mantendo o usuário logado no PWA.
- Cliente em primeiro acesso define senha (`cliente-first-login.functions.ts`).
- Resolução de papel no servidor: `src/lib/resolve-role.functions.ts`.
- Server functions protegidas usam `.middleware([requireSupabaseAuth])`; o token é anexado no cliente por `attachSupabaseAuth` registrado em `src/start.ts`.
- Membros de equipe (`office_members`) têm visão restrita (sem dados financeiros sensíveis) e todas as ações são registradas em `project_activity`.
- Gate de módulos por plano: `src/lib/plan-features.ts` e `src/lib/module-access.ts`. No trial de 14 dias todos os recursos Premium ficam liberados.

---

## 7. Pagamentos (Mercado Pago)

- Checkout de planos: `checkout-mp.functions.ts` → `/checkout/$plano`.
- Venda avulsa de material (R$ 29,90): `material-checkout.functions.ts`.
- Webhook: `/api/public/mp-webhook` grava em `payment_events`, libera plano/material e dispara e-mail transacional.
- Comprovantes em PDF: `receipts.functions.ts` → `/comprovante/$paymentId`.
- Admin pode atribuir plano manualmente (`admin-plans.functions.ts` → `grantUserPlan`) e reiniciar trial.

---

## 8. Variáveis de ambiente

### Cliente (expostas, prefixo `VITE_`)
```
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
VITE_SUPABASE_PROJECT_ID
```

### Servidor (segredos — nunca no bundle do cliente)
```
EXTERNAL_SUPABASE_SERVICE_ROLE_KEY
ADMIN_EMAILS
MERCADOPAGO_ACCESS_TOKEN
MERCADOPAGO_PUBLIC_KEY
MERCADOPAGO_WEBHOOK_SECRET
VAPID_PUBLIC_RAW
VAPID_PRIVATE_JWK
RESEND_API_KEY / EMAIL_FROM / SITE_URL      # e-mails transacionais
AI_API_KEY (+ AI_BASE_URL, AI_CHAT_MODEL, AI_EMBEDDING_MODEL)   # IA
```

Regras: `process.env.*` só pode ser lido **dentro** do `.handler()` das server functions. Config do browser usa `import.meta.env.VITE_*`.

---

## 9. Hospedagem em outro provedor

### Pré-requisitos
1. Repositório Git com o código (Git sync via menu + > GitHub).
2. Projeto Supabase próprio (ou reaproveitar os atuais).
3. Conta Mercado Pago (credenciais de produção) e provedor de IA compatível com API OpenAI.

### Passos
1. **Banco:** aplicar, em ordem alfabética/cronológica, todos os SQL de `supabase/manual-migrations/`. Conferir GRANTs e políticas RLS.
2. **Storage:** recriar buckets e políticas; migrar arquivos existentes.
3. **Auth:** configurar provedores (e-mail/senha + Google), URLs de redirect (`https://SEU_DOMINIO/auth/callback`), templates de e-mail.
4. **Variáveis de ambiente:** cadastrar todas as da §8 no provedor de hospedagem.
5. **Build & deploy:**
   - Cloudflare Workers/Pages (recomendado, é o alvo nativo): build `bun run build`, deploy do output do Vite/Nitro.
   - Vercel/Netlify: preset Nitro correspondente; garantir runtime Node 20+ se optar por servidor Node.
   - Node self-hosted: `bun run build` e servir o handler gerado atrás de um proxy (Nginx/Caddy).
6. **Domínio:** apontar DNS, habilitar HTTPS, configurar `www` → apex.
7. **Webhook Mercado Pago:** cadastrar `https://SEU_DOMINIO/api/public/mp-webhook` e o `MERCADOPAGO_WEBHOOK_SECRET`.
8. **PWA:** revisar `public/manifest.webmanifest` (start_url, ícones, nome) e `public/sw.js`; gerar novo par VAPID se trocar de infra.
9. **Verificação pós-deploy:** cadastro de escritório + onboarding obrigatório, cadastro de cliente com projeto, portal do cliente, checkout Pix ponta a ponta, download de material gratuito e premium, assistente Liw, instalação do PWA no iOS e Android.

### Restrições do runtime
Não utilizar `child_process`, `sharp`, `canvas`, `puppeteer`, `fs.watch` ou pacotes com binários nativos nas server functions. Não configurar `ssr.external` no `vite.config.ts`.

---

## 10. SEO e metadados

- Cada rota define seu próprio `head()` com `title`, `description`, `og:title`, `og:description`; `og:image` apenas nas folhas com imagem absoluta.
- Um único `<h1>` por página, HTML semântico, `alt` em imagens, lazy loading, canonical.
- Rotas separadas (sem âncoras `#`) para cada seção indexável.

## 11. Segurança — checklist de manutenção

- RLS ativa e GRANTs explícitos em toda tabela nova.
- Funções `SECURITY DEFINER` com `search_path` fixo e `EXECUTE` revogado de `anon`/`authenticated` quando não forem necessárias ao cliente.
- Nenhuma política `USING (true)` em tabelas com dados sensíveis.
- Downloads premium e status de compra validados no servidor (nunca no cliente).
- Segredos apenas no servidor; chaves VAPID e service role fora do bundle.
- Verificação de assinatura HMAC no webhook antes de processar payload.

## 12. Observabilidade

- Telemetria de visitas/dispositivos/navegação: `import-logs.functions.ts` + `/app/admin/logs`.
- Captura de erros: `src/lib/error-capture.ts`, página `/app/admin/erros`.
- Logs de e-mail: `email_send_log`, `email_send_state`, `suppressed_emails`.
- Downloads: `download_events` + `/app/admin/downloads` (filtros 7/30/90 dias e histórico total).
