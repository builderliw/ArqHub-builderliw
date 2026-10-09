import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { navProfissional as nav } from "@/lib/nav-profissional";
import React, { useState } from "react";
import { generateAiBudget } from "@/lib/budget-ai.functions";
import { toast } from "sonner";
import { Calculator, Loader2, FileText, AlertCircle, FileSpreadsheet, ArrowRight, Lock, Sparkles } from "lucide-react";
import { getSession } from "@/lib/session";
import { ToolHero } from "@/components/tool-hero";

export const Route = createFileRoute("/app/profissional/ferramentas/orcamentos")({
  component: Page,
});

function Page() {
  const plan = getSession()?.plan ?? "trial";
  const locked = plan === "basico";

  if (locked) {
    return (
      <AppShell role="profissional" nav={nav} title="Orçamentos Inteligentes">
        <ToolHero
          icon={<Calculator className="h-6 w-6 text-primary" strokeWidth={1.75} />}
          title="Orçamentos Inteligentes"
          subtitle="IA aplicada a custos — gere orçamentos completos a partir da descrição do projeto."
          slug="orcamentos"
          bullets={[
            "Base de composições e insumos atualizada",
            "Cálculo automático de BDI, mão de obra e materiais",
            "Exportação em planilha (.xlsx) e PDF",
          ]}
        />
      </AppShell>
    );
  }

  const [briefing, setBriefing] = useState("");
  const [location, setLocation] = useState("");
  const [result, setResult] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  async function handleGenerate() {
    if (!briefing || !location) {
      toast.error("Preencha o briefing e a localização.");
      return;
    }
    setBusy(true);
    try {
      const data = await generateAiBudget({ data: { briefing, location } });
      setResult(data);
      toast.success("Orçamento gerado com sucesso!");
    } catch (e) {
      toast.error("Erro ao gerar orçamento.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell role="profissional" nav={nav} title="Orçamentos Inteligentes">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <ToolHero
          icon={<Calculator className="h-6 w-6 text-primary" strokeWidth={1.75} />}
          title="Orçamentos Inteligentes"
          subtitle="IA aplicada a custos — gere orçamentos completos a partir da descrição do projeto."
          slug="orcamentos"
          bullets={[
            "Base de composições e insumos atualizada",
            "Cálculo automático de BDI, mão de obra e materiais",
            "Exportação em planilha (.xlsx) e PDF",
          ]}
        />

        <section className="bg-white border border-border rounded-xl p-6 mt-8 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Novo Orçamento Técnico</h2>
          </div>
          <textarea
            className="w-full h-32 p-3 border border-border rounded-lg bg-secondary/5 focus:bg-white transition-colors outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="Descreva o projeto: área, ambientes, padrão construtivo, acabamentos desejados..."
            value={briefing}
            onChange={(e) => setBriefing(e.target.value)}
          />
          <input
            className="w-full h-10 mt-4 p-3 border border-border rounded-lg bg-secondary/5 focus:bg-white transition-colors outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="Localização (Cidade/UF)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
          <button
            onClick={handleGenerate}
            disabled={busy}
            className="mt-6 w-full sm:w-auto bg-primary text-white px-8 py-3 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 font-bold transition-all shadow-lg shadow-primary/20"
          >
            {busy ? <Loader2 className="animate-spin h-5 w-5" /> : <Calculator className="h-5 w-5" />}
            Gerar Orçamento Técnico
          </button>
        </section>

        {result && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header com Resumo e Confiança */}
            <section className="bg-white border border-border rounded-xl p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-2xl font-bold text-ink">
                    Total Estimado: R$ {result.summary.total.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Custo estimado por m²: R$ {result.summary.costPerM2.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ring-1 ring-inset ${
                    result.summary.confidence === "alta" 
                      ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20" 
                      : result.summary.confidence === "media"
                      ? "bg-amber-50 text-amber-700 ring-amber-600/20"
                      : "bg-red-50 text-red-700 ring-red-600/20"
                  }`}>
                    {result.summary.confidence === "alta" ? "🟢" : result.summary.confidence === "media" ? "🟡" : "🔴"}
                    {result.summary.confidence === "alta" ? "ALTA PRECISÃO" : result.summary.confidence === "media" ? "ESTIMATIVA" : "BAIXA PRECISÃO"}
                  </div>
                </div>
              </div>
              
              {result.summary.confidenceReason && (
                <div className="mt-4 p-3 bg-secondary/30 rounded-lg flex gap-2 items-start">
                  <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-[13px] text-muted-foreground leading-relaxed italic">
                    {result.summary.confidenceReason}
                  </p>
                </div>
              )}
            </section>

            {/* KPIs Financeiros */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <KpiMini label="Materiais" value={result.kpis.materials} />
              <KpiMini label="Mão de Obra" value={result.kpis.labor} />
              <KpiMini label="Equipamentos" value={result.kpis.equipment} />
              <KpiMini label="Indiretos" value={result.kpis.indirect} />
              <KpiMini label="BDI/Margem" value={result.kpis.bdi} />
            </div>

            {/* Orçamento Detalhado */}
            <section className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-border bg-secondary/10">
                <h4 className="font-semibold text-ink">Composições e Custos Detalhados</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-secondary/5 border-b border-border">
                      <th className="px-6 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Item / Serviço</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider text-center">Unid</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider text-center">Qtd</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider text-right">Unitário</th>
                      <th className="px-6 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider text-right">Total</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider text-center">Fonte</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {result.categories.map((cat: any) => (
                      <React.Fragment key={cat.name}>
                        <tr className="bg-primary/5">
                          <td colSpan={6} className="px-6 py-2 text-xs font-bold text-primary uppercase">
                            {cat.name}
                          </td>
                        </tr>
                        {cat.items.map((it: any, i: number) => (
                          <tr key={i} className="hover:bg-secondary/5 transition-colors">
                            <td className="px-6 py-3 text-[13px] font-medium text-ink">{it.description}</td>
                            <td className="px-4 py-3 text-[13px] text-muted-foreground text-center">{it.unit}</td>
                            <td className="px-4 py-3 text-[13px] text-muted-foreground text-center">{it.quantity}</td>
                            <td className="px-4 py-3 text-[13px] text-muted-foreground text-right">
                              R$ {it.unitPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-6 py-3 text-[13px] font-semibold text-ink text-right">
                              R$ {it.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${
                                it.type === 'real' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                              }`}>
                                {it.source}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Alertas e Informações Faltantes */}
            <div className="grid md:grid-cols-2 gap-4">
              <section className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                <h4 className="flex items-center gap-2 text-sm font-bold text-amber-900 mb-3">
                  <AlertCircle className="h-4 w-4" /> Alertas Inteligentes
                </h4>
                <ul className="space-y-2">
                  {result.alerts.map((alert: string, i: number) => (
                    <li key={i} className="text-[13px] text-amber-800 leading-relaxed flex gap-2">
                      <span className="shrink-0">⚠️</span> {alert}
                    </li>
                  ))}
                </ul>
              </section>

              <section className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                <h4 className="flex items-center gap-2 text-sm font-bold text-blue-900 mb-3">
                  <FileText className="h-4 w-4" /> Informações Necessárias
                </h4>
                <ul className="space-y-2">
                  {result.missingInfo.map((info: string, i: number) => (
                    <li key={i} className="text-[13px] text-blue-800 leading-relaxed flex gap-2">
                      <span className="shrink-0">📝</span> {info}
                    </li>
                  ))}
                </ul>
              </section>
            </div>
            
            {/* Ações Finais */}
            <div className="flex justify-end gap-3 pb-10">
              <button className="h-10 px-4 border border-border rounded-lg text-sm font-medium bg-white hover:bg-secondary transition-colors">
                Exportar Planilha (.xlsx)
              </button>
              <button className="h-10 px-4 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
                Gerar Relatório em PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function KpiMini({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white border border-border rounded-lg p-3 text-center shadow-sm">
      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{label}</p>
      <p className="text-sm font-bold text-ink mt-0.5">
        R$ {value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
      </p>
    </div>
  );
}

