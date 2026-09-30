import { Link } from "@tanstack/react-router";
import { Users, FolderOpen, CheckSquare, FileSignature, Send, type LucideIcon } from "lucide-react";

type Action = {
  label: string;
  icon: LucideIcon;
  to?: string;
  onClick?: () => void;
};

export function QuickActions({
  onNovoProjeto,
  onNovoContrato,
  onConvidar,
}: {
  onNovoProjeto?: () => void;
  onNovoContrato?: () => void;
  onConvidar?: () => void;
}) {
  const actions: Action[] = [
    { label: "Novo Cliente", icon: Users, to: "/app/profissional/clientes" },
    { label: "Novo Projeto", icon: FolderOpen, onClick: onNovoProjeto },
    { label: "Nova Tarefa", icon: CheckSquare, to: "/app/profissional/tarefas" },
    { label: "Novo Contrato", icon: FileSignature, onClick: onNovoContrato },
    { label: "Convidar Cliente", icon: Send, onClick: onConvidar },
  ];

  return (
    <div className="mb-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
      {actions.map((a) => {
        const cls = "group flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg bg-white border border-border hover:border-primary hover:shadow-[0_4px_16px_-8px_rgba(0,0,0,0.1)] transition-all";
        const inner = (
          <>
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
              <a.icon className="h-3.5 w-3.5" strokeWidth={2} />
            </span>
            <span className="text-[12.5px] font-medium text-ink">{a.label}</span>
          </>
        );
        if (a.to) {
          return <Link key={a.label} to={a.to} className={cls}>{inner}</Link>;
        }
        return (
          <button key={a.label} onClick={a.onClick} className={cls + " text-left"}>
            {inner}
          </button>
        );
      })}
    </div>
  );
}
