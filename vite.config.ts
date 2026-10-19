import { existsSync } from "node:fs";
import { resolve } from "node:path";
import type { Plugin } from "vite";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Várias imagens de src/assets ainda não foram enviadas ao GitHub.
// Em vez de quebrar o build, cada imagem ausente vira um placeholder neutro
// (e aparece um aviso no log). Assim que o arquivo real for adicionado ao
// repositório, ele passa a ser usado automaticamente.
const IMG_RE = /\.(png|jpe?g|webp|gif|svg|avif)$/i;
const PLACEHOLDER =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800"><rect width="1200" height="800" fill="#e7e2da"/></svg>',
  );

function missingAssetFallback(): Plugin {
  const warned = new Set<string>();
  return {
    name: "arqhub:missing-asset-fallback",
    enforce: "pre",
    load(id) {
      const file = id.split("?")[0];
      if (!IMG_RE.test(file) || file.startsWith("\0") || existsSync(file)) return null;
      if (!file.startsWith(resolve(process.cwd(), "src"))) return null;
      if (!warned.has(file)) {
        warned.add(file);
        this.warn(`Imagem ausente, usando placeholder: ${file.replace(process.cwd() + "/", "")}`);
      }
      return `export default ${JSON.stringify(PLACEHOLDER)};`;
    },
  };
}

export default defineConfig({
  // Gera a saída no formato da Vercel (.vercel/output).
  nitro: { preset: process.env.NITRO_PRESET || "vercel" },
  plugins: [missingAssetFallback()],
  vite: {
    server: { port: 3000 },
  },
});
