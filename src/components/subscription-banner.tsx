import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { AlertTriangle, Sparkles } from "lucide-react";
import { useOfficeStatus } from "@/hooks/use-office-status";

export function SubscriptionBanner() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { loading, status, daysLeft, isExpired } = useOfficeStatus();

  useEffect(() => {
    if (loading) return;
    if (isExpired && !pathname.startsWith("/planos")) {
      navigate({ to: "/planos" });
    }
  }, [loading, isExpired, pathname, navigate]);

  if (loading || !status) return null;

  if (isExpired) {
    return (
      <div className="px-6 lg:px-8 pt-4">
        <div className="flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-[13px]">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" strokeWidth={2} />
            <span className="font-medium">Sua assinatura expirou.</span>
            <span className="text-destructive/80">Renove para continuar usando o ArqHub.</span>
          </div>
          <Link
            to="/planos"
            className="rounded-md bg-destructive px-3 py-1.5 text-white font-medium hover:bg-destructive/90 transition-colors"
          >
            Ver planos
          </Link>
        </div>
      </div>
    );
  }

  if (status === "trial") {
    const left = daysLeft ?? 0;
    if (left <= 3) {
      return (
        <div className="px-6 lg:px-8 pt-4">
          <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 text-[13px] text-amber-900">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-600" strokeWidth={2} />
              <span className="font-medium">
                {left > 0
                  ? `Seu teste grátis termina em ${left} ${left === 1 ? "dia" : "dias"}.`
                  : "Seu período de teste termina hoje."}
              </span>
            </div>
            <Link
              to="/planos"
              className="rounded-md bg-primary px-3 py-1.5 text-white font-medium hover:bg-primary/90 transition-colors"
            >
              Assinar agora
            </Link>
          </div>
        </div>
      );
    }
    return null;
  }


  if (status === "active") {
    const left = daysLeft;
    if (left !== null && left <= 7) {
      return (
        <div className="px-6 lg:px-8 pt-4">
          <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 text-[13px] text-amber-900">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-600" strokeWidth={2} />
              <span className="font-medium">
                {left > 0
                  ? `Seu plano vence em ${left} ${left === 1 ? "dia" : "dias"} — renove para não perder o acesso.`
                  : "Seu plano vence hoje — renove agora."}
              </span>
            </div>
            <Link
              to="/planos"
              className="rounded-md bg-amber-600 px-3 py-1.5 text-white font-medium hover:bg-amber-700 transition-colors"
            >
              Renovar
            </Link>
          </div>
        </div>
      );
    }
    return null;
  }



  return null;
}
