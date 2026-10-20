// Baixa do site antigo (arqhub.world) as imagens que nao estao no repositorio.
// Roda automaticamente antes do build na Vercel. NUNCA interrompe o build:
// se o site antigo nao responder, o build segue e as imagens ausentes viram
// placeholder (ver vite.config.ts).
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const SITE = (process.env.IMAGENS_ORIGEM || "https://arqhub.world").replace(/\/$/, "");
const ROOT = process.cwd();
const LIMITE_MS = 4 * 60 * 1000;
const inicio = Date.now();

const NECESSARIAS = [
  "artigo-aut-1.jpg",
  "artigo-aut-2.jpg",
  "artigo-aut-3.jpg",
  "artigo-caixa-1.jpg",
  "artigo-caixa-2.jpg",
  "artigo-caixa-3.jpg",
  "artigo-caixa-4.jpg",
  "artigo-caixa-5.jpg",
  "artigo-consultiva-1.jpg",
  "artigo-consultiva-2.jpg",
  "artigo-consultiva-3.jpg",
  "artigo-cub-1.jpg",
  "artigo-cub-2.jpg",
  "artigo-cub-3.jpg",
  "artigo-exec-1.jpg",
  "artigo-exec-2.jpg",
  "artigo-exec-3.jpg",
  "artigo-experiencia-1.jpg",
  "artigo-experiencia-2.jpg",
  "artigo-experiencia-3.jpg",
  "artigo-followup-1.jpg",
  "artigo-followup-2.jpg",
  "artigo-followup-3.jpg",
  "artigo-followup-4.jpg",
  "artigo-ia-fin-1.jpg",
  "artigo-ia-fin-2.jpg",
  "artigo-ia-fin-3.jpg",
  "artigo-ia-fin-4.jpg",
  "artigo-ia-fin-5.jpg",
  "artigo-iac-1.jpg",
  "artigo-iac-2.jpg",
  "artigo-iac-3.jpg",
  "artigo-marketing-1.jpg",
  "artigo-marketing-2.jpg",
  "artigo-marketing-3.jpg",
  "artigo-marketing-4.jpg",
  "artigo-operacional-1.jpg",
  "artigo-operacional-2.jpg",
  "artigo-operacional-3.jpg",
  "artigo-operacional-4.jpg",
  "artigo-precificacao-1.jpg",
  "artigo-precificacao-2.jpg",
  "artigo-precificacao-3.jpg",
  "artigo-precificacao-4.jpg",
  "artigo-produtividade-1.jpg",
  "artigo-produtividade-2.jpg",
  "artigo-produtividade-3.jpg",
  "artigo-rv-1.jpg",
  "artigo-rv-2.jpg",
  "artigo-rv-3.jpg",
  "artigo-solucoes-1.jpg",
  "artigo-solucoes-2.jpg",
  "artigo-solucoes-3.jpg",
  "artigo-solucoes-4.jpg",
  "artigo-sus-1.jpg",
  "artigo-sus-2.jpg",
  "artigo-sus-3.jpg",
  "artigo-tcpo-1.jpg",
  "artigo-tcpo-2.jpg",
  "artigo-tcpo-3.jpg",
  "artigo-trafego-1.jpg",
  "artigo-trafego-2.jpg",
  "artigo-trafego-3.jpg",
  "artigo-trafego-4.jpg",
  "bento-alertas.webp",
  "bento-dashboard.webp",
  "bento-diario.webp",
  "bento-relatorios.webp",
  "cadastro-bg.jpg",
  "conteudo-empreenda.jpg",
  "conteudo-potencializador.jpg",
  "conteudo-seu-negocio.jpg",
  "diario-foto-1.jpg",
  "diario-foto-2.jpg",
  "diario-foto-3.jpg",
  "etapa-1-briefing.jpg",
  "etapa-2-preliminar.jpg",
  "etapa-3-anteprojeto.jpg",
  "etapa-4-legal.jpg",
  "etapa-5-executivo.jpg",
  "etapa-6-obra.jpg",
  "ia-1.jpg",
  "ia-2.jpg",
  "ia-3.jpg",
  "ia-4.jpg",
  "login-admin.jpg",
  "login-cliente.jpg",
  "login-escritorio.jpg",
  "portal-cliente-interior.jpg"
];

