import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bell, MessageSquare, FileText, ShoppingBag, CalendarClock } from "lucide-react";
import { externalSupabase } from "@/integrations/external-supabase/client";
import { listClienteRecentActivity } from "@/lib/cliente-data.functions";

type Item = {
  id: string;
  type: "message" | "document" | "product" | "meeting";
  title: string;
  text: string;
  project_name: string;
  office_logo: string | null;
  created_at: string;
  link: string;
};

const LS_KEY = "arqhub.cliente.notifs.lastSeen";

function readLastSeen(): string {
  if (typeof localStorage === "undefined") return new Date(0).toISOString();
  return localStorage.getItem(LS_KEY) ?? new Date(0).toISOString();
}

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "agora";
  if (s < 3600) return `${Math.floor(s / 60)}min`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

function typeMeta(t: Item["type"]) {
  if (t === "message")
    return { Icon: MessageSquare, color: "text-emerald-600 bg-emerald-50", verb: "enviou uma mensagem" };
  if (t === "document")
    return { Icon: FileText, color: "text-blue-600 bg-blue-50", verb: "" };
  if (t === "meeting")
    return { Icon: CalendarClock, color: "text-blue-600 bg-blue-50", verb: "" };
  return { Icon: ShoppingBag, color: "text-amber-600 bg-amber-50", verb: "" };
}

export function ClienteNotificationsBell() {
  const [items, setItems] = useState<Item[]>([]);
  const [lastSeen, setLastSeen] = useState<string>(readLastSeen());
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  async function load() {
    const { data: sess } = await externalSupabase.auth.getSession();
    const token = sess.session?.access_token;
    if (!token) return;
    try {
      const r = await listClienteRecentActivity({ data: { accessToken: token } });
      setItems(r.items as Item[]);
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 20000);
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(t);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const unreadCount = items.filter((i) => i.created_at > lastSeen).length;

  function toggle() {
    if (!open && unreadCount > 0) {
      const now = new Date().toISOString();
      setTimeout(() => {
        setLastSeen(now);
        try { localStorage.setItem(LS_KEY, now); } catch {}
      }, 600);
    }
    setOpen((v) => !v);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggle}
        className="relative h-9 w-9 inline-flex items-center justify-center rounded-md hover:bg-secondary/60 text-muted-foreground hover:text-ink transition-colors"
        aria-label="Notificações"
      >
        <Bell className="h-4 w-4" strokeWidth={1.75} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[360px] max-h-[460px] bg-white border border-border rounded-xl shadow-lg z-50 flex flex-col overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
            <h4 className="text-[13px] font-semibold text-ink">Notificações</h4>
            {unreadCount > 0 && (
              <span className="text-[11px] text-muted-foreground">{unreadCount} novas</span>
            )}
          </div>
          <div className="overflow-y-auto flex-1">
            {items.length === 0 ? (
              <div className="px-4 py-10 text-center text-[12.5px] text-muted-foreground">
                Sem novidades por aqui ainda.
              </div>
            ) : (
              <ul>
                {items.map((n) => {
                  const isNew = n.created_at > lastSeen;
                  const { Icon, color, verb } = typeMeta(n.type);
                  return (
                    <li
                      key={n.id}
                      className={`border-b border-border last:border-b-0 ${isNew ? "bg-emerald-50/40" : ""}`}
                    >
                      <Link
                        to={n.link}
                        onClick={() => setOpen(false)}
                        className="block px-4 py-3 hover:bg-secondary/40 transition-colors"
                      >
                        <div className="flex items-start gap-2.5">
                          <span className={`mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full shrink-0 overflow-hidden ${color}`}>
                            {n.office_logo ? (
                              <img src={n.office_logo} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                            )}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="text-[12.5px] text-ink leading-snug">
                              <span className="font-medium">{n.title}</span>{" "}
                              {verb && <span className="text-muted-foreground">{verb}</span>}
                              {n.type === "message" && n.text && (
                                <span className="text-muted-foreground">: "{n.text}"</span>
                              )}
                              {n.type !== "message" && (
                                <span className="text-muted-foreground"> {n.text}</span>
                              )}
                            </div>
                            <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                              {n.project_name} · {timeAgo(n.created_at)}
                            </div>
                          </div>
                          {isNew && (
                            <span className="mt-1.5 h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                          )}
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
