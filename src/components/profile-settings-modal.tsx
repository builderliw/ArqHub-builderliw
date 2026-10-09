import { useEffect, useRef, useState } from "react";
import {
  X, Upload, Loader2, ExternalLink, Globe, Building2, User, Trash2, Plus, Users, LayoutGrid,
} from "lucide-react";
import { externalSupabase } from "@/integrations/external-supabase/client";
import { getSession, setSession } from "@/lib/session";
import { fetchOfficeExtra, saveOfficeExtra } from "@/lib/office-onboarding";
import { parseCover, buildCover } from "@/lib/cover-position";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";

async function fileToResizedDataUrl(file: File, maxSize = 512, quality = 0.85): Promise<string> {
  const dataUrl = await new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = () => rej(new Error("read"));
    r.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = () => rej(new Error("img"));
    i.src = dataUrl;
  });
  const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", quality);
}

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60);
}
function maskCNPJ(v: string) {
  return v.replace(/\D/g, "").slice(0, 14)
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}
function maskPhone(v: string) {
  return v.replace(/\D/g, "").slice(0, 11)
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}
function maskCEP(v: string) {
  return v.replace(/\D/g, "").slice(0, 8).replace(/^(\d{5})(\d)/, "$1-$2");
}



type TeamRow = {
  key: string; id?: string; full_name: string; position: string; bio: string; avatar_url: string;
};
type WorkRow = {
  key: string; id?: string; name: string; description: string; location: string;
  area_m2: string; year: string; cover_url: string;
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label className="block text-[11px] uppercase tracking-wider text-muted-foreground mb-1">{label}</label>
    {children}
  </div>
);

const inputCls =
  "w-full h-10 px-3 text-[13px] border border-border rounded-md outline-none focus:border-primary bg-white";

const SectionTitle = ({ icon: Icon, children }: { icon: any; children: React.ReactNode }) => (
  <div className="flex items-center gap-2 pt-1">
    <Icon className="h-3.5 w-3.5 text-primary" />
    <span className="text-[12px] font-semibold uppercase tracking-wider text-ink">{children}</span>
    <div className="flex-1 h-px bg-border" />
  </div>
);

