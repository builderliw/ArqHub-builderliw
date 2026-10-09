import { useEffect, useMemo, useRef, useState } from "react";
import { Send, ChevronUp, MailOpen, Search, X, Smile, Check } from "lucide-react";

const QUICK_EMOJIS = ["👍", "❤️", "😊", "🙏", "👏", "🎉", "✅", "🔥", "💡", "📎", "📅", "❓"];

const SENDER_PALETTE = ["#7c3aed", "#2563eb", "#ea580c", "#0891b2", "#c026d3", "#dc2626", "#ca8a04", "#0284c7", "#059669", "#db2777"];

// Padrão arquitetura/interior — ícones linha em tile 240×240
const ARCH_DOODLE_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240' viewBox='0 0 240 240'><g fill='none' stroke='#b8a98a' stroke-opacity='0.32' stroke-width='1.25' stroke-linecap='round' stroke-linejoin='round'>
<!-- casa -->
<path d='M20 50 L36 36 L52 50 L52 66 L20 66 Z'/><path d='M30 66 L30 56 L42 56 L42 66'/>
<!-- régua -->
<rect x='80' y='32' width='40' height='8' rx='1'/><path d='M86 32 L86 36 M92 32 L92 38 M98 32 L98 36 M104 32 L104 38 M110 32 L110 36 M116 32 L116 38'/>
<!-- compasso -->
<path d='M160 28 L150 56 M160 28 L170 56 M154 44 L166 44'/><circle cx='160' cy='26' r='2'/>
<!-- lâmpada -->
<circle cx='205' cy='40' r='7'/><path d='M202 50 L208 50 M203 54 L207 54'/>
<!-- planta -->
<path d='M40 110 q-6 -14 0 -22 q6 8 0 22 Z'/><path d='M40 110 L40 124 M34 124 L46 124'/>
<!-- cadeira -->
<path d='M88 100 L88 120 M108 100 L108 120 M86 110 L110 110 M88 100 L108 100 L106 108 L90 108 Z'/>
<!-- chave -->
<circle cx='160' cy='112' r='6'/><path d='M166 112 L186 112 M180 112 L180 118 M186 112 L186 118'/>
<!-- sofá -->
<path d='M204 104 L228 104 L228 120 L204 120 Z M204 110 L228 110'/>
<!-- triângulo de desenho -->
<path d='M22 168 L60 168 L22 200 Z'/><path d='M28 168 L28 174 M34 168 L34 172'/>
<!-- janela -->
<rect x='84' y='168' width='28' height='28'/><path d='M98 168 L98 196 M84 182 L112 182'/>
<!-- pincel -->
<path d='M150 168 L170 188 M168 168 L172 172 L170 178 L158 184 L154 180 Z'/>
<!-- escada -->
<path d='M204 196 L204 168 L210 168 L210 196 M222 196 L222 168 L228 168 L228 196 M204 176 L222 176 M204 184 L222 184 M204 192 L222 192'/>
</g></svg>`;
const ARCH_DOODLE_URL = `url("data:image/svg+xml;utf8,${encodeURIComponent(ARCH_DOODLE_SVG)}")`;

function dateLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yest = new Date(); yest.setDate(today.getDate() - 1);
  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (sameDay(d, today)) return "Hoje";
  if (sameDay(d, yest)) return "Ontem";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}


import { useProjectMessages } from "@/hooks/use-project-messages";

export function ProjectChat({
  projectId,
  height,
  mode = "default",
  variant = "default",
  onUnreadChange,
  officeId = null,
}: {
  projectId: string | null;
  height?: number | string;
  mode?: "default" | "cliente";
  variant?: "default" | "whatsapp";
  onUnreadChange?: (count: number) => void;
  officeId?: string | null;
}) {
  const isWa = variant === "whatsapp";

  const {
    messages,
    userId,
    senderNames,
    loading,
    error,
    send,
    unreadCount,
    lastReadAt,
    markAllRead,
    hasMore,
    loadOlder,
    loadingOlder,
  } = useProjectMessages(projectId, mode, officeId);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wasAtBottomRef = useRef(true);
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [showEmoji, setShowEmoji] = useState(false);

  const visibleMessages = useMemo(() => {
    let list = messages;
    if (onlyUnread) {
      list = list.filter(
        (m) => userId && m.sender_id !== userId && (!lastReadAt || m.created_at > lastReadAt),
      );
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((m) => m.body.toLowerCase().includes(q));
    }
    const sorted = list.slice().sort((a, b) => {
      const ta = new Date(a.created_at).getTime();
      const tb = new Date(b.created_at).getTime();
      return sortAsc ? ta - tb : tb - ta;
    });
    return sorted;
  }, [messages, onlyUnread, userId, lastReadAt, searchQuery, sortAsc]);

  const senderColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    const chronological = messages.slice().sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
    let i = 0;
    for (const m of chronological) {
      if (m.sender_id === userId) continue;
      if (map[m.sender_id]) continue;
      map[m.sender_id] = SENDER_PALETTE[i % SENDER_PALETTE.length];
      i++;
    }
    return map;
  }, [messages, userId]);


  // Notify parent of unread count changes
  useEffect(() => {
    onUnreadChange?.(unreadCount);
  }, [unreadCount, onUnreadChange]);

  // Auto-scroll when new messages arrive AND user was at bottom
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    if (wasAtBottomRef.current) {
      el.scrollTo({ top: el.scrollHeight });
    }
  }, [messages.length]);

  // Track scroll position
  function onScroll() {
    const el = listRef.current;
    if (!el) return;
    wasAtBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
  }

  // Auto mark-as-read when chat is in viewport and user is near bottom
  useEffect(() => {
    if (!containerRef.current || unreadCount === 0 || onlyUnread) return;

    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && wasAtBottomRef.current) {
            markAllRead();
          }
        }
      },
      { threshold: 0.4 },
    );
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, [unreadCount, markAllRead]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    await send(text);
    setText("");
    setSending(false);
    markAllRead();
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function isUnread(m: { sender_id: string; created_at: string }) {
    if (!userId || m.sender_id === userId) return false;
    if (!lastReadAt) return true;
    return m.created_at > lastReadAt;
  }

  return (
    <div
      ref={containerRef}
      className={`flex flex-col overflow-hidden h-full min-h-0 ${
        isWa ? "rounded-lg" : "border border-border rounded-lg bg-secondary/20"
      }`}
    >
      <div className={`flex flex-col gap-2 px-3 py-2 ${isWa ? "bg-[#f0f2f5] border-b border-[#d1d7db]" : "border-b border-border bg-white/60"}`}>
        <div className="flex items-center justify-between gap-2">
          {hasMore && !onlyUnread && !searchQuery.trim() ? (
            <button
              type="button"
              onClick={loadOlder}
              disabled={loadingOlder}
              className={`inline-flex items-center gap-1.5 text-[12px] font-medium hover:underline disabled:opacity-50 ${isWa ? "text-[#008069]" : "text-primary"}`}
            >
              <ChevronUp className="h-3.5 w-3.5" />
              {loadingOlder ? "Carregando..." : "Carregar mensagens anteriores"}
            </button>
          ) : <span />}
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-amber-700 hover:underline"
              >
                <MailOpen className="h-3.5 w-3.5" />
                marcar como lidas
              </button>
            )}
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar no histórico..."
            className={`w-full h-8 pl-8 pr-8 text-[12px] focus:outline-none bg-white ${
              isWa
                ? "rounded-full border border-[#d1d7db] focus:ring-2 focus:ring-[#008069]/30 focus:border-[#008069]"
                : "rounded-md border border-border focus:ring-2 focus:ring-primary/30 focus:border-primary"
            }`}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-ink"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <div
        ref={listRef}
        onScroll={onScroll}
        className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2"
        style={{
          ...(height !== undefined ? { height } : {}),
          ...(isWa
            ? {
                backgroundColor: "#efeae2",
                backgroundImage: ARCH_DOODLE_URL,
                backgroundSize: "240px 240px",
              }
            : {}),
        }}
      >
        {loading && messages.length === 0 ? (
          <p className="text-[12px] text-muted-foreground text-center">Carregando...</p>
        ) : visibleMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-10 px-6">
            <div className="text-[40px] mb-2">{onlyUnread ? "📭" : "👋"}</div>
            <p className="text-[13.5px] font-medium text-[#3b4a54]">
              {onlyUnread ? "Nenhuma mensagem não lida" : "Diga oi para começar a conversa"}
            </p>
            <p className="text-[12px] text-[#667781] mt-1 max-w-xs">
              {onlyUnread
                ? "Você está em dia com tudo. 🎉"
                : "Tire dúvidas, peça atualizações ou compartilhe ideias com o escritório. Resposta em horário comercial."}
            </p>
          </div>
        ) : (
          (() => {
            let lastDay = "";
            return visibleMessages.map((m) => {
              const mine = m.sender_id === userId;
              const unread = isUnread(m);
              const day = dateLabel(m.created_at);
              const showDivider = day !== lastDay;
              lastDay = day;
              const time = new Date(m.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

              if (isWa) {
                return (
                  <div key={m.id}>
                    {showDivider && (
                      <div className="flex justify-center my-3">
                        <span className="text-[11px] font-medium text-[#54656f] bg-white/90 px-3 py-1 rounded-md shadow-sm">
                          {day}
                        </span>
                      </div>
                    )}
                    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[75%] px-2.5 py-1.5 text-[13.5px] leading-snug whitespace-pre-wrap break-words shadow-sm ${
                          mine
                            ? "bg-[#d9fdd3] text-[#111b21] rounded-lg rounded-br-sm"
                            : "bg-white text-[#111b21] rounded-lg rounded-bl-sm"
                        }`}
                      >
                        {!mine && (
                          <div className="text-[11px] font-semibold mb-0.5" style={{ color: senderColorMap[m.sender_id] ?? "#7c3aed" }}>
                            {senderNames[m.sender_id] ?? "Usuário"}
                          </div>
                        )}
                        <div>{m.body}</div>
                        <div className="text-[10px] text-[#667781] text-right mt-0.5 -mb-0.5 inline-flex items-center gap-1 float-right ml-2">
                          <span>{time}</span>
                          {mine && <Check className="h-3 w-3 text-[#667781]" strokeWidth={2.5} />}
                          {unread && !mine && (
                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500 align-middle" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] ${mine ? "items-end" : "items-start"} flex flex-col`}>
                    {!mine && (
                      <span className="text-[10.5px] text-muted-foreground mb-0.5 px-1 inline-flex items-center gap-1">
                        {senderNames[m.sender_id] ?? "Usuário"}
                        {unread && (
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" aria-label="Nova" />
                        )}
                      </span>
                    )}
                    <div
                      className={`px-3 py-2 rounded-2xl text-[13px] whitespace-pre-wrap break-words ${
                        mine
                          ? "bg-primary text-white rounded-br-md"
                          : unread
                            ? "bg-amber-50 border border-amber-200 text-ink rounded-bl-md"
                            : "bg-white border border-border text-ink rounded-bl-md"
                      }`}
                    >
                      {m.body}
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-0.5 px-1">
                      {formatTime(m.created_at)}
                    </span>
                  </div>
                </div>
              );
            });
          })()
        )}
      </div>

      {error && <div className="text-[11.5px] text-red-600 px-4 pb-2">{error}</div>}

      <form onSubmit={handleSend} className={`relative flex items-center gap-2 p-3 ${isWa ? "bg-[#f0f2f5] border-t border-[#d1d7db]" : "border-t border-border bg-white"}`}>
        {showEmoji && (
          <div className={`absolute bottom-full left-3 mb-2 z-10 p-2 rounded-xl bg-white border border-[#d1d7db] shadow-lg grid grid-cols-6 gap-1 ${isWa ? "" : ""}`}>
            {QUICK_EMOJIS.map((em) => (
              <button
                key={em}
                type="button"
                onClick={() => { setText((t) => (t + em).slice(0, 2000)); setShowEmoji(false); }}
                className="h-9 w-9 rounded-lg hover:bg-secondary text-[20px] flex items-center justify-center transition-colors"
              >
                {em}
              </button>
            ))}
          </div>
        )}
        {isWa && (
          <button
            type="button"
            onClick={() => setShowEmoji((v) => !v)}
            aria-label="Emojis"
            className="inline-flex items-center justify-center h-10 w-10 rounded-full text-[#54656f] hover:bg-black/5 transition-colors shrink-0"
          >
            <Smile className="h-5 w-5" strokeWidth={2} />
          </button>
        )}
        <input
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 2000))}
          placeholder="Digite uma mensagem"
          maxLength={2000}
          className={`flex-1 h-10 px-4 text-[13.5px] focus:outline-none bg-white ${
            isWa
              ? "rounded-full border border-[#d1d7db] focus:ring-2 focus:ring-[#008069]/30"
              : "h-9 rounded-md border border-border focus:ring-2 focus:ring-primary/30 focus:border-primary"
          }`}
        />
        {isWa ? (
          <button
            type="submit"
            disabled={!text.trim() || sending}
            aria-label="Enviar"
            className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-[#008069] text-white hover:bg-[#017561] disabled:opacity-50 transition-colors shrink-0 shadow-sm"
          >
            <Send className="h-4 w-4" strokeWidth={2} />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!text.trim() || sending}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md bg-primary text-white text-[13px] font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            <Send className="h-3.5 w-3.5" strokeWidth={2} />
            Enviar
          </button>
        )}
      </form>
    </div>
  );
}


