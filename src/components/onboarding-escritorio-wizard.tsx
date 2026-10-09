import { useEffect, useState } from "react";
import { Loader2, ArrowRight, ArrowLeft, Check, Upload, Building2, MapPin, Image as ImageIcon, Settings2, Sparkles, Users, LayoutGrid, Plus, Trash2 } from "lucide-react";
import { externalSupabase } from "@/integrations/external-supabase/client";
import { toast } from "sonner";
import {
  fetchOfficeExtra,
  saveOfficeExtra,
  SPECIALTIES,
  TEAM_SIZES,
  type OfficeExtra,
} from "@/lib/office-onboarding";

type Props = {
  officeId: string;
  initialName?: string | null;
  onComplete: () => void;
};

type TeamDraft = { key: string; full_name: string; position: string; bio: string; avatar_url: string };
type WorkDraft = {
  key: string; name: string; description: string; location: string;
  area_m2: string; year: string; cover_url: string;
};

const TOTAL_STEPS = 6;

const STEPS = [
  { n: 1, label: "Dados", icon: Building2 },
  { n: 2, label: "Endereço", icon: MapPin },
  { n: 3, label: "Identidade", icon: ImageIcon },
  { n: 4, label: "Perfil", icon: Settings2 },
  { n: 5, label: "Equipe", icon: Users },
  { n: 6, label: "Portfólio", icon: LayoutGrid },
];


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

function slugify(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

async function fileToDataUrl(file: File): Promise<string> {
  if (file.size > 2 * 1024 * 1024) throw new Error("Imagem grande demais (máx 2MB).");
  return await new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = () => rej(new Error("Falha ao ler arquivo."));
    r.readAsDataURL(file);
  });
}


