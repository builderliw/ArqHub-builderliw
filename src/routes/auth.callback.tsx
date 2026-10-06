import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { externalSupabase } from "@/integrations/external-supabase/client";
import { setSession } from "@/lib/session";

export const Route = createFileRoute("/auth/callback")({
  head: () => ({ meta: [{ title: "Entrando — ArqHub" }] }),
  component: AuthCallback,
});

const statusMessages = [
  "Verificando suas credenciais…",
  "Sincronizando dados…",
  "Preparando seu ambiente…",
];

function AuthCallback() {
  const navigate = useNavigate();
  const [statusIndex, setStatusIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStatusIndex((i) => (i + 1) % statusMessages.length);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    (async () => {
      const requestedRole =
        typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("role") : null;
      const { data } = await externalSupabase.auth.getUser();
      const user = data?.user;

      if (typeof window !== "undefined" && window.opener && window.opener !== window) {
        try { window.close(); } catch { /* noop */ }
        return;
      }

      if (!user) {
        navigate({ to: "/entrar/$role", params: { role: "escritorio" } });
        return;
      }

      await externalSupabase.from("profiles").upsert(
        {
          id: user.id,
          email: user.email,
          full_name:
            (user.user_metadata?.full_name as string | undefined) ||
            (user.user_metadata?.name as string | undefined) ||
            user.email?.split("@")[0] ||
            "Usuário",
        },
        { onConflict: "id" },
      );

      if (requestedRole === "cliente") {
        const { data: sess } = await externalSupabase.auth.getSession();
        const token = sess.session?.access_token;
        const { checkClientByToken } = await import("@/lib/cliente-lookup.functions");
        const result = token
          ? await checkClientByToken({ data: { accessToken: token } })
          : { ok: false as const };

        if (result.ok) {
          setSession({
            role: "cliente",
            name: (user.user_metadata?.full_name as string) || user.email || "Cliente",
            email: user.email || "",
            onboardingDone: true,
          });
          navigate({ to: "/app/cliente" });
          return;
        }

        await externalSupabase.auth.signOut();
        navigate({ to: "/entrar/$role", params: { role: "cliente" } });
        return;
      }

      const { data: links } = await externalSupabase
        .from("client_users")
        .select("client_id")
        .eq("user_id", user.id)
        .limit(1);

      if (links && links.length > 0) {
        setSession({
          role: "cliente",
          name: (user.user_metadata?.full_name as string) || user.email || "Cliente",
          email: user.email || "",
          onboardingDone: true,
        });
        navigate({ to: "/app/cliente" });
        return;
      }

      const { data: offices } = await externalSupabase
        .from("offices")
        .select("id")
        .eq("owner_id", user.id)
        .limit(1);

      // Membro convidado: localizar por email e vincular user_id.
      let isMember = false;
      let memberOfficeId: string | null = null;
      if (!offices || offices.length === 0) {
        const email = user.email ?? "";
        const { data: mems } = await externalSupabase
          .from("office_members")
          .select("id, office_id, status, user_id")
          .or(`user_id.eq.${user.id},email.eq.${email}`)
          .limit(1);
        const mem = mems?.[0];
        if (mem) {
          isMember = true;
          memberOfficeId = mem.office_id;
          if (!mem.user_id || mem.status !== "active") {
            await externalSupabase
              .from("office_members")
              .update({ user_id: user.id, status: "active", joined_at: new Date().toISOString() })
              .eq("id", mem.id);
          }
        }
      }

      if (!offices?.length && !isMember) {
        await externalSupabase.from("offices").insert({
          owner_id: user.id,
          name: (user.user_metadata?.full_name as string) || user.email || "Meu escritório",
        });
      }

      setSession({
        role: "profissional",
        name: (user.user_metadata?.full_name as string) || user.email || "Profissional",
        email: user.email || "",
        onboardingDone: isMember ? true : !!(offices && offices.length > 0),
        isMember,
        officeId: memberOfficeId ?? offices?.[0]?.id ?? undefined,
      });
      navigate({
        to: isMember || (offices && offices.length > 0) ? "/app/profissional" : "/onboarding",
      });
    })();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center surface-grain px-6">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[22rem] rounded-[1.25rem] bg-white p-10 shadow-xl text-center ring-1 ring-border/40"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/60 ring-1 ring-primary/10">
          <motion.svg
            className="h-8 w-8 text-primary"
            viewBox="0 0 24 24"
            fill="none"
            animate={{ rotate: 360 }}
            transition={{ duration: 2.4, ease: "linear", repeat: Infinity }}
          >
            <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeOpacity="0.18" strokeWidth="2" />
            <path
              d="M21 12a9 9 0 0 0-9-9"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </motion.svg>
        </div>

        <h1 className="mt-6 t-h3 text-ink">
          Entrando no ArqHub
        </h1>

        <p className="mt-3 t-body text-ink-muted leading-relaxed">
          Só um instante enquanto preparamos tudo para você.
        </p>

        <div className="mt-6 h-5 flex items-center justify-center">
          <motion.p
            key={statusIndex}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="t-caption text-muted-foreground"
          >
            {statusMessages[statusIndex]}
          </motion.p>
        </div>

        <div className="mt-8 flex justify-center gap-1">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="inline-block h-1.5 w-1.5 rounded-full bg-primary/30"
              animate={{ scale: [1, 1.5, 1], opacity: [0.35, 1, 0.35] }}
              transition={{
                duration: 1.4,
                repeat: Infinity,
                delay: i * 0.25,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
