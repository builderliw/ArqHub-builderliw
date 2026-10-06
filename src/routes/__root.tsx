import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { BackToTop } from "@/components/back-to-top";
import { GlobalLogCapture } from "@/components/global-log-capture";
import { InstallAppPrompt } from "@/components/install-app-prompt";
import { AssistenteBubbleLazy } from "@/components/assistente-bubble-lazy";
import { Toaster } from "@/components/ui/sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "ArqHub — Gestão para Arquitetura, Engenharia e Interiores" },
      {
        name: "description",
        content:
          "Gerencie projetos, clientes, obras e finanças em um único lugar.",
      },
      { property: "og:title", content: "ArqHub" },
      {
        property: "og:description",
        content:
          "Gerencie projetos, clientes, obras e finanças em um único lugar. Plataforma  para arquitetos, engenheiros e designers.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "ArqHub" },
      {
        name: "twitter:description",
        content:
          "Gerencie projetos, clientes, obras e finanças em um único lugar. Plataforma  para arquitetos, engenheiros e designers.",
      },
      { name: "theme-color", content: "#0F172A" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "ArqHub" },
      { name: "mobile-web-app-capable", content: "yes" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800&family=Geist+Mono:wght@400;500&family=Inter:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var isStandalone =
                    (window.matchMedia && (
                      window.matchMedia('(display-mode: standalone)').matches ||
                      window.matchMedia('(display-mode: fullscreen)').matches ||
                      window.matchMedia('(display-mode: minimal-ui)').matches
                    )) ||
                    window.navigator.standalone === true ||
                    document.referrer.indexOf('android-app://') === 0;
                  if (!isStandalone) return;
                  var path = window.location.pathname;
                  var allowed =
                    path.indexOf('/app') === 0 ||
                    path.indexOf('/entrar') === 0 ||
                    path.indexOf('/esqueci-senha') === 0 ||
                    path.indexOf('/redefinir-senha') === 0 ||
                    path.indexOf('/auth') === 0;
                  if (!allowed) window.location.replace('/app');
                } catch (_) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    void import("@/lib/pwa-register").then(({ registerPwa }) => registerPwa());
  }, []);

  useEffect(() => {
    void import("@/lib/pwa-detect").then(({ isPwaStandalone }) => {
      if (!isPwaStandalone()) return;
      const path = window.location.pathname;
      const allowed =
        path.startsWith("/app") ||
        path.startsWith("/entrar") ||
        path.startsWith("/esqueci-senha") ||
        path.startsWith("/redefinir-senha") ||
        path.startsWith("/auth");
      if (!allowed) {
        window.location.replace("/app");
      }
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <BackToTop />
      <GlobalLogCapture />
      <InstallAppPrompt />
      <AssistenteBubbleLazy />
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}