// [caminho no site antigo (ou URL completa), destino no repositorio]
const MEDIA = [
  ["/__l5e/assets-v1/782ae44e-9570-4ea8-9baa-2db5cdf66dfe/arqhub-logo-mark.png", "public/media/arqhub-logo-mark.png"],
  ["/__l5e/assets-v1/952d761b-399e-4e7a-97c1-7402257b4501/arqhub-logo-resumo.png", "public/media/arqhub-logo-resumo.png"],
  ["/__l5e/assets-v1/1eb3687a-ac30-4bb0-925a-6a8de3a210bd/logo-a.png", "public/media/logo-a.png"],
  ["/__l5e/assets-v1/6e914460-0189-4530-9c13-4e62a1dbf393/cliente-banner.jpg", "public/media/cliente-banner.jpg"],
  ["/__l5e/assets-v1/1e7831c9-95c5-48cd-8b99-fbc4848daf5f/dashboard-banner-blueprints.jpg", "public/media/dashboard-banner-blueprints.jpg"],
  ["/__l5e/assets-v1/a6865339-b488-4d68-87e0-fbe10e2aca18/dashboard-banner-v2.jpg", "public/media/dashboard-banner-v2.jpg"],
  ["/__l5e/assets-v1/a56f573f-104d-4231-a017-1408ab089d04/dashboard-banner-v3.jpg", "public/media/dashboard-banner-v3.jpg"],
  ["/__l5e/assets-v1/3612b082-fae1-47e1-9028-d0863ab21b38/dashboard-banner.jpg", "public/media/dashboard-banner.jpg"],
  ["/__l5e/assets-v1/2c027fc8-cecb-4d06-bfc3-311e757de730/financeiro-banner.jpg", "public/media/financeiro-banner.jpg"],
  ["/__l5e/assets-v1/7356ec30-46ae-4ec7-a114-029294528be3/hero-apt-v3.jpg", "public/media/hero-apt-v3.jpg"],
  ["/__l5e/assets-v1/9634e37d-626b-4537-b598-0ee2d3b7fdbf/hero-apt.jpg", "public/media/hero-apt.jpg"],
  ["/__l5e/assets-v1/e582c5fb-baed-495a-b099-e9ff46a84820/hero-carnava.png", "public/media/hero-carnava.png"],
  ["/__l5e/assets-v1/f9078cf3-8f47-46c2-aa2f-3a9e8017d37a/liw-avatar-circle.png", "public/media/liw-avatar-circle.png"],
  ["/__l5e/assets-v1/b5c17291-30fb-4d00-9231-9021aac99cf8/liw-avatar-new.png", "public/media/liw-avatar-new.png"],
  ["/__l5e/assets-v1/0928efa5-894e-4c21-9fad-d796f09a06c2/liw-avatar.png", "public/media/liw-avatar.png"],
  ["/__l5e/assets-v1/68e6dce9-5397-4f89-bf2c-6e0ad02bc254/piggy-bank-no-bg.png", "public/media/piggy-bank-no-bg.png"],
  ["/__l5e/assets-v1/d5c6775c-27cd-40e4-87ca-f64f4216f5d1/piggy-bank.png", "public/media/piggy-bank.png"],
  ["/__l5e/assets-v1/d32c69ee-82e1-46d0-b5c3-0df3427f9c28/project-placeholder.jpg", "public/media/project-placeholder.jpg"],
  ["https://storage.googleapis.com/gpt-engineer-file-uploads/J9w6x95LXdRifvbebfKdIkuyIOE3/social-images/social-1781011628416-Gemini_Generated_Image_nutrc9nutrc9nutr.webp", "public/og-image.webp"]
];

const tempoEsgotado = () => Date.now() - inicio > LIMITE_MS;

async function texto(url) {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(30000) });
    return r.ok ? await r.text() : null;
  } catch { return null; }
}

async function salvar(url, destino) {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(60000) });
    if (!r.ok) return false;
    const buf = Buffer.from(await r.arrayBuffer());
    const tipo = r.headers.get("content-type") || "";
    if (buf.length === 0 || tipo.includes("text/html")) return false;
    mkdirSync(dirname(destino), { recursive: true });
    writeFileSync(destino, buf);
    return true;
  } catch { return false; }
}

async function emLotes(itens, n, fn) {
  for (let i = 0; i < itens.length; i += n) {
    if (tempoEsgotado()) break;
    await Promise.all(itens.slice(i, i + n).map(fn));
  }
}

