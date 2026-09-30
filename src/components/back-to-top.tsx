import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 500);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      onClick={scrollTop}
      aria-label="Voltar ao topo"
      className={`
        fixed bottom-8 right-8 z-50
        flex items-center justify-center
        h-11 w-11 rounded-full
        bg-background/75 text-ink backdrop-blur-xl supports-[backdrop-filter]:bg-background/60
        border border-border/60
        shadow-[0_1px_2px_0_rgb(16_24_40/0.04),0_4px_12px_-2px_rgb(16_24_40/0.08)]
        transition-all duration-500 ease-out
        hover:bg-background hover:scale-105 hover:shadow-[0_2px_4px_-2px_rgb(16_24_40/0.06),0_12px_20px_-4px_rgb(16_24_40/0.1)]
        active:scale-95
        ${visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0 pointer-events-none"}
      `}
    >
      <ArrowUp className="h-4 w-4" strokeWidth={1.75} />
    </button>
  );
}
