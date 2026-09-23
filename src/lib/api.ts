import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

// JSON fetch against the Netlify Functions. Non-2xx responses throw an ApiError
// carrying the function's `error` message.
export async function api<T>(path: string, init: { method?: string; body?: unknown; signal?: AbortSignal } = {}) {
  const res = await fetch(path, {
    method: init.method ?? "GET",
    headers: init.body === undefined ? undefined : { "Content-Type": "application/json" },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    credentials: "same-origin",
    signal: init.signal,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(data?.error ?? "Something went wrong. Please try again.", res.status);
  }
  return data as T;
}

// Loads `path` and keeps the last good response on screen while `reload()` refetches,
// much like a server-rendered page refresh. `reload()` resolves once the fresh data is
// in state. A 401 sends the visitor to /login.
export function useApi<T>(path: string | null) {
  const navigate = useNavigate();
  const location = useLocation();
  const [state, setState] = useState<{ data?: T; error?: string }>({});
  const [version, setVersion] = useState(0);
  const waiters = useRef<(() => void)[]>([]);

  useEffect(() => {
    if (!path) return;
    const controller = new AbortController();
    const settle = () => waiters.current.splice(0).forEach((resolve) => resolve());
    api<T>(path, { signal: controller.signal })
      .then((data) => {
        if (controller.signal.aborted) return;
        setState({ data });
        settle();
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        if (error instanceof ApiError && error.status === 401) {
          navigate(`/login?from=${encodeURIComponent(location.pathname)}`, { replace: true });
          return;
        }
        setState((prev) => ({ ...prev, error: error instanceof Error ? error.message : String(error) }));
        settle();
      });
    return () => controller.abort();
    // location.pathname is only read for the redirect target; it must not trigger refetches.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, version, navigate]);

  const reload = useCallback(
    () =>
      new Promise<void>((resolve) => {
        waiters.current.push(resolve);
        setVersion((v) => v + 1);
      }),
    []
  );
  return { data: state.data, error: state.error, reload };
}
