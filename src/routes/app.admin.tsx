import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/app/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  return <Outlet />;
}