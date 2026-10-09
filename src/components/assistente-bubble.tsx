import { X } from "lucide-react";
import liwAvatar from "@/assets/liw-avatar.png.asset.json";
import liwAvatarCircle from "@/assets/liw-avatar-new.png.asset.json";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { AssistenteChat } from "@/components/assistente-chat";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

const POS_KEY = "arqhub-liw-bubble-pos";

type Pos = { x: number; y: number };

function clampPos(p: Pos, size: number): Pos {
  const m = 8;
  const maxX = Math.max(m, window.innerWidth - size - m);
  const maxY = Math.max(m, window.innerHeight - size - m);
  return { x: Math.min(Math.max(p.x, m), maxX), y: Math.min(Math.max(p.y, m), maxY) };
}

export function AssistenteBubble() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  // Posição livre do ícone (arrastável). null = posição padrão.
  const [pos, setPos] = useState<Pos | null>(null);
  const [dragging, setDragging] = useState(false);
  const dragInfo = useRef<{ dx: number; dy: number; moved: boolean; size: number } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(POS_KEY);
      if (raw) {
        const p = JSON.parse(raw) as Pos;
        if (typeof p?.x === "number" && typeof p?.y === "number") {
          setPos(clampPos(p, triggerRef.current?.offsetWidth || 72));
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Mantém dentro da tela ao redimensionar
  useEffect(() => {
    if (!pos) return;
    const onResize = () => setPos((p) => (p ? clampPos(p, triggerRef.current?.offsetWidth || 72) : p));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [pos]);

  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    dragInfo.current = {
      dx: e.clientX - rect.left,
      dy: e.clientY - rect.top,
      moved: false,
      size: rect.width,
    };
    el.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const info = dragInfo.current;
    if (!info) return;
    const nx = e.clientX - info.dx;
    const ny = e.clientY - info.dy;
    if (!info.moved) {
      const el = triggerRef.current;
      const rect = el?.getBoundingClientRect();
      if (rect && Math.abs(nx - rect.left) < 4 && Math.abs(ny - rect.top) < 4) return;
      info.moved = true;
      setDragging(true);
    }
    setPos(clampPos({ x: nx, y: ny }, info.size));
  };

  const endDrag = (e: React.PointerEvent<HTMLButtonElement>) => {
    const info = dragInfo.current;
    dragInfo.current = null;
    try {
      triggerRef.current?.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    if (info?.moved) {
      setDragging(false);
      setPos((p) => {
        if (p) {
          try {
            window.localStorage.setItem(POS_KEY, JSON.stringify(p));
          } catch {
            // ignore
          }
        }
        return p;
      });
    }
  };


  const isPortalEscritorio = pathname.startsWith("/app/profissional");

  const hidden =
    (pathname.startsWith("/app") && !isPortalEscritorio) ||
    pathname.startsWith("/entrar") ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/pagamento") ||
    pathname.startsWith("/comprovante") ||
    pathname.startsWith("/instalar") ||
    pathname.startsWith("/abrir-chrome") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/redefinir-senha") ||
    pathname.startsWith("/auth") ||
    pathname === "/assistente" ||
    pathname === "/assistente/";

  useEffect(() => {
    if (hidden) setOpen(false);
  }, [hidden]);

  const close = useCallback(() => {
    setOpen(false);
    // devolve foco ao gatilho
    requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  // Escape global + foco inicial no botão de fechar
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        close();
      }
    };
    document.addEventListener("keydown", onKey);
    requestAnimationFrame(() => closeRef.current?.focus());
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  // Focus trap no diálogo
  const onPanelKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab" || !panelRef.current) return;
    const nodes = panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE);
    if (nodes.length === 0) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    const active = document.activeElement as HTMLElement | null;
    if (e.shiftKey && active === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  };

  if (hidden) return null;

  return (
    <>
      {!open && (
        <button
          ref={triggerRef}
          type="button"
          data-testid="assistente-bubble-trigger"
          aria-label="Abrir assistente Liw (arraste para reposicionar)"
          title="Clique para conversar • arraste para reposicionar"
          aria-expanded={false}
          aria-haspopup="dialog"
          aria-controls="assistente-panel"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onClick={() => {
            if (dragging) return;
            setOpen(true);
          }}
          style={
            pos
              ? { left: pos.x, top: pos.y, right: "auto", bottom: "auto", touchAction: "none" }
              : { touchAction: "none" }
          }
          className={`fixed z-[70] h-[72px] w-[72px] sm:h-[84px] sm:w-[84px] rounded-full overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 shadow-[0_4px_14px_rgba(0,0,0,0.15)] ${
            pos ? "" : "bottom-24 right-4 sm:right-8"
          } ${dragging ? "cursor-grabbing scale-105 shadow-2xl" : "cursor-grab transition-transform hover:scale-105"}`}
        >
          <img
            src={liwAvatarCircle.url}
            alt=""
            aria-hidden="true"
            className="h-full w-full object-cover pointer-events-none select-none"
            draggable={false}
          />
        </button>
      )}

      {open && (
        <div
          className="fixed bottom-4 right-2 sm:right-6 z-[70] flex flex-col items-end gap-0 pointer-events-none"
          style={{ maxHeight: "calc(100dvh - 1rem)" }}
        >
          <div className="relative pointer-events-none mr-2 sm:mr-4 mb-[-12px] flex items-end gap-2">
            <div className="relative mb-6 max-w-[220px] rounded-2xl bg-white/90 backdrop-blur px-4 py-3 text-sm text-ink shadow-lg">
              Olá, eu sou a Liw, sua assistente ArqHub! Como posso te ajudar?
              <span
                aria-hidden="true"
                className="absolute -right-1.5 bottom-4 h-3 w-3 rotate-45 bg-white/90"
              />
            </div>
            <img
              src={liwAvatar.url}
              alt=""
              aria-hidden="true"
              className="h-40 w-auto sm:h-52 object-contain drop-shadow-xl"
            />
          </div>

          <div
            id="assistente-panel"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Assistente Liw"
            data-testid="assistente-bubble-panel"
            onKeyDown={onPanelKeyDown}
            className="pointer-events-auto w-[min(400px,calc(100vw-1rem))] h-[min(540px,calc(100dvh-12rem))] rounded-2xl border border-white/40 bg-white/70 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-end px-3 py-2 border-b border-white/40 bg-white/40">
              <button
                ref={closeRef}
                type="button"
                aria-label="Fechar assistente"
                onClick={close}
                className="h-8 w-8 shrink-0 rounded-md hover:bg-white/60 flex items-center justify-center text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="flex-1 min-h-0">
              <AssistenteChat compact hideEmptyAvatar />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
