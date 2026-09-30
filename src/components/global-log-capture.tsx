import { useEffect } from "react";
import { installGlobalLogCapture } from "@/lib/app-logger";

export function GlobalLogCapture() {
  useEffect(() => {
    installGlobalLogCapture();
  }, []);
  return null;
}
