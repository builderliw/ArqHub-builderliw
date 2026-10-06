// PWA service worker registration with strict Lovable-preview guards.
// Only registers in real production. Removes any stale registration otherwise.

const SW_PATH = "/sw.js";

function shouldRegister(): boolean {
  if (typeof window === "undefined") return false;
  if (!("serviceWorker" in navigator)) return false;
  if (!import.meta.env.PROD) return false;
  if (window.self !== window.top) return false; // inside iframe

  const host = window.location.hostname;
  if (host.startsWith("id-preview--") || host.startsWith("preview--")) return false;
  if (host === "lovableproject.com" || host.endsWith(".lovableproject.com")) return false;
  if (host === "lovableproject-dev.com" || host.endsWith(".lovableproject-dev.com")) return false;
  if (host === "beta.lovable.dev" || host.endsWith(".beta.lovable.dev")) return false;

  if (new URL(window.location.href).searchParams.get("sw") === "off") return false;
  return true;
}

async function unregisterAppSW() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  const regs = await navigator.serviceWorker.getRegistrations();
  for (const r of regs) {
    const url = r.active?.scriptURL || r.installing?.scriptURL || r.waiting?.scriptURL || "";
    if (url.endsWith(SW_PATH)) {
      try { await r.unregister(); } catch {}
    }
  }
}

export async function registerPwa() {
  if (!shouldRegister()) {
    await unregisterAppSW();
    return null;
  }
  try {
    const reg = await navigator.serviceWorker.register(SW_PATH, { scope: "/" });
    return reg;
  } catch (e) {
    console.warn("[pwa] register failed", e);
    return null;
  }
}

export async function getPushSubscription() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return null;
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) return null;
  return reg.pushManager.getSubscription();
}

export async function clearBadge() {
  try {
    if ("clearAppBadge" in navigator) await (navigator as Navigator & { clearAppBadge?: () => Promise<void> }).clearAppBadge?.();
  } catch {}
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    reg?.active?.postMessage("CLEAR_BADGE");
  } catch {}
}
