import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Bell, BellOff, LayoutDashboard, FolderOpen, FileText, MessageSquare, Calendar,
  ClipboardCheck, ShoppingBag, BellRing, ArrowLeft,
CalendarClock , Images } from "lucide-react";
import { AppShell, type NavGroup } from "@/components/app-shell";
import { Switch } from "@/components/ui/switch";
import { externalSupabase } from "@/integrations/external-supabase/client";
import { getMyNotificationPrefs, setMyNotificationPrefs } from "@/lib/notify-new-document.functions";
import { subscribePush, unsubscribePush } from "@/lib/push.functions";
import { VAPID_PUBLIC_KEY, urlBase64ToUint8Array } from "@/lib/push-config";
import { getPushSubscription, clearBadge } from "@/lib/pwa-register";

export const Route = createFileRoute("/app/cliente_/notificacoes")({
  head: () => ({ meta: [{ title: "Notificações — ArqHub" }] }),
  component: NotificacoesPage,
});

const nav: NavGroup[] = [
  { label: "Interface", items: [{ to: "/app/cliente", label: "Início", icon: LayoutDashboard }, { to: "/app/cliente/meu-projeto", label: "Meu projeto", icon: FolderOpen }] },
  {
    label: "Acompanhamento",
    items: [
      { to: "/app/cliente/agenda", label: "Agenda", icon: CalendarClock },
      { to: "/app/cliente/aprovacoes", label: "Aprovações", icon: ClipboardCheck },
      { to: "/app/cliente/cronograma", label: "Cronograma", icon: Calendar },
      { to: "/app/cliente/documentos", label: "Documentos", icon: FolderOpen },
      { to: "/app/cliente/galeria", label: "Galeria", icon: Images },
      { to: "/app/cliente/produtos", label: "Produtos", icon: ShoppingBag },
    ],
  },
  {
    label: "Comunicação",
    items: [
      { to: "/app/cliente/mensagens", label: "Mensagens", icon: MessageSquare },
      { to: "/app/cliente/notificacoes", label: "Notificações", icon: BellRing },
    ],
  },
  { label: "Financeiro", items: [{ to: "/app/meus-pagamentos", label: "Meus pagamentos", icon: FileText }] },
];

function NotificacoesPage() {
  const [emailNotify, setEmailNotify] = useState<boolean | null>(null);
  const [savingPref, setSavingPref] = useState(false);
  const [pushState, setPushState] = useState<"unsupported" | "unsubscribed" | "subscribed" | "denied" | "loading">("loading");
  const [pushBusy, setPushBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data: sess } = await externalSupabase.auth.getSession();
        const t = sess.session?.access_token;
        if (!t) return;
        const r = await getMyNotificationPrefs({ data: { externalAccessToken: t } });
        setEmailNotify(r.new_document);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (typeof window === "undefined") return;
      clearBadge();
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setPushState("unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        setPushState("denied");
        return;
      }
      const sub = await getPushSubscription();
      setPushState(sub ? "subscribed" : "unsubscribed");
    })();
  }, []);

  async function togglePref() {
    if (emailNotify === null || savingPref) return;
    setSavingPref(true);
    const next = !emailNotify;
    setEmailNotify(next);
    try {
      const { data: sess } = await externalSupabase.auth.getSession();
      const t = sess.session?.access_token;
      if (t) await setMyNotificationPrefs({ data: { externalAccessToken: t, new_document: next } });
    } catch {
      setEmailNotify(!next);
    } finally {
      setSavingPref(false);
    }
  }

  async function togglePush() {
    if (pushBusy) return;
    setPushBusy(true);
    try {
      const { data: sess } = await externalSupabase.auth.getSession();
      const t = sess.session?.access_token;
      if (!t) return;

      if (pushState === "subscribed") {
        const sub = await getPushSubscription();
        if (sub) {
          await unsubscribePush({ data: { externalAccessToken: t, endpoint: sub.endpoint } });
          await sub.unsubscribe();
        }
        setPushState("unsubscribed");
        return;
      }

      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setPushState(perm === "denied" ? "denied" : "unsubscribed");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      });
      const json = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
      const endpoint = sub.endpoint;
      const p256dh = json.keys?.p256dh ?? "";
      const auth = json.keys?.auth ?? "";
      const res = await subscribePush({
        data: {
          externalAccessToken: t,
          endpoint,
          p256dh,
          auth,
          userAgent: navigator.userAgent.slice(0, 256),
        },
      });
      if (res.ok) setPushState("subscribed");
      else {
        await sub.unsubscribe();
        setPushState("unsubscribed");
      }
    } catch (e) {
      console.warn("[push] toggle failed", e);
    } finally {
      setPushBusy(false);
    }
  }

  return (
    <AppShell role="cliente" nav={nav} title="Notificações">
      <Link
        to="/app/cliente"
        className="inline-flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground hover:text-ink mb-4"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao painel
      </Link>
      <div className="mb-5">
        <h2 className="text-[22px] font-semibold tracking-tight text-ink">Notificações</h2>
        <p className="text-sm text-muted-foreground mt-1">Configure como você quer ser avisado.</p>
      </div>

      <div className="max-w-2xl space-y-3">
        <div className="rounded-xl border border-border bg-white p-4 flex items-center gap-3">
          {emailNotify ? (
            <Bell className="h-4 w-4 text-primary shrink-0" strokeWidth={2} />
          ) : (
            <BellOff className="h-4 w-4 text-muted-foreground shrink-0" strokeWidth={2} />
          )}
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-ink">Avisar por e-mail novos documentos</div>
            <div className="text-[12px] text-muted-foreground mt-0.5">
              {emailNotify === null
                ? "Carregando preferências…"
                : emailNotify
                ? "Você receberá um e-mail sempre que o escritório enviar um novo arquivo."
                : "Notificações por e-mail desativadas."}
            </div>
          </div>
          <Switch
            checked={!!emailNotify}
            disabled={emailNotify === null || savingPref}
            onCheckedChange={() => togglePref()}
            aria-label="Ativar notificações por e-mail"
          />
        </div>

        {pushState !== "unsupported" && (
          <div className="rounded-xl border border-border bg-white p-4 flex items-center gap-3">
            {pushState === "subscribed" ? (
              <Bell className="h-4 w-4 text-primary shrink-0" strokeWidth={2} />
            ) : (
              <BellOff className="h-4 w-4 text-muted-foreground shrink-0" strokeWidth={2} />
            )}
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold text-ink">Notificações no celular (push)</div>
              <div className="text-[12px] text-muted-foreground mt-0.5">
                {pushState === "loading" && "Carregando…"}
                {pushState === "subscribed" && "Você receberá um aviso no celular e um indicador no ícone do app quando chegar um novo documento."}
                {pushState === "unsubscribed" && "Ative para receber aviso instantâneo no celular, mesmo com o app fechado."}
                {pushState === "denied" && "Permissão bloqueada no navegador. Habilite nas configurações do site para ativar."}
              </div>
            </div>
            {pushState !== "denied" && pushState !== "loading" && (
              <Switch
                checked={pushState === "subscribed"}
                disabled={pushBusy}
                onCheckedChange={() => togglePush()}
                aria-label="Ativar notificações no celular"
              />
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
