import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router";
import { Toaster } from "@/components/ui/sonner";
import { LandingPage } from "@/pages/landing";
import { LoginPage } from "@/pages/login";
import { NotFoundPage } from "@/pages/not-found";

// The dashboard ships as its own chunks, so the landing and login pages stay light.
const DashboardLayout = lazy(() => import("@/pages/dashboard/layout").then((m) => ({ default: m.DashboardLayout })));
const OverviewPage = lazy(() => import("@/pages/dashboard/overview").then((m) => ({ default: m.OverviewPage })));
const LeavesPage = lazy(() => import("@/pages/dashboard/leaves").then((m) => ({ default: m.LeavesPage })));
const PayrollPage = lazy(() => import("@/pages/dashboard/payroll").then((m) => ({ default: m.PayrollPage })));
const ClaimsPage = lazy(() => import("@/pages/dashboard/claims").then((m) => ({ default: m.ClaimsPage })));
const SettingsPage = lazy(() => import("@/pages/dashboard/settings").then((m) => ({ default: m.SettingsPage })));

export function App() {
  return (
    <>
      <BrowserRouter>
        <Suspense>
          <Routes>
            <Route index element={<LandingPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="dashboard" element={<DashboardLayout />}>
              <Route index element={<OverviewPage />} />
              <Route path="leaves" element={<LeavesPage />} />
              <Route path="payroll" element={<PayrollPage />} />
              <Route path="claims" element={<ClaimsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
      <Toaster richColors position="top-right" />
    </>
  );
}
