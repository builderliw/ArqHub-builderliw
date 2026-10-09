import { useEffect, useMemo, useState } from "react";
import { Download, X, Smartphone, ChevronRight } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { isPwaStandalone } from "@/lib/pwa-detect";
import { logEvent } from "@/lib/app-logger";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const STORAGE_KEY = "arqhub:install-prompt-dismissed-at";
const NEVER_KEY = "arqhub:install-prompt-never";
const INSTALLED_KEY = "arqhub:pwa-installed";
const SNOOZE_MS = 20 * 60 * 1000;

type NavigatorWithRelated = Navigator & {
  getInstalledRelatedApps?: () => Promise<Array<{ platform: string; url?: string; id?: string }>>;
};

async function isAppAlreadyInstalled(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (isPwaStandalone()) return true;
  try {
    if (localStorage.getItem(INSTALLED_KEY) === "1") return true;
  } catch {}
  try {
    const nav = navigator as NavigatorWithRelated;
    if (typeof nav.getInstalledRelatedApps === "function") {
      const apps = await nav.getInstalledRelatedApps();
      if (Array.isArray(apps) && apps.length > 0) return true;
    }
  } catch {}
  return false;
}

function detectPlatform(): "ios" | "android" | "desktop" {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent || "";
  if (/iPhone|iPad|iPod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) {
    return "ios";
  }
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}

function isSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua);
}

function isAllowedRoute(path: string): boolean {
  if (path.startsWith("/app")) return false;
  if (path.startsWith("/entrar")) return false;
  if (path.startsWith("/esqueci-senha")) return false;
  if (path.startsWith("/redefinir-senha")) return false;
  if (path.startsWith("/auth")) return false;
  if (path.startsWith("/instalar")) return false;
  if (path.startsWith("/checkout")) return false;
  if (path.startsWith("/pagamento")) return false;
  return true;
}

