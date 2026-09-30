// Public VAPID key (safe to expose to the browser).
export const VAPID_PUBLIC_KEY =
  "BKg7hYKOodIvzo083fRR5UOQZEVIkLmAHRqP27vQJnbG2I0E_Bh-ccydbaQKKsbWMbCB2dfbXhONnPSQRIQJaVA";

export function urlBase64ToUint8Array(b64: string): Uint8Array {
  const padding = "=".repeat((4 - (b64.length % 4)) % 4);
  const base64 = (b64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}
