import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type DownloadRow = {
  id: string;
  kind: string;
  category: string | null;
  slug: string;
  title: string;
  filename: string | null;
  access_level: string | null;
  user_email: string | null;
  device: string | null;
  created_at: string;
};

export type DownloadStats = {
  days: number;
  total: number;
  last7d: number;
  last30d: number;
  uniqueUsers: number;
  since: string | null;
  byItem: Array<{ slug: string; title: string; kind: string; count: number; last: string }>;
  byDay: Array<{ day: string; count: number }>;
  rows: DownloadRow[];
};

const Schema = z.object({ accessToken: z.string().min(10), days: z.number().int().min(0).max(3650).optional() });

export const getDownloadStats = createServerFn({ method: "POST" })
  .inputValidator((d) => Schema.parse(d))
  .handler(async ({ data }): Promise<DownloadStats> => {
    const { assertAdminByToken } = await import("@/lib/admin-auth.server");
    await assertAdminByToken(data.accessToken);
    const { supabaseAdmin } = await import("@/integrations/external-supabase/admin.server");

    const periodDays = data.days ?? 0;
    const isoPeriod = periodDays > 0 ? new Date(Date.now() - periodDays * 86400000).toISOString() : "";

    let q = supabaseAdmin
      .from("download_events" as any)
      .select("id, kind, category, slug, title, filename, access_level, user_email, device, created_at")
      .order("created_at", { ascending: false })
      .limit(20000);
    if (isoPeriod) q = q.gte("created_at", isoPeriod);
    const { data: rowsRaw, error } = await q;
    if (error) throw new Error(error.message);

    const rows: DownloadRow[] = ((rowsRaw ?? []) as any[]).map((r) => ({
      id: String(r.id),
      kind: String(r.kind ?? "material"),
      category: r.category ?? null,
      slug: String(r.slug ?? "-"),
      title: String(r.title ?? r.filename ?? r.slug ?? "-"),
      filename: r.filename ?? null,
      access_level: r.access_level ?? null,
      user_email: r.user_email ?? null,
      device: r.device ?? null,
      created_at: String(r.created_at),
    }));

    const now = Date.now();
    const iso7 = new Date(now - 7 * 86400000).toISOString();
    const iso30 = new Date(now - 30 * 86400000).toISOString();

    const byItemMap = new Map<string, { slug: string; title: string; kind: string; count: number; last: string }>();
    const byDayMap = new Map<string, number>();
    const users = new Set<string>();
    for (const r of rows) {
      const key = `${r.kind}:${r.slug}`;
      const cur = byItemMap.get(key) ?? { slug: r.slug, title: r.title, kind: r.kind, count: 0, last: r.created_at };
      cur.count += 1;
      if (r.created_at > cur.last) cur.last = r.created_at;
      byItemMap.set(key, cur);
      const day = r.created_at.slice(0, 10);
      byDayMap.set(day, (byDayMap.get(day) ?? 0) + 1);
      if (r.user_email) users.add(r.user_email.toLowerCase());
    }

    const byDay = [...byDayMap.entries()]
      .map(([day, count]) => ({ day, count }))
      .sort((a, b) => (a.day < b.day ? -1 : 1))
      .slice(-(periodDays > 0 ? periodDays : 30));

    return {
      days: periodDays,
      total: rows.length,
      last7d: rows.filter((r) => r.created_at >= iso7).length,
      last30d: rows.filter((r) => r.created_at >= iso30).length,
      uniqueUsers: users.size,
      since: rows.length ? rows[rows.length - 1].created_at : null,
      byItem: [...byItemMap.values()].sort((a, b) => b.count - a.count),
      byDay,
      rows: rows.slice(0, 300),
    };
  });
