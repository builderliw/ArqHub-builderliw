import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type OnboardingFunnel = {
  steps: {
    visits: number;
    login: number;
    purchase: number;
  };
  rates: {
    visitToLogin: number;
    loginToPurchase: number;
    overall: number;
  };
  activationRate: number; // percentage of logins that completed onboarding
};

const Schema = z.object({ 
  accessToken: z.string().min(10), 
  days: z.number().int().min(0).max(3650).optional() 
});

export const getOnboardingFunnel = createServerFn({ method: "POST" })
  .inputValidator((d) => Schema.parse(d))
  .handler(async ({ data }): Promise<OnboardingFunnel> => {
    const { assertAdminByToken } = await import("@/lib/admin-auth.server");
    await assertAdminByToken(data.accessToken);

    const { externalAdmin } = await import("@/integrations/external-supabase/admin.server");
    const { supabaseAdmin } = await import("@/integrations/external-supabase/admin.server");

    const periodDays = data.days ?? 30;
    const now = new Date();
    const isoPeriod = periodDays > 0 ? new Date(now.getTime() - periodDays * 86400000).toISOString() : "";

    // 1. Visits (pageviews where action is pageview)
    // 2. Logins (logs where action starts with 'auth.')
    // 3. Purchase (payment_events approved)

    const [logsRes, paymentsRes, officesRes] = await Promise.all([
      externalAdmin
        .from("app_logs" as any)
        .select("action, details, user_id, created_at")
        .gte("created_at", isoPeriod || '1970-01-01'),
      supabaseAdmin
        .from("payment_events")
        .select("id, status, user_id, created_at")
        .eq("status", "approved")
        .gte("created_at", isoPeriod || '1970-01-01'),
      externalAdmin
        .from("offices")
        .select("id, onboarding_completed, user_id, created_at")
        .gte("created_at", isoPeriod || '1970-01-01')
    ]);

    const logs = (logsRes.data ?? []) as any[];
    const payments = (paymentsRes.data ?? []) as any[];
    const offices = (officesRes.data ?? []) as any[];

    // Unique visitors (by visitor_id in details or user_id)
    const visitorsSet = new Set();
    const loginSet = new Set();
    
    logs.forEach(l => {
      const vid = l.details?.visitor_id || l.user_id;
      if (vid) visitorsSet.add(vid);
      
      if (l.action?.startsWith('auth.') || l.user_id) {
        if (l.user_id) loginSet.add(l.user_id);
      }
    });

    const buyerSet = new Set(payments.map(p => p.user_id).filter(Boolean));
    
    const visits = visitorsSet.size;
    const logins = loginSet.size;
    const purchases = buyerSet.size;

    // Activation: logins that completed onboarding
    const onboardedCount = offices.filter(o => o.onboarding_completed).length;
    const totalOffices = offices.length;

    const visitToLogin = visits > 0 ? (logins / visits) * 100 : 0;
    const loginToPurchase = logins > 0 ? (purchases / logins) * 100 : 0;
    const overall = visits > 0 ? (purchases / visits) * 100 : 0;
    const activationRate = totalOffices > 0 ? (onboardedCount / totalOffices) * 100 : 0;

    return {
      steps: { visits, login: logins, purchase: purchases },
      rates: { 
        visitToLogin: Number(visitToLogin.toFixed(1)), 
        loginToPurchase: Number(loginToPurchase.toFixed(1)), 
        overall: Number(overall.toFixed(1)) 
      },
      activationRate: Number(activationRate.toFixed(1))
    };
  });
