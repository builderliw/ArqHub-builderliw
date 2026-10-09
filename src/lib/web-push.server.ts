// Web Push (RFC 8291 / aes128gcm) implementation for Cloudflare Workers using Web Crypto.
// Server-only: never import from client modules.

// VAPID keypair (private). Public key lives in src/lib/push-config.ts.
// Loaded lazily from environment secrets — never hardcode.
type VapidJwk = { kty: "EC"; crv: "P-256"; x: string; y: string; d: string };
let _vapidJwk: VapidJwk | undefined;
let _vapidPublicRaw: string | undefined;
function getVapidJwk(): VapidJwk {
  if (_vapidJwk) return _vapidJwk;
  const raw = process.env.VAPID_PRIVATE_JWK;
  if (!raw) throw new Error("VAPID_PRIVATE_JWK not configured");
  const parsed = JSON.parse(raw) as VapidJwk;
  if (parsed.kty !== "EC" || parsed.crv !== "P-256" || !parsed.d || !parsed.x || !parsed.y) {
    throw new Error("VAPID_PRIVATE_JWK invalid");
  }
  _vapidJwk = parsed;
  return parsed;
}
function getVapidPublicRaw(): string {
  if (_vapidPublicRaw) return _vapidPublicRaw;
  const v = process.env.VAPID_PUBLIC_RAW;
  if (!v) throw new Error("VAPID_PUBLIC_RAW not configured");
  _vapidPublicRaw = v;
  return v;
}
const VAPID_SUBJECT = "mailto:noreply@arqhub.world";

function b64uToBytes(s: string): Uint8Array {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  const raw = atob(s);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}
function bytesToB64u(b: Uint8Array): string {
  let s = "";
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function concat(...parts: Uint8Array[]): Uint8Array {
  let len = 0;
  for (const p of parts) len += p.length;
  const out = new Uint8Array(len);
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
}
const enc = new TextEncoder();

async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, length: number) {
  const key = await crypto.subtle.importKey("raw", ikm as unknown as BufferSource, "HKDF", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt: salt as unknown as BufferSource, info: info as unknown as BufferSource },
    key,
    length * 8,
  );
  return new Uint8Array(bits);
}

async function importClientPublicKey(p256dhB64u: string) {
  const raw = b64uToBytes(p256dhB64u);
  if (raw.length !== 65 || raw[0] !== 0x04) throw new Error("Invalid p256dh");
  const x = bytesToB64u(raw.slice(1, 33));
  const y = bytesToB64u(raw.slice(33, 65));
  return crypto.subtle.importKey(
    "jwk",
    { kty: "EC", crv: "P-256", x, y },
    { name: "ECDH", namedCurve: "P-256" },
    true,
    [],
  );
}

async function buildVapidAuthHeader(audience: string): Promise<string> {
  const header = { typ: "JWT", alg: "ES256" };
  const payload = {
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 12 * 3600,
    sub: VAPID_SUBJECT,
  };
  const headerB64 = bytesToB64u(enc.encode(JSON.stringify(header)));
  const payloadB64 = bytesToB64u(enc.encode(JSON.stringify(payload)));
  const signingInput = `${headerB64}.${payloadB64}`;

  const signingKey = await crypto.subtle.importKey(
    "jwk",
    { ...getVapidJwk(), ext: true, key_ops: ["sign"] },
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
  const sig = new Uint8Array(
    await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, signingKey, enc.encode(signingInput)),
  );
  const jwt = `${signingInput}.${bytesToB64u(sig)}`;
  return `vapid t=${jwt}, k=${getVapidPublicRaw()}`;
}

async function encryptPayload(payload: Uint8Array, clientP256dhB64u: string, clientAuthB64u: string) {
  // Ephemeral ECDH keypair
  const ephemeral = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"],
  );
  const ephemeralJwk = await crypto.subtle.exportKey("jwk", ephemeral.publicKey);
  const ephX = b64uToBytes(ephemeralJwk.x!);
  const ephY = b64uToBytes(ephemeralJwk.y!);
  const ephemeralPubRaw = concat(new Uint8Array([0x04]), ephX, ephY);

  const clientPub = await importClientPublicKey(clientP256dhB64u);
  const sharedBits = await crypto.subtle.deriveBits(
    { name: "ECDH", public: clientPub }, ephemeral.privateKey, 256,
  );
  const ikm = new Uint8Array(sharedBits);

  const authSecret = b64uToBytes(clientAuthB64u);
  const clientPubRaw = b64uToBytes(clientP256dhB64u);

  // RFC 8291: PRK_key = HKDF(authSecret, ECDH, info="WebPush: info\0" || ua_public || as_public, 32)
  const keyInfo = concat(
    enc.encode("WebPush: info\0"),
    clientPubRaw,
    ephemeralPubRaw,
  );
  const ikm2 = await hkdf(authSecret, ikm, keyInfo, 32);

  // salt
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // CEK and nonce derived from ikm2 and salt
  const cek = await hkdf(salt, ikm2, concat(enc.encode("Content-Encoding: aes128gcm\0")), 16);
  const nonce = await hkdf(salt, ikm2, concat(enc.encode("Content-Encoding: nonce\0")), 12);

  // Plaintext + 0x02 padding delimiter (aes128gcm requires a delimiter byte)
  const plaintext = concat(payload, new Uint8Array([0x02]));

  const aesKey = await crypto.subtle.importKey("raw", cek as unknown as BufferSource, { name: "AES-GCM" }, false, ["encrypt"]);
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: nonce as unknown as BufferSource },
      aesKey,
      plaintext as unknown as BufferSource,
    ),
  );

  // Header: salt(16) || rs(4 BE) || idlen(1) || keyid (ephemeral public raw 65 bytes)
  const rs = new Uint8Array(4);
  new DataView(rs.buffer).setUint32(0, 4096, false);
  const idlen = new Uint8Array([ephemeralPubRaw.length]);
  return concat(salt, rs, idlen, ephemeralPubRaw, ciphertext);
}

export type WebPushSubscription = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

export type WebPushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  badge?: number;
  icon?: string;
};

/** Returns { status, statusCode, removed } — removed=true if endpoint is gone (404/410). */
export async function sendWebPush(sub: WebPushSubscription, payload: WebPushPayload) {
  try {
    const body = enc.encode(JSON.stringify(payload));
    const ciphertext = await encryptPayload(body, sub.p256dh, sub.auth);
    const url = new URL(sub.endpoint);
    const auth = await buildVapidAuthHeader(`${url.protocol}//${url.host}`);

    const res = await fetch(sub.endpoint, {
      method: "POST",
      headers: {
        "Content-Encoding": "aes128gcm",
        "Content-Type": "application/octet-stream",
        "TTL": "86400",
        "Urgency": "normal",
        "Authorization": auth,
      },
      body: ciphertext as unknown as BodyInit,
    });

    return {
      ok: res.ok,
      status: res.status,
      removed: res.status === 404 || res.status === 410,
    };
  } catch (e) {
    return { ok: false, status: 0, removed: false, error: String(e) };
  }
}
