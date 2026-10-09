import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Mail, RefreshCw, Search, Send, Eye, X, CheckCircle2, AlertCircle, Gift, History } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { adminNav } from "@/lib/nav-admin";
import { externalSupabase } from "@/integrations/external-supabase/client";
import {
  listEmailRecipients,
  previewCustomEmail,
  sendCustomEmail,
  listCustomEmailHistory,
  type EmailRecipient,
  type SendResult,
  type EmailHistoryRow,
} from "@/lib/admin-email.functions";

export const Route = createFileRoute("/app/admin/emails")({
  head: () => ({ meta: [{ title: "E-mails — Admin" }] }),
  component: Page,
});

type Compose = {
  subject: string;
  eyebrow: string;
  heading: string;
  message: string;
  ctaLabel: string;
  ctaUrl: string;
  signature: string;
  trialDays: number;
};

const EMPTY: Compose = {
  subject: "",
  eyebrow: "",
  heading: "",
  message: "",
  ctaLabel: "",
  ctaUrl: "",
  signature: "Um abraço,\nEquipe ArqHub",
  trialDays: 0,
};

const PRESETS: Array<{ id: string; label: string; compose: Compose }> = [
  {
    id: "desculpas",
    label: "Pedido de desculpas + dias grátis",
    compose: {
      subject: "{{nome}}, pedimos desculpas — liberamos {{dias}} dias grátis para você",
      eyebrow: "Equipe ArqHub",
      heading: "{{nome}}, pedimos desculpas pelo ocorrido",
      message:
        "Olá, {{nome}}.\n\n" +
        "Você entrou no ArqHub recentemente e, naquele momento, a plataforma não estava funcionando como deveria. Sentimos muito por isso — sabemos que o seu tempo é valioso.\n\n" +
        "O problema já foi corrigido e, como forma de pedir desculpas, liberamos {{dias}} dias de teste grátis na sua conta, válidos até {{validade}}. Não é preciso cadastrar cartão.\n\n" +
        "Se tiver qualquer dúvida, é só responder este e-mail.",
      ctaLabel: "Acessar o ArqHub",
      ctaUrl: "https://arqhub.world/entrar/escritorio",
      signature: "Um abraço,\nEquipe ArqHub",
      trialDays: 30,
    },
  },
  {
    id: "novidade",
    label: "Comunicado / novidade",
    compose: {
      subject: "Novidade no ArqHub",
      eyebrow: "Novidade",
      heading: "{{nome}}, temos uma novidade para você",
      message: "Olá, {{nome}}.\n\nEscreva aqui o comunicado.",
      ctaLabel: "Ver no ArqHub",
      ctaUrl: "https://arqhub.world/entrar/escritorio",
      signature: "Um abraço,\nEquipe ArqHub",
      trialDays: 0,
    },
  },
  { id: "branco", label: "Em branco", compose: EMPTY },
];

async function token() {
  const { data } = await externalSupabase.auth.getSession();
  const t = data.session?.access_token;
  if (!t) throw new Error("Sessão expirada. Faça login novamente.");
  return t;
}

