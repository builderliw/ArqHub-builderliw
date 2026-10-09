import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type FileUIPart, type UIMessage } from "ai";
import { FileArchive, FileImage, FileText, Monitor, Plus, Ruler, Send, Trash2, X, Paperclip } from "lucide-react";
import liwAvatar from "@/assets/liw-avatar.png.asset.json";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { Link } from "@tanstack/react-router";
import { externalSupabase } from "@/integrations/external-supabase/client";

const STORAGE_KEY = "arqhub-assistente-history";
const FREE_QUESTIONS_LIMIT = 5;
const MAX_FILE_SIZE = 8 * 1024 * 1024;
const MAX_ATTACHMENTS = 3;

/** Tipos aceitos pelo assistente Liw. */
const ALLOWED_EXTENSIONS = ["pdf", "dwg", "dxf", "jpg", "jpeg", "png", "zip"] as const;

const ACCEPT_ALL = ".pdf,.dwg,.dxf,.jpg,.jpeg,.png,.zip";
const ACCEPT_DOC = ".pdf";
const ACCEPT_CAD = ".dwg,.dxf";
const ACCEPT_IMG = ".jpg,.jpeg,.png,image/jpeg,image/png";
const ACCEPT_ZIP = ".zip";

function fileExt(name: string) {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

/** Valida extensão e tamanho. Retorna mensagem de erro ou null. */
function validateFile(file: File, accept: string): string | null {
  const ext = fileExt(file.name);
  if (!ALLOWED_EXTENSIONS.includes(ext as (typeof ALLOWED_EXTENSIONS)[number])) {
    return `"${file.name}": formato não aceito. Envie PDF, DWG, DXF, JPG, PNG ou ZIP.`;
  }
  const allowed = accept
    .split(",")
    .map((a) => a.trim().replace(/^\./, "").toLowerCase())
    .filter((a) => !a.includes("/"));
  if (allowed.length && !allowed.includes(ext)) {
    return `"${file.name}": este campo aceita apenas ${allowed.map((a) => a.toUpperCase()).join(", ")}.`;
  }
  if (file.size === 0) return `"${file.name}": arquivo vazio.`;
  if (file.size > MAX_FILE_SIZE) {
    return `"${file.name}": arquivo muito grande (máx. 8 MB).`;
  }
  return null;
}


function loadInitialMessages(): UIMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as UIMessage[]) : [];
  } catch {
    return [];
  }
}

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import ReactMarkdown from "react-markdown";