async function main() {
  const faltam = NECESSARIAS.filter((f) => !existsSync(join(ROOT, "src/assets", f)));
  const faltamMedia = MEDIA.filter(([, d]) => !existsSync(join(ROOT, d)));
  if (faltam.length === 0 && faltamMedia.length === 0) {
    console.log("[imagens] todas as imagens ja estao no repositorio.");
    return;
  }
  console.log(`[imagens] faltam ${faltam.length} fotos e ${faltamMedia.length} imagens principais; buscando em ${SITE}`);

  // 1. Percorre paginas e arquivos JS/CSS do site antigo coletando nomes de imagens
  const paginas = ["/", "/planos", "/recursos", "/modulos", "/blog", "/sobre", "/portal-cliente", "/entrar",
    "/conteudos/empreenda", "/conteudos/potencializador", "/conteudos/seu-negocio", "/cadastro"];
  const vistos = new Set();
  const fila = [];
  const imagens = new Set();
  const reImg = /([A-Za-z0-9_.\-]+\.(?:jpe?g|png|webp|gif|svg|avif))(?=["'`)\s?#,])/g;
  const reArq = /(?:^|[\s"'`(,=/])(?:\.?\/)?(?:assets\/)?([A-Za-z0-9_.\-]+\.(?:js|css))(?=["'`)\s?#,])/g;

  await emLotes(paginas, 6, async (p) => {
    const html = await texto(SITE + p);
    if (!html) return;
    for (const m of html.matchAll(/(?:src|href)="(\/assets\/[^"]+\.(?:js|css))"/g)) {
      if (!vistos.has(m[1])) { vistos.add(m[1]); fila.push(m[1]); }
    }
    for (const m of html.matchAll(reImg)) imagens.add(m[1]);
  });
  if (vistos.size === 0) {
    console.log(`[imagens] nao consegui abrir ${SITE}; seguindo sem baixar.`);
  }
  while (fila.length && !tempoEsgotado()) {
    const lote = fila.splice(0, 8);
    await Promise.all(lote.map(async (u) => {
      const t = await texto(SITE + u);
      if (!t) return;
      for (const m of t.matchAll(reArq)) {
        const cam = "/assets/" + m[1];
        if (!vistos.has(cam)) { vistos.add(cam); fila.push(cam); }
      }
      for (const m of t.matchAll(reImg)) imagens.add(m[1]);
    }));
  }

  // 2. Baixa cada foto com o nome original que o codigo espera
  const lista = [...imagens];
  let ok = 0;
  await emLotes(faltam, 8, async (nome) => {
    const ponto = nome.lastIndexOf(".");
    const base = nome.slice(0, ponto), ext = nome.slice(ponto);
    const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp("^" + esc(base) + "-[A-Za-z0-9_\\-]{6,12}" + esc(ext) + "$");
    const achou = lista.find((x) => x === nome || re.test(x));
    if (achou && (await salvar(`${SITE}/assets/${achou}`, join(ROOT, "src/assets", nome)))) ok++;
  });

  let okMedia = 0;
  await emLotes(faltamMedia, 8, async ([orig, destino]) => {
    // 1o tenta o caminho publico (/media/x.png ou /og-image.webp), que existe quando
    // o dominio ja aponta para a Vercel; depois o endereco antigo da Lovable.
    const publico = "/" + destino.replace(/^public\//, "");
    const lovable = orig.startsWith("http") ? orig : SITE + orig;
    if ((await salvar(SITE + publico, join(ROOT, destino))) || (await salvar(lovable, join(ROOT, destino)))) okMedia++;
  });

  console.log(`[imagens] baixadas: ${ok}/${faltam.length} fotos, ${okMedia}/${faltamMedia.length} imagens principais (${Math.round((Date.now() - inicio) / 1000)}s)`);

  // Trava de seguranca: se quase nada veio, cancela o build. Assim a Vercel mantem
  // no ar a versao anterior (com imagens) em vez de publicar um site sem fotos.
  const total = faltam.length + faltamMedia.length;
  if (total > 0 && ok + okMedia < total * 0.5 && process.env.IMAGENS_PERMITIR_SEM !== "1") {
    console.log("[imagens] ERRO: nao consegui baixar as imagens. Build cancelado para nao publicar o site sem fotos.");
    console.log("[imagens] O site que ja esta no ar continua funcionando. Para publicar mesmo assim, defina IMAGENS_PERMITIR_SEM=1 na Vercel.");
    process.exitCode = 1;
  }
}

main()
  .catch((e) => console.log("[imagens] erro ignorado:", e?.message ?? e))
  .finally(() => process.exit(process.exitCode ?? 0));
