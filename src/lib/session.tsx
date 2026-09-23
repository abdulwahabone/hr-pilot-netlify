import { createContext, useContext } from "react";
import type { User } from "@/lib/types";

type Session = { user: User; setUser: (user: User) => void };

export const SessionContext = createContext<Session | null>(null);

// The signed-in user, available anywhere under the dashboard layout.
export function useSession() {
  const session = useContext(SessionContext);
  if (!session) throw new Error("useSession must be used inside the dashboard layout.");
  return session;
}
