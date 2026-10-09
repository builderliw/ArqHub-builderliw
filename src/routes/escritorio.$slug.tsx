import { coverImgProps } from "@/lib/cover-position";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  MapPin, Globe, ArrowLeft, Ruler, Calendar, Phone, Mail, Instagram,
  MessageCircle, Share2, Copy, Check, X, Users2,
} from "lucide-react";
import { externalSupabase } from "@/integrations/external-supabase/client";
import { SiteFooter } from "@/components/site-footer";
import arqhubLogoAsset from "@/assets/arqhub-logo.png.asset.json";
import projectPlaceholder from "@/assets/project-placeholder.jpg.asset.json";

export const Route = createFileRoute("/escritorio/$slug")({
  loader: async ({ params }) => {
    const { data: office } = await externalSupabase
      .from("offices")
      .select(
        "id, name, slug, bio, history, founded_year, city, estado, website, logo_url, cover_url, portfolio_public, phone, whatsapp, email, instagram, specialties, team_size",
      )
      .eq("slug", params.slug)
      .eq("portfolio_public", true)
      .maybeSingle();
    if (!office) throw notFound();

    const [{ data: projects }, { data: members }] = await Promise.all([
      externalSupabase
        .from("projects")
        .select("id, name, description, cover_url, location, area_m2, deadline, status, specialty, year, created_at")
        .eq("office_id", (office as any).id)
        .eq("portfolio_visible", true)
        .order("created_at", { ascending: false }),
      externalSupabase
        .from("office_members")
        .select("id, full_name, position, bio, specialty, avatar_url")
        .eq("office_id", (office as any).id)
        .limit(24),
    ]);

    const memberIds = (members ?? []).map((m: any) => m.id);
    let pm: any[] = [];
    if (memberIds.length > 0) {
      const { data } = await externalSupabase
        .from("project_members")
        .select("project_id, member_id")
        .in("member_id", memberIds);
      pm = data ?? [];
    }
    const projectsByMember = new Map<string, string[]>();
    pm.forEach((r) => {
      const arr = projectsByMember.get(r.member_id) ?? [];
      arr.push(r.project_id);
      projectsByMember.set(r.member_id, arr);
    });
    const membersWithProjects = (members ?? []).map((m: any) => ({
      ...m,
      name: m.full_name ?? m.name,
      projectIds: projectsByMember.get(m.id) ?? [],
    }));

    return { office, projects: projects ?? [], members: membersWithProjects };
  },
  head: ({ loaderData, params }) => {
    const o: any = loaderData?.office;
    if (!o) return { meta: [{ title: "Portfólio — ArqHub" }] };
    const title = `${o.name} — Arquitetura & Projetos`;
    const desc = o.bio ?? `Conheça o portfólio de ${o.name}${o.city ? " em " + o.city : ""}.`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "profile" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: desc },
        ...(o.cover_url ? [
          { property: "og:image", content: o.cover_url },
          { name: "twitter:image", content: o.cover_url },
        ] : []),
      ],
    };
  },
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center px-6 bg-white">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-ink">Portfólio não encontrado</h1>
        <p className="text-sm text-muted-foreground mt-2">Esta página não existe ou não está pública.</p>
        <Link to="/" className="mt-4 inline-flex items-center gap-1 text-sm text-primary hover:underline">
          <ArrowLeft className="h-4 w-4"/> Voltar
        </Link>
      </div>
    </div>
  ),
  errorComponent: () => (
    <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
      Erro ao carregar portfólio.
    </div>
  ),
  component: OfficePortfolio,
});