export function InstallAppPrompt() {
  const [visible, setVisible] = useState(false);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [platform, setPlatform] = useState<"ios" | "android" | "desktop">("desktop");
  const [view, setView] = useState<"main" | "ios-guide" | "android-guide">("main");
  const [step, setStep] = useState(0);
  const [installing, setInstalling] = useState(false);

  // QR/link sempre apontam para o domínio público de produção,
  // para que ao escanear no celular a pessoa caia no site oficial
  // (não na URL de preview) e receba o pop-up de instalação.
  const PUBLIC_SITE_URL = "https://arqhub.world";

  const siteUrl = useMemo(() => {
    if (typeof window === "undefined") return PUBLIC_SITE_URL;
    const host = window.location.hostname;
    const isPublic =
      host === "arqhub.world" ||
      host === "www.arqhub.world" ||
      host.endsWith(".arqhub.world");
    return isPublic ? window.location.origin : PUBLIC_SITE_URL;
  }, []);

  const installUrl = useMemo(() => `${siteUrl}/?install=app`, [siteUrl]);
  // QR abre direto a tela de instalação, que dispara o prompt nativo sem instruções.
  const qrUrl = useMemo(() => `${siteUrl}/instalar?auto=1`, [siteUrl]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const p = detectPlatform();
    setPlatform(p);
    let cancelled = false;
    const cleanups: Array<() => void> = [];

    const forceInstall = new URLSearchParams(window.location.search).get("install") === "app";

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      const evt = e as BeforeInstallPromptEvent;
      (window as unknown as { __arqhubBip?: BeforeInstallPromptEvent }).__arqhubBip = evt;
      setDeferred(evt);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    cleanups.push(() => window.removeEventListener("beforeinstallprompt", onBeforeInstall));

    const onInstalled = () => {
      setVisible(false);
      try { localStorage.setItem(INSTALLED_KEY, "1"); } catch {}
      try { localStorage.setItem(STORAGE_KEY, String(Date.now())); } catch {}
    };
    window.addEventListener("appinstalled", onInstalled);
    cleanups.push(() => window.removeEventListener("appinstalled", onInstalled));

    const onOpenRequest = () => {
      setView("main");
      setStep(0);
      setVisible(true);
    };
    window.addEventListener("arqhub:open-install", onOpenRequest);
    cleanups.push(() => window.removeEventListener("arqhub:open-install", onOpenRequest));

    const onInstallNow = async () => {
      const evt = (window as unknown as { __arqhubBip?: BeforeInstallPromptEvent }).__arqhubBip;
      if (evt) {
        try {
          await evt.prompt();
          const choice = await evt.userChoice;
          (window as unknown as { __arqhubBip?: BeforeInstallPromptEvent }).__arqhubBip = undefined;
          setDeferred(null);
          if (choice.outcome === "accepted") {
            try { localStorage.setItem(INSTALLED_KEY, "1"); } catch {}
          }
          return;
        } catch {
          // fallback abaixo
        }
      }
      setVisible(true);
    };
    window.addEventListener("arqhub:install-now", onInstallNow);
    cleanups.push(() => window.removeEventListener("arqhub:install-now", onInstallNow));

    const setup = async () => {
      if (isPwaStandalone()) return;
      if (!isAllowedRoute(window.location.pathname)) return;
      if (await isAppAlreadyInstalled()) return;
      if (cancelled) return;

      let delay = forceInstall ? 250 : 1200;
      try {
        if (!forceInstall && localStorage.getItem(NEVER_KEY) === "1") return;
        if (!forceInstall) {
          const last = Number(localStorage.getItem(STORAGE_KEY) || 0);
          if (last) {
            const remaining = last + SNOOZE_MS - Date.now();
            if (remaining > 0) delay = remaining;
          }
        }
      } catch {}

      const t = window.setTimeout(() => { if (!cancelled) setVisible(true); }, delay);
      cleanups.push(() => window.clearTimeout(t));
    };

    setup();

    return () => {
      cancelled = true;
      for (const c of cleanups) c();
    };
  }, []);

  const snooze = () => {
    try { localStorage.setItem(STORAGE_KEY, String(Date.now())); } catch {}
  };

  const dismiss = () => {
    snooze();
    setVisible(false);
    setView("main");
    setStep(0);
    // reaparece em 20 minutos se a aba continuar aberta
    window.setTimeout(() => {
      if (isPwaStandalone()) return;
      try {
        if (localStorage.getItem(NEVER_KEY) === "1") return;
        if (localStorage.getItem(INSTALLED_KEY) === "1") return;
      } catch {}
      setVisible(true);
    }, SNOOZE_MS);
  };

  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible]);


  const neverShowAgain = () => {
    try { localStorage.setItem(NEVER_KEY, "1"); } catch {}
    setVisible(false);
  };

  const startIosGuide = () => {
    setStep(0);
    setView("ios-guide");
  };

  const startAndroidGuide = () => {
    setStep(0);
    setView("android-guide");
  };

  const waitForNativePrompt = () =>
    new Promise<BeforeInstallPromptEvent | null>((resolve) => {
      const current = (window as unknown as { __arqhubBip?: BeforeInstallPromptEvent }).__arqhubBip || deferred;
      if (current) {
        resolve(current);
        return;
      }

      let done = false;
      const finish = (evt: BeforeInstallPromptEvent | null) => {
        if (done) return;
        done = true;
        window.clearTimeout(timer);
        window.removeEventListener("beforeinstallprompt", capture);
        resolve(evt);
      };
      const capture = (event: Event) => {
        event.preventDefault();
        const evt = event as BeforeInstallPromptEvent;
        (window as unknown as { __arqhubBip?: BeforeInstallPromptEvent }).__arqhubBip = evt;
        setDeferred(evt);
        finish(evt);
      };
      const timer = window.setTimeout(() => finish(null), 1800);
      window.addEventListener("beforeinstallprompt", capture, { once: true });
    });

  const install = async () => {
    setInstalling(true);
    logEvent({ level: "audit", action: "pwa.install.click", message: "Clicou em baixar app", details: { platform } });

    const evt = await waitForNativePrompt();
    if (evt) {
      try {
        await evt.prompt();
        const choice = await evt.userChoice;
        setDeferred(null);
        (window as unknown as { __arqhubBip?: BeforeInstallPromptEvent }).__arqhubBip = undefined;
        logEvent({
          level: "audit",
          action: `pwa.install.${choice.outcome}`,
          message: choice.outcome === "accepted" ? "Instalação aceita" : "Instalação recusada",
          details: { platform },
        });
        if (choice.outcome === "accepted") {
          try { localStorage.setItem(INSTALLED_KEY, "1"); } catch {}
        }
        setVisible(false);
        setInstalling(false);
        return;
      } catch {
        // cai no fluxo abaixo
      }
    }

    setInstalling(false);

    if (platform === "ios") {
      logEvent({ level: "audit", action: "pwa.install.ios.chrome-redirect", message: "Redirecionando para Chrome iOS", details: { platform } });
      // Abre a página de instalação no Chrome iOS (esquema googlechromes://).
      // Se o Chrome não estiver instalado, o iOS envia para a App Store.
      window.location.href = "googlechromes://arqhub.world/instalar?auto=1";
      window.setTimeout(() => {
        window.location.href = "https://apps.apple.com/app/google-chrome/id535886823";
      }, 1500);
      return;
    }

    logEvent({ level: "info", action: "pwa.install.guide", message: "Abriu guia Android", details: { platform } });
    startAndroidGuide();
  };

  if (!visible) return null;

  const androidSteps = [
    {
      icon: <ChevronRight className="h-6 w-6" />,
      title: "Abra o menu do navegador",
      desc: "Toque no botão ⋮ (três pontos) no canto superior direito do Chrome.",
    },
    {
      icon: <Download className="h-6 w-6" />,
      title: "Instalar app",
      desc: "Escolha “Instalar app” ou “Adicionar à tela inicial”.",
    },
    {
      icon: <Smartphone className="h-6 w-6" />,
      title: "Confirmar",
      desc: "Confirme a instalação. O ArqHub aparece como app no seu Android.",
    },
  ];

  const currentSteps = androidSteps;
  const currentStep = currentSteps[step];

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={dismiss}
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-foreground/40 backdrop-blur-sm p-4 animate-in fade-in duration-200"
    >
      <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-sm rounded-2xl bg-background border border-border shadow-xl overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
        <button
          onClick={dismiss}
          aria-label="Fechar"
          className="absolute right-3 top-3 rounded-full p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition z-10"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="px-8 pt-10 pb-7">
          <div className="text-center">
            <h2 className="text-[17px] font-semibold tracking-tight text-foreground">
              {view === "main" ? "Baixe o app ArqHub" : "Como instalar"}
            </h2>
            <p className="mt-1.5 text-[13px] text-muted-foreground">
              {view === "main"
                ? "Acesse tudo com um toque no celular."
                : view === "ios-guide"
                  ? "iPhone / iPad — Safari"
                  : "Android — Chrome"}
            </p>
          </div>

          {view === "main" && (
            <>
              {platform === "desktop" ? (
                <div className="mt-7 flex flex-col items-center">
                  <div className="rounded-xl border border-border bg-background p-4">
                    <QRCodeSVG value={qrUrl} size={176} marginSize={0} />
                  </div>
                  <p className="mt-4 text-[12px] text-muted-foreground">
                    Aponte a câmera do celular
                  </p>
                </div>
              ) : (
                <p className="mt-5 text-center text-[13px] text-muted-foreground leading-relaxed">
                  Toque em baixar e confirme na janela do Chrome.
                </p>
              )}

              <button
                onClick={install}
                disabled={installing}
                className="mt-7 w-full inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-4 py-2.5 text-[13px] font-medium text-background hover:bg-foreground/90 transition disabled:opacity-60"
              >
                {installing ? "Abrindo..." : "Baixar app"}
              </button>

              <button
                onClick={dismiss}
                className="mt-1.5 w-full rounded-full px-4 py-2 text-[12px] font-medium text-muted-foreground hover:text-foreground transition"
              >
                Agora não
              </button>
            </>
          )}

          {(view === "ios-guide" || view === "android-guide") && currentStep && (
            <div className="mt-6">
              <div className="flex items-center gap-1.5">
                {currentSteps.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? "bg-foreground" : "bg-muted"}`}
                  />
                ))}
              </div>

              <div className="mt-6 flex flex-col items-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-foreground">
                  {currentStep.icon}
                </div>
                <h3 className="mt-4 text-[14px] font-semibold text-foreground">
                  {currentStep.title}
                </h3>
                <p className="mt-1.5 text-[13px] text-muted-foreground leading-relaxed">
                  {currentStep.desc}
                </p>
              </div>

              <div className="mt-6 flex gap-2">
                {step > 0 && (
                  <button
                    onClick={() => setStep((s) => s - 1)}
                    className="flex-1 rounded-full border border-border px-4 py-2.5 text-[13px] font-medium text-foreground hover:bg-muted transition"
                  >
                    Voltar
                  </button>
                )}
                {step < currentSteps.length - 1 ? (
                  <button
                    onClick={() => setStep((s) => s + 1)}
                    className="flex-1 rounded-full bg-foreground px-4 py-2.5 text-[13px] font-medium text-background hover:bg-foreground/90 transition"
                  >
                    Próximo
                  </button>
                ) : (
                  <button
                    onClick={dismiss}
                    className="flex-1 rounded-full bg-foreground px-4 py-2.5 text-[13px] font-medium text-background hover:bg-foreground/90 transition"
                  >
                    Concluir
                  </button>
                )}
              </div>
            </div>
          )}

          <button
            onClick={neverShowAgain}
            className="mt-5 w-full text-[11px] text-muted-foreground/60 hover:text-muted-foreground transition"
          >
            Não mostrar mais
          </button>
        </div>
      </div>
    </div>
  );
}