function MessageResponse({ children }: { children: string }) {
  return (
    <div className="prose prose-sm max-w-none text-foreground [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
      <ReactMarkdown
        components={{
          a: ({ href, children }) => (
            <a
              href={href}
              className="text-primary underline underline-offset-2 hover:opacity-80"
            >
              {children}
            </a>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";

const SUGGESTIONS = [
  "O que é o ArqHub?",
  "Quais são os planos?",
  "Como funciona o portal do cliente?",
  "Quais as etapas de um projeto arquitetônico?",
];

export function AssistenteChat({ compact = false, hideEmptyAvatar = false }: { compact?: boolean; hideEmptyAvatar?: boolean }) {
  const transport = useRef(new DefaultChatTransport({ api: "/api/chat" })).current;
  const initialMessages = useRef<UIMessage[]>(loadInitialMessages()).current;
  const { messages, sendMessage, setMessages, status, error } = useChat({
    id: "arqhub-assistente",
    messages: initialMessages,
    transport,
  });
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [attachments, setAttachments] = useState<FileUIPart[]>([]);
  const [attachError, setAttachError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ url: string; name: string } | null>(null);
  const [loginNotice, setLoginNotice] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ left: 0, top: 0 });
  const menuBtnRef = useRef<HTMLButtonElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const acceptRef = useRef<string>(ACCEPT_ALL);
  const [acceptAttr, setAcceptAttr] = useState<string>(ACCEPT_ALL);

  const pickFiles = (accept: string) => {
    acceptRef.current = accept;
    setAcceptAttr(accept);
    const input = fileInputRef.current;
    if (!input) return;
    // set accept on the DOM node immediately and open the dialog synchronously
    input.accept = accept;
    input.click();
  };


  useEffect(() => {
    let active = true;
    externalSupabase.auth.getUser().then(({ data }) => {
      if (active) setIsLoggedIn(!!data.user);
    });
    const { data: sub } = externalSupabase.auth.onAuthStateChange((_e, session) => {
      setIsLoggedIn(!!session?.user);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const userQuestionCount = useMemo(
    () => messages.filter((m) => m.role === "user").length,
    [messages],
  );
  const limitReached = userQuestionCount >= FREE_QUESTIONS_LIMIT;
  const hasAssistantAnsweredLast = messages[messages.length - 1]?.role === "assistant";

  useEffect(() => {
    textareaRef.current?.focus();
  }, [status]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // ignore quota errors
    }
  }, [messages]);


  const isBusy = status === "submitted" || status === "streaming";

  const handleFiles = async (list: FileList | null, accept: string = ACCEPT_ALL) => {
    if (!list || !isLoggedIn) return;
    setAttachError(null);
    const errors: string[] = [];
    const next: FileUIPart[] = [];
    const room = MAX_ATTACHMENTS - attachments.length;
    if (room <= 0) {
      setAttachError(`Você pode anexar no máximo ${MAX_ATTACHMENTS} arquivos por mensagem.`);
      return;
    }
    const files = Array.from(list);
    if (files.length > room) {
      errors.push(`Somente ${room} arquivo(s) puderam ser adicionados (limite de ${MAX_ATTACHMENTS}).`);
    }
    for (const file of files.slice(0, room)) {
      const problem = validateFile(file, accept);
      if (problem) {
        errors.push(problem);
        continue;
      }
      const url = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
      next.push({
        type: "file",
        filename: file.name,
        mediaType: file.type || "application/octet-stream",
        url,
      });
    }
    if (next.length) setAttachments((prev) => [...prev, ...next].slice(0, MAX_ATTACHMENTS));
    if (errors.length) setAttachError(errors.join(" "));
  };

  const requireLogin = (action: () => void) => {
    if (!isLoggedIn) {
      setAttachError(null);
      setLoginNotice(true);
      return false;
    }
    setLoginNotice(false);
    setAttachError(null);
    action();
    return true;
  };

  // Verifica o login ANTES de fechar o menu / disparar qualquer ação
  const guardedSelect = (action: () => void) => {
    if (!isLoggedIn) {
      setAttachError(null);
      setLoginNotice(true);
      setMenuOpen(false);
      return;
    }
    setLoginNotice(false);
    // run synchronously to preserve the user gesture (file dialog / screen capture)
    action();
    setMenuOpen(false);
  };





  const captureScreen = async () => {
    setAttachError(null);
    const media = navigator.mediaDevices as MediaDevices & {
      getDisplayMedia?: (c?: unknown) => Promise<MediaStream>;
    };
    if (!media?.getDisplayMedia) {
      setAttachError("Captura de tela não suportada neste dispositivo.");
      return;
    }
    try {
      const stream = await media.getDisplayMedia({ video: true });
      const track = stream.getVideoTracks()[0];
      const video = document.createElement("video");
      video.srcObject = stream;
      await video.play();
      await new Promise((r) => setTimeout(r, 250));
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d")?.drawImage(video, 0, 0);
      track.stop();
      stream.getTracks().forEach((t) => t.stop());
      const url = canvas.toDataURL("image/png");
      setAttachments((prev) =>
        [...prev, { type: "file" as const, filename: `captura-${Date.now()}.png`, mediaType: "image/png", url }].slice(0, 3),
      );
    } catch {
      setAttachError("Não foi possível capturar a tela.");
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "u") {
        e.preventDefault();
        requireLogin(() => pickFiles(ACCEPT_ALL));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isLoggedIn]);

  const submit = (value: string) => {
    const v = value.trim();
    if ((!v && attachments.length === 0) || isBusy || limitReached) return;
    void sendMessage({ text: v || "Analise o anexo.", files: attachments });
    setText("");
    setAttachments([]);
  };

  const clearHistory = () => {
    setMessages([]);
    setAttachments([]);
    setAttachError(null);
    setLoginNotice(false);
    try {
      window.sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  return (
    <div className={compact ? "flex h-full flex-col bg-transparent" : "flex h-[70vh] flex-col rounded-2xl border border-border bg-white shadow-sm"}>
      {messages.length > 0 && (
        <div className="flex justify-end px-3 pt-2">
          <button
            type="button"
            onClick={clearHistory}
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:bg-black/5 hover:text-ink transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            Apagar histórico
          </button>
        </div>
      )}
      <Conversation className="flex-1">
        <ConversationContent>
          {messages.length === 0 ? (
            hideEmptyAvatar ? null : (
              <div className="flex h-full min-h-[200px] items-center justify-center">
                <img
                  src={liwAvatar.url}
                  alt=""
                  aria-hidden="true"
                  className="h-32 w-24 sm:h-40 sm:w-28 rounded-lg object-cover object-top shadow-lg opacity-90"
                />
              </div>
            )
          ) : (
            messages.map((m) => {
              const textParts = m.parts
                .map((p) => (p.type === "text" ? p.text : ""))
                .join("");
              return (
                <Message key={m.id} from={m.role}>
                  {m.role === "assistant" ? (
                    <MessageResponse>{textParts}</MessageResponse>
                  ) : (
                    <MessageContent>{textParts}</MessageContent>
                  )}
                </Message>
              );
            })
          )}

          {limitReached && hasAssistantAnsweredLast && (
            <Message from="assistant">
              <div className="rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-50 to-amber-100/70 p-4 shadow-sm">
                <p className="text-sm font-medium text-amber-900 mb-2">
                  🚀 Você usou seus 5 questionamentos gratuitos!
                </p>
                <p className="text-sm text-amber-800/90 mb-4 leading-relaxed">
                  Crie sua conta e desbloqueie a Liw sem limites: tire dúvidas sobre cálculos, métodos construtivos, materiais de construção, compatibilidade de projetos e qualquer tema de arquitetura ou engenharia.
                </p>
                <Link
                  to="/entrar"
                  className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-md hover:bg-primary/90 transition-colors"
                >
                  Testar 14 dias grátis
                </Link>
              </div>
            </Message>
          )}

          {status === "submitted" && (
            <div className="px-2 py-1">
              <Shimmer>Pensando...</Shimmer>
            </div>
          )}
          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
              Não consegui responder agora. Tente novamente em instantes.
            </div>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="border-t border-white/40 p-3 bg-white/40">
        {messages.length === 0 && !limitReached && (
          <div className="mb-2 -mx-1 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => submit(s)}
                disabled={isBusy || limitReached}
                className="shrink-0 rounded-full border border-border bg-white/70 backdrop-blur px-3 py-1.5 text-xs text-muted-foreground hover:bg-white hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        {attachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {attachments.map((a, i) => {
              const isImage = a.mediaType?.startsWith("image/");
              return (
                <div
                  key={`${a.filename}-${i}`}
                  className="group relative overflow-hidden rounded-xl border border-border bg-white/80"
                >
                  {isImage ? (
                    <button
                      type="button"
                      onClick={() => setPreview({ url: a.url, name: a.filename ?? "Imagem" })}
                      className="block h-16 w-16"
                      aria-label={`Pré-visualizar ${a.filename}`}
                    >
                      <img
                        src={a.url}
                        alt={a.filename ?? "Anexo"}
                        className="h-16 w-16 object-cover transition-transform group-hover:scale-105"
                      />
                    </button>
                  ) : (
                    <div className="flex h-16 max-w-[160px] items-center gap-2 px-3">
                      <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="truncate text-xs text-muted-foreground">{a.filename}</span>
                    </div>
                  )}
                  <button
                    type="button"
                    aria-label="Remover anexo"
                    onClick={() => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                    className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
        {preview && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-6"
            onClick={() => setPreview(null)}
            role="dialog"
            aria-modal="true"
          >
            <img
              src={preview.url}
              alt={preview.name}
              className="max-h-[80vh] max-w-[90vw] rounded-xl object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              type="button"
              aria-label="Fechar pré-visualização"
              onClick={() => setPreview(null)}
              className="absolute right-4 top-4 rounded-full bg-white/15 p-2 text-white hover:bg-white/25"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {loginNotice && (
          <div className="mb-2 flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            <span className="flex-1">
              Para usar anexos, captura de tela e arquivos de projetos é preciso estar logado.
            </span>
            <Link
              to="/entrar"
              className="shrink-0 rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Entrar
            </Link>
          </div>
        )}

        {attachError && (
          <p className="mb-2 text-xs text-destructive">{attachError}</p>
        )}


        <input
          ref={fileInputRef}
          type="file"
          accept={acceptAttr}
          multiple
          className="hidden"
          onChange={(e) => {
            void handleFiles(e.target.files, acceptRef.current);
            e.target.value = "";
          }}
        />

        <PromptInput
          onSubmit={(msg) => {
            if (isBusy || limitReached) return;
            submit((msg.text ?? "").trim());
          }}
        >
          <PromptInputTextarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isBusy || limitReached}
            placeholder={
              limitReached
                ? "Limite de perguntas atingido. Faça login para continuar."
                : isBusy
                  ? "Liw está respondendo..."
                  : "Escreva sua pergunta..."
            }
          />
          <PromptInputFooter className="justify-between">
            <div className="relative">
              <button
                ref={menuBtnRef}
                type="button"
                aria-label="Adicionar anexo"
                aria-expanded={menuOpen}
                disabled={isBusy || limitReached}
                onClick={() => {
                  const r = menuBtnRef.current?.getBoundingClientRect();
                  if (r) setMenuPos({ left: r.left, top: r.top - 8 });
                  setMenuOpen((v) => !v);
                }}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-white/70 text-muted-foreground transition-colors hover:bg-white hover:text-foreground disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
              </button>

              {menuOpen &&
                typeof document !== "undefined" &&
                createPortal(
                  <>
                    <div
                      className="fixed inset-0 z-[2147483000]"
                      onClick={() => setMenuOpen(false)}
                      aria-hidden="true"
                    />
                    <div
                      role="menu"
                      style={{ left: menuPos.left, top: menuPos.top, transform: "translateY(-100%)" }}
                      className="fixed z-[2147483001] w-56 overflow-hidden rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-xl"
                    >
                      {[
                        {
                          icon: FileImage,
                          label: "Imagem ou foto",
                          onSelect: () => pickFiles(ACCEPT_IMG),
                        },
                        {
                          icon: Paperclip,
                          label: "Arquivo",
                          hint: "PDF, CAD, ZIP",
                          onSelect: () => pickFiles(ACCEPT_ALL),
                        },
                        {
                          icon: Monitor,
                          label: "Captura de tela",
                          onSelect: () => void captureScreen(),
                        },
                      ].map((opt) => (
                        <button
                          key={opt.label}
                          type="button"
                          role="menuitem"
                          onClick={() => guardedSelect(opt.onSelect)}
                          className="flex w-full items-center rounded-lg px-2 py-2 text-left text-sm hover:bg-accent"
                        >
                          <opt.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span className="flex-1">{opt.label}</span>
                          {opt.hint && (
                            <span className="ml-2 text-[10px] text-muted-foreground">{opt.hint}</span>
                          )}
                        </button>
                      ))}

                      <p className="px-2 pb-1 pt-1.5 text-[10.5px] leading-snug text-muted-foreground">
                        Até 3 arquivos, 8 MB cada.
                      </p>
                    </div>
                  </>,
                  document.body,
                )}
            </div>




            <PromptInputSubmit
              status={isBusy ? "streaming" : undefined}
              disabled={isBusy || (!text.trim() && attachments.length === 0) || limitReached}
            >
              <Send className="h-4 w-4" />
            </PromptInputSubmit>
          </PromptInputFooter>

        </PromptInput>
      </div>
    </div>
  );
}