export function OnboardingEscritorioWizard({ officeId, initialName, onComplete }: Props) {
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);

  // Passo 1
  const [name, setName] = useState(initialName ?? "");
  const [razaoSocial, setRazaoSocial] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [cau, setCau] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [instagram, setInstagram] = useState("");

  // Passo 2
  const [cep, setCep] = useState("");
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");

  // Passo 3
  const [logoUrl, setLogoUrl] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState("");

  // Passo 4
  const [teamSize, setTeamSize] = useState<OfficeExtra["team_size"]>("1");
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [bio, setBio] = useState("");

  // Passo 5 — equipe
  const [team, setTeam] = useState<TeamDraft[]>([]);

  // Passo 6 — portfólio
  const [works, setWorks] = useState<WorkDraft[]>([]);
  const [publicPage, setPublicPage] = useState(true);



  // Pré-preenche se já existia algo
  useEffect(() => {
    (async () => {
      const { data } = await externalSupabase
        .from("offices")
        .select("name, bio, city, website, logo_url, cover_url")
        .eq("id", officeId).maybeSingle();
      if (data) {
        setName((prev) => prev || (data as any).name || "");
        setCidade((data as any).city ?? "");
        setWebsite((data as any).website ?? "");
        setLogoUrl((data as any).logo_url ?? "");
        setCoverUrl((data as any).cover_url ?? "");
        setBio((data as any).bio ?? "");
      }

      const extra = await fetchOfficeExtra(officeId);
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
      setAvatarUrl(extra.avatar_url ?? "");
      setTeamSize(extra.team_size ?? "1");
      setSpecialties(extra.specialties ?? []);
    })();
  }, [officeId]);

  // Sobe para o storage do escritório; se falhar, cai para data URL.
  async function uploadImage(file: File, kind: string): Promise<string> {
    if (file.size > 5 * 1024 * 1024) throw new Error("Imagem grande demais (máx 5MB).");
    const path = `${officeId}/${kind}-${Date.now()}-${file.name.replace(/[^a-z0-9.\-_]/gi, "_")}`;
    const { error } = await externalSupabase.storage
      .from("office-assets")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (!error) {
      const { data } = externalSupabase.storage.from("office-assets").getPublicUrl(path);
      return data.publicUrl;
    }
    return await fileToDataUrl(file);
  }

  async function handleUpload(setter: (s: string) => void, file: File | null, kind = "img") {
    if (!file) return;
    try {
      setter(await uploadImage(file, kind));
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  function toggleSpecialty(s: string) {
    setSpecialties((cur) => cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]);
  }

  function addMember() {
    setTeam((t) => [...t, { key: crypto.randomUUID(), full_name: "", position: "", bio: "", avatar_url: "" }]);
  }
  function updateMember(key: string, patch: Partial<TeamDraft>) {
    setTeam((t) => t.map((m) => (m.key === key ? { ...m, ...patch } : m)));
  }
  function removeMember(key: string) {
    setTeam((t) => t.filter((m) => m.key !== key));
  }

  function addWork() {
    setWorks((w) => [...w, { key: crypto.randomUUID(), name: "", description: "", location: "", area_m2: "", year: "", cover_url: "" }]);
  }
  function updateWork(key: string, patch: Partial<WorkDraft>) {
    setWorks((w) => w.map((p) => (p.key === key ? { ...p, ...patch } : p)));
  }
  function removeWork(key: string) {
    setWorks((w) => w.filter((p) => p.key !== key));
  }

  function next() {
    if (step === 1 && !name.trim()) return toast.error("Informe o nome do escritório.");
    setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  }

  function prev() {
    setStep((s) => Math.max(1, s - 1));
  }

  async function finish() {
    if (specialties.length === 0) return toast.error("Selecione ao menos uma especialidade.");
    setBusy(true);

    // Slug único para a página pública de apresentação
    let finalSlug = slugify(name) || `escritorio-${officeId.slice(0, 6)}`;
    const { data: taken } = await externalSupabase
      .from("offices").select("id").eq("slug", finalSlug).neq("id", officeId).maybeSingle();
    if (taken) finalSlug = `${finalSlug}-${officeId.slice(0, 4)}`;

    const { error } = await externalSupabase.from("offices").update({
      name: name.trim(),
      slug: finalSlug,
      bio: bio.trim() || null,
      city: cidade.trim() || null,
      website: website.trim() || null,
      logo_url: logoUrl || null,
      cover_url: coverUrl || null,
      portfolio_public: publicPage,
    } as any).eq("id", officeId);

    if (error) {
      setBusy(false);
      return toast.error(error.message);
    }

    const { error: extraErr } = await saveOfficeExtra(officeId, {
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
      avatar_url: avatarUrl || null,
      team_size: teamSize ?? null,
      specialties,
      onboarding_completed: true,
      onboarded_at: new Date().toISOString(),
    });
    if (extraErr) { setBusy(false); return toast.error(extraErr); }

    // Equipe do escritório
    const validTeam = team.filter((m) => m.full_name.trim());
    if (validTeam.length > 0) {
      const { error: teamErr } = await externalSupabase.from("office_members").insert(
        validTeam.map((m) => ({
          office_id: officeId,
          full_name: m.full_name.trim(),
          position: m.position.trim() || null,
          bio: m.bio.trim() || null,
          avatar_url: m.avatar_url || null,
        })) as any,
      );
      if (teamErr) toast.error(`Equipe: ${teamErr.message}`);
    }

    // Portfólio
    const validWorks = works.filter((p) => p.name.trim());
    if (validWorks.length > 0) {
      const { error: workErr } = await externalSupabase.from("projects").insert(
        validWorks.map((p) => ({
          office_id: officeId,
          name: p.name.trim(),
          description: p.description.trim() || null,
          location: p.location.trim() || null,
          area_m2: p.area_m2 ? Number(String(p.area_m2).replace(",", ".")) : null,
          year: p.year ? Number(String(p.year).slice(0, 4)) : null,
          cover_url: p.cover_url || null,
          specialty: specialties[0] ?? null,
          portfolio_visible: true,

        })) as any,
      );
      if (workErr) toast.error(`Portfólio: ${workErr.message}`);
    }

    setBusy(false);
    toast.success("Escritório configurado!");
    onComplete();
  }

  const pct = (step / TOTAL_STEPS) * 100;


  return (
    <div className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl my-auto overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="px-7 pt-7 pb-5 border-b border-border bg-gradient-to-br from-white to-secondary/30">
          <div className="flex items-center gap-2 text-primary mb-2">
            <Sparkles className="h-4 w-4" strokeWidth={2} />
            <span className="text-[11px] font-semibold uppercase tracking-wider">Onboarding</span>
          </div>
          <h2 className="text-[22px] font-semibold tracking-tight text-ink">Bem-vindo ao ArqHub</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Vamos configurar seu escritório em menos de 3 minutos.
          </p>

          {/* Steps + progress */}
          <div className="mt-5">
            <div className="flex items-center justify-between mb-2">
              {STEPS.map((s) => {
                const done = step > s.n;
                const active = step === s.n;
                return (
                  <div key={s.n} className="flex items-center gap-2">
                    <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold transition-colors ${
                      done ? "bg-primary text-white" : active ? "bg-ink text-white" : "bg-secondary text-muted-foreground"
                    }`}>
                      {done ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> : s.n}
                    </span>
                    <span className={`text-[12px] font-medium hidden sm:inline ${active || done ? "text-ink" : "text-muted-foreground"}`}>
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="h-1 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all duration-300" style={{ width: `${pct}%` }} />
            </div>
            <div className="mt-1.5 text-[11px] text-muted-foreground">Passo {step} de {TOTAL_STEPS}</div>
          </div>
        </div>

        {/* Body */}
        <div className="px-7 py-6 overflow-y-auto flex-1">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-[15px] font-semibold text-ink">Dados do Escritório</h3>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nome do Escritório *" value={name} onChange={setName} placeholder="Estúdio Arq..." />
                <Field label="Razão Social" value={razaoSocial} onChange={setRazaoSocial} />
                <Field label="CNPJ" value={cnpj} onChange={(v) => setCnpj(maskCNPJ(v))} placeholder="00.000.000/0000-00" />
                <Field label="CAU" value={cau} onChange={setCau} placeholder="A123456-7" />
                <Field label="Telefone" value={phone} onChange={(v) => setPhone(maskPhone(v))} placeholder="(11) 99999-9999" />
                <Field label="WhatsApp" value={whatsapp} onChange={(v) => setWhatsapp(maskPhone(v))} placeholder="(11) 99999-9999" />
                <Field label="E-mail" value={email} onChange={setEmail} placeholder="contato@..." type="email" />
                <Field label="Website" value={website} onChange={setWebsite} placeholder="https://..." />
                <div className="col-span-2">
                  <Field label="Instagram" value={instagram} onChange={setInstagram} placeholder="@seuescritorio" />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-[15px] font-semibold text-ink">Endereço</h3>
              <div className="grid grid-cols-6 gap-3">
                <div className="col-span-2"><Field label="CEP" value={cep} onChange={(v) => setCep(maskCEP(v))} placeholder="00000-000" /></div>
                <div className="col-span-4"><Field label="Rua" value={rua} onChange={setRua} /></div>
                <div className="col-span-2"><Field label="Número" value={numero} onChange={setNumero} /></div>
                <div className="col-span-4"><Field label="Complemento" value={complemento} onChange={setComplemento} placeholder="Sala, andar..." /></div>
                <div className="col-span-3"><Field label="Bairro" value={bairro} onChange={setBairro} /></div>
                <div className="col-span-2"><Field label="Cidade" value={cidade} onChange={setCidade} /></div>
                <div className="col-span-1"><Field label="UF" value={estado} onChange={(v) => setEstado(v.toUpperCase().slice(0, 2))} placeholder="SP" /></div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <h3 className="text-[15px] font-semibold text-ink">Identidade Visual</h3>
              <p className="text-[12.5px] text-muted-foreground -mt-2">
                PNG, JPG ou SVG. Até 2MB por imagem.
              </p>
              <div className="grid grid-cols-3 gap-4">
                <UploadField label="Logo Principal" value={logoUrl} onUpload={(f) => handleUpload(setLogoUrl, f)} shape="square" onClear={() => setLogoUrl("")} />
                <UploadField label="Foto de Perfil" value={avatarUrl} onUpload={(f) => handleUpload(setAvatarUrl, f)} shape="circle" onClear={() => setAvatarUrl("")} />
                <UploadField label="Capa do Escritório" value={coverUrl} onUpload={(f) => handleUpload(setCoverUrl, f)} shape="wide" onClear={() => setCoverUrl("")} />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <h3 className="text-[15px] font-semibold text-ink">Configurações Iniciais</h3>
              <div>
                <div className="text-[12px] font-medium text-ink mb-2">Quantas pessoas trabalham no escritório?</div>
                <div className="grid grid-cols-5 gap-2">
                  {TEAM_SIZES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setTeamSize(t.value)}
                      className={`px-3 py-2.5 rounded-lg border text-[12.5px] font-medium transition-colors ${
                        teamSize === t.value
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border bg-white text-foreground/80 hover:border-foreground/30"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[12px] font-medium text-ink mb-2">Especialidades</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {SPECIALTIES.map((s) => {
                    const on = specialties.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleSpecialty(s)}
                        className={`px-3 py-2 rounded-lg border text-[12px] font-medium transition-colors text-left ${
                          on
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border bg-white text-foreground/80 hover:border-foreground/30"
                        }`}
                      >
                        <span className="inline-flex items-center gap-1.5">
                          {on && <Check className="h-3 w-3" strokeWidth={2.5} />}
                          {s}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Sobre o escritório</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value.slice(0, 1200))}
                  rows={4}
                  placeholder="Conte a história do escritório, o que vocês fazem de melhor e o que diferencia o seu trabalho."
                  className="mt-1 w-full px-3 py-2 text-[13px] border border-border rounded-md outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 resize-none"
                />
                <div className="mt-1 text-[11px] text-muted-foreground">{bio.length}/1200</div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-[15px] font-semibold text-ink">Equipe do escritório</h3>
                  <p className="text-[12.5px] text-muted-foreground">Adicione os arquitetos e colaboradores. Opcional.</p>
                </div>
                <button type="button" onClick={addMember} className="inline-flex items-center gap-1.5 px-3 h-9 rounded-md border border-border text-[12.5px] font-medium hover:bg-secondary">
                  <Plus className="h-3.5 w-3.5" /> Adicionar
                </button>
              </div>
              {team.length === 0 && (
                <div className="rounded-lg border border-dashed border-border p-6 text-center text-[12.5px] text-muted-foreground">
                  Nenhum membro adicionado ainda.
                </div>
              )}
              <div className="space-y-3">
                {team.map((m) => (
                  <div key={m.key} className="rounded-xl border border-border p-4">
                    <div className="flex gap-4">
                      <div className="w-24 shrink-0">
                        <UploadField label="Foto" value={m.avatar_url} shape="circle"
                          onUpload={(f) => handleUpload((u) => updateMember(m.key, { avatar_url: u }), f, "member")}
                          onClear={() => updateMember(m.key, { avatar_url: "" })} />
                      </div>
                      <div className="flex-1 grid grid-cols-2 gap-3">
                        <Field label="Nome *" value={m.full_name} onChange={(v) => updateMember(m.key, { full_name: v })} />
                        <Field label="Cargo" value={m.position} onChange={(v) => updateMember(m.key, { position: v })} placeholder="Arquiteto(a) sócio(a)" />
                        <div className="col-span-2">
                          <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Mini bio</label>
                          <textarea value={m.bio} onChange={(e) => updateMember(m.key, { bio: e.target.value.slice(0, 400) })} rows={2}
                            className="mt-1 w-full px-3 py-2 text-[13px] border border-border rounded-md outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 resize-none" />
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 flex justify-end">
                      <button type="button" onClick={() => removeMember(m.key)} className="inline-flex items-center gap-1 text-[11.5px] text-muted-foreground hover:text-rose-500">
                        <Trash2 className="h-3.5 w-3.5" /> Remover
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-[15px] font-semibold text-ink">Portfólio</h3>
                  <p className="text-[12.5px] text-muted-foreground">Projetos relevantes que aparecerão na sua página pública. Opcional.</p>
                </div>
                <button type="button" onClick={addWork} className="inline-flex items-center gap-1.5 px-3 h-9 rounded-md border border-border text-[12.5px] font-medium hover:bg-secondary">
                  <Plus className="h-3.5 w-3.5" /> Adicionar projeto
                </button>
              </div>

              <label className="flex items-start gap-3 rounded-xl border border-border p-4 cursor-pointer hover:bg-secondary/30">
                <input type="checkbox" checked={publicPage} onChange={(e) => setPublicPage(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[var(--color-primary,#0f766e)]" />
                <span>
                  <span className="block text-[13px] font-medium text-ink">Página de apresentação pública</span>
                  <span className="block text-[12px] text-muted-foreground">
                    Quando ativo, seu escritório, equipe e projetos ficam visíveis em
                    <code className="mx-1 rounded bg-secondary px-1 text-[11.5px] font-mono">/escritorio/{slugify(name) || "seu-escritorio"}</code>
                    e na vitrine de portfólios do ArqHub.
                  </span>
                </span>
              </label>

              {works.length === 0 && (
                <div className="rounded-lg border border-dashed border-border p-6 text-center text-[12.5px] text-muted-foreground">
                  Nenhum projeto adicionado ainda.
                </div>
              )}
              <div className="space-y-3">
                {works.map((p) => (
                  <div key={p.key} className="rounded-xl border border-border p-4">
                    <div className="flex gap-4">
                      <div className="w-40 shrink-0">
                        <UploadField label="Foto do projeto" value={p.cover_url} shape="wide"
                          onUpload={(f) => handleUpload((u) => updateWork(p.key, { cover_url: u }), f, "project")}
                          onClear={() => updateWork(p.key, { cover_url: "" })} />
                      </div>
                      <div className="flex-1 grid grid-cols-3 gap-3">
                        <div className="col-span-3">
                          <Field label="Nome do projeto *" value={p.name} onChange={(v) => updateWork(p.key, { name: v })} />
                        </div>
                        <Field label="Local" value={p.location} onChange={(v) => updateWork(p.key, { location: v })} placeholder="São Paulo, SP" />
                        <Field label="Área (m²)" value={p.area_m2} onChange={(v) => updateWork(p.key, { area_m2: v.replace(/[^\d.,]/g, "") })} placeholder="180" />
                        <Field label="Ano / data" value={p.year} onChange={(v) => updateWork(p.key, { year: v.replace(/\D/g, "").slice(0, 4) })} placeholder="2025" />
                        <div className="col-span-3">
                          <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Resumo</label>
                          <textarea value={p.description} onChange={(e) => updateWork(p.key, { description: e.target.value.slice(0, 500) })} rows={2}
                            className="mt-1 w-full px-3 py-2 text-[13px] border border-border rounded-md outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 resize-none" />
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 flex justify-end">
                      <button type="button" onClick={() => removeWork(p.key)} className="inline-flex items-center gap-1 text-[11.5px] text-muted-foreground hover:text-rose-500">
                        <Trash2 className="h-3.5 w-3.5" /> Remover
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-7 py-4 border-t border-border bg-secondary/20 flex items-center justify-between">
          <button
            type="button"
            onClick={prev}
            disabled={step === 1 || busy}
            className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-md text-[13px] font-medium text-muted-foreground hover:text-ink disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} /> Voltar
          </button>
          {step < TOTAL_STEPS ? (
            <button
              type="button"
              onClick={next}
              className="inline-flex items-center gap-1.5 px-4 h-9 bg-ink hover:bg-black text-white rounded-md text-[13px] font-medium transition-colors"
            >
              Continuar <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
          ) : (
            <button
              type="button"
              onClick={finish}
              disabled={busy}
              className="inline-flex items-center gap-1.5 px-4 h-9 bg-primary hover:opacity-90 text-white rounded-md text-[13px] font-medium transition-colors disabled:opacity-50"
            >
              {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Entrar no ArqHub <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label, value, onChange, placeholder, type = "text",
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div>
      <label className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full h-10 px-3 text-[13px] border border-border rounded-md outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
      />
    </div>
  );
}

function UploadField({
  label, value, onUpload, shape, onClear,
}: { label: string; value: string; onUpload: (f: File | null) => void; shape: "square" | "circle" | "wide"; onClear: () => void }) {
  const cls = shape === "circle" ? "rounded-full aspect-square"
    : shape === "wide" ? "rounded-lg aspect-[16/9]"
    : "rounded-lg aspect-square";
  return (
    <div>
      <label className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</label>
      <label className={`mt-1 group relative block w-full ${cls} bg-secondary border-2 border-dashed border-border hover:border-primary transition-colors cursor-pointer overflow-hidden`}>
        {value ? (
          <>
            <img src={value} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <span className="text-white text-[11px] font-medium">Trocar</span>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
            <Upload className="h-5 w-5 mb-1" strokeWidth={1.75} />
            <span className="text-[10.5px] font-medium">Enviar</span>
          </div>
        )}
        <input
          type="file"
          accept="image/png,image/jpeg,image/svg+xml,image/webp"
          className="sr-only"
          onChange={(e) => onUpload(e.target.files?.[0] ?? null)}
        />
      </label>
      {value && (
        <button type="button" onClick={onClear} className="mt-1 text-[11px] text-muted-foreground hover:text-rose-500">
          Remover
        </button>
      )}
    </div>
  );
}
