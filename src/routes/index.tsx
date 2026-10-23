import { createFileRoute } from "@tanstack/react-router";
import { Home } from "@/components/home-landing-page";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ArqHub — Gestão para Arquitetura, Engenharia e Interiores" },
      {
        name: "description",
        content: "Gerencie projetos, clientes, obras e finanças em um único lugar.",
      },
    ],
  }),
  component: Home,
});
