// ArqHub Academy vive em domínio próprio.
// Qualquer acesso a /academy (botão da home, menu, links antigos) vai para lá.
import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

const ACADEMY_URL = "https://arqhub-academy.world";

export const Route = createFileRoute("/academy")({
  head: () => ({
    meta: [
      { title: "ArqHub Academy" },
      { httpEquiv: "refresh", content: `0;url=${ACADEMY_URL}` },
    ],
  }),
  component: function AcademyRedirect() {
    useEffect(() => {
      window.location.replace(ACADEMY_URL);
    }, []);

    return (
      <p className="p-8 text-center text-sm text-muted-foreground">
        Redirecionando para a{" "}
        <a className="underline font-medium text-foreground" href={ACADEMY_URL}>
          ArqHub Academy
        </a>
        …
      </p>
    );
  },
});
