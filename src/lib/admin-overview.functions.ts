import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type AdminOverview = {
  users: { total: number; last7d: number; last30d: number };
  offices: { total: number; active: number; trial: number; onboarded: number };
  subscriptions: { active: number; canceled30d: number; mrrCents: number };
  support: { total: number; pending: number };
  enterprise: { total: number; pending: number };
  payments: { last30d: number; approved30d: number; revenue30dCents: number; revenueAllCents: number };
  materials: { total: number };
  downloads: { total: number; last30d: number; top: Array<{ slug: string; title: string; count: number }> };
  traffic: {
    pageviews: number;
    visitors: number;
    anonymous: number;
    mobile: number;
    desktop: number;
    installs: number;
    errors7d: number;
    topPages: Array<{ route: string; count: number }>;
  };
  period: {
    days: number;
    usersNew: number;
    revenueCents: number;
    paymentsApproved: number;
    downloads: number;
    pageviews: number;
    visitors: number;
  };
  since: string | null;
  events: Array<{ id: string; kind: string; title: string; at: string }>;
};

const Schema = z.object({ accessToken: z.string().min(10), days: z.number().int().min(0).max(3650).optional() });

export const getAdminOverview = createServerFn({ method: "POST" })
  .inputValidator((d) => Schema.parse(d))
  .handler(async ({ data }): Promise<AdminOverview> => {
    const { assertAdminByToken } = await import("@/lib/admin-auth.server");
    await assertAdminByToken(data.accessToken);

    const { supabaseAdmin } = await import("@/integrations/external-supabase/admin.server");
    const { externalAdmin } = await import("@/integrations/external-supabase/admin.server");

    const now = Date.now();
    const iso7 = new Date(now - 7 * 86400000).toISOString();
    const iso30 = new Date(now - 30 * 86400000).toISOString();
    const periodDays = data.days ?? 30;
    const isoPeriod = periodDays > 0 ? new Date(now - periodDays * 86400000).toISOString() : "";

    const [
      usersTotal,
      users7d,
      users30d,
      firstUser,
      officesAll,
      subsActive,
      subsCanceled30,
      plansAll,
      logsAll,
      supportAll,
      supportPending,
      entAll,
      entPending,
      pay30,
      payApprovedAll,
      materialsCount,
      downloadsAll,
      recentSupport,
      recentEnterprise,
      recentPayments,
      recentDownloads,
    ] = await Promise.all([
      externalAdmin.from("profiles").select("*", { count: "exact", head: true }),
      externalAdmin.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", iso7),
      externalAdmin.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", iso30),
      externalAdmin.from("profiles").select("created_at").order("created_at", { ascending: true }).limit(1),
      externalAdmin.from("offices").select("id, status, trial_expires_at, onboarding_completed"),
      externalAdmin.from("subscriptions").select("plan_id, status", { count: "exact" }).eq("status", "active"),
      externalAdmin
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("status", "canceled")
        .gte("updated_at", iso30),
      externalAdmin.from("plans").select("id, code, price_cents"),
      externalAdmin
        .from("app_logs" as any)
        .select("level, action, route, user_id, user_email, user_agent, created_at")
        .order("created_at", { ascending: false })
        .limit(50000),
      supabaseAdmin.from("support_messages").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("support_messages").select("*", { count: "exact", head: true }).eq("status", "new"),
      supabaseAdmin.from("enterprise_requests").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("enterprise_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabaseAdmin.from("payment_events").select("*", { count: "exact", head: true }).gte("created_at", iso30),
      supabaseAdmin.from("payment_events").select("amount, created_at").eq("status", "approved"),
      supabaseAdmin.from("material_files").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("download_events" as any).select("slug, title, filename, created_at").limit(50000),
      supabaseAdmin
        .from("support_messages")
        .select("id, name, message, created_at")
        .order("created_at", { ascending: false })
        .limit(3),
      supabaseAdmin
        .from("enterprise_requests")
        .select("id, empresa, nome, created_at")
        .order("created_at", { ascending: false })
        .limit(3),
      supabaseAdmin
        .from("payment_events")
        .select("id, status, amount, created_at")
        .order("created_at", { ascending: false })
        .limit(3),
      supabaseAdmin
        .from("download_events" as any)
        .select("id, title, slug, created_at")
        .order("created_at", { ascending: false })
        .limit(3),
    ]);

    // MRR
    const planById = new Map(
      ((plansAll.data ?? []) as any[]).map((p) => [p.id, { code: String(p.code), price: Number(p.price_cents ?? 0) }]),
    );
    let mrr = 0;
    for (const s of (subsActive.data ?? []) as any[]) {
      const p = planById.get(s.plan_id);
      if (!p) continue;
      mrr += p.code.includes("yearly") ? Math.round(p.price / 12) : p.price;
    }

    // Escritórios
    const officesRows = (officesAll.data ?? []) as any[];
    const officesActive = officesRows.filter((o) => o.status === "active").length;
    const officesTrial = officesRows.filter(
      (o) => o.status === "trial" || (o.trial_expires_at && new Date(o.trial_expires_at) > new Date()),
    ).length;
    const officesOnboarded = officesRows.filter((o) => o.onboarding_completed).length;

    // Pagamentos (coluna correta é `amount`, em reais)
    const payRows = ((payApprovedAll.data ?? []) as any[]).map((r) => ({
      cents: Math.round(Number(r.amount ?? 0) * 100),
      at: r.created_at as string,
    }));
    const revenueAllCents = payRows.reduce((a, r) => a + r.cents, 0);
    const pay30Rows = payRows.filter((r) => r.at >= iso30);
    const revenue30dCents = pay30Rows.reduce((a, r) => a + r.cents, 0);

    // Downloads
    const dlRows = ((downloadsAll.data ?? []) as any[]).map((r) => ({
      slug: String(r.slug ?? "-"),
      title: String(r.title ?? r.filename ?? r.slug ?? "-"),
      at: String(r.created_at ?? ""),
    }));
    const dlBySlug = new Map<string, { slug: string; title: string; count: number }>();
    for (const r of dlRows) {
      const cur = dlBySlug.get(r.slug) ?? { slug: r.slug, title: r.title, count: 0 };
      cur.count += 1;
      dlBySlug.set(r.slug, cur);
    }
    const topDownloads = [...dlBySlug.values()].sort((a, b) => b.count - a.count).slice(0, 5);

    // Tráfego (app_logs — desde o primeiro registro)
    const logs = (logsAll.data ?? []) as any[];
    let pageviews = 0;
    let mobile = 0;
    let desktop = 0;
    let installs = 0;
    let errors7d = 0;
    const visitorSet = new Set<string>();
    const anonSet = new Set<string>();
    const pageCount = new Map<string, number>();
    let periodPageviews = 0;
    const periodVisitorSet = new Set<string>();
    for (const l of logs) {
      const action = String(l.action ?? "");
      const ua = String(l.user_agent ?? "");
      const at = String(l.created_at ?? "");
      const inPeriod = !isoPeriod || at >= isoPeriod;
      if (action === "pageview") {
        pageviews += 1;
        if (inPeriod) periodPageviews += 1;
        const route = String(l.route ?? "/");
        pageCount.set(route, (pageCount.get(route) ?? 0) + 1);
        if (/Mobile|Android|iPhone|iPad/i.test(ua)) mobile += 1;
        else desktop += 1;
      }
      if (action === "pwa.installed") installs += 1;
      if (l.level === "error" && at >= iso7) errors7d += 1;
      const key = l.user_id ? `u:${l.user_id}` : l.user_email ? `e:${l.user_email}` : `a:${ua}`;
      visitorSet.add(key);
      if (inPeriod) periodVisitorSet.add(key);
      if (!l.user_id && !l.user_email) anonSet.add(key);
    }
    const topPages = [...pageCount.entries()]
      .map(([route, count]) => ({ route, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    // Janela do período selecionado
    const periodPayRows = isoPeriod ? payRows.filter((r) => r.at >= isoPeriod) : payRows;
    const periodDownloads = isoPeriod ? dlRows.filter((r) => r.at >= isoPeriod).length : dlRows.length;
    const usersPeriod = isoPeriod
      ? (await externalAdmin.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", isoPeriod))
          .count ?? 0
      : usersTotal.count ?? 0;

    // Timeline
    const events: AdminOverview["events"] = [];
    for (const r of (recentSupport.data ?? []) as any[]) {
      events.push({ id: `s-${r.id}`, kind: "suporte", title: `Suporte · ${r.name}`, at: r.created_at });
    }
    for (const r of (recentEnterprise.data ?? []) as any[]) {
      events.push({
        id: `e-${r.id}`,
        kind: "enterprise",
        title: `Enterprise · ${r.empresa ?? r.nome}`,
        at: r.created_at,
      });
    }
    for (const r of (recentPayments.data ?? []) as any[]) {
      const brl = Number(r.amount ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
      events.push({
        id: `p-${r.id}`,
        kind: r.status === "approved" ? "pagamento" : "erro",
        title: `Pagamento ${r.status} · ${brl}`,
        at: r.created_at,
      });
    }
    for (const r of (recentDownloads.data ?? []) as any[]) {
      events.push({
        id: `d-${r.id}`,
        kind: "download",
        title: `Download · ${r.title ?? r.slug}`,
        at: r.created_at,
      });
    }
    events.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

    const firstLogAt = logs.length ? String(logs[logs.length - 1].created_at ?? "") : "";
    const firstProfileAt = ((firstUser.data ?? []) as any[])[0]?.created_at ?? "";
    const sinceCandidates = [firstLogAt, firstProfileAt].filter(Boolean).sort();

    return {
      users: { total: usersTotal.count ?? 0, last7d: users7d.count ?? 0, last30d: users30d.count ?? 0 },
      offices: { total: officesRows.length, active: officesActive, trial: officesTrial, onboarded: officesOnboarded },
      subscriptions: { active: subsActive.count ?? 0, canceled30d: subsCanceled30.count ?? 0, mrrCents: mrr },
      support: { total: supportAll.count ?? 0, pending: supportPending.count ?? 0 },
      enterprise: { total: entAll.count ?? 0, pending: entPending.count ?? 0 },
      payments: {
        last30d: pay30.count ?? 0,
        approved30d: pay30Rows.length,
        revenue30dCents,
        revenueAllCents,
      },
      materials: { total: materialsCount.count ?? 0 },
      downloads: {
        total: dlRows.length,
        last30d: dlRows.filter((r) => r.at >= iso30).length,
        top: topDownloads,
      },
      traffic: {
        pageviews,
        visitors: visitorSet.size,
        anonymous: anonSet.size,
        mobile,
        desktop,
        installs,
        errors7d,
        topPages,
      },
      period: {
        days: periodDays,
        usersNew: usersPeriod,
        revenueCents: periodPayRows.reduce((a, r) => a + r.cents, 0),
        paymentsApproved: periodPayRows.length,
        downloads: periodDownloads,
        pageviews: periodPageviews,
        visitors: periodVisitorSet.size,
      },
      since: sinceCandidates[0] ?? null,
      events: events.slice(0, 10),
    };
  });
