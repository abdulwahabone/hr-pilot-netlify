import { useEffect, useState } from "react";
import { Navigate } from "react-router";
import { LoginForm } from "@/components/login-form";
import { api } from "@/lib/api";

export function LoginPage() {
  // Already signed in? Skip the form, as the server-rendered login page did.
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    api("/api/auth/me", { signal: controller.signal })
      .then(() => setSignedIn(true))
      .catch(() => {
        if (!controller.signal.aborted) setSignedIn(false);
      });
    return () => controller.abort();
  }, []);

  if (signedIn) return <Navigate to="/dashboard" replace />;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      {signedIn === false && <LoginForm />}
    </div>
  );
}
