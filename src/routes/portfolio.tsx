import { coverImgProps } from "@/lib/cover-position";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { externalSupabase } from "@/integrations/external-supabase/client";
import { ArrowRight, MapPin, Loader2, Search } from "lucide-react";

export const Route = createFileRoute("/portfolio")({
  head: () => ({
    meta: [
      { title: "Portfólios de Escritórios — ArqHub" },
      {
        name: "description",
        content:
          "Descubra escritórios de arquitetura no ArqHub. Cartões de visita digitais com história, equipe, contato e projetos reais.",
      },
      { property: "og:title", content: "Portfólios de Escritórios — ArqHub" },
      {
        property: "og:description",
        content: "Cartões de visita digitais de escritórios de arquitetura reais.",
      },
    ],
  }),
  component: Portfolio,
});

type Office = {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  city: string | null;
  estado: string | null;
  logo_url: string | null;
  cover_url: string | null;
  specialties: string[] | null;
};

function Portfolio() {
  const [offices, setOffices] = useState<Office[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<string>("Todos");

  useEffect(() => {
    (async () => {
      const { data } = await externalSupabase
        .from("offices")
        .select("id, name, slug, bio, city, estado, logo_url, cover_url, specialties")
        .eq("portfolio_public", true)
        .not("slug", "is", null)
        .order("name", { ascending: true });
      setOffices((data as any) ?? []);
      setLoading(false);
    })();
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    offices.forEach((o) => (o.specialties ?? []).forEach((s) => s && set.add(s)));
    return ["Todos", ...Array.from(set).sort()];
  }, [offices]);

  const visible = useMemo(() => {
    const term = q.trim().toLowerCase();
    return offices.filter((o) => {
      if (filter !== "Todos" && !(o.specialties ?? []).includes(filter)) return false;
      if (!term) return true;
      return (
        o.name.toLowerCase().includes(term) ||
        (o.city ?? "").toLowerCase().includes(term) ||
        (o.bio ?? "").toLowerCase().includes(term)
      );
    });
  }, [offices, filter, q]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        {/* HERO */}
        <section className="py-8 lg:py-10 bg-surface border-b border-border">
          <div className="mx-auto max-w-6xl px-6">
            <div className="t-eyebrow text-primary mb-2">Portfólios</div>
            <h1 className="t-h1 max-w-3xl">
              Escritórios de arquitetura. Cartões de visita reais.
            </h1>
            <p className="mt-3 t-body text-muted-foreground max-w-2xl">
              Cada escritório do ArqHub pode publicar sua página com história, equipe, projetos e
              contato — pronta para colocar na bio do Instagram.
            </p>

            <div className="mt-5 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Buscar por nome, cidade ou palavra-chave..."
                  className="w-full h-10 pl-10 pr-3 rounded-full border border-border bg-white text-[13.5px] outline-none focus:border-primary/60"
                />
              </div>
            </div>

            {categories.length > 1 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => setFilter(c)}
                    className={`t-label px-4 py-1.5 rounded-full border transition-colors ${
                      filter === c
                        ? "bg-ink text-white border-ink"
                        : "bg-white text-muted-foreground border-border hover:text-ink hover:border-ink/30"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* GRID */}
        <section className="py-8 lg:py-10">
          <div className="mx-auto max-w-6xl px-6">
            {loading ? (
              <div className="py-24 flex items-center justify-center text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2"/> Carregando escritórios...
              </div>
            ) : visible.length === 0 ? (
              <div className="py-20 text-center">
                <p className="t-body text-muted-foreground">
                  Nenhum escritório publicou seu portfólio ainda.
                </p>
                <Link
                  to="/cadastro"
                  className="mt-5 inline-flex items-center gap-1.5 h-11 px-5 bg-primary text-primary-foreground rounded-lg t-label hover:brightness-95"
                >
                  Seja o primeiro <ArrowRight className="h-4 w-4"/>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {visible.map((o) => (
                  <Link
                    key={o.id}
                    to="/escritorio/$slug"
                    params={{ slug: o.slug }}
                    className="group overflow-hidden rounded-2xl bg-white border border-border transition-all hover:shadow-[0_16px_40px_-16px_rgba(0,0,0,0.18)] hover:-translate-y-0.5"
                  >
                    <div className="aspect-[4/3] bg-secondary relative overflow-hidden">
                      {o.cover_url ? (
                        <img
                          {...coverImgProps(o.cover_url)}
                          alt={o.name}
                          loading="lazy"
                          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                        />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-emerald-50 to-white"/>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-ink/45 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"/>
                    </div>
                    <div className="p-5">
                      <div className="flex items-center gap-3">
                        {o.logo_url ? (
                          <img src={o.logo_url} alt="" className="h-10 w-10 rounded-lg object-cover border border-border"/>
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-secondary border border-border flex items-center justify-center text-[13px] font-semibold text-ink">
                            {o.name.slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="t-body font-semibold text-ink truncate">{o.name}</div>
                          {(o.city || o.estado) && (
                            <div className="t-caption text-muted-foreground inline-flex items-center gap-1">
                              <MapPin className="h-3 w-3"/>
                              {[o.city, o.estado].filter(Boolean).join(", ")}
                            </div>
                          )}
                        </div>
                      </div>
                      {o.bio && (
                        <p className="mt-3 t-body-sm text-muted-foreground line-clamp-2">{o.bio}</p>
                      )}
                      {(o.specialties ?? []).length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {(o.specialties ?? []).slice(0, 3).map((s) => (
                            <span key={s} className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
