import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface HiddenValueProps {
  value: string;
  className?: string;
  mask?: string;
  eyeClassName?: string;
}

export function HiddenValue({
  value,
  className = "",
  mask = "••••••",
  eyeClassName = "text-muted-foreground hover:text-ink hover:bg-muted",
}: HiddenValueProps) {
  const [visible, setVisible] = useState(false);

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className="tabular-nums">{visible ? value : mask}</span>
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className={`inline-flex items-center justify-center rounded p-0.5 transition cursor-pointer ${eyeClassName}`}
        aria-label={visible ? "Ocultar valor" : "Mostrar valor"}
      >
        {visible ? (
          <Eye className="h-3 w-3" strokeWidth={2} />
        ) : (
          <EyeOff className="h-3 w-3" strokeWidth={2} />
        )}
      </button>
    </span>
  );
}
