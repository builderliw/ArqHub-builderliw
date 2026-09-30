import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/ajuda")({
  component: () => <Outlet />,
});
