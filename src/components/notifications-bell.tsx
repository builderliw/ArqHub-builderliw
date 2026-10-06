import { useEffect, useRef, useState } from "react";
import { Bell, Check, X, AlertCircle } from "lucide-react";
import {
  useProfissionalNotifications,
  type ApprovalNotification,
} from "@/hooks/use-profissional-notifications";

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "agora";
  if (s < 3600) return `${Math.floor(s / 60)}min`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

function statusInfo(s: ApprovalNotification["status"]) {
  if (s === "approved") return { label: "aprovou", Icon: Check, color: "text-emerald-600 bg-emerald-50" };
  if (s === "rejected") return { label: "reprovou", Icon: X, color: "text-red-600 bg-red-50" };
  return { label: "solicitou alterações em", Icon: AlertCircle, color: "text-amber-600 bg-amber-50" };
}

export function NotificationsBell({ officeId }: { officeId: string | null }) {
  const { items, unread, markAllSeen } = useProfissionalNotifications(officeId);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  function toggle() {
    if (!open) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  }

  function handleMarkAllRead() {
    markAllSeen();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggle}
        className="relative p-2 rounded-md text-muted-foreground hover:text-ink hover:bg-secondary transition-colors"
        aria-label="Notificações"
      >
        <Bell className="h-4 w-4" strokeWidth={1.75} />
        {unread.length > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center">
            {unread.length > 9 ? "9+" : unread.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[340px] max-h-[440px] bg-white border border-border rounded-xl shadow-lg z-50 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
            <h4 className="text-[13px] font-semibold text-ink">Notificações</h4>
            {unread.length > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11.5px] text-primary hover:underline"
              >
                Marcar como lidas
              </button>
            )}
          </div>
          <div className="overflow-y-auto flex-1">
            {items.length === 0 ? (
              <div className="px-4 py-8 text-center text-[12.5px] text-muted-foreground">
                Sem notificações ainda.
              </div>
            ) : (
              <ul>
                {items.map((n) => {
                  const isUnread = unread.some((u) => u.id === n.id);
                  const { label, Icon, color } = statusInfo(n.status);
                  return (
                    <li
                      key={n.id}
                      className={`px-4 py-3 border-b border-border last:border-b-0 ${isUnread ? "bg-primary/[0.03]" : ""}`}
                    >
                      <div className="flex items-start gap-2.5">
                        <span className={`mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full shrink-0 ${color}`}>
                          <Icon className="h-3 w-3" strokeWidth={2.5} />
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-[12.5px] text-ink leading-snug">
                            <span className="font-medium">{n.client_name}</span>{" "}
                            <span className="text-muted-foreground">{label}</span>{" "}
                            <span className="font-medium">{n.stage_title}</span>
                          </div>
                          <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                            {n.project_name} · {timeAgo(n.created_at)}
                          </div>
                          {n.note && (
                            <div className="text-[11.5px] text-muted-foreground mt-1 italic line-clamp-2">
                              "{n.note}"
                            </div>
                          )}
                        </div>
                        {isUnread && (
                          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                        )}
                      </div>
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
