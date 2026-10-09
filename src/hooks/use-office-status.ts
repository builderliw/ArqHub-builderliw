import { useEffect, useState } from "react";
import { externalSupabase } from "@/integrations/external-supabase/client";

export type OfficeStatus = "trial" | "active" | "expired" | "pending" | "canceled";

export type OfficeStatusInfo = {
  loading: boolean;
  officeId: string | null;
  officeName: string | null;
  status: OfficeStatus | null;
  trialExpiresAt: string | null;
  currentPeriodEnd: string | null;
  expiresAt: string | null;
  daysLeft: number | null;
  isExpired: boolean;
};

export function useOfficeStatus(): OfficeStatusInfo {
  const [info, setInfo] = useState<OfficeStatusInfo>({
    loading: true,
    officeId: null,
    officeName: null,
    status: null,
    trialExpiresAt: null,
    currentPeriodEnd: null,
    expiresAt: null,
    daysLeft: null,
    isExpired: false,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: u } = await externalSupabase.auth.getUser();
      if (!u.user) {
        if (!cancelled) setInfo((p) => ({ ...p, loading: false }));
        return;
      }
      const { data: office } = await externalSupabase
        .from("offices")
        .select("id, name, status, trial_expires_at")
        .eq("owner_id", u.user.id)
        .maybeSingle();
      if (cancelled) return;
      if (!office) {
        setInfo({ loading: false, officeId: null, officeName: null, status: null, trialExpiresAt: null, currentPeriodEnd: null, expiresAt: null, daysLeft: null, isExpired: false });
        return;
      }
      const officeId = (office as { id: string }).id;
      const officeName = (office as { name: string | null }).name ?? null;
      const status = (office as { status: OfficeStatus }).status ?? null;
      const trialExpiresAt = (office as { trial_expires_at: string | null }).trial_expires_at ?? null;

      let currentPeriodEnd: string | null = null;
      try {
        const { data: sub } = await externalSupabase
          .from("subscriptions")
          .select("current_period_end")
          .eq("office_id", officeId)
          .maybeSingle();
        currentPeriodEnd = (sub as { current_period_end: string | null } | null)?.current_period_end ?? null;
      } catch {
        currentPeriodEnd = null;
      }

      const expiresAt = status === "active" ? currentPeriodEnd : trialExpiresAt;
      let daysLeft: number | null = null;
      if (expiresAt) {
        const ms = new Date(expiresAt).getTime() - Date.now();
        daysLeft = Math.ceil(ms / (1000 * 60 * 60 * 24));
      }
      const isExpired =
        status === "expired" ||
        (status === "trial" && trialExpiresAt !== null && new Date(trialExpiresAt).getTime() < Date.now());
      setInfo({
        loading: false,
        officeId,
        officeName,
        status,
        trialExpiresAt,
        currentPeriodEnd,
        expiresAt,
        daysLeft,
        isExpired,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return info;
}
