import foto1 from "@/assets/diario-foto-1.jpg";
import foto2 from "@/assets/diario-foto-2.jpg";
import foto3 from "@/assets/diario-foto-3.jpg";
import { Calendar as CalendarIcon, Sun, Camera, ClipboardList, CheckCircle2, Clock } from "lucide-react";

export const DiarioObraDemo = () => (
  <div className="w-full h-full flex items-center justify-center p-3">
    <div className="w-full max-w-[320px] bg-white border border-black/5 rounded-2xl overflow-hidden shadow-[0_8px_28px_-12px_rgba(0,0,0,0.18)]">
      <div className="flex items-center gap-2.5 px-3 py-2.5 bg-gradient-to-br from-emerald-50 via-white to-white border-b border-black/5">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-sm">
          <CalendarIcon className="h-4 w-4" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-[12.5px] font-semibold text-[#3f3f3d] leading-tight">Diário de Obra</div>
          <div className="text-[10px] text-[#8a8a80]">Segunda-feira</div>
        </div>
      </div>

      <div className="p-3 space-y-2.5">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-black/5 bg-[#f7f7f4] p-2.5">
            <div className="flex items-center gap-1 text-[9px] uppercase tracking-wider text-[#8a8a80] mb-1">
              <CalendarIcon className="h-2.5 w-2.5" /> Data
            </div>
            <div className="text-[12px] font-semibold text-[#3f3f3d] leading-tight">15 Jul 2025</div>
            <div className="text-[10px] text-[#8a8a80] mt-0.5">Segunda-feira</div>
          </div>
          <div className="rounded-lg border border-amber-200/70 bg-gradient-to-br from-amber-50 to-orange-50/40 p-2.5">
            <div className="flex items-center gap-1 text-[9px] uppercase tracking-wider text-amber-700/80 mb-1">
              <Sun className="h-2.5 w-2.5" /> Temperatura
            </div>
            <div className="text-[14px] font-bold text-[#3f3f3d] leading-none tabular-nums">28°C</div>
            <div className="text-[10px] text-[#8a8a80] mt-1">Previsão do dia</div>
          </div>
        </div>

        <div className="rounded-lg border border-black/5 p-2.5">
          <div className="flex items-center justify-between mb-1.5">
            <div className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-[#3f3f3d]">
              <Camera className="h-3 w-3" /> Fotos do dia
            </div>
            <span className="text-[9.5px] text-[#8a8a80]">3 fotos</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {[foto1, foto2, foto3].map((src, i) => (
              <img
                key={i}
                src={src}
                alt={`Foto da obra ${i + 1}`}
                loading="lazy"
                decoding="async"
                width={512}
                height={512}
                className="aspect-square w-full h-auto rounded object-cover bg-stone-200"
              />
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-black/5 p-2.5">
          <div className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-[#3f3f3d] mb-1.5">
            <ClipboardList className="h-3 w-3" /> Atividades do dia
          </div>
          <ul className="space-y-1">
            <li className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
                <span className="text-[10.5px] text-[#3f3f3d] truncate">Concretagem laje</span>
              </div>
              <span className="text-[9px] text-[#8a8a80] shrink-0">Concluída</span>
            </li>
            <li className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <Clock className="h-3 w-3 text-amber-500 shrink-0" />
                <span className="text-[10.5px] text-[#3f3f3d] truncate">Instalação hidráulica</span>
              </div>
              <span className="text-[9px] text-[#8a8a80] shrink-0">Em andamento</span>
            </li>
            <li className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
                <span className="text-[10.5px] text-[#3f3f3d] truncate">Alvenaria pavimento térreo</span>
              </div>
              <span className="text-[9px] text-[#8a8a80] shrink-0">Concluída</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
);
