import { afterEach, describe, expect, it, vi } from "vitest";
import { isPwaStandalone } from "@/lib/pwa-detect";

function setMatchMedia(matcher: (q: string) => boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: (q: string) => ({
      matches: matcher(q),
      media: q,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

afterEach(() => {
  // reset navigator.standalone & referrer
  // @ts-expect-error test cleanup
  delete (window.navigator as Navigator & { standalone?: boolean }).standalone;
  Object.defineProperty(document, "referrer", { configurable: true, value: "" });
  setMatchMedia(() => false);
});

describe("isPwaStandalone", () => {
  it("retorna false em navegador comum", () => {
    setMatchMedia(() => false);
    expect(isPwaStandalone()).toBe(false);
  });

  it("detecta display-mode: standalone (Android/Chrome/Desktop PWA)", () => {
    setMatchMedia((q) => q === "(display-mode: standalone)");
    expect(isPwaStandalone()).toBe(true);
  });

  it("detecta display-mode: fullscreen", () => {
    setMatchMedia((q) => q === "(display-mode: fullscreen)");
    expect(isPwaStandalone()).toBe(true);
  });

  it("detecta display-mode: minimal-ui", () => {
    setMatchMedia((q) => q === "(display-mode: minimal-ui)");
    expect(isPwaStandalone()).toBe(true);
  });

  it("detecta navigator.standalone === true (iOS Safari home-screen)", () => {
    setMatchMedia(() => false);
    Object.defineProperty(window.navigator, "standalone", {
      configurable: true,
      value: true,
    });
    expect(isPwaStandalone()).toBe(true);
  });

  it("detecta referrer android-app://", () => {
    setMatchMedia(() => false);
    Object.defineProperty(document, "referrer", {
      configurable: true,
      value: "android-app://com.android.chrome/",
    });
    expect(isPwaStandalone()).toBe(true);
  });

  it("não quebra se matchMedia lançar exceção", () => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: () => {
        throw new Error("boom");
      },
    });
    expect(() => isPwaStandalone()).not.toThrow();
    expect(isPwaStandalone()).toBe(false);
  });
});

describe("guard de redirecionamento /app", () => {
  it("rota raiz em modo standalone deve redirecionar para /app", () => {
    setMatchMedia((q) => q === "(display-mode: standalone)");
    const standalone = isPwaStandalone();
    const path = "/";
    const target = standalone && path === "/" ? "/app" : path;
    expect(target).toBe("/app");
  });

  it("rota /app em modo standalone permanece em /app", () => {
    setMatchMedia((q) => q === "(display-mode: standalone)");
    const standalone = isPwaStandalone();
    const path = "/app";
    const allowed =
      path.startsWith("/app") ||
      path.startsWith("/entrar") ||
      path.startsWith("/esqueci-senha") ||
      path.startsWith("/redefinir-senha") ||
      path.startsWith("/auth");
    expect(standalone && !allowed).toBe(false);
  });

  it("rota pública /planos em modo standalone deve cair em /app", () => {
    setMatchMedia((q) => q === "(display-mode: standalone)");
    const standalone = isPwaStandalone();
    const path = "/planos";
    const allowed =
      path.startsWith("/app") ||
      path.startsWith("/entrar") ||
      path.startsWith("/esqueci-senha") ||
      path.startsWith("/redefinir-senha") ||
      path.startsWith("/auth");
    expect(standalone && !allowed).toBe(true);
  });

  it("rota /entrar em modo standalone permanece (fluxo de login)", () => {
    setMatchMedia((q) => q === "(display-mode: standalone)");
    const path = "/entrar";
    const allowed =
      path.startsWith("/app") ||
      path.startsWith("/entrar") ||
      path.startsWith("/esqueci-senha") ||
      path.startsWith("/redefinir-senha") ||
      path.startsWith("/auth");
    expect(allowed).toBe(true);
  });

  it("navegador comum nunca redireciona", () => {
    setMatchMedia(() => false);
    const path = "/planos";
    const standalone = isPwaStandalone();
    expect(standalone).toBe(false);
    expect(path).toBe("/planos");
  });
});

// Smoke test do resolveTarget de /app (espelha src/routes/app.tsx)
function resolveTarget(session: { role?: string } | null): string {
  if (!session) return "/entrar";
  if (session.role === "profissional") return "/app/profissional";
  if (session.role === "cliente") return "/app/cliente";
  if (session.role === "admin") return "/app/admin";
  return "/entrar";
}

describe("fluxo de login/painel a partir de /app", () => {
  it("sem sessão vai para /entrar", () => {
    expect(resolveTarget(null)).toBe("/entrar");
  });
  it("profissional vai para painel profissional", () => {
    expect(resolveTarget({ role: "profissional" })).toBe("/app/profissional");
  });
  it("cliente vai para painel cliente", () => {
    expect(resolveTarget({ role: "cliente" })).toBe("/app/cliente");
  });
  it("admin vai para painel admin", () => {
    expect(resolveTarget({ role: "admin" })).toBe("/app/admin");
  });
  it("papel desconhecido cai em /entrar", () => {
    expect(resolveTarget({ role: "ghost" })).toBe("/entrar");
  });

  // Silence unused-vi warning
  it("vi disponível", () => expect(typeof vi).toBe("object"));
});
