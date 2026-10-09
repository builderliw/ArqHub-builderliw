import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PlayCircle, ArrowRight, GraduationCap, Megaphone, X, Volume2, VolumeX, Play, Captions, CaptionsOff } from "lucide-react";

export const Route = createFileRoute("/videos")({
  head: () => ({
    meta: [
      { title: "Vídeos — Conheça o ArqHub em ação" },
      { name: "description", content: "Assista a 6 vídeos: 3 tutoriais explicando como funciona a plataforma e 3 vídeos de apresentação do ArqHub." },
      { property: "og:title", content: "Vídeos — Conheça o ArqHub em ação" },
      { property: "og:description", content: "Tutoriais e apresentações mostrando na prática como o ArqHub organiza projetos, obra e clientes." },
    ],
  }),
  component: VideosPage,
});

type Video = {
  id: string;
  title: string;
  desc: string;
  duration: string;
  // URL de embed (YouTube). Deixe null para exibir "Em breve".
  embedUrl: string | null;
  // URL de arquivo MP4 hospedado (tem prioridade sobre embedUrl)
  mp4Url?: string;
  // Legendas WebVTT (opcional)
  vttUrl?: string;
  // Poster opcional
  poster?: string;
};

const explicativos: Video[] = [
  {
    id: "e1",
    title: "Tour completo pela plataforma",
    desc: "Um passeio guiado pelo painel do escritório: dashboard, clientes, projetos, agenda e financeiro.",
    duration: "1:55",
    embedUrl: null,
  },
  {
    id: "e2",
    title: "Portal do cliente na prática",
    desc: "Como seu cliente acompanha o projeto, aprova etapas, vê documentos e conversa direto com o escritório.",
    duration: "3:28",
    embedUrl: null,
  },
  {
    id: "e3",
    title: "Do cadastro à entrega",
    desc: "Fluxo completo: cadastre um cliente, monte o cronograma de 8 etapas e envie apresentações versionadas.",
    duration: "5:04",
    embedUrl: null,
  },
];

const propagandas: Video[] = [
  {
    id: "p1",
    title: "ArqHub — Feito para arquitetos",
    desc: "Manifesto. A ferramenta que substitui planilha, WhatsApp solto e pastas espalhadas.",
    duration: "0:45",
    embedUrl: null,
  },
  {
    id: "p2",
    title: "O cliente também merece experiência",
    desc: "Surpreenda com um portal premium e transparente do início ao fim do projeto.",
    duration: "0:38",
    embedUrl: null,
  },
  {
    id: "p3",
    title: "Comece grátis por 14 dias",
    desc: "Sem cartão de crédito. Tudo o que seu escritório precisa em uma única plataforma.",
    duration: "0:30",
    embedUrl: null,
  },
];

