import { useEffect, useMemo, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { PageState } from "@/components/page-state";
import { api, ApiError } from "@/lib/api";
import { SessionContext } from "@/lib/session";
import type { User } from "@/lib/types";

// Client-side route guard: /api/auth/me decides whether the dashboard renders or
// the visitor is sent to /login. Every function re-checks the session server-side.
export function DashboardLayout() {
  const location = useLocation();
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [error, setError] = useState<string>();

  useEffect(() => {
    const controller = new AbortController();
    api<{ user: User }>("/api/auth/me", { signal: controller.signal })
      .then((data) => setUser(data.user))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        if (err instanceof ApiError && err.status === 401) setUser(null);
        else setError(err instanceof Error ? err.message : String(err));
      });
    return () => controller.abort();
  }, []);

  const session = useMemo(() => (user ? { user, setUser } : null), [user]);

  if (user === null) {
    return <Navigate to={`/login?from=${encodeURIComponent(location.pathname)}`} replace />;
  }
  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <PageState error={error} />
      </div>
    );
  }

  return (
    <SessionContext value={session}>
      <div className="flex min-h-screen bg-muted/30">
        <Sidebar />
        <div className="flex flex-1 flex-col">
          <Topbar user={session.user} />
          <main className="flex-1 p-4 md:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </SessionContext>
  );
}
