import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowLeft, Eye, Star, BookOpen } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { externalSupabase } from "@/integrations/external-supabase/client";

export function StarRating() {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  return (
    <div className="flex items-center gap-2">
      <span className="t-caption uppercase tracking-wider text-muted-foreground text-[11px] mr-1">
        {submitted ? "Obrigado!" : "Avalie:"}
      </span>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={submitted}
            onClick={() => {
              setRating(star);
              setSubmitted(true);
            }}
            onMouseEnter={() => !submitted && setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="transition-transform hover:scale-110 focus:outline-none disabled:cursor-default"
            aria-label={`${star} estrelas`}
          >
            <Star
              className={`w-5 h-5 transition-colors ${
                star <= (hover || rating)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-muted-foreground/50"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export function P({ children }: { children: React.ReactNode }) {
  return <p className="t-body text-ink/85 leading-[1.85] mb-5">{children}</p>;
}
export function Lead({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[19px] sm:text-[20px] leading-[1.7] text-ink/90 mb-6 font-light first-letter:text-[64px] first-letter:font-display first-letter:font-semibold first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:leading-[0.9] first-letter:text-primary">
      {children}
    </p>
  );
}
export function Chapter({ num, title }: { num: string; title: string }) {
  return (
    <div className="mt-20 mb-8 clear-both">
      <div className="flex items-center gap-3 mb-3">
        <BookOpen className="w-4 h-4 text-primary" />
        <span className="t-caption uppercase tracking-[0.2em] text-primary text-[11px] font-semibold">
          Capítulo {num}
        </span>
      </div>
      <h2 className="font-display text-[28px] sm:text-[36px] leading-[1.15] tracking-[-0.01em] text-ink font-semibold border-b border-border pb-5">
        {title}
      </h2>
    </div>
  );
}
export function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="t-h4 text-ink mt-8 mb-3">{children}</h3>;
}
export function Quote({ children }: { children: React.ReactNode }) {
  return (
    <blockquote className="my-10 border-l-4 border-primary pl-6 py-1 text-ink/90 italic t-body-lg clear-both">
      {children}
    </blockquote>
  );
}
export function List({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 mb-6 ml-1">
      {items.map((i) => (
        <li key={i} className="flex gap-3 t-body text-ink/85">
          <span className="mt-2.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
          <span>{i}</span>
        </li>
      ))}
    </ul>
  );
}
export function FloatFigure({
  src,
  alt,
  caption,
  side = "right",
}: {
  src: string;
  alt: string;
  caption: string;
  side?: "left" | "right";
}) {
  return (
    <figure
      className={`my-4 sm:w-[38%] sm:max-w-[460px] ${
        side === "right" ? "sm:float-right sm:ml-8 sm:mr-0" : "sm:float-left sm:mr-8 sm:ml-0"
      } sm:mb-4 mb-8`}
    >
      <div className="overflow-hidden rounded-sm">
        <img src={src} alt={alt} loading="lazy" className="w-full h-auto object-cover aspect-square" />
      </div>
      <figcaption className="mt-3 text-[12px] text-muted-foreground leading-snug border-l-2 border-primary pl-3">
        {caption}
      </figcaption>
    </figure>
  );
}
export function WideFigure({
  src,
  alt,
  caption,
  ratio = "16/9",
}: {
  src: string;
  alt: string;
  caption: string;
  ratio?: string;
}) {
  return (
    <figure className="my-12 clear-both">
      <div className="overflow-hidden rounded-sm">
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="w-full h-auto object-cover"
          style={{ aspectRatio: ratio }}
        />
      </div>
      <figcaption className="mt-3 text-[12.5px] text-muted-foreground leading-snug border-l-2 border-primary pl-3">
        {caption}
      </figcaption>
    </figure>
  );
}

export function ArticleShell({
  category,
  readTime,
  title,
  subtitle,
  backTo = "/conteudos/potencializador",
  backLabel = "Potencializador",
  children,
}: {
  category: string;
  readTime: string;
  title: string;
  subtitle: string;
  /** @deprecated - reads agora vêm do banco */
  reads?: string;
  backTo?: string;
  backLabel?: string;
  children: React.ReactNode;
}) {
  const slug = useRouterState({ select: (s) => s.location.pathname });
  const [reads, setReads] = useState<number | null>(null);
  const trackedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await externalSupabase
        .from("article_reads")
        .select("count")
        .eq("slug", slug)
        .maybeSingle();
      if (!cancelled) setReads(((data as { count: number } | null)?.count) ?? 0);
    })();
    return () => { cancelled = true; };
  }, [slug]);

  useEffect(() => {
    const sessionKey = `article_read:${slug}`;
    if (sessionStorage.getItem(sessionKey)) {
      trackedRef.current = true;
      return;
    }
    function onScroll() {
      if (trackedRef.current) return;
      const scrolled = window.scrollY + window.innerHeight;
      const total = document.documentElement.scrollHeight;
      if (total <= 0) return;
      if (scrolled / total >= 0.5) {
        trackedRef.current = true;
        sessionStorage.setItem(sessionKey, "1");
        externalSupabase
          .rpc("increment_article_read", { _slug: slug })
          .then(({ data, error }) => {
            if (!error && typeof data === "number") setReads(data);
          });
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [slug]);
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <article className="pt-10 lg:pt-14 pb-16">
          <div className="mx-auto max-w-7xl px-6">
            <div className="flex items-center gap-3 t-caption text-muted-foreground mb-6">
              <Link
                to={backTo}
                className="inline-flex items-center gap-1.5 hover:text-ink transition-colors"
              >
                <ArrowLeft className="h-3 w-3" /> {backLabel}
              </Link>
              <span className="text-border">·</span>
              <span className="uppercase tracking-[0.14em] text-primary font-semibold text-[11px]">
                {category}
              </span>
              <span className="text-border">·</span>
              <span>{readTime}</span>
            </div>


            <h1 className="font-display text-[34px] sm:text-[46px] lg:text-[54px] leading-[1.05] tracking-[-0.02em] text-ink font-semibold">
              {title}
            </h1>

            <p className="mt-6 text-[19px] sm:text-[22px] leading-[1.5] text-muted-foreground font-light">
              {subtitle}
            </p>

            <div className="mt-8 pb-8 mb-2 border-b border-border flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white font-semibold text-[13px]">
                  A
                </span>
                <div>
                  <div className="text-[13px] font-semibold text-ink">Equipe ArqHub</div>
                  <div className="text-[12px] text-muted-foreground">Publicado em junho de 2026</div>
                </div>
              </div>
              <div className="flex items-center gap-5">
                <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                  <Eye className="w-3.5 h-3.5" />
                  <span>
                    <span className="font-semibold text-ink">{(reads ?? 0).toLocaleString("pt-BR")}</span> leituras
                  </span>
                </div>
                <StarRating />
              </div>
            </div>

            {children}

            <div className="mt-16 pt-8 border-t border-border flex items-center justify-between">
              <Link
                to={backTo}
                className="inline-flex items-center gap-2 t-caption text-muted-foreground hover:text-ink transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Voltar para {backLabel}
              </Link>

              <StarRating />
            </div>
          </div>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