function statusLabel(r: EmailRecipient) {
  if (r.hasActivePlan) return { text: "Assinante", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  if (!r.officeId) return { text: "Sem escritório", cls: "bg-secondary text-muted-foreground border-border" };
  const exp = r.trialExpiresAt ? new Date(r.trialExpiresAt).getTime() : null;
  if (exp && exp > Date.now()) return { text: "Em teste", cls: "bg-amber-50 text-amber-700 border-amber-200" };
  return { text: "Teste expirado", cls: "bg-red-50 text-red-700 border-red-200" };
}

function fmt(iso: string | null) {
  return iso ? new Date(iso).toLocaleDateString("pt-BR") : "—";
}

function Page() {
  const [tab, setTab] = useState<"novo" | "historico">("novo");
  const [compose, setCompose] = useState<Compose>(PRESETS[0].compose);
  const [recipients, setRecipients] = useState<EmailRecipient[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [q, setQ] = useState("");
  const [onlyNoPlan, setOnlyNoPlan] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewSubject, setPreviewSubject] = useState("");
  const [busy, setBusy] = useState<null | "preview" | "test" | "send">(null);
  const [results, setResults] = useState<SendResult[] | null>(null);
  const [history, setHistory] = useState<EmailHistoryRow[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const listFn = useServerFn(listEmailRecipients);
  const previewFn = useServerFn(previewCustomEmail);
  const sendFn = useServerFn(sendCustomEmail);
  const historyFn = useServerFn(listCustomEmailHistory);

  async function loadRecipients() {
    setLoadingList(true);
    try {
      const res = await listFn({ data: { accessToken: await token() } });
      setRecipients(res.items);
    } catch (e: any) {
      toast.error("Erro ao carregar usuários", { description: e?.message ?? "" });
    } finally {
      setLoadingList(false);
    }
  }

  async function loadHistory() {
    setLoadingHistory(true);
    try {
      const res = await historyFn({ data: { accessToken: await token() } });
      setHistory(res.items);
    } catch (e: any) {
      toast.error("Erro ao carregar histórico", { description: e?.message ?? "" });
    } finally {
      setLoadingHistory(false);
    }
  }

  useEffect(() => { loadRecipients(); /* eslint-disable-next-line */ }, []);
  useEffect(() => { if (tab === "historico") loadHistory(); /* eslint-disable-next-line */ }, [tab]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return recipients.filter((r) => {
      if (onlyNoPlan && r.hasActivePlan) return false;
      if (!term) return true;
      return [r.email, r.fullName, r.officeName].some((v) => (v ?? "").toLowerCase().includes(term));
    });
  }, [recipients, q, onlyNoPlan]);

  const selectedRows = recipients.filter((r) => selected.has(r.id));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function set<K extends keyof Compose>(k: K, v: Compose[K]) {
    setCompose((c) => ({ ...c, [k]: v }));
    setPreviewHtml(null);
  }

  function validate(): string | null {
    if (compose.subject.trim().length < 3) return "Preencha o assunto.";
    if (compose.message.trim().length < 5) return "Escreva a mensagem.";
    if ((compose.ctaLabel && !compose.ctaUrl) || (!compose.ctaLabel && compose.ctaUrl))
      return "Para o botão, preencha o texto e o link.";
    if (/\{\{\s*(dias|validade)\s*\}\}/i.test(compose.subject + compose.message + compose.heading) && compose.trialDays === 0)
      return "A mensagem usa {{dias}} ou {{validade}}, mas nenhum dia de teste está sendo liberado.";
    return null;
  }

  async function handlePreview() {
    const err = validate();
    if (err) return toast.error(err);
    setBusy("preview");
    try {
      const firstSel = selectedRows[0];
      const sampleName = firstSel?.fullName?.split(" ")[0] || undefined;
      const res = await previewFn({ data: { accessToken: await token(), compose, sampleName } });
      setPreviewHtml(res.html);
      setPreviewSubject(res.subject);
    } catch (e: any) {
      toast.error("Erro na pré-visualização", { description: e?.message ?? "" });
    } finally {
      setBusy(null);
    }
  }

  async function handleTest() {
    const err = validate();
    if (err) return toast.error(err);
    setBusy("test");
    try {
      const res = await sendFn({ data: { accessToken: await token(), compose, testToSelf: true, userIds: [] } });
      const r = res.results[0];
      if (r?.emailStatus === "sent") toast.success("E-mail de teste enviado", { description: r.email ?? "" });
      else toast.error("Falha no envio de teste", { description: r?.emailError ?? "" });
    } catch (e: any) {
      toast.error("Falha no envio de teste", { description: e?.message ?? "" });
    } finally {
      setBusy(null);
    }
  }

  async function handleSend() {
    const err = validate();
    if (err) return toast.error(err);
    if (selectedRows.length === 0) return toast.error("Selecione ao menos um destinatário.");
    const trialNote = compose.trialDays > 0
      ? `\n\nTambém serão liberados ${compose.trialDays} dias de teste grátis para quem tem escritório e não é assinante.`
      : "";
    if (!confirm(`Enviar este e-mail para ${selectedRows.length} usuário(s)?${trialNote}`)) return;
    setBusy("send");
    setResults(null);
    try {
      const res = await sendFn({
        data: { accessToken: await token(), compose, testToSelf: false, userIds: selectedRows.map((r) => r.id) },
      });
      setResults(res.results);
      const ok = res.results.filter((r) => r.emailStatus === "sent").length;
      if (ok === res.results.length) toast.success(`${ok} e-mail(s) enviado(s)`);
      else toast.warning(`${ok} de ${res.results.length} enviados — veja os detalhes`);
      setSelected(new Set());
      loadRecipients();
    } catch (e: any) {
      toast.error("Falha no envio", { description: e?.message ?? "" });
    } finally {
      setBusy(null);
    }
  }

  const input = "w-full rounded-lg border border-border bg-white px-3 py-2 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-primary/30";
  const label = "block text-[12px] font-medium text-muted-foreground mb-1";

  return (
    <AppShell role="admin" nav={adminNav} title="E-mails">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-[22px] font-semibold tracking-tight text-ink">E-mails personalizados</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Escreva uma mensagem, escolha os usuários e, se quiser, libere dias de teste grátis junto.
          </p>
        </div>
        <div className="inline-flex rounded-lg border border-border bg-white p-0.5 text-[13px]">
          <button onClick={() => setTab("novo")}
            className={`px-3 py-1.5 rounded-md inline-flex items-center gap-1.5 ${tab === "novo" ? "bg-secondary text-ink font-medium" : "text-muted-foreground"}`}>
            <Mail className="h-3.5 w-3.5" /> Novo e-mail
          </button>
          <button onClick={() => setTab("historico")}
            className={`px-3 py-1.5 rounded-md inline-flex items-center gap-1.5 ${tab === "historico" ? "bg-secondary text-ink font-medium" : "text-muted-foreground"}`}>
            <History className="h-3.5 w-3.5" /> Histórico
          </button>
        </div>
      </div>

      {tab === "novo" ? (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          {/* ---------------- Mensagem ---------------- */}
          <section className="bg-white border border-border rounded-xl p-5">
            <div className="flex items-center justify-between gap-2 mb-4">
              <h3 className="text-[15px] font-semibold text-ink">1. Mensagem</h3>
              <select
                className="rounded-lg border border-border bg-white px-2 py-1.5 text-[12.5px]"
                defaultValue={PRESETS[0].id}
                onChange={(e) => {
                  const p = PRESETS.find((x) => x.id === e.target.value);
                  if (p) { setCompose(p.compose); setPreviewHtml(null); }
                }}
              >
                {PRESETS.map((p) => <option key={p.id} value={p.id}>Modelo: {p.label}</option>)}
              </select>
            </div>

            <div className="space-y-3">
              <div>
                <label className={label}>Assunto</label>
                <input className={input} value={compose.subject} onChange={(e) => set("subject", e.target.value)} />
              </div>
              <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
                <div>
                  <label className={label}>Etiqueta (opcional)</label>
                  <input className={input} value={compose.eyebrow} onChange={(e) => set("eyebrow", e.target.value)} />
                </div>
                <div>
                  <label className={label}>Título (opcional)</label>
                  <input className={input} value={compose.heading} onChange={(e) => set("heading", e.target.value)} />
                </div>
              </div>
              <div>
                <label className={label}>Mensagem — deixe uma linha em branco entre parágrafos</label>
                <textarea className={`${input} min-h-[220px] leading-relaxed`} value={compose.message}
                  onChange={(e) => set("message", e.target.value)} />
                <p className="text-[11.5px] text-muted-foreground mt-1">
                  Variáveis: <code>{"{{nome}}"}</code> <code>{"{{email}}"}</code> <code>{"{{escritorio}}"}</code>{" "}
                  <code>{"{{dias}}"}</code> <code>{"{{validade}}"}</code>
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className={label}>Texto do botão (opcional)</label>
                  <input className={input} value={compose.ctaLabel} onChange={(e) => set("ctaLabel", e.target.value)} />
                </div>
                <div>
                  <label className={label}>Link do botão</label>
                  <input className={input} value={compose.ctaUrl} placeholder="https://arqhub.world/..."
                    onChange={(e) => set("ctaUrl", e.target.value)} />
                </div>
              </div>
              <div>
                <label className={label}>Assinatura</label>
                <textarea className={`${input} min-h-[64px]`} value={compose.signature}
                  onChange={(e) => set("signature", e.target.value)} />
              </div>

              <div className="rounded-lg border border-border bg-secondary/40 p-3 flex flex-wrap items-center gap-3">
                <Gift className="h-4 w-4 text-primary" />
                <label className="text-[13px] text-ink">Liberar teste grátis de</label>
                <input type="number" min={0} max={90} value={compose.trialDays}
                  onChange={(e) => set("trialDays", Math.max(0, Math.min(90, Number(e.target.value) || 0)))}
                  className="w-20 rounded-md border border-border bg-white px-2 py-1 text-[13px]" />
                <span className="text-[13px] text-ink">dias</span>
                <span className="text-[11.5px] text-muted-foreground w-full">
                  0 = não mexe no teste. O prazo conta a partir do envio. Assinantes ativos e contas sem escritório não são alterados.
                </span>
              </div>
            </div>
          </section>

          {/* ---------------- Destinatários ---------------- */}
          <section className="bg-white border border-border rounded-xl p-5 flex flex-col min-h-[520px]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[15px] font-semibold text-ink">2. Destinatários</h3>
              <button onClick={loadRecipients} className="text-[12.5px] text-muted-foreground inline-flex items-center gap-1 hover:text-ink">
                <RefreshCw className={`h-3.5 w-3.5 ${loadingList ? "animate-spin" : ""}`} /> Atualizar
              </button>
            </div>

            {selectedRows.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {selectedRows.map((r) => (
                  <span key={r.id} className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2.5 py-1 text-[12px]">
                    {r.fullName || r.email}
                    <button aria-label="Remover" onClick={() => toggle(r.id)}><X className="h-3 w-3" /></button>
                  </span>
                ))}
              </div>
            )}

            <div className="relative mb-2">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input className={`${input} pl-9`} placeholder="Buscar por nome, e-mail ou escritório"
                value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <label className="flex items-center gap-2 text-[12.5px] text-muted-foreground mb-2">
              <input type="checkbox" checked={onlyNoPlan} onChange={(e) => setOnlyNoPlan(e.target.checked)} />
              Ocultar assinantes ativos
            </label>

            <div className="flex-1 overflow-y-auto border border-border rounded-lg divide-y divide-border max-h-[460px]">
              {loadingList ? (
                <div className="p-4 text-[13px] text-muted-foreground">Carregando usuários…</div>
              ) : filtered.length === 0 ? (
                <div className="p-4 text-[13px] text-muted-foreground">Nenhum usuário encontrado.</div>
              ) : (
                filtered.slice(0, 300).map((r) => {
                  const st = statusLabel(r);
                  return (
                    <label key={r.id} className="flex items-start gap-3 px-3 py-2.5 hover:bg-secondary/40 cursor-pointer">
                      <input type="checkbox" className="mt-1" checked={selected.has(r.id)} onChange={() => toggle(r.id)} />
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-medium text-ink truncate">{r.fullName || "(sem nome)"}</div>
                        <div className="text-[12px] text-muted-foreground truncate">{r.email ?? "sem e-mail"}</div>
                        <div className="text-[11.5px] text-muted-foreground">
                          Cadastro {fmt(r.createdAt)}{r.officeName ? ` · ${r.officeName}` : ""}
                        </div>
                      </div>
                      <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] ${st.cls}`}>{st.text}</span>
                    </label>
                  );
                })
              )}
            </div>
            <p className="text-[11.5px] text-muted-foreground mt-2">
              {selectedRows.length} selecionado(s) · máximo de 100 por envio
            </p>
          </section>

          {/* ---------------- Ações + preview ---------------- */}
          <section className="lg:col-span-2 bg-white border border-border rounded-xl p-5">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-[15px] font-semibold text-ink mr-auto">3. Revisar e enviar</h3>
              <button onClick={handlePreview} disabled={!!busy}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-white text-[13px] hover:bg-secondary disabled:opacity-50">
                <Eye className="h-3.5 w-3.5" /> {busy === "preview" ? "Gerando…" : "Pré-visualizar"}
              </button>
              <button onClick={handleTest} disabled={!!busy}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-white text-[13px] hover:bg-secondary disabled:opacity-50">
                <Mail className="h-3.5 w-3.5" /> {busy === "test" ? "Enviando…" : "Enviar teste para mim"}
              </button>
              <button onClick={handleSend} disabled={!!busy || selectedRows.length === 0}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-[13px] font-medium hover:brightness-95 disabled:opacity-50">
                <Send className="h-3.5 w-3.5" />
                {busy === "send" ? "Enviando…" : `Enviar para ${selectedRows.length || ""} usuário(s)`}
              </button>
            </div>

            {previewHtml && (
              <div className="mt-4">
                <div className="text-[12.5px] text-muted-foreground mb-2">
                  Assunto: <span className="text-ink font-medium">{previewSubject}</span>
                  {selectedRows[0] ? " (exemplo com o primeiro selecionado)" : " (exemplo)"}
                </div>
                <iframe title="Pré-visualização" srcDoc={previewHtml} sandbox=""
                  className="w-full h-[640px] rounded-lg border border-border bg-white" />
              </div>
            )}

            {results && (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[640px] text-[13px]">
                  <thead className="bg-secondary/40 border-b border-border text-left text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 font-medium">Destinatário</th>
                      <th className="px-3 py-2 font-medium">E-mail</th>
                      <th className="px-3 py-2 font-medium">Teste grátis</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {results.map((r, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2">{r.name || "—"}<div className="text-[12px] text-muted-foreground">{r.email ?? "—"}</div></td>
                        <td className="px-3 py-2">
                          {r.emailStatus === "sent" ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" /> Enviado</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-red-700" title={r.emailError}>
                              <AlertCircle className="h-3.5 w-3.5" />
                              {r.emailStatus === "suppressed" ? "Descadastrado" : r.emailStatus === "no_email" ? "Sem e-mail" : "Falhou"}
                              {r.emailError ? <span className="text-[11.5px] text-muted-foreground ml-1 truncate max-w-[260px]">{r.emailError}</span> : null}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-[12.5px]">
                          {r.trial === "extended" && `Liberado até ${fmt(r.trialExpiresAt ?? null)}`}
                          {r.trial === "skipped_active_plan" && "Não alterado (assinante)"}
                          {r.trial === "skipped_no_office" && "Não alterado (sem escritório)"}
                          {r.trial === "failed" && <span className="text-red-700">Falhou</span>}
                          {r.trial === "not_requested" && "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      ) : (
        <section className="bg-white border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-[13px] text-muted-foreground">Últimos 200 envios personalizados</span>
            <button onClick={loadHistory} className="text-[12.5px] text-muted-foreground inline-flex items-center gap-1 hover:text-ink">
              <RefreshCw className={`h-3.5 w-3.5 ${loadingHistory ? "animate-spin" : ""}`} /> Atualizar
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-[13px]">
              <thead className="bg-secondary/40 border-b border-border text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Data</th>
                  <th className="px-4 py-2.5 font-medium">Para</th>
                  <th className="px-4 py-2.5 font-medium">Assunto</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">Teste grátis</th>
                  <th className="px-4 py-2.5 font-medium">Enviado por</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {history.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-6 text-muted-foreground">
                    {loadingHistory ? "Carregando…" : "Nenhum envio ainda."}
                  </td></tr>
                ) : history.map((h, i) => (
                  <tr key={i}>
                    <td className="px-4 py-2.5 whitespace-nowrap">{new Date(h.createdAt).toLocaleString("pt-BR")}</td>
                    <td className="px-4 py-2.5">{h.to}</td>
                    <td className="px-4 py-2.5 max-w-[320px] truncate" title={h.subject ?? ""}>{h.subject ?? "—"}</td>
                    <td className="px-4 py-2.5">
                      {h.status === "sent"
                        ? <span className="text-emerald-700">Enviado</span>
                        : <span className="text-red-700" title={h.error ?? ""}>Falhou</span>}
                    </td>
                    <td className="px-4 py-2.5 text-[12.5px]">
                      {h.trialDays ? `${h.trialDays} dias${h.trialResult === "extended" ? "" : h.trialResult === "skipped_active_plan" ? " (assinante, não aplicado)" : h.trialResult === "skipped_no_office" ? " (sem escritório)" : ""}` : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-[12.5px] text-muted-foreground">{h.sentBy ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </AppShell>
  );
}
