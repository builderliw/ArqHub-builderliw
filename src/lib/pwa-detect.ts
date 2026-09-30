// Detecção robusta de execução como PWA instalado (iOS + Android + Desktop).
export function isPwaStandalone(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const nav = window.navigator as Navigator & { standalone?: boolean };
    const mm = window.matchMedia;
    const matches = (q: string) => {
      try {
        return !!mm && mm(q).matches;
      } catch {
        return false;
      }
    };
    return (
      matches("(display-mode: standalone)") ||
      matches("(display-mode: fullscreen)") ||
      matches("(display-mode: minimal-ui)") ||
      nav.standalone === true ||
      document.referrer.startsWith("android-app://")
    );
  } catch {
    return false;
  }
}
