import { useEffect, useState } from "react";
import { MessageSquare } from "lucide-react";

type Msg = { side: "office" | "client"; text: string; author: string };

const script: Msg[] = [
  { side: "office", author: "Escritório", text: "Oi Marina! A planta do living já está pronta pra sua aprovação 👇" },
  { side: "client", author: "Marina (cliente)", text: "Perfeito! Posso ver as opções de piso também?" },
  { side: "office", author: "Escritório", text: "Claro, enviei 3 referências no seu portal ✨" },
  { side: "client", author: "Marina (cliente)", text: "Aprovado! Adorei a segunda opção 💚" },
];

export function ChatPortalDemo() {
  const [visible, setVisible] = useState(0);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      while (!cancelled) {
        for (let i = 0; i < script.length; i++) {
          if (cancelled) return;
          setTyping(true);
          await new Promise((r) => setTimeout(r, 380));
          if (cancelled) return;
          setTyping(false);
          setVisible(i + 1);
          await new Promise((r) => setTimeout(r, 750));
        }
        await new Promise((r) => setTimeout(r, 900));
        if (cancelled) return;
        setVisible(0);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const shown = script.slice(0, visible);
  const nextSide = script[visible]?.side ?? "office";

  return (
    <div className="w-full h-full flex flex-col rounded-xl overflow-hidden border border-[#d1d7db] shadow-sm bg-[#efeae2]">
      {/* Header — estilo Portal do Cliente */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[#d1d7db] bg-[#f0f2f5]">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#008069] text-white">
          <MessageSquare className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0">
          <div className="text-[11px] font-semibold text-[#111b21] truncate">Projeto Residencial · Marina</div>
          <div className="text-[9.5px] text-[#008069] flex items-center gap-1">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#008069] animate-pulse" />
            online agora
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-3 space-y-1.5 overflow-hidden">
        {shown.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.side === "client" ? "justify-end" : "justify-start"}`}
            style={{ animation: "chat-in .35s ease-out both" }}
          >
            <div
              className={`max-w-[82%] px-2.5 py-1.5 text-[11px] leading-snug shadow-sm ${
                m.side === "office"
                  ? "bg-white text-[#111b21] rounded-lg rounded-bl-sm"
                  : "bg-[#d9fdd3] text-[#111b21] rounded-lg rounded-br-sm"
              }`}
            >
              <div className="text-[9px] font-semibold mb-0.5 text-[#7c3aed]">
                {m.author}
              </div>
              {m.text}
            </div>
          </div>
        ))}

        {typing && visible < script.length && (
          <div className={`flex ${nextSide === "client" ? "justify-end" : "justify-start"}`}>
            <div
              className={`rounded-lg px-3 py-2 flex items-center gap-1 shadow-sm ${
                nextSide === "office" ? "bg-white" : "bg-[#d9fdd3]"
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#667781]" style={{ animation: "chat-dot 1s infinite .0s" }} />
              <span className="h-1.5 w-1.5 rounded-full bg-[#667781]" style={{ animation: "chat-dot 1s infinite .15s" }} />
              <span className="h-1.5 w-1.5 rounded-full bg-[#667781]" style={{ animation: "chat-dot 1s infinite .3s" }} />
            </div>
          </div>
        )}
      </div>

      {/* Input mock */}
      <div className="border-t border-[#d1d7db] px-3 py-2 bg-[#f0f2f5] flex items-center gap-2">
        <div className="flex-1 h-7 rounded-full bg-white border border-[#d1d7db] text-[10px] text-[#667781] px-3 flex items-center">
          Escreva uma mensagem…
        </div>
        <div className="h-7 w-7 rounded-full bg-[#008069] flex items-center justify-center shrink-0">
          <svg className="h-3 w-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 2 11 13" />
            <path d="M22 2 15 22l-4-9-9-4Z" />
          </svg>
        </div>
      </div>

      <style>{`
        @keyframes chat-in {
          from { opacity: 0; transform: translateY(6px) scale(.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes chat-dot {
          0%, 60%, 100% { opacity: .35; transform: translateY(0); }
          30% { opacity: 1; transform: translateY(-2px); }
        }
      `}</style>
    </div>
  );
}
