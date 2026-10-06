import { Link } from "@tanstack/react-router";
import { Crown, Sparkles, X } from "lucide-react";
import { createPortal } from "react-dom";
import { useCallback, useState } from "react";

import { PLAN_MARKETING_FEATURES } from "@/lib/plan-features";

export type UpgradeReason = {
  title: string;
  description: string;
  /** Plano sugerido para destravar o recurso. */
  suggested?: "premium" | "enterprise";
};

export function UpgradeModal({
  open,
  reason,
  onClose,
}: {
  open: boolean;
  reason: UpgradeReason | null;
  onClose: () => void;
}) {
  if (!open || !reason || typeof document === "undefined") return null;

  const suggested = reason.suggested ?? "premium";
  const features = PLAN_MARKETING_FEATURES[suggested].slice(0, 6);

  return createPortal(
    <div className="fixed inset-0 z-[2147483000] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-white shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="bg-gradient-to-br from-amber-50 to-white px-6 pb-5 pt-6">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-amber-100">
            <Crown className="h-5 w-5 text-amber-700" />
          </div>
          <h2 className="mt-3 text-[19px] font-semibold tracking-tight text-ink">
            {reason.title}
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">{reason.description}</p>
        </div>

        <div className="px-6 pb-6">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
            {suggested === "enterprise" ? "No Enterprise você tem" : "No Premium você tem"}
          </p>
          <ul className="mt-2 space-y-1.5">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-[13.5px] text-ink">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                <span>{f}</span>
              </li>
            ))}
          </ul>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Link
              to={suggested === "enterprise" ? "/cadastro/enterprise" : "/checkout/$plano"}
              params={suggested === "enterprise" ? undefined : { plano: "premium" }}
              search={suggested === "enterprise" ? undefined : { freq: "monthly" }}
              onClick={onClose}
              className="inline-flex h-10 flex-1 items-center justify-center rounded-md bg-primary px-4 text-[13px] font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Fazer upgrade agora
            </Link>
            <Link
              to="/planos"
              onClick={onClose}
              className="inline-flex h-10 items-center justify-center rounded-md border border-border px-4 text-[13px] font-medium text-ink hover:bg-muted"
            >
              Comparar planos
            </Link>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** Helper para abrir o modal de upgrade a partir de qualquer tela. */
export function useUpgradeModal() {
  const [reason, setReason] = useState<UpgradeReason | null>(null);

  const requireUpgrade = useCallback((r: UpgradeReason) => setReason(r), []);
  const close = useCallback(() => setReason(null), []);

  const modal = <UpgradeModal open={!!reason} reason={reason} onClose={close} />;

  return { requireUpgrade, close, modal };
}
