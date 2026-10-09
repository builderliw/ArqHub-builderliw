import { coverImgProps } from "@/lib/cover-position";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Loader2, ExternalLink, Globe, Copy, Check, Instagram, Share2, QrCode,
  Eye, EyeOff, MapPin, Ruler, Calendar, Users2, Plus, Trash2, Image as ImageIcon,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { navProfissional as nav } from "@/lib/nav-profissional";
import { externalSupabase } from "@/integrations/external-supabase/client";
import { fetchOfficeExtra, saveOfficeExtra, SPECIALTIES } from "@/lib/office-onboarding";
import { toast } from "sonner";

export const Route = createFileRoute("/app/profissional/escritorio")({
  head: () => ({ meta: [{ title: "Escritório — ArqHub" }] }),
  component: EscritorioPage,
});

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60);
}

type Member = {
  id: string;
  full_name: string;
  position: string | null;
  bio: string | null;
  specialty: string | null;
  avatar_url: string | null;
  projectIds: string[];
};

type Project = {
  id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  location: string | null;
  area_m2: number | null;
  specialty: string | null;
  year: number | null;
  portfolio_visible: boolean;
};

function EscritorioPage() {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  const [officeId, setOfficeId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [bio, setBio] = useState("");
  const [history, setHistory] = useState("");
  const [foundedYear, setFoundedYear] = useState<string>("");
  const [city, setCity] = useState("");
  const [website, setWebsite] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [portfolioPublic, setPortfolioPublic] = useState(false);

  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [instagram, setInstagram] = useState("");
  const [estado, setEstado] = useState("");
  const [specialties, setSpecialties] = useState<string[]>([]);

  const [members, setMembers] = useState<Member[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: u } = await externalSupabase.auth.getUser();
      if (!u.user) return;
      const { data } = await externalSupabase
        .from("offices")
        .select("id, name, slug, bio, history, founded_year, city, website, logo_url, cover_url, portfolio_public")
        .eq("owner_id", u.user.id).limit(1).maybeSingle();
      if (data) {
        const d: any = data;
        setOfficeId(d.id);
        setName(d.name ?? "");
        setSlug(d.slug ?? "");
        setBio(d.bio ?? "");
        setHistory(d.history ?? "");
        setFoundedYear(d.founded_year ? String(d.founded_year) : "");
        setCity(d.city ?? "");
        setWebsite(d.website ?? "");
        setLogoUrl(d.logo_url ?? "");
        setCoverUrl(d.cover_url ?? "");
        setPortfolioPublic(!!d.portfolio_public);

        const extra = await fetchOfficeExtra(d.id);
        setPhone(extra.phone ?? "");
        setWhatsapp(extra.whatsapp ?? "");
        setEmail(extra.email ?? "");
        setInstagram(extra.instagram ?? "");
        setEstado(extra.estado ?? "");
        setSpecialties(extra.specialties ?? []);

        const [membersRes, projectsRes, pmRes] = await Promise.all([
          externalSupabase.from("office_members")
            .select("id, full_name, position, bio, specialty, avatar_url")
            .eq("office_id", d.id).order("created_at", { ascending: true }),
          externalSupabase.from("projects")
            .select("id, name, description, cover_url, location, area_m2, specialty, year, portfolio_visible")
            .eq("office_id", d.id).order("created_at", { ascending: false }),
          externalSupabase.from("project_members").select("project_id, member_id"),
        ]);
        const byMember = new Map<string, string[]>();
        (pmRes.data ?? []).forEach((r: any) => {
          const arr = byMember.get(r.member_id) ?? [];
          arr.push(r.project_id);
          byMember.set(r.member_id, arr);
        });
        setMembers((membersRes.data ?? []).map((m: any) => ({
          id: m.id, full_name: m.full_name, position: m.position,
          bio: m.bio, specialty: m.specialty, avatar_url: m.avatar_url,
          projectIds: byMember.get(m.id) ?? [],
        })));
        setProjects((projectsRes.data ?? []) as Project[]);
      }
      setLoading(false);
    })();
  }, []);

  const publicUrl = useMemo(() => {
    if (typeof window === "undefined" || !slug) return "";
    return `${window.location.origin}/escritorio/${slug}`;
  }, [slug]);

  async function uploadFile(kind: "logo" | "cover" | "member", file: File, memberId?: string) {
    if (!officeId) return;
    const prefix = memberId ? `${officeId}/member-${memberId}` : `${officeId}/${kind}`;
    const path = `${prefix}-${Date.now()}-${file.name.replace(/[^a-z0-9.\-_]/gi, "_")}`;
    const { error } = await externalSupabase.storage.from("office-assets").upload(path, file, {
      upsert: true, contentType: file.type,
    });
    if (error) return toast.error(`Falha no upload: ${error.message}`);
    const { data } = externalSupabase.storage.from("office-assets").getPublicUrl(path);
    if (memberId) {
      setMembers((prev) => prev.map((m) => m.id === memberId ? { ...m, avatar_url: data.publicUrl } : m));
    } else if (kind === "logo") setLogoUrl(data.publicUrl);
    else setCoverUrl(data.publicUrl);
    toast.success("Imagem enviada.");
  }

  function updateMember(id: string, patch: Partial<Member>) {
    setMembers((prev) => prev.map((m) => m.id === id ? { ...m, ...patch } : m));
  }
  function toggleMemberProject(memberId: string, projectId: string) {
    setMembers((prev) => prev.map((m) => {
      if (m.id !== memberId) return m;
      const has = m.projectIds.includes(projectId);
      return { ...m, projectIds: has ? m.projectIds.filter((x) => x !== projectId) : [...m.projectIds, projectId] };
    }));
  }
  function updateProject(id: string, patch: Partial<Project>) {
    setProjects((prev) => prev.map((p) => p.id === id ? { ...p, ...patch } : p));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!officeId) return;
    setBusy(true);
    const finalSlug = slug.trim() || slugify(name);

    // 1) offices
    const { error: e1 } = await externalSupabase.from("offices").update({
      name: name.trim(),
      slug: finalSlug || null,
      bio: bio.trim() || null,
      history: history.trim() || null,
      founded_year: foundedYear ? Number(foundedYear) : null,
      city: city.trim() || null,
      website: website.trim() || null,
      logo_url: logoUrl.trim() || null,
      cover_url: coverUrl.trim() || null,
      portfolio_public: portfolioPublic,
    }).eq("id", officeId);
    if (e1) { setBusy(false); return toast.error(e1.message); }

    // 2) extras
    const extraRes = await saveOfficeExtra(officeId, {
      phone: phone.trim() || null,
      whatsapp: whatsapp.trim() || null,
      email: email.trim() || null,
      instagram: instagram.trim() || null,
      estado: estado.trim() || null,
      specialties,
    });
    if (extraRes.error) { setBusy(false); return toast.error(extraRes.error); }

    // 3) members
    for (const m of members) {
      const { error } = await externalSupabase.from("office_members").update({
        full_name: m.full_name,
        position: m.position,
        bio: m.bio,
        specialty: m.specialty,
        avatar_url: m.avatar_url,
      }).eq("id", m.id);
      if (error) { setBusy(false); return toast.error(`Membro ${m.full_name}: ${error.message}`); }
    }

    // 4) projects (specialty / year / portfolio_visible)
    for (const p of projects) {
      const { error } = await externalSupabase.from("projects").update({
        specialty: p.specialty ?? null,
        year: p.year ?? null,
        portfolio_visible: p.portfolio_visible,
      }).eq("id", p.id);
      if (error) { setBusy(false); return toast.error(`Projeto ${p.name}: ${error.message}`); }
    }

    // 5) project_members: reset + reinsert per member
    for (const m of members) {
      await externalSupabase.from("project_members").delete().eq("member_id", m.id);
      if (m.projectIds.length > 0) {
        const rows = m.projectIds.map((pid) => ({ member_id: m.id, project_id: pid }));
        const { error } = await externalSupabase.from("project_members").insert(rows);
        if (error) { setBusy(false); return toast.error(`Vínculo ${m.full_name}: ${error.message}`); }
      }
    }

    setBusy(false);
    setSlug(finalSlug);
    toast.success("Salvo.");
  }

  function toggleSpec(s: string) {
    setSpecialties((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  }

  async function copy() {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  }

  const qrSrc = publicUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(publicUrl)}`
    : "";

  const visibleProjects = projects.filter((p) => p.portfolio_visible);

  return (
    <AppShell role="profissional" nav={nav} title="Escritório">
      <div className="mb-6 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-[22px] font-semibold tracking-tight text-ink">Cartão de visita digital</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Tudo o que aparece na sua página pública é configurado aqui — com pré-visualização em tempo real.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowPreview((v) => !v)}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-border text-[12.5px] font-medium hover:bg-secondary">
            {showPreview ? <EyeOff className="h-3.5 w-3.5"/> : <Eye className="h-3.5 w-3.5"/>}
            {showPreview ? "Ocultar preview" : "Mostrar preview"}
          </button>
          {portfolioPublic && slug && (
            <>
              <button onClick={copy}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-border text-[12.5px] font-medium hover:bg-secondary">
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600"/> : <Copy className="h-3.5 w-3.5"/>}
                {copied ? "Copiado" : "Copiar link"}
              </button>
              <button onClick={() => setShowQr((v) => !v)}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-border text-[12.5px] font-medium hover:bg-secondary">
                <QrCode className="h-3.5 w-3.5"/> QR
              </button>
              <Link to="/escritorio/$slug" params={{ slug }} target="_blank"
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-ink text-white text-[12.5px] font-medium hover:bg-black">
                <ExternalLink className="h-3.5 w-3.5"/> Abrir
              </Link>
            </>
          )}
        </div>
      </div>

      {showQr && publicUrl && (
        <div className="mb-6 max-w-md bg-white border border-border rounded-xl p-5 flex items-center gap-5">
          <img src={qrSrc} alt="QR" className="h-32 w-32 rounded-lg border border-border"/>
          <div className="text-[13px]">
            <div className="font-medium text-ink">Compartilhe seu cartão</div>
            <div className="text-muted-foreground mt-1 break-all text-[12px]">{publicUrl}</div>
            <a href={`https://wa.me/?text=${encodeURIComponent(`Conheça meu escritório: ${publicUrl}`)}`}
              target="_blank" rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-[12px] text-primary hover:underline">
              <Share2 className="h-3 w-3"/> Compartilhar por WhatsApp
            </a>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-[13px] text-muted-foreground flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin"/>Carregando...</div>
      ) : !officeId ? (
        <div className="text-[13px] text-muted-foreground">Nenhum escritório vinculado.</div>
      ) : (
        <div className={`grid ${showPreview ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)]" : "grid-cols-1"} gap-6 items-start`}>
          {/* ================= FORM ================= */}
          <form onSubmit={save} className="bg-white border border-border rounded-xl p-6 space-y-8 min-w-0">
            {/* Identidade */}
            <section className="space-y-4">
              <SectionTitle>Identidade</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nome do escritório">
                  <input required value={name} onChange={(e) => setName(e.target.value)} className={input}/>
                </Field>
                <Field label="Slug (URL)">
                  <input value={slug} onChange={(e) => setSlug(slugify(e.target.value))} placeholder="meu-escritorio" className={`${input} font-mono`}/>
                </Field>
              </div>
              <Field label="Bio curta (aparece no topo)">
                <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3}
                  placeholder="Uma linha ou dois parágrafos sobre a filosofia do escritório."
                  className={`${input} h-auto py-2`}/>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <UploadField label="Logo" url={logoUrl} onFile={(f) => uploadFile("logo", f)} onUrl={setLogoUrl}/>
                <UploadField label="Capa (hero)" url={coverUrl} onFile={(f) => uploadFile("cover", f)} onUrl={setCoverUrl}/>
              </div>
            </section>

            {/* História */}
            <section className="space-y-4 border-t border-border pt-6">
              <SectionTitle>História do escritório</SectionTitle>
              <div className="grid grid-cols-[1fr_auto] gap-3">
                <Field label="Nossa história">
                  <textarea value={history} onChange={(e) => setHistory(e.target.value)} rows={6}
                    placeholder="Como o escritório nasceu, valores, marcos importantes, prêmios..."
                    className={`${input} h-auto py-2`}/>
                </Field>
                <Field label="Fundado em">
                  <input type="number" value={foundedYear} onChange={(e) => setFoundedYear(e.target.value)}
                    placeholder="2018" className={`${input} w-24`}/>
                </Field>
              </div>
            </section>

            {/* Contato */}
            <section className="space-y-4 border-t border-border pt-6">
              <SectionTitle>Contato</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Cidade"><input value={city} onChange={(e) => setCity(e.target.value)} className={input} placeholder="São Paulo"/></Field>
                <Field label="Estado (UF)"><input value={estado} onChange={(e) => setEstado(e.target.value.toUpperCase().slice(0, 2))} className={input} placeholder="SP"/></Field>
                <Field label="Telefone"><input value={phone} onChange={(e) => setPhone(e.target.value)} className={input} placeholder="(11) 99999-9999"/></Field>
                <Field label="WhatsApp"><input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className={input} placeholder="(11) 99999-9999"/></Field>
                <Field label="E-mail"><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={input}/></Field>
                <Field label="Instagram">
                  <div className="relative">
                    <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground"/>
                    <input value={instagram} onChange={(e) => setInstagram(e.target.value)} className={`${input} pl-8`} placeholder="@meuescritorio"/>
                  </div>
                </Field>
                <Field label="Site"><input value={website} onChange={(e) => setWebsite(e.target.value)} className={input} placeholder="https://..."/></Field>
              </div>
            </section>

            {/* Especialidades */}
            <section className="space-y-3 border-t border-border pt-6">
              <SectionTitle>Especialidades do escritório</SectionTitle>
              <div className="flex flex-wrap gap-2">
                {SPECIALTIES.map((s) => {
                  const on = specialties.includes(s);
                  return (
                    <button type="button" key={s} onClick={() => toggleSpec(s)}
                      className={`px-3 h-8 rounded-full border text-[12px] transition-colors ${
                        on ? "bg-primary text-primary-foreground border-primary" : "bg-white text-muted-foreground border-border hover:border-ink/30"
                      }`}>{s}</button>
                  );
                })}
              </div>
            </section>

            {/* Arquitetos */}
            <section className="space-y-4 border-t border-border pt-6">
              <div className="flex items-center justify-between">
                <SectionTitle>Arquitetos & equipe</SectionTitle>
                <Link to="/app/profissional/equipe" className="text-[12px] text-primary hover:underline inline-flex items-center gap-1">
                  <Plus className="h-3 w-3"/> Adicionar membro
                </Link>
              </div>
              {members.length === 0 ? (
                <div className="text-[12.5px] text-muted-foreground border border-dashed border-border rounded-lg p-4">
                  Nenhum membro cadastrado. Convide sua equipe na aba <strong>Equipe</strong> para exibir biografias e projetos por arquiteto.
                </div>
              ) : (
                <div className="space-y-4">
                  {members.map((m) => (
                    <div key={m.id} className="border border-border rounded-lg p-4 space-y-3 bg-secondary/20">
                      <div className="flex items-start gap-4">
                        <label className="relative shrink-0 cursor-pointer group">
                          {m.avatar_url ? (
                            <img src={m.avatar_url} alt="" className="h-16 w-16 rounded-full object-cover border border-border"/>
                          ) : (
                            <div className="h-16 w-16 rounded-full bg-white border border-border grid place-items-center text-[18px] font-semibold text-ink">
                              {(m.full_name || "?").slice(0, 1).toUpperCase()}
                            </div>
                          )}
                          <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 grid place-items-center transition">
                            <ImageIcon className="h-4 w-4 text-white"/>
                          </div>
                          <input type="file" accept="image/*" className="hidden"
                            onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile("member", f, m.id); }}/>
                        </label>
                        <div className="flex-1 grid grid-cols-2 gap-2 min-w-0">
                          <input value={m.full_name} onChange={(e) => updateMember(m.id, { full_name: e.target.value })}
                            placeholder="Nome" className={input}/>
                          <input value={m.position ?? ""} onChange={(e) => updateMember(m.id, { position: e.target.value })}
                            placeholder="Cargo (ex: Arquiteta sócia)" className={input}/>
                          <input value={m.specialty ?? ""} onChange={(e) => updateMember(m.id, { specialty: e.target.value })}
                            placeholder="Especialidade (ex: Interiores)" className={`${input} col-span-2`}/>
                        </div>
                      </div>
                      <textarea value={m.bio ?? ""} onChange={(e) => updateMember(m.id, { bio: e.target.value })}
                        rows={2} placeholder="Biografia — formação, trajetória, prêmios..."
                        className={`${input} h-auto py-2`}/>

                      {projects.length > 0 && (
                        <div>
                          <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">Projetos assinados</div>
                          <div className="flex flex-wrap gap-1.5">
                            {projects.map((p) => {
                              const on = m.projectIds.includes(p.id);
                              return (
                                <button type="button" key={p.id} onClick={() => toggleMemberProject(m.id, p.id)}
                                  className={`px-2.5 h-7 rounded-full border text-[11.5px] transition-colors ${
                                    on ? "bg-ink text-white border-ink" : "bg-white text-muted-foreground border-border hover:border-ink/30"
                                  }`}>{p.name}</button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Projetos */}
            <section className="space-y-3 border-t border-border pt-6">
              <div className="flex items-center justify-between">
                <SectionTitle>Projetos no portfólio</SectionTitle>
                <Link to="/app/profissional/clientes" className="text-[12px] text-primary hover:underline">Gerenciar projetos</Link>
              </div>
              {projects.length === 0 ? (
                <div className="text-[12.5px] text-muted-foreground border border-dashed border-border rounded-lg p-4">
                  Nenhum projeto cadastrado ainda. Cadastre projetos na aba <strong>Clientes</strong>.
                </div>
              ) : (
                <div className="space-y-2">
                  {projects.map((p) => (
                    <div key={p.id} className="grid grid-cols-[auto_1fr_140px_90px_auto] gap-2 items-center border border-border rounded-lg p-2 bg-white">
                      <div className="h-11 w-14 rounded bg-secondary overflow-hidden shrink-0">
                        {p.cover_url && <img src={p.cover_url} alt="" className="h-full w-full object-cover"/>}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[13px] font-medium text-ink truncate">{p.name}</div>
                        {p.location && <div className="text-[11.5px] text-muted-foreground truncate">{p.location}</div>}
                      </div>
                      <select value={p.specialty ?? ""} onChange={(e) => updateProject(p.id, { specialty: e.target.value || null })}
                        className={`${input} h-9`}>
                        <option value="">Categoria...</option>
                        {SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <input type="number" value={p.year ?? ""} onChange={(e) => updateProject(p.id, { year: e.target.value ? Number(e.target.value) : null })}
                        placeholder="Ano" className={`${input} h-9`}/>
                      <label className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground shrink-0">
                        <input type="checkbox" checked={p.portfolio_visible}
                          onChange={(e) => updateProject(p.id, { portfolio_visible: e.target.checked })}/>
                        Público
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Publicação */}
            <section className="border-t border-border pt-6">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={portfolioPublic} onChange={(e) => setPortfolioPublic(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-border"/>
                <div>
                  <div className="text-[13px] font-medium text-ink flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5"/> Publicar cartão de visita
                  </div>
                  <div className="text-[12px] text-muted-foreground mt-0.5">
                    Fica visível em <code className="text-[11.5px] bg-secondary px-1 rounded">/escritorio/{slug || "seu-slug"}</code>.
                  </div>
                </div>
              </label>
            </section>

            <div className="sticky bottom-0 -mx-6 -mb-6 px-6 py-3 bg-white border-t border-border flex justify-end">
              <button type="submit" disabled={busy}
                className="inline-flex items-center gap-1.5 px-4 h-10 bg-ink text-white rounded-md text-[13px] font-medium disabled:opacity-50">
                {busy && <Loader2 className="h-3.5 w-3.5 animate-spin"/>}Salvar alterações
              </button>
            </div>
          </form>

          {/* ================= LIVE PREVIEW ================= */}
          {showPreview && (
            <aside className="sticky top-4 h-[calc(100vh-32px)] overflow-hidden rounded-xl border border-border bg-white shadow-sm">
              <div className="h-8 border-b border-border bg-secondary/40 flex items-center gap-1.5 px-3">
                <span className="h-2 w-2 rounded-full bg-red-400"/>
                <span className="h-2 w-2 rounded-full bg-yellow-400"/>
                <span className="h-2 w-2 rounded-full bg-green-400"/>
                <span className="ml-2 text-[11px] text-muted-foreground truncate">
                  arqhub.world/escritorio/{slug || "seu-slug"}
                </span>
              </div>
              <div className="h-[calc(100%-32px)] overflow-y-auto">
                <LivePreview data={{
                  name, bio, history, foundedYear, city, estado, website, logoUrl, coverUrl,
                  specialties, phone, whatsapp, email, instagram,
                  members, projects: visibleProjects,
                }}/>
              </div>
            </aside>
          )}
        </div>
      )}
    </AppShell>
  );
}

const input = "mt-1 w-full h-10 px-3 text-[13px] border border-border rounded-md outline-none focus:border-primary/60 bg-white";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-[12px] font-semibold text-ink uppercase tracking-wider">{children}</h3>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
function UploadField({
  label, url, onFile, onUrl,
}: { label: string; url: string; onFile: (f: File) => void; onUrl: (v: string) => void }) {
  return (
    <div>
      <label className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</label>
      <div className="mt-1 flex items-center gap-2">
        {url && <img src={url} alt="" className="h-10 w-10 rounded object-cover border border-border"/>}
        <input value={url} onChange={(e) => onUrl(e.target.value)} placeholder="URL ou envie um arquivo"
          className="flex-1 h-10 px-3 text-[13px] border border-border rounded-md outline-none focus:border-primary/60 bg-white"/>
        <label className="h-10 px-3 rounded-md border border-border bg-white text-[12px] font-medium hover:bg-secondary cursor-pointer inline-flex items-center gap-1.5">
          <ImageIcon className="h-3.5 w-3.5"/> Upload
          <input type="file" accept="image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }}/>
        </label>
        {url && (
          <button type="button" onClick={() => onUrl("")} className="h-10 w-10 grid place-items-center rounded-md border border-border text-muted-foreground hover:text-ink">
            <Trash2 className="h-3.5 w-3.5"/>
          </button>
        )}
      </div>
    </div>
  );
}

/* ================================================================== */
/*                        LIVE PREVIEW                                */
/* ================================================================== */
function LivePreview({ data }: { data: any }) {
  const {
    name, bio, history, foundedYear, city, estado, website, logoUrl, coverUrl,
    specialties, whatsapp, phone, email, instagram, members, projects,
  } = data;
  const loc = [city, estado].filter(Boolean).join(" · ");
  const initials = (name || "?").split(/\s+/).map((w: string) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
  const [filter, setFilter] = useState("Todos");
  const filtered = filter === "Todos" ? projects : projects.filter((p: any) => p.specialty === filter);
  const projectCats = Array.from(new Set(projects.map((p: any) => p.specialty).filter(Boolean))) as string[];

  return (
    <div className="text-[13px]">
      {/* HERO */}
      <div className="relative">
        {coverUrl ? (
          <div className="h-40 w-full overflow-hidden relative">
            <img {...coverImgProps(coverUrl)} alt="" className="h-full w-full object-cover"/>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"/>
          </div>
        ) : (
          <div className="h-24 bg-gradient-to-br from-emerald-50 via-white to-secondary"/>
        )}
        <div className="px-4 -mt-10 relative">
          <div className="bg-white border border-border rounded-xl p-4 flex items-start gap-3 shadow-sm">
            {logoUrl ? (
              <img src={logoUrl} alt="" className="h-14 w-14 rounded-lg object-cover border border-border shrink-0"/>
            ) : (
              <div className="h-14 w-14 rounded-lg bg-secondary border border-border grid place-items-center font-semibold text-ink shrink-0">{initials}</div>
            )}
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-semibold text-ink truncate">{name || "Nome do escritório"}</div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                {loc && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3"/>{loc}</span>}
                {website && <span className="inline-flex items-center gap-1"><Globe className="h-3 w-3"/>{website.replace(/^https?:\/\//, "").replace(/\/$/, "")}</span>}
                {foundedYear && <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3"/>desde {foundedYear}</span>}
              </div>
              {specialties?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {specialties.slice(0, 6).map((s: string) => (
                    <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{s}</span>
                  ))}
                </div>
              )}
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {whatsapp && <span className="text-[10.5px] px-2 py-1 rounded bg-[#25D366] text-white font-semibold">WhatsApp</span>}
                {email && <span className="text-[10.5px] px-2 py-1 rounded border border-border">E-mail</span>}
                {instagram && <span className="text-[10.5px] px-2 py-1 rounded border border-border">Instagram</span>}
                {phone && !whatsapp && <span className="text-[10.5px] px-2 py-1 rounded border border-border">Telefone</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-8">
        {bio && (
          <section>
            <div className="text-[10px] uppercase tracking-widest text-primary font-semibold">Bio</div>
            <p className="mt-1 text-[12.5px] text-ink/80 leading-relaxed whitespace-pre-line line-clamp-6">{bio}</p>
          </section>
        )}

        {history && (
          <section>
            <div className="text-[10px] uppercase tracking-widest text-primary font-semibold">Nossa história</div>
            <p className="mt-1 text-[12.5px] text-ink/80 leading-relaxed whitespace-pre-line line-clamp-[12]">{history}</p>
          </section>
        )}

        {members?.length > 0 && (
          <section>
            <div className="text-[10px] uppercase tracking-widest text-primary font-semibold">Arquitetos</div>
            <div className="mt-2 space-y-3">
              {members.map((m: any) => {
                const mProjects = projects.filter((p: any) => m.projectIds.includes(p.id));
                return (
                  <div key={m.id} className="border border-border rounded-lg p-3 bg-white">
                    <div className="flex items-center gap-3">
                      {m.avatar_url ? (
                        <img src={m.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover"/>
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-secondary grid place-items-center text-[12px] font-semibold text-ink">
                          {(m.full_name || "?").slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-[12.5px] font-semibold text-ink truncate">{m.full_name || "Sem nome"}</div>
                        <div className="text-[10.5px] text-muted-foreground truncate">
                          {[m.position, m.specialty].filter(Boolean).join(" · ")}
                        </div>
                      </div>
                    </div>
                    {m.bio && <p className="mt-2 text-[11.5px] text-ink/70 leading-relaxed line-clamp-3">{m.bio}</p>}
                    {mProjects.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {mProjects.map((p: any) => (
                          <span key={p.id} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-ink">{p.name}</span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section>
          <div className="flex items-baseline justify-between">
            <div className="text-[10px] uppercase tracking-widest text-primary font-semibold">Projetos ({projects.length})</div>
            {projectCats.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {["Todos", ...projectCats].map((c) => (
                  <button key={c} onClick={() => setFilter(c)}
                    className={`text-[10px] px-2 py-0.5 rounded-full border ${filter === c ? "bg-ink text-white border-ink" : "bg-white border-border text-muted-foreground"}`}>
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>
          {filtered.length === 0 ? (
            <div className="mt-3 border border-dashed border-border rounded-lg py-8 text-center text-[11.5px] text-muted-foreground">
              Nenhum projeto publicado.
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {filtered.map((p: any) => (
                <div key={p.id}>
                  <div className="aspect-[4/3] bg-secondary rounded overflow-hidden">
                    {p.cover_url && <img src={p.cover_url} alt="" className="h-full w-full object-cover"/>}
                  </div>
                  <div className="mt-1.5 text-[11.5px] font-medium text-ink truncate">{p.name}</div>
                  <div className="text-[10.5px] text-muted-foreground flex flex-wrap gap-x-2">
                    {p.specialty && <span>{p.specialty}</span>}
                    {p.year && <span>{p.year}</span>}
                    {p.area_m2 && <span>{p.area_m2}m²</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
