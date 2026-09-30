import { useEffect, useState } from "react";
import { ProjectProductsManager } from "@/components/project-products-manager";

export function ClientProductsTab({ projects, officeId }: { projects: { id: string; name: string }[]; officeId: string | null }) {
  const [projectId, setProjectId] = useState<string>(projects[0]?.id ?? "");
  useEffect(() => { if (!projectId && projects[0]) setProjectId(projects[0].id); }, [projects, projectId]);

  if (projects.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-secondary/20 p-8 text-center text-[12.5px] text-muted-foreground">
        Crie um projeto para este cliente antes de adicionar produtos.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-[11px] font-medium text-muted-foreground mb-1">Projeto</label>
        <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="bg-white border border-border rounded-md h-9 px-2 text-[13px] min-w-[240px]">
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      {projectId && <ProjectProductsManager projectId={projectId} officeId={officeId} />}
    </div>
  );
}
