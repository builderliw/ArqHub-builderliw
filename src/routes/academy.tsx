// ArqHub Academy vive em domínio próprio.
// Qualquer acesso a /academy (botão da home, menu, links antigos) vai para lá.
import { createFileRoute, redirect } from "@tanstack/react-router";

const ACADEMY_URL = "https://arqhub-academy.world";

export const Route = createFileRoute("/academy")({
  beforeLoad: () => {
    throw redirect({ href: ACADEMY_URL });
  },
  // Fallback caso o redirect do router não dispare (SSR / edge)
  component: function AcademyRedirect() {
    if (typeof window !== "undefined") {
      window.location.replace(ACADEMY_URL);
    }
    return (
      <p className="p-8 text-center text-sm text-muted-foreground">
        Redirecionando para a{" "}
        <a className="underline" href={ACADEMY_URL}>
          ArqHub Academy
        </a>
        …
      </p>
    );
  },
});