function normalizePhone(p?: string | null) {
  if (!p) return null;
  return p.replace(/\D+/g, "");
}
function instagramUrl(v?: string | null) {
  if (!v) return null;
  const t = v.trim().replace(/^@/, "");
  if (/^https?:\/\//i.test(t)) return t;
  return `https://instagram.com/${t}`;
}

function OfficePortfolio() {
  const { office, projects, members } = Route.useLoaderData() as any;
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState<any>(null);

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const wa = normalizePhone(office.whatsapp || office.phone);
  const ig = instagramUrl(office.instagram);

  const specialties: string[] = Array.isArray(office.specialties) ? office.specialties : [];
  const locationLabel = [office.city, office.estado].filter(Boolean).join(" · ");

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  }

  async function nativeShare() {
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      try {
        await (navigator as any).share({
          title: `${office.name} — Portfólio`,
          text: office.bio ?? `Conheça o portfólio de ${office.name}`,
          url: shareUrl,
        });
        return;
      } catch {}
    }
    copyLink();
  }

  const heroInitials = useMemo(
    () =>
      (office.name || "?")
        .split(/\s+/)
        .map((w: string) => w[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase(),
    [office.name],
  );

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* HERO */}
      <header className="relative">
        {office.cover_url ? (
          <div className="h-[52vh] min-h-[360px] w-full overflow-hidden relative">
            <img {...coverImgProps(office.cover_url)} alt={office.name} className="h-full w-full object-cover"/>
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent"/>
          </div>
        ) : (
          <div className="h-[36vh] min-h-[240px] bg-gradient-to-br from-emerald-50 via-white to-secondary"/>
        )}

        <Link
          to="/portfolio"
          className="absolute top-4 left-4 z-10 inline-flex items-center gap-1 rounded-full bg-white/90 hover:bg-white text-ink text-[12px] font-medium px-3 py-1.5 shadow-sm backdrop-blur"
        >
          <ArrowLeft className="h-3.5 w-3.5"/> Portfólios
        </Link>

        <div className="max-w-6xl mx-auto px-6 -mt-24 sm:-mt-20 relative">
          <div className="bg-white border border-border rounded-2xl p-6 sm:p-8 shadow-[0_16px_50px_-20px_rgba(0,0,0,0.25)] flex flex-col sm:flex-row items-start gap-5">
            {office.logo_url ? (
              <img src={office.logo_url} alt="" className="h-20 w-20 rounded-xl object-cover border border-border shrink-0"/>
            ) : (
              <div className="h-20 w-20 rounded-xl bg-secondary border border-border shrink-0 flex items-center justify-center text-ink font-semibold text-xl">
                {heroInitials}
              </div>
            )}

            <div className="flex-1 min-w-0 w-full">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h1 className="text-2xl sm:text-[28px] font-semibold tracking-tight text-ink">{office.name}</h1>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-muted-foreground">
                    {locationLabel && (
                      <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5"/>{locationLabel}</span>
                    )}
                    {office.website && (
                      <a href={office.website} target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-1 hover:text-primary">
                        <Globe className="h-3.5 w-3.5"/>{office.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                      </a>
                    )}
                    {office.team_size && (
                      <span className="inline-flex items-center gap-1"><Users2 className="h-3.5 w-3.5"/>{office.team_size} pessoas</span>
                    )}
                  </div>
                </div>

                {/* Share cluster */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={copyLink}
                    className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full border border-border text-[12.5px] font-medium text-ink hover:bg-secondary transition-colors"
                    title="Copiar link"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-600"/> : <Copy className="h-3.5 w-3.5"/>}
                    {copied ? "Copiado" : "Copiar link"}
                  </button>
                  <button
                    onClick={nativeShare}
                    className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full bg-ink text-white text-[12.5px] font-medium hover:bg-black"
                  >
                    <Share2 className="h-3.5 w-3.5"/> Compartilhar
                  </button>
                </div>
              </div>

              {specialties.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {specialties.map((s) => (
                    <span key={s} className="text-[11.5px] px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">
                      {s}
                    </span>
                  ))}
                </div>
              )}

              {/* Contatos CTAs */}
              <div className="mt-5 flex flex-wrap gap-2">
                {wa && (
                  <a
                    href={`https://wa.me/${wa}?text=${encodeURIComponent(`Olá, ${office.name}! Vim pelo seu portfólio.`)}`}
                    target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-[#25D366] text-white text-[12.5px] font-semibold hover:brightness-95"
                  >
                    <MessageCircle className="h-4 w-4"/> WhatsApp
                  </a>
                )}
                {office.email && (
                  <a href={`mailto:${office.email}`}
                    className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg border border-border text-ink text-[12.5px] font-medium hover:bg-secondary">
                    <Mail className="h-4 w-4"/> E-mail
                  </a>
                )}
                {office.phone && !wa && (
                  <a href={`tel:${office.phone}`}
                    className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg border border-border text-ink text-[12.5px] font-medium hover:bg-secondary">
                    <Phone className="h-4 w-4"/> Ligar
                  </a>
                )}
                {ig && (
                  <a href={ig} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg border border-border text-ink text-[12.5px] font-medium hover:bg-secondary">
                    <Instagram className="h-4 w-4"/> Instagram
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-14 flex-1 w-full space-y-16">
        {/* HISTÓRIA */}
        {(office.history || office.bio) && (
          <section>
            <div className="text-[11px] uppercase tracking-[0.18em] text-primary font-semibold">Sobre o escritório</div>
            <h2 className="mt-1 text-xl sm:text-2xl font-semibold text-ink">
              Nossa história{office.founded_year ? ` · desde ${office.founded_year}` : ""}
            </h2>
            {office.bio && (
              <p className="mt-4 text-[15px] leading-relaxed text-ink/80 max-w-3xl whitespace-pre-line">
                {office.bio}
              </p>
            )}
            {office.history && (
              <p className="mt-4 text-[14.5px] leading-relaxed text-ink/75 max-w-3xl whitespace-pre-line">
                {office.history}
              </p>
            )}
          </section>
        )}

        {/* ARQUITETOS */}
        {members.length > 0 && (
          <section>
            <div className="text-[11px] uppercase tracking-[0.18em] text-primary font-semibold">Arquitetos</div>
            <h2 className="mt-1 text-xl sm:text-2xl font-semibold text-ink">Quem faz acontecer</h2>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
              {members.map((m: any) => {
                const mProjects = projects.filter((p: any) => m.projectIds?.includes(p.id));
                return (
                  <article key={m.id} className="p-5 border border-border rounded-xl bg-white">
                    <div className="flex items-start gap-4">
                      {m.avatar_url ? (
                        <img src={m.avatar_url} alt="" className="h-16 w-16 rounded-full object-cover shrink-0"/>
                      ) : (
                        <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center text-[16px] font-semibold text-ink shrink-0">
                          {(m.name || "?").slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-[15px] font-semibold text-ink">{m.name ?? "Membro"}</div>
                        <div className="text-[12px] text-muted-foreground">
                          {[m.position, m.specialty].filter(Boolean).join(" · ")}
                        </div>
                      </div>
                    </div>
                    {m.bio && (
                      <p className="mt-3 text-[13px] text-ink/75 leading-relaxed whitespace-pre-line">{m.bio}</p>
                    )}
                    {mProjects.length > 0 && (
                      <div className="mt-4">
                        <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground mb-1.5">
                          Projetos assinados
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {mProjects.map((p: any) => (
                            <button key={p.id} onClick={() => setOpen(p)}
                              className="text-[11.5px] px-2.5 py-1 rounded-full bg-secondary text-ink hover:bg-border">
                              {p.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* PROJETOS */}
        <ProjectsGallery projects={projects} onOpen={setOpen} />



        {/* CTA FINAL */}
        <section className="border-t border-border pt-10 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <img src={arqhubLogoAsset.url} alt="ArqHub" className="h-7 w-auto opacity-80"/>
            <span className="text-[12px] text-muted-foreground">
              Cartão de visita digital criado no ArqHub
            </span>
          </div>
          <Link to="/cadastro" className="text-[12.5px] font-medium text-primary hover:underline">
            Crie o seu →
          </Link>
        </section>
      </main>

      {/* LIGHTBOX PROJETO */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setOpen(null)}
        >
          <div className="max-w-4xl w-full bg-white rounded-2xl overflow-hidden grid md:grid-cols-[1.4fr_1fr]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative bg-secondary aspect-[4/3] md:aspect-auto md:min-h-[440px]">
              <ProjectCover
                src={open.cover_url}
                alt={open.name}
                className="absolute inset-0 h-full w-full"
              />
            </div>
            <div className="p-7 relative">
              <button onClick={() => setOpen(null)}
                className="absolute top-3 right-3 h-8 w-8 rounded-full bg-secondary hover:bg-border flex items-center justify-center">
                <X className="h-4 w-4"/>
              </button>
              <h3 className="text-xl font-semibold text-ink pr-8">{open.name}</h3>
              <dl className="mt-5 space-y-2 text-[13px]">
                {open.location && <div className="flex items-center gap-2 text-ink"><MapPin className="h-4 w-4 text-muted-foreground"/>{open.location}</div>}
                {open.area_m2 && <div className="flex items-center gap-2 text-ink"><Ruler className="h-4 w-4 text-muted-foreground"/>{open.area_m2} m²</div>}
                {open.deadline && <div className="flex items-center gap-2 text-ink"><Calendar className="h-4 w-4 text-muted-foreground"/>{new Date(open.deadline).getFullYear()}</div>}
              </dl>
              {open.description && (
                <p className="mt-5 text-[13.5px] text-muted-foreground leading-relaxed whitespace-pre-line">
                  {open.description}
                </p>
              )}
              {wa && (
                <a
                  href={`https://wa.me/${wa}?text=${encodeURIComponent(`Olá! Tenho interesse no projeto "${open.name}".`)}`}
                  target="_blank" rel="noreferrer"
                  className="mt-6 inline-flex items-center gap-1.5 h-10 px-4 rounded-lg bg-[#25D366] text-white text-[13px] font-semibold hover:brightness-95"
                >
                  <MessageCircle className="h-4 w-4"/> Falar sobre este projeto
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      <SiteFooter />
    </div>
  );
}

function ProjectCover({ src, alt, className = "" }: { src?: string | null; alt: string; className?: string }) {
  const [error, setError] = useState(false);
  const url = src && !error ? src : projectPlaceholder.url;
  return (
    <img
      src={url}
      alt={alt}
      loading="lazy"
      onError={() => setError(true)}
      className={`object-cover ${className}`}
    />
  );
}

function ProjectsGallery({ projects, onOpen }: { projects: any[]; onOpen: (p: any) => void }) {
  const [filter, setFilter] = useState<string>("Todos");
  const cats = useMemo(() => {
    const s = new Set<string>();
    projects.forEach((p) => { if (p.specialty) s.add(p.specialty); });
    return Array.from(s).sort();
  }, [projects]);
  const filtered = filter === "Todos" ? projects : projects.filter((p) => p.specialty === filter);

  return (
    <section>
      <div className="flex items-baseline justify-between flex-wrap gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-primary font-semibold">Portfólio</div>
          <h2 className="mt-1 text-xl sm:text-2xl font-semibold text-ink">Projetos relevantes</h2>
        </div>
        <span className="text-[12px] text-muted-foreground">{filtered.length} publicado(s)</span>
      </div>

      {cats.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {["Todos", ...cats].map((c) => (
            <button key={c} onClick={() => setFilter(c)}
              className={`px-3 h-8 rounded-full border text-[12px] transition-colors ${
                filter === c ? "bg-ink text-white border-ink" : "bg-white text-muted-foreground border-border hover:border-ink/30"
              }`}>
              {c}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="mt-8 border border-dashed border-border rounded-xl py-16 text-center text-[13px] text-muted-foreground">
          Nenhum projeto publicado {filter !== "Todos" ? `em "${filter}"` : "no portfólio ainda"}.
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((p: any) => (
            <button key={p.id} onClick={() => onOpen(p)} className="group text-left">
              <div className="aspect-[4/3] bg-secondary rounded-xl overflow-hidden">
                <ProjectCover
                  src={p.cover_url}
                  alt={p.name}
                  className="h-full w-full group-hover:scale-[1.03] transition-transform duration-500"
                />
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-[14.5px] font-semibold text-ink">{p.name}</h3>
                  {p.specialty && (
                    <span className="text-[10.5px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium shrink-0">
                      {p.specialty}
                    </span>
                  )}
                </div>
                {p.description && <p className="mt-1 text-[12.5px] text-muted-foreground line-clamp-2">{p.description}</p>}
                <div className="mt-2 flex flex-wrap items-center gap-3 text-[11.5px] text-muted-foreground">
                  {p.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3"/>{p.location}</span>}
                  {p.area_m2 && <span className="inline-flex items-center gap-1"><Ruler className="h-3 w-3"/>{p.area_m2} m²</span>}
                  {(p.year || p.deadline) && <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3"/>{p.year ?? new Date(p.deadline).getFullYear()}</span>}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
