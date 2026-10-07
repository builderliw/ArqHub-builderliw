import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Chrome, Download, Smartphone } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type BrowserState = {
  platform: "android" | "ios" | "desktop";
  browser: "chrome" | "safari" | "samsung" | "other";
};

export const Route = createFileRoute("/instalar")({
  head: () => ({
    meta: [
      { title: "Instalar app ArqHub" },
      { name: "description", content: "Instale o app ArqHub no celular pelo Chrome ou Safari." },
      { property: "og:title", content: "Instalar app ArqHub" },
      { property: "og:description", content: "Baixe o app ArqHub no celular pelo Chrome ou Safari." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: InstallPage,
});

function detectBrowser(): BrowserState {
  if (typeof navigator === "undefined") return { platform: "desktop", browser: "other" };
  const ua = navigator.userAgent || "";
  const platform = /Android/i.test(ua)
    ? "android"
    : /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
      ? "ios"
      : "desktop";

  const browser = /SamsungBrowser/i.test(ua)
    ? "samsung"
    : /Chrome|CriOS/i.test(ua) && !/Edg|OPR|SamsungBrowser/i.test(ua)
      ? "chrome"
      : /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua)
        ? "safari"
        : "other";

  return { platform, browser };
}

function InstallPage() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [browserState, setBrowserState] = useState<BrowserState>({ platform: "desktop", browser: "other" });
  const [status, setStatus] = useState<"ready" | "waiting" | "installed" | "unavailable">("waiting");

  const installUrl = "https://arqhub.world/instalar?source=chrome";
  const chromeIntent = useMemo(
    () =>
      `intent://arqhub.world/instalar?source=chrome` +
      `#Intent;scheme=https;package=com.android.chrome;` +
      `S.browser_fallback_url=${encodeURIComponent(installUrl)};end`,
    [],
  );

  useEffect(() => {
    const state = detectBrowser();
    setBrowserState(state);

    const fireNative = async (evt: BeforeInstallPromptEvent) => {
      try {
        await evt.prompt();
        await evt.userChoice;
        (window as unknown as { __arqhubBip?: BeforeInstallPromptEvent }).__arqhubBip = undefined;
        setDeferred(null);
      } catch {
        setStatus("unavailable");
      }
    };

    // Se Android fora do Chrome, redireciona direto para o Chrome sem UI.
    if (state.platform === "android" && state.browser !== "chrome") {
      window.location.href =
        `intent://arqhub.world/instalar?source=chrome` +
        `#Intent;scheme=https;package=com.android.chrome;` +
        `S.browser_fallback_url=${encodeURIComponent(installUrl)};end`;
      return;
    }

    const existing = (window as unknown as { __arqhubBip?: BeforeInstallPromptEvent }).__arqhubBip;
    if (existing) {
      setDeferred(existing);
      setStatus("ready");
      void fireNative(existing);
    }

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      const evt = e as BeforeInstallPromptEvent;
      (window as unknown as { __arqhubBip?: BeforeInstallPromptEvent }).__arqhubBip = evt;
      setDeferred(evt);
      setStatus("ready");
      void fireNative(evt);
    };

    const onInstalled = () => setStatus("installed");
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    const timer = window.setTimeout(() => {
      const latest = (window as unknown as { __arqhubBip?: BeforeInstallPromptEvent }).__arqhubBip;
      if (latest) {
        setDeferred(latest);
        setStatus("ready");
        void fireNative(latest);
      } else {
        setStatus("unavailable");
      }
    }, 2000);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = async () => {
    const evt = deferred || (window as unknown as { __arqhubBip?: BeforeInstallPromptEvent }).__arqhubBip;

    if (browserState.platform === "android" && browserState.browser !== "chrome") {
      window.location.href = chromeIntent;
      return;
    }

    if (evt) {
      await evt.prompt();
      await evt.userChoice;
      (window as unknown as { __arqhubBip?: BeforeInstallPromptEvent }).__arqhubBip = undefined;
      setDeferred(null);
      return;
    }

    setStatus("unavailable");
  };


  const isAndroidOutsideChrome = browserState.platform === "android" && browserState.browser !== "chrome";
  const isIosOutsideSafari = browserState.platform === "ios" && browserState.browser !== "safari";

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-5 py-10">
      <section className="w-full max-w-sm text-center">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[28px] border border-border bg-card shadow-xl overflow-hidden">
          <img src="/icons/icon-192.png" alt="ArqHub" className="h-full w-full object-cover" />
        </div>

        <h1 className="mt-6 text-3xl font-semibold tracking-tight">Baixar app ArqHub</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Toque no botão abaixo para abrir a janela oficial de instalação no celular.
        </p>

        <button
          onClick={install}
          className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 text-base font-semibold text-primary-foreground shadow-lg hover:bg-primary/90 active:scale-[0.99]"
        >
          {isAndroidOutsideChrome ? <Chrome className="h-5 w-5" /> : <Download className="h-5 w-5" />}
          {isAndroidOutsideChrome ? "Abrir no Google Chrome" : "Instalar aplicativo"}
        </button>

        {isIosOutsideSafari && (
          <a
            href={installUrl}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-border px-5 py-3.5 text-sm font-medium"
          >
            Abrir no Safari
          </a>
        )}

        <div className="mt-5 rounded-2xl border border-border bg-card p-4 text-left text-xs leading-5 text-muted-foreground">
          {status === "ready" && (
            <p className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> Pronto para instalar. Ao tocar, aparecerá a janela “Instalar aplicativo”.</p>
          )}
          {status === "waiting" && (
            <p className="flex gap-2"><Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> Preparando a instalação automática...</p>
          )}
          {status === "installed" && (
            <p className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> App instalado. Procure o ícone ArqHub na tela inicial.</p>
          )}
          {status === "unavailable" && browserState.platform === "android" && browserState.browser === "chrome" && (
            <p>Se a janela não aparecer, aguarde alguns segundos e toque novamente em “Instalar aplicativo”.</p>
          )}
          {status === "unavailable" && browserState.platform === "ios" && (
            <p>No iPhone/iPad, a instalação acontece pelo Safari usando “Compartilhar” e “Adicionar à Tela de Início”.</p>
          )}
          {status === "unavailable" && browserState.platform === "desktop" && (
            <p>Abra esta página pelo celular para instalar o app ArqHub.</p>
          )}
        </div>
      </section>
    </main>
  );
}
