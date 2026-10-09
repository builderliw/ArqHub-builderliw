import { externalSupabase } from "@/integrations/external-supabase/client";

export type LogLevel = "debug" | "info" | "warn" | "error" | "audit";

export type LogInput = {
  level?: LogLevel;
  screen?: string | null;
  route?: string | null;
  action?: string | null;
  message: string;
  details?: Record<string, unknown> | null;
  office_id?: string | null;
};

const VISITOR_KEY = "arqhub:visitor-id";

function uuid(): string {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  } catch {}
  return "v-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function getVisitorId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = uuid();
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

export type DeviceInfo = {
  device: "mobile" | "tablet" | "desktop";
  os: string;
  browser: string;
  standalone: boolean;
};

export function getDeviceInfo(): DeviceInfo {
  if (typeof navigator === "undefined") {
    return { device: "desktop", os: "unknown", browser: "unknown", standalone: false };
  }
  const ua = navigator.userAgent || "";
  const isTablet = /iPad|Tablet|PlayBook|Silk/i.test(ua) || (navigator.platform === "MacIntel" && (navigator as Navigator & { maxTouchPoints?: number }).maxTouchPoints! > 1);
  const isMobile = !isTablet && /Mobi|Android|iPhone|iPod|Opera Mini|IEMobile/i.test(ua);
  const device: DeviceInfo["device"] = isTablet ? "tablet" : isMobile ? "mobile" : "desktop";

  let os = "Desktop";
  if (/Android/i.test(ua)) os = "Android";
  else if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS";
  else if (/Windows/i.test(ua)) os = "Windows";
  else if (/Mac OS X/i.test(ua)) os = "macOS";
  else if (/Linux/i.test(ua)) os = "Linux";

  let browser = "Outro";
  if (/EdgiOS|Edg\//i.test(ua)) browser = "Edge";
  else if (/OPR\/|Opera/i.test(ua)) browser = "Opera";
  else if (/CriOS|Chrome/i.test(ua) && !/Edg\//i.test(ua)) browser = "Chrome";
  else if (/FxiOS|Firefox/i.test(ua)) browser = "Firefox";
  else if (/Safari/i.test(ua)) browser = "Safari";

  let standalone = false;
  try {
    standalone =
      (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
  } catch {}

  return { device, os, browser, standalone };
}

function currentRoute(): string | null {
  if (typeof window === "undefined") return null;
  return window.location.pathname + window.location.search;
}

const SOURCE_KEY = "arqhub:first-source";

export type TrafficSource = {
  source: string;
  medium: string | null;
  campaign: string | null;
  content: string | null;
  landing: string | null;
  first_at: string;
};

function detectSource(): TrafficSource | null {
  if (typeof window === "undefined") return null;
  const p = new URLSearchParams(window.location.search);
  const utmSource = p.get("utm_source") || p.get("ref") || p.get("fonte");
  const utmMedium = p.get("utm_medium");
  const utmCampaign = p.get("utm_campaign");
  const utmContent = p.get("utm_content");
  const ref = (typeof document !== "undefined" ? document.referrer : "") || "";
  const host = (() => {
    try {
      return ref ? new URL(ref).hostname.replace(/^www\./, "") : "";
    } catch {
      return "";
    }
  })();

  let source = (utmSource || "").toLowerCase();
  if (!source) {
    if (/instagram|l\.instagram|ig/.test(host)) source = "instagram";
    else if (/facebook|fb\./.test(host)) source = "facebook";
    else if (/google\./.test(host)) source = "google";
    else if (/t\.co|twitter|x\.com/.test(host)) source = "twitter";
    else if (/linkedin/.test(host)) source = "linkedin";
    else if (/whatsapp|wa\.me/.test(host)) source = "whatsapp";
    else if (/tiktok/.test(host)) source = "tiktok";
    else if (/youtube|youtu\.be/.test(host)) source = "youtube";
    else if (host && !host.includes("arqhub")) source = host;
    else source = "direto";
  }
  // In-app browser do Instagram (referrer costuma vir vazio)
  if (source === "direto" && typeof navigator !== "undefined" && /Instagram/i.test(navigator.userAgent)) {
    source = "instagram";
  }

  return {
    source,
    medium: utmMedium,
    campaign: utmCampaign,
    content: utmContent,
    landing: window.location.pathname,
    first_at: new Date().toISOString(),
  };
}

export function getTrafficSource(): TrafficSource | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(SOURCE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as TrafficSource;
      const fresh = detectSource();
      // Uma nova campanha/UTM explícita sobrepõe a origem gravada
      if (fresh && fresh.source !== "direto" && fresh.source !== parsed.source) {
        localStorage.setItem(SOURCE_KEY, JSON.stringify(fresh));
        return fresh;
      }
      return parsed;
    }
    const fresh = detectSource();
    if (fresh) localStorage.setItem(SOURCE_KEY, JSON.stringify(fresh));
    return fresh;
  } catch {
    return detectSource();
  }
}

function inferScreen(route: string | null): string | null {
  if (!route) return null;
  const parts = route.split("?")[0].split("/").filter(Boolean);
  return parts[parts.length - 1] || parts[0] || null;
}


let userCache: { id: string | null; email: string | null } | null = null;
async function getUser() {
  if (userCache) return userCache;
  try {
    const { data } = await externalSupabase.auth.getUser();
    userCache = { id: data.user?.id ?? null, email: data.user?.email ?? null };
  } catch {
    userCache = { id: null, email: null };
  }
  return userCache;
}

if (typeof window !== "undefined") {
  externalSupabase.auth.onAuthStateChange(() => {
    userCache = null;
  });
}

export async function logEvent(input: LogInput): Promise<void> {
  try {
    const route = input.route ?? currentRoute();
    const screen = input.screen ?? inferScreen(route);
    const user = await getUser();
    const visitorId = getVisitorId();
    const device = typeof window !== "undefined" ? getDeviceInfo() : null;

    const details: Record<string, unknown> = { ...(input.details ?? {}) };
    if (visitorId) details.visitor_id = visitorId;
    if (device) {
      details.device = device.device;
      details.os = device.os;
      details.browser = device.browser;
      details.standalone = device.standalone;
    }
    if (typeof document !== "undefined" && document.referrer) {
      details.referrer = document.referrer;
    }
    const src = getTrafficSource();
    if (src) {
      details.source = src.source;
      if (src.medium) details.utm_medium = src.medium;
      if (src.campaign) details.utm_campaign = src.campaign;
      if (src.content) details.utm_content = src.content;
      if (src.landing) details.landing = src.landing;
    }


    await externalSupabase.from("app_logs").insert({
      level: input.level ?? "info",
      source: "client",
      screen,
      route,
      action: input.action ?? null,
      message: input.message.slice(0, 2000),
      details,
      user_id: user.id,
      user_email: user.email,
      office_id: input.office_id ?? null,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    });
  } catch {
    // never throw from logger
  }
}

export const logger = {
  debug: (message: string, extra?: Omit<LogInput, "message" | "level">) =>
    logEvent({ ...extra, level: "debug", message }),
  info: (message: string, extra?: Omit<LogInput, "message" | "level">) =>
    logEvent({ ...extra, level: "info", message }),
  warn: (message: string, extra?: Omit<LogInput, "message" | "level">) =>
    logEvent({ ...extra, level: "warn", message }),
  error: (message: string, extra?: Omit<LogInput, "message" | "level">) =>
    logEvent({ ...extra, level: "error", message }),
  audit: (message: string, extra?: Omit<LogInput, "message" | "level">) =>
    logEvent({ ...extra, level: "audit", message }),
};

let installed = false;
let lastPath: string | null = null;

function trackPageView() {
  if (typeof window === "undefined") return;
  const path = window.location.pathname + window.location.search;
  if (path === lastPath) return;
  lastPath = path;
  logEvent({ level: "info", action: "pageview", message: `Pageview ${window.location.pathname}` });
}

export function installGlobalLogCapture() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  // Ensure visitor id exists asap
  getVisitorId();
  getTrafficSource();


  // First pageview + SPA navigation tracking
  trackPageView();
  const _push = history.pushState;
  const _replace = history.replaceState;
  history.pushState = function (...args: Parameters<typeof history.pushState>) {
    const r = _push.apply(this, args);
    setTimeout(trackPageView, 0);
    return r;
  };
  history.replaceState = function (...args: Parameters<typeof history.replaceState>) {
    const r = _replace.apply(this, args);
    setTimeout(trackPageView, 0);
    return r;
  };
  window.addEventListener("popstate", trackPageView);

  window.addEventListener("error", (ev) => {
    const err = (ev as ErrorEvent).error;
    logEvent({
      level: "error",
      action: "window.error",
      message: (err?.message || (ev as ErrorEvent).message || "Unknown error").toString(),
      details: {
        stack: err?.stack ?? null,
        filename: (ev as ErrorEvent).filename,
        lineno: (ev as ErrorEvent).lineno,
        colno: (ev as ErrorEvent).colno,
      },
    });
  });

  window.addEventListener("unhandledrejection", (ev) => {
    const reason = (ev as PromiseRejectionEvent).reason;
    const message =
      reason instanceof Error ? reason.message : typeof reason === "string" ? reason : "Unhandled rejection";
    logEvent({
      level: "error",
      action: "unhandledrejection",
      message,
      details: {
        stack: reason instanceof Error ? reason.stack : null,
        reason: reason instanceof Error ? undefined : reason,
      },
    });
  });

  // PWA install lifecycle
  window.addEventListener("beforeinstallprompt", () => {
    logEvent({ level: "info", action: "pwa.install.available", message: "Prompt de instalação disponível" });
  });
  window.addEventListener("appinstalled", () => {
    logEvent({ level: "audit", action: "pwa.installed", message: "App instalado" });
  });
}
