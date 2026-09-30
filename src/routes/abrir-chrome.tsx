import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Chrome, Compass, Smartphone } from "lucide-react";

export const Route = createFileRoute("/abrir-chrome")({
  head: () => ({
    meta: [
      { title: "Baixar app ArqHub" },
      { name: "description", content: "Escolha o navegador para instalar o app ArqHub no seu celular." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: OpenChromePage,
});

function OpenChromePage() {
  const [os, setOs] = useState<"android" | "ios" | "desktop">("desktop");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ua = navigator.userAgent || "";
    if (/Android/i.test(ua)) setOs("android");
    else if (/iPhone|iPad|iPod/i.test(ua)) setOs("ios");
    else setOs("desktop");
  }, []);

  const target = "https://arqhub.world/?install=app";
  const targetLabel = "arqhub.world";
  const chromeIntent = useMemo(
    () =>
      `intent://arqhub.world/?install=app` +
      `#Intent;scheme=https;package=com.android.chrome;` +
      `S.browser_fallback_url=${encodeURIComponent(target)};end`,
    [],
  );
  const safariUrl = target;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 bg-background text-foreground p-6 text-center">
      <div className="flex flex-col items-center gap-2">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Smartphone className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-semibold">Baixar app ArqHub</h1>
        <p className="text-sm text-muted-foreground max-w-sm">
          Abra no navegador recomendado e toque em instalar quando aparecer a janela do ArqHub.
        </p>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        {os === "android" && (
          <>
            <a
              href={chromeIntent}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-primary-foreground font-medium shadow-lg"
            >
              <Chrome className="w-5 h-5" />
              Abrir no Google Chrome
            </a>
            <a
              href={target}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-6 py-3.5 font-medium"
            >
              <Compass className="w-5 h-5" />
              Abrir {targetLabel}
            </a>
          </>
        )}

        {os === "ios" && (
          <>
            <a
              href={safariUrl}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-primary-foreground font-medium shadow-lg"
            >
              <Compass className="w-5 h-5" />
              Abrir no Safari
            </a>
            <a
              href={target}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-6 py-3.5 font-medium"
            >
              Abrir {targetLabel}
            </a>
          </>
        )}

        {os === "desktop" && (
          <a
            href={target}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-primary-foreground font-medium shadow-lg"
          >
            Continuar
          </a>
        )}
      </div>

      <p className="text-xs text-muted-foreground max-w-xs">
        Se o celular bloquear a escolha do navegador, toque em “Abrir {targetLabel}”.
      </p>
    </main>
  );
}
