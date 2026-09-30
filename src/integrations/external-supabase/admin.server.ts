// Admin (service role) client for the external Supabase project.
// Server-only — NEVER import this from client code.
import { createClient } from "@supabase/supabase-js";

const URL = "https://yknwdpyaevodvonvhadt.supabase.co";

function make() {
  const key = process.env.EXTERNAL_SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("EXTERNAL_SUPABASE_SERVICE_ROLE_KEY not configured");
  return createClient(URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

let _c: ReturnType<typeof make> | undefined;
export const externalAdmin = new Proxy({} as ReturnType<typeof make>, {
  get(_, p, r) {
    if (!_c) _c = make();
    return Reflect.get(_c, p, r);
  },
});

export const EXTERNAL_URL = URL;

export const supabaseAdmin = externalAdmin;