export function ProfileSettingsModal({
  open, onClose, onSaved,
}: { open: boolean; onClose: () => void; onSaved?: (p: { name: string; avatar_url: string | null }) => void }) {


  // perfil
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const avatarFileRef = useRef<HTMLInputElement>(null);

  // escritório
  const [officeId, setOfficeId] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [officeName, setOfficeName] = useState("");
  const [slug, setSlug] = useState("");
  const [razaoSocial, setRazaoSocial] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [cau, setCau] = useState("");
  const [city, setCity] = useState("");
  const [estado, setEstado] = useState("");
  const [cep, setCep] = useState("");
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [bairro, setBairro] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [instagram, setInstagram] = useState("");
  const [website, setWebsite] = useState("");
  const [bio, setBio] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [coverPos, setCoverPos] = useState(50);
  const [portfolioPublic, setPortfolioPublic] = useState(false);
  const [team, setTeam] = useState<TeamRow[]>([]);
  const [removedTeam, setRemovedTeam] = useState<string[]>([]);
  const [works, setWorks] = useState<WorkRow[]>([]);
  const [removedWorks, setRemovedWorks] = useState<string[]>([]);
  const logoFileRef = useRef<HTMLInputElement>(null);
  const coverFileRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    setLoading(true);

    setRemovedTeam([]);
    setRemovedWorks([]);
    (async () => {
      const { data: u } = await externalSupabase.auth.getUser();
      if (!u.user) { setLoading(false); return; }

      const { data: p } = await externalSupabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", u.user.id)
        .maybeSingle();
      setName(p?.full_name ?? getSession()?.name ?? "");
      setAvatar(p?.avatar_url ?? null);

      const { data: office } = await externalSupabase
        .from("offices")
        .select("id, owner_id, name, slug, bio, city, website, logo_url, cover_url, portfolio_public")
        .eq("owner_id", u.user.id).limit(1).maybeSingle();

      if (office) {
        setOfficeId(office.id);
        setIsOwner(true);
        setOfficeName(office.name ?? "");
        setSlug((office as any).slug ?? "");
        setBio((office as any).bio ?? "");
        setCity((office as any).city ?? "");
        setWebsite((office as any).website ?? "");
        setLogoUrl((office as any).logo_url ?? "");
        {
          const c = parseCover((office as any).cover_url);
          setCoverUrl(c.url);
          setCoverPos(c.pos);
        }
        setPortfolioPublic(!!(office as any).portfolio_public);

        const extra = await fetchOfficeExtra(office.id);
        setRazaoSocial(extra.razao_social ?? "");
        setCnpj(extra.cnpj ?? "");
        setCau(extra.cau ?? "");
        setPhone(extra.phone ?? "");
        setWhatsapp(extra.whatsapp ?? "");
        setEmail(extra.email ?? "");
        setInstagram(extra.instagram ?? "");
        setCep(extra.cep ?? "");
        setRua(extra.rua ?? "");
        setNumero(extra.numero ?? "");
        setComplemento(extra.complemento ?? "");
        setBairro(extra.bairro ?? "");
        setEstado(extra.estado ?? "");

        const [{ data: members }, { data: projs }] = await Promise.all([
          externalSupabase.from("office_members")
            .select("id, full_name, position, bio, avatar_url")
            .eq("office_id", office.id).order("created_at", { ascending: true }),
          externalSupabase.from("projects")
            .select("id, name, description, location, area_m2, year, cover_url")
            .eq("office_id", office.id).eq("portfolio_visible", true)
            .order("created_at", { ascending: true }),
        ]);

        setTeam((members ?? []).map((m: any) => ({
          key: m.id, id: m.id, full_name: m.full_name ?? "", position: m.position ?? "",
          bio: m.bio ?? "", avatar_url: m.avatar_url ?? "",
        })));
        setWorks((projs ?? []).map((w: any) => ({
          key: w.id, id: w.id, name: w.name ?? "", description: w.description ?? "",
          location: w.location ?? "", area_m2: w.area_m2 != null ? String(w.area_m2) : "",
          year: w.year != null ? String(w.year) : "", cover_url: w.cover_url ?? "",
        })));
      } else {
        setIsOwner(false);
      }
      setLoading(false);
    })();
  }, [open]);

  async function onImageFile(
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (s: string) => void,
    maxSize = 512,
  ) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) { toast.error("Selecione uma imagem."); return; }
    if (f.size > 8 * 1024 * 1024) { toast.error("Imagem muito grande (máx 8MB)."); return; }
    try {
      const url = await fileToResizedDataUrl(f, maxSize);
      setter(url);
    } catch {
      toast.error("Não foi possível processar a imagem.");
    } finally {
      if (e.target) e.target.value = "";
    }
  }

  async function save() {
    const trimmed = name.trim();
    if (!trimmed) { toast.error("Informe um nome."); return; }
    if (trimmed.length > 80) { toast.error("Nome muito longo (máx 80)."); return; }
    setSaving(true);
    try {
      const { data: u } = await externalSupabase.auth.getUser();
      if (!u.user) throw new Error("Sessão expirada");

      // perfil
      const { error: pErr } = await externalSupabase
        .from("profiles")
        .upsert({ id: u.user.id, full_name: trimmed, avatar_url: avatar }, { onConflict: "id" });
      if (pErr) throw pErr;
      const s = getSession();
      if (s) setSession({ ...s, name: trimmed });

      // escritório (apenas dono)
      if (isOwner && officeId) {
        let finalSlug = slug.trim() || slugify(officeName || trimmed);
        if (finalSlug) {
          const { data: taken } = await externalSupabase
            .from("offices").select("id").eq("slug", finalSlug).neq("id", officeId).maybeSingle();
          if (taken) finalSlug = `${finalSlug}-${officeId.slice(0, 4)}`;
        }

        const { error: oErr } = await externalSupabase.from("offices").update({
          name: officeName.trim() || trimmed,
          slug: finalSlug || null,
          bio: bio.trim() || null,
          city: city.trim() || null,
          website: website.trim() || null,
          logo_url: logoUrl || null,
          cover_url: buildCover(coverUrl, coverPos) || null,
          portfolio_public: portfolioPublic,
        } as any).eq("id", officeId);
        if (oErr) throw oErr;

        const extraErr = (await saveOfficeExtra(officeId, {
          razao_social: razaoSocial.trim() || null,
          cnpj: cnpj || null,
          cau: cau.trim() || null,
          phone: phone || null,
          whatsapp: whatsapp || null,
          email: email.trim() || null,
          instagram: instagram.trim() || null,
          cep: cep || null,
          rua: rua.trim() || null,
          numero: numero.trim() || null,
          complemento: complemento.trim() || null,
          bairro: bairro.trim() || null,
          estado: estado.trim() || null,
          onboarding_completed: true,
          onboarded_at: new Date().toISOString(),
        })).error;
        if (extraErr) throw new Error(extraErr);

        // Equipe
        if (removedTeam.length) {
          await externalSupabase.from("office_members").delete().in("id", removedTeam);
        }
        for (const m of team) {
          if (!m.full_name.trim()) continue;
          const payload = {
            office_id: officeId,
            full_name: m.full_name.trim(),
            position: m.position.trim() || null,
            bio: m.bio.trim() || null,
            avatar_url: m.avatar_url || null,
          };
          const { error } = m.id
            ? await externalSupabase.from("office_members").update(payload as any).eq("id", m.id)
            : await externalSupabase.from("office_members").insert(payload as any);
          if (error) toast.error(`Equipe: ${error.message}`);
        }

        // Portfólio
        if (removedWorks.length) {
          await externalSupabase.from("projects")
            .update({ portfolio_visible: false } as any).in("id", removedWorks);
        }
        for (const w of works) {
          if (!w.name.trim()) continue;
          const payload = {
            office_id: officeId,
            name: w.name.trim(),
            description: w.description.trim() || null,
            location: w.location.trim() || null,
            area_m2: w.area_m2 ? Number(String(w.area_m2).replace(",", ".")) : null,
            year: w.year ? Number(String(w.year).slice(0, 4)) : null,
            cover_url: w.cover_url || null,
            portfolio_visible: true,
          };
          const { error } = w.id
            ? await externalSupabase.from("projects").update(payload as any).eq("id", w.id)
            : await externalSupabase.from("projects").insert(payload as any);
          if (error) toast.error(`Portfólio: ${error.message}`);
        }

        setSlug(finalSlug);
      }

      toast.success("Configurações salvas.");
      onSaved?.({ name: trimmed, avatar_url: avatar });
      onClose();
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;
  const initial = (name?.[0] ?? "U").toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-xl border border-border overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <h2 className="text-[15px] font-semibold text-ink">Configurações</h2>
          <button onClick={onClose} className="h-8 w-8 grid place-items-center rounded-md hover:bg-secondary/60 text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>




        <div className="p-5 space-y-4 overflow-y-auto">
          {loading ? (
            <div className="h-32 grid place-items-center text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-secondary border border-border overflow-hidden grid place-items-center text-[20px] font-semibold text-ink shrink-0">
                  {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : initial}
                </div>
                <div className="flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={() => avatarFileRef.current?.click()}
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-border bg-white text-[12.5px] font-medium hover:bg-secondary/40"
                  >
                    <Upload className="h-3.5 w-3.5" /> Alterar foto
                  </button>
                  {avatar && (
                    <button
                      type="button"
                      onClick={() => setAvatar(null)}
                      className="text-[11.5px] text-muted-foreground hover:text-ink text-left"
                    >
                      Remover foto
                    </button>
                  )}
                  <input ref={avatarFileRef} type="file" accept="image/*" onChange={(e) => onImageFile(e, (u) => setAvatar(u), 256)} className="hidden" />
                </div>
              </div>

              <Field label="Nome">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={80}
                  className={inputCls}
                  placeholder="Seu nome"
                />
              </Field>
              {isOwner && (
              <>
              {/* Capa */}
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">Capa / banner</label>
                <div
                  className={`relative h-32 w-full rounded-lg border border-border overflow-hidden bg-secondary/40 ${coverUrl ? "cursor-ns-resize" : ""}`}
                  onPointerDown={(e) => {
                    if (!coverUrl) return;
                    const el = e.currentTarget;
                    el.setPointerCapture(e.pointerId);
                    const startY = e.clientY;
                    const startPos = coverPos;
                    const move = (ev: PointerEvent) => {
                      const delta = ((ev.clientY - startY) / el.clientHeight) * 100;
                      setCoverPos(Math.max(0, Math.min(100, startPos - delta)));
                    };
                    const up = () => {
                      el.removeEventListener("pointermove", move);
                      el.removeEventListener("pointerup", up);
                    };
                    el.addEventListener("pointermove", move);
                    el.addEventListener("pointerup", up);
                  }}
                >
                  {coverUrl ? (
                    <img
                      src={coverUrl}
                      alt=""
                      draggable={false}
                      className="h-full w-full object-cover select-none"
                      style={{ objectPosition: `50% ${coverPos}%` }}
                    />
                  ) : (
                    <div className="h-full w-full grid place-items-center text-[12px] text-muted-foreground">
                      Sem capa
                    </div>
                  )}
                  <div className="absolute bottom-2 right-2 flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => coverFileRef.current?.click()}
                      className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md bg-white/95 border border-border text-[11.5px] font-medium hover:bg-white"
                    >
                      <Upload className="h-3 w-3" /> Upload
                    </button>
                    {coverUrl && (
                      <button
                        type="button"
                        onClick={() => { setCoverUrl(""); setCoverPos(50); }}
                        className="h-7 w-7 grid place-items-center rounded-md bg-white/95 border border-border text-muted-foreground hover:text-ink"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  <input ref={coverFileRef} type="file" accept="image/*" onChange={(e) => onImageFile(e, (u) => { setCoverUrl(u); setCoverPos(50); }, 1200)} className="hidden" />
                </div>
                {coverUrl && (
                  <div className="mt-2 flex items-center gap-3">
                    <span className="text-[11px] text-muted-foreground shrink-0">Enquadramento</span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={coverPos}
                      onChange={(e) => setCoverPos(Number(e.target.value))}
                      className="flex-1 accent-primary"
                    />
                    <button
                      type="button"
                      onClick={() => setCoverPos(50)}
                      className="text-[11px] text-muted-foreground hover:text-ink shrink-0"
                    >
                      Centralizar
                    </button>
                  </div>
                )}
                <p className="mt-1 text-[11px] text-muted-foreground">Arraste a imagem para cima/baixo ou use o controle para ajustar.</p>
              </div>


              {/* Logo */}
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-lg bg-secondary border border-border overflow-hidden grid place-items-center text-[18px] font-semibold text-ink shrink-0">
                  {logoUrl ? <img src={logoUrl} alt="" className="h-full w-full object-cover" /> : (officeName?.[0] ?? "E").toUpperCase()}
                </div>
                <div className="flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={() => logoFileRef.current?.click()}
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-border bg-white text-[12.5px] font-medium hover:bg-secondary/40"
                  >
                    <Upload className="h-3.5 w-3.5" /> Upload da logo
                  </button>
                  {logoUrl && (
                    <button
                      type="button"
                      onClick={() => setLogoUrl("")}
                      className="text-[11.5px] text-muted-foreground hover:text-ink text-left"
                    >
                      Remover logo
                    </button>
                  )}
                  <input ref={logoFileRef} type="file" accept="image/*" onChange={(e) => onImageFile(e, setLogoUrl, 512)} className="hidden" />
                </div>
              </div>

              <SectionTitle icon={Building2}>Dados do escritório</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nome">
                  <input value={officeName} onChange={(e) => setOfficeName(e.target.value)} className={inputCls} />
                </Field>
                <Field label="Slug (URL)">
                  <input value={slug} onChange={(e) => setSlug(slugify(e.target.value))} placeholder="meu-escritorio"
                    className={`${inputCls} font-mono`} />
                </Field>
                <Field label="Razão social">
                  <input value={razaoSocial} onChange={(e) => setRazaoSocial(e.target.value)} className={inputCls} />
                </Field>
                <Field label="CNPJ (opcional)">
                  <input value={cnpj} onChange={(e) => setCnpj(maskCNPJ(e.target.value))} placeholder="00.000.000/0000-00" className={inputCls} />
                </Field>
                <Field label="CAU / CREA">
                  <input value={cau} onChange={(e) => setCau(e.target.value)} className={inputCls} />
                </Field>
              </div>

              <SectionTitle icon={Globe}>Endereço</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                <Field label="CEP">
                  <input value={cep} onChange={(e) => setCep(maskCEP(e.target.value))} placeholder="00000-000" className={inputCls} />
                </Field>
                <Field label="Rua">
                  <input value={rua} onChange={(e) => setRua(e.target.value)} className={inputCls} />
                </Field>
                <Field label="Número">
                  <input value={numero} onChange={(e) => setNumero(e.target.value)} className={inputCls} />
                </Field>
                <Field label="Complemento">
                  <input value={complemento} onChange={(e) => setComplemento(e.target.value)} className={inputCls} />
                </Field>
                <Field label="Bairro">
                  <input value={bairro} onChange={(e) => setBairro(e.target.value)} className={inputCls} />
                </Field>
                <Field label="Cidade">
                  <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="São Paulo" className={inputCls} />
                </Field>
                <Field label="Estado (UF)">
                  <input value={estado} onChange={(e) => setEstado(e.target.value.toUpperCase().slice(0, 2))} className={inputCls} />
                </Field>
              </div>

              <SectionTitle icon={User}>Contato</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Telefone">
                  <input value={phone} onChange={(e) => setPhone(maskPhone(e.target.value))} placeholder="(11) 99999-9999" className={inputCls} />
                </Field>
                <Field label="WhatsApp">
                  <input value={whatsapp} onChange={(e) => setWhatsapp(maskPhone(e.target.value))} placeholder="(11) 99999-9999" className={inputCls} />
                </Field>
                <Field label="E-mail">
                  <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contato@escritorio.com" className={inputCls} />
                </Field>
                <Field label="Instagram">
                  <input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@seuescritorio" className={inputCls} />
                </Field>
                <div className="col-span-2">
                  <Field label="Site">
                    <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..." className={inputCls} />
                  </Field>
                </div>
              </div>

              <SectionTitle icon={Building2}>Sobre o escritório</SectionTitle>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4}
                placeholder="História, valores e diferenciais do escritório..."
                className="w-full px-3 py-2 text-[13px] border border-border rounded-md outline-none focus:border-primary" />

              {/* Equipe */}
              <SectionTitle icon={Users}>Equipe</SectionTitle>
              <div className="space-y-3">
                {team.map((m) => (
                  <div key={m.key} className="rounded-lg border border-border p-3 space-y-2.5">
                    <div className="flex items-start gap-3">
                      <label className="h-14 w-14 shrink-0 rounded-full border border-border bg-secondary/50 overflow-hidden grid place-items-center cursor-pointer">
                        {m.avatar_url
                          ? <img src={m.avatar_url} alt="" className="h-full w-full object-cover" />
                          : <Upload className="h-4 w-4 text-muted-foreground" />}
                        <input type="file" accept="image/*" className="hidden"
                          onChange={(e) => onImageFile(e, (u) => setTeam((t) => t.map((x) => x.key === m.key ? { ...x, avatar_url: u } : x)), 256)} />
                      </label>
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <input value={m.full_name} placeholder="Nome do integrante" className={inputCls}
                          onChange={(e) => setTeam((t) => t.map((x) => x.key === m.key ? { ...x, full_name: e.target.value } : x))} />
                        <input value={m.position} placeholder="Cargo / função" className={inputCls}
                          onChange={(e) => setTeam((t) => t.map((x) => x.key === m.key ? { ...x, position: e.target.value } : x))} />
                      </div>
                      <button type="button" title="Remover"
                        onClick={() => { if (m.id) setRemovedTeam((r) => [...r, m.id!]); setTeam((t) => t.filter((x) => x.key !== m.key)); }}
                        className="h-8 w-8 grid place-items-center rounded-md text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <textarea value={m.bio} rows={2} placeholder="Mini biografia..."
                      className="w-full px-3 py-2 text-[13px] border border-border rounded-md outline-none focus:border-primary"
                      onChange={(e) => setTeam((t) => t.map((x) => x.key === m.key ? { ...x, bio: e.target.value } : x))} />
                  </div>
                ))}
                <button type="button"
                  onClick={() => setTeam((t) => [...t, { key: crypto.randomUUID(), full_name: "", position: "", bio: "", avatar_url: "" }])}
                  className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-dashed border-border text-[12.5px] font-medium hover:bg-secondary/40">
                  <Plus className="h-3.5 w-3.5" /> Adicionar integrante
                </button>
              </div>

              {/* Portfólio */}
              <SectionTitle icon={LayoutGrid}>Portfólio</SectionTitle>
              <div className="space-y-3">
                {works.map((w) => (
                  <div key={w.key} className="rounded-lg border border-border p-3 space-y-2.5">
                    <div className="flex items-start gap-3">
                      <label className="h-16 w-24 shrink-0 rounded-md border border-border bg-secondary/50 overflow-hidden grid place-items-center cursor-pointer">
                        {w.cover_url
                          ? <img src={w.cover_url} alt="" className="h-full w-full object-cover" />
                          : <Upload className="h-4 w-4 text-muted-foreground" />}
                        <input type="file" accept="image/*" className="hidden"
                          onChange={(e) => onImageFile(e, (u) => setWorks((p) => p.map((x) => x.key === w.key ? { ...x, cover_url: u } : x)), 1200)} />
                      </label>
                      <div className="flex-1 grid grid-cols-3 gap-2">
                        <input value={w.name} placeholder="Nome do projeto" className={`${inputCls} col-span-3`}
                          onChange={(e) => setWorks((p) => p.map((x) => x.key === w.key ? { ...x, name: e.target.value } : x))} />
                        <input value={w.location} placeholder="Local" className={inputCls}
                          onChange={(e) => setWorks((p) => p.map((x) => x.key === w.key ? { ...x, location: e.target.value } : x))} />
                        <input value={w.area_m2} placeholder="m²" inputMode="decimal" className={inputCls}
                          onChange={(e) => setWorks((p) => p.map((x) => x.key === w.key ? { ...x, area_m2: e.target.value } : x))} />
                        <input value={w.year} placeholder="Ano" inputMode="numeric" className={inputCls}
                          onChange={(e) => setWorks((p) => p.map((x) => x.key === w.key ? { ...x, year: e.target.value.replace(/\D/g, "").slice(0, 4) } : x))} />
                      </div>
                      <button type="button" title="Remover do portfólio"
                        onClick={() => { if (w.id) setRemovedWorks((r) => [...r, w.id!]); setWorks((p) => p.filter((x) => x.key !== w.key)); }}
                        className="h-8 w-8 grid place-items-center rounded-md text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <textarea value={w.description} rows={2} placeholder="Resumo do projeto..."
                      className="w-full px-3 py-2 text-[13px] border border-border rounded-md outline-none focus:border-primary"
                      onChange={(e) => setWorks((p) => p.map((x) => x.key === w.key ? { ...x, description: e.target.value } : x))} />
                  </div>
                ))}
                <button type="button"
                  onClick={() => setWorks((p) => [...p, { key: crypto.randomUUID(), name: "", description: "", location: "", area_m2: "", year: "", cover_url: "" }])}
                  className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-dashed border-border text-[12.5px] font-medium hover:bg-secondary/40">
                  <Plus className="h-3.5 w-3.5" /> Adicionar projeto
                </button>
              </div>

              <div className="border-t border-border pt-4 space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={portfolioPublic} onChange={(e) => setPortfolioPublic(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-border" />
                  <div>
                    <div className="text-[13px] font-medium text-ink flex items-center gap-1.5">
                      <Globe className="h-3.5 w-3.5" /> Página de apresentação pública
                    </div>
                    <div className="text-[12px] text-muted-foreground mt-0.5">
                      Quando ativo, sua página fica visível em <code className="text-[11.5px] bg-secondary px-1 rounded">/escritorio/{slug || "seu-slug"}</code>.
                    </div>
                  </div>
                </label>

                {portfolioPublic && slug && (
                  <Link to="/escritorio/$slug" params={{ slug }} target="_blank"
                    className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md border border-border text-[12.5px] font-medium hover:bg-secondary/40">
                    <ExternalLink className="h-3.5 w-3.5" /> Ver página de apresentação
                  </Link>
                )}
              </div>
              </>
              )}
            </>
          )}
        </div>

        <div className="px-5 py-3 border-t border-border flex items-center justify-end gap-2 bg-secondary/30">
          <button
            onClick={onClose}
            className="h-9 px-3.5 rounded-md text-[13px] text-muted-foreground hover:bg-secondary/60"
            disabled={saving}
          >
            Cancelar
          </button>
          <button
            onClick={save}
            disabled={saving || loading}
            className="h-9 px-4 rounded-md bg-ink text-white text-[13px] font-medium inline-flex items-center gap-1.5 disabled:opacity-60"
          >
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
