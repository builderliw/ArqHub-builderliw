import { lazy, Suspense, useEffect, useState } from "react";

const Bubble = lazy(() =>
  import("@/components/assistente-bubble").then((m) => ({ default: m.AssistenteBubble })),
);

export function AssistenteBubbleLazy() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return (
    <Suspense fallback={null}>
      <Bubble />
    </Suspense>
  );
}