function VideosPage() {
  const [open, setOpen] = useState<Video | null>(null);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-border bg-gradient-to-b from-surface/60 to-white">
          <div className="max-w-6xl mx-auto px-6 py-16 md:py-20">
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← Voltar</Link>
            <div className="mt-6 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[12px] font-medium">
              <PlayCircle className="h-3.5 w-3.5" /> Biblioteca de vídeos
            </div>
            <h1 className="mt-4 font-display text-4xl md:text-5xl tracking-tight text-ink">
              Veja o ArqHub em <span className="text-primary">movimento</span>
            </h1>
            <p className="mt-3 text-lg text-muted-foreground max-w-2xl">
              Seis vídeos curtos: três explicando como a plataforma funciona no dia a dia e três mostrando
              por que arquitetos estão migrando para o ArqHub.
            </p>
          </div>
        </section>

        {/* Explicativos */}
        <section className="max-w-6xl mx-auto px-6 py-14">
          <SectionHeader
            icon={GraduationCap}
            eyebrow="Como funciona"
            title="Tutoriais da plataforma"
            desc="Passo a passo real dos painéis do escritório e do cliente."
          />
          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {explicativos.map((v, i) => (
              <VideoCard key={v.id} video={v} index={i + 1} tone="explicativo" onOpen={setOpen} />
            ))}
          </div>
        </section>

        {/* Divisor */}
        <div className="max-w-6xl mx-auto px-6"><div className="border-t border-border" /></div>

        {/* Propagandas */}
        <section className="max-w-6xl mx-auto px-6 py-14">
          <SectionHeader
            icon={Megaphone}
            eyebrow="Manifesto"
            title="Apresentações do ArqHub"
            desc="Vídeos curtos para conhecer a essência da plataforma."
          />
          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {propagandas.map((v, i) => (
              <VideoCard key={v.id} video={v} index={i + 1} tone="propaganda" onOpen={setOpen} />
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border bg-surface/40">
          <div className="max-w-4xl mx-auto px-6 py-14 text-center">
            <h2 className="font-display text-2xl md:text-3xl text-ink">
              Pronto para experimentar?
            </h2>
            <p className="mt-2 text-[15px] text-muted-foreground">
              14 dias grátis. Sem cartão. Cancele quando quiser.
            </p>
            <Link
              to="/cadastro"
              className="mt-6 inline-flex items-center gap-2 px-6 h-12 bg-ink text-white rounded-lg text-[15px] font-medium hover:bg-black transition"
            >
              Começar grátis <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />

      {/* Modal */}
      {open && <VideoModal video={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

function SectionHeader({
  icon: Icon, eyebrow, title, desc,
}: { icon: React.ComponentType<{ className?: string }>; eyebrow: string; title: string; desc: string }) {
  return (
    <div className="max-w-2xl">
      <div className="inline-flex items-center gap-2 text-[11.5px] uppercase tracking-[0.14em] text-primary font-semibold">
        <Icon className="h-3.5 w-3.5" /> {eyebrow}
      </div>
      <h2 className="mt-2 font-display text-2xl md:text-3xl text-ink tracking-tight">{title}</h2>
      <p className="mt-1.5 text-[14.5px] text-muted-foreground">{desc}</p>
    </div>
  );
}

function VideoCard({
  video, index, tone, onOpen,
}: { video: Video; index: number; tone: "explicativo" | "propaganda"; onOpen: (v: Video) => void }) {
  const isProp = tone === "propaganda";
  return (
    <button
      onClick={() => onOpen(video)}
      className="group text-left rounded-2xl border border-border bg-white overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
    >
      <div className={`relative aspect-video overflow-hidden ${
        isProp
          ? "bg-gradient-to-br from-ink via-neutral-800 to-primary/70"
          : "bg-gradient-to-br from-primary/15 via-white to-surface"
      }`}>
        {/* Miniatura (quando disponível) */}
        {video.poster && (
          <img
            src={video.poster}
            alt={video.title}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Padrão decorativo */}
        {!video.poster && (
          <div className="absolute inset-0 opacity-[0.06]" style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
            backgroundSize: "18px 18px",
            color: isProp ? "#fff" : "#000",
          }} />
        )}

        {/* Escurecimento leve para legibilidade dos badges quando há miniatura */}
        {video.poster && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-black/25" />
        )}

        {/* Play */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`h-16 w-16 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 ${
            video.poster ? "bg-white/95 text-ink" : isProp ? "bg-white/95 text-ink" : "bg-ink text-white"
          } shadow-xl`}>
            <PlayCircle className="h-8 w-8" strokeWidth={1.5} />
          </div>
        </div>

        {/* Badges */}
        <div className="absolute top-3 left-3">
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10.5px] font-semibold uppercase tracking-wider ${
            isProp ? "bg-white/90 text-ink" : "bg-ink text-white"
          }`}>
            {isProp ? "Apresentação" : `Tutorial ${index}`}
          </span>
        </div>
        <div className="absolute bottom-3 right-3">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold bg-black/70 text-white backdrop-blur">
            <PlayCircle className="h-3 w-3" /> {video.duration}
          </span>
        </div>

        {/* Em breve overlay */}
        {!video.embedUrl && !video.mp4Url && (
          <div className="absolute bottom-3 left-3">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10.5px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
              Em breve
            </span>
          </div>
        )}
      </div>

      <div className="p-5">
        <h3 className="text-[15px] font-semibold text-ink leading-snug">{video.title}</h3>
        <p className="mt-1.5 text-[13px] text-muted-foreground leading-relaxed">{video.desc}</p>
      </div>
    </button>
  );
}

function VideoModal({ video, onClose }: { video: Video; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  // Começa mudo para maximizar compatibilidade de autoplay em mobile (iOS/Android exigem muted).
  const [muted, setMuted] = useState(true);
  // Se mesmo mudo o autoplay falhar, mostramos um botão grande "Reproduzir".
  const [needsTap, setNeedsTap] = useState(false);
  // Legendas ligadas por padrão quando há VTT.
  const [captionsOn, setCaptionsOn] = useState(true);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !video.mp4Url) return;
    el.muted = true;
    el.volume = 1;
    const tryPlay = async () => {
      try {
        await el.play();
        setNeedsTap(false);
      } catch {
        setNeedsTap(true);
      }
    };
    tryPlay();
  }, [video.mp4Url]);

  // Aplica o estado de legendas ao <track> nativo.
  useEffect(() => {
    const el = videoRef.current;
    if (!el || !video.vttUrl) return;
    const apply = () => {
      const tracks = el.textTracks;
      for (let i = 0; i < tracks.length; i++) {
        tracks[i].mode = captionsOn ? "showing" : "hidden";
      }
    };
    apply();
    // Alguns navegadores só expõem o textTrack após o metadata carregar.
    el.addEventListener("loadedmetadata", apply);
    return () => el.removeEventListener("loadedmetadata", apply);
  }, [captionsOn, video.vttUrl]);

  const handleTapPlay = async () => {
    const el = videoRef.current;
    if (!el) return;
    try {
      el.muted = false;
      setMuted(false);
      await el.play();
      setNeedsTap(false);
    } catch {
      el.muted = true;
      setMuted(true);
      await el.play().catch(() => {});
      setNeedsTap(false);
    }
  };

  const toggleMute = () => {
    const el = videoRef.current;
    if (!el) return;
    const next = !el.muted;
    el.muted = next;
    setMuted(next);
    if (!next) el.play().catch(() => {});
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-black rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 h-9 w-9 rounded-full bg-black/60 text-white hover:bg-black flex items-center justify-center"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="relative aspect-video bg-black">
          {video.mp4Url ? (
            <>
              <video
                ref={videoRef}
                src={video.mp4Url}
                className="w-full h-full"
                controls
                playsInline
                preload="metadata"
                poster={video.poster}
                crossOrigin="anonymous"
              >
                {video.vttUrl && (
                  <track
                    kind="subtitles"
                    src={video.vttUrl}
                    srcLang="pt-BR"
                    label="Português"
                    default
                  />
                )}
              </video>

              {/* Botão de legendas (CC) — canto superior esquerdo */}
              {video.vttUrl && !needsTap && (
                <button
                  onClick={() => setCaptionsOn((v) => !v)}
                  className={`absolute top-3 left-3 z-10 inline-flex items-center gap-2 px-3 py-2 rounded-full text-[12.5px] font-semibold backdrop-blur transition ${
                    captionsOn ? "bg-white text-ink hover:bg-white/90" : "bg-black/70 text-white hover:bg-black"
                  }`}
                  aria-label={captionsOn ? "Desativar legendas" : "Ativar legendas"}
                  aria-pressed={captionsOn}
                >
                  {captionsOn ? <Captions className="h-4 w-4" /> : <CaptionsOff className="h-4 w-4" />}
                  {captionsOn ? "Legendas ativas" : "Legendas"}
                </button>
              )}


              {/* Botão de som (visível enquanto estiver mudo) */}
              {!needsTap && muted && (
                <button
                  onClick={toggleMute}
                  className="absolute bottom-14 left-4 z-10 inline-flex items-center gap-2 px-3 py-2 rounded-full bg-black/70 text-white text-[12.5px] font-semibold hover:bg-black backdrop-blur"
                  aria-label="Ativar som"
                >
                  <VolumeX className="h-4 w-4" /> Ativar som
                </button>
              )}
              {!needsTap && !muted && (
                <button
                  onClick={toggleMute}
                  className="absolute bottom-14 left-4 z-10 inline-flex items-center gap-2 px-3 py-2 rounded-full bg-black/60 text-white text-[12.5px] font-semibold hover:bg-black backdrop-blur"
                  aria-label="Silenciar"
                >
                  <Volume2 className="h-4 w-4" /> Som ligado
                </button>
              )}

              {/* Fallback: autoplay falhou → tap-to-play com som */}
              {needsTap && (
                <button
                  onClick={handleTapPlay}
                  className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/50 text-white"
                  aria-label="Reproduzir vídeo"
                >
                  <div className="h-20 w-20 rounded-full bg-white text-ink flex items-center justify-center shadow-2xl">
                    <Play className="h-9 w-9" fill="currentColor" />
                  </div>
                  <div className="mt-3 text-sm font-semibold">Toque para reproduzir</div>
                  <div className="text-[12px] text-white/70">com som ativado</div>
                </button>
              )}
            </>
          ) : video.embedUrl ? (
            <iframe
              src={video.embedUrl}
              title={video.title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-white/80 text-center p-8">
              <div className="h-16 w-16 rounded-full bg-white/10 flex items-center justify-center mb-4">
                <PlayCircle className="h-8 w-8" strokeWidth={1.5} />
              </div>
              <div className="text-lg font-semibold text-white">{video.title}</div>
              <div className="mt-2 text-[13px] text-white/60 max-w-md">
                Este vídeo estará disponível em breve. Fique de olho — vamos publicar aqui em primeira mão.
              </div>
            </div>
          )}
        </div>
        <div className="px-5 py-4 bg-white">
          <div className="text-[14.5px] font-semibold text-ink">{video.title}</div>
          <div className="mt-0.5 text-[12.5px] text-muted-foreground">{video.desc}</div>
        </div>
      </div>
    </div>
  );
}
