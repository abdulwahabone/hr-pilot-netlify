import { Link } from "react-router";
import { CalendarDays, HeartPulse, Receipt, ClipboardCheck, ArrowRight } from "lucide-react";
import { useApi } from "@/lib/api";
import { useSession } from "@/lib/session";
import { formatCurrency, formatDateRange, formatDate } from "@/lib/format";
import type { Claim, Leave, LeaveBalance } from "@/lib/types";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { PageState } from "@/components/page-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DashboardData = {
  balance: LeaveBalance;
  recentLeaves: Leave[];
  recentClaims: Claim[];
  pendingLeaves: number;
  pendingClaims: number;
  orgPendingLeaves: number;
  orgPendingClaims: number;
};

export function OverviewPage() {
  const { user } = useSession();
  const { data, error } = useApi<DashboardData>("/api/dashboard");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome back, {user.name.split(" ")[0]}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Here&apos;s what&apos;s happening with your HR account today.
        </p>
      </div>

      {!data ? (
        <PageState error={error} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={CalendarDays}
              label="Annual leave balance"
              value={`${data.balance.annual.remaining} / ${data.balance.annual.total} days`}
              hint={`${data.balance.annual.used} days taken`}
            />
            <StatCard
              icon={HeartPulse}
              label="Sick leave balance"
              value={`${data.balance.sick.remaining} / ${data.balance.sick.total} days`}
              hint={`${data.balance.sick.used} days taken`}
            />
            <StatCard
              icon={ClipboardCheck}
              label="Your pending leaves"
              value={String(data.pendingLeaves)}
              hint="Awaiting admin approval"
            />
            <StatCard
              icon={Receipt}
              label="Your pending claims"
              value={String(data.pendingClaims)}
              hint="Awaiting admin approval"
            />
          </div>

          {user.role === "ADMIN" && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <ClipboardCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">Approvals waiting on you</p>
                    <p className="text-sm text-muted-foreground">
                      {data.orgPendingLeaves} leave request{data.orgPendingLeaves === 1 ? "" : "s"} and{" "}
                      {data.orgPendingClaims} claim{data.orgPendingClaims === 1 ? "" : "s"} across the team
                      need a decision.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link to="/dashboard/leaves" className={cn(buttonVariants({ variant: "outline" }))}>
                    Review leaves
                  </Link>
                  <Link to="/dashboard/claims" className={cn(buttonVariants())}>
                    Review claims
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent leave requests</CardTitle>
                <Link to="/dashboard/leaves" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
                  View all
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </CardHeader>
              <CardContent>
                {data.recentLeaves.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    You haven&apos;t applied for any leave yet.
                  </p>
                ) : (
                  <ul className="divide-y">
                    {data.recentLeaves.map((leave) => (
                      <li key={leave.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                        <div>
                          <p className="text-sm font-medium capitalize">{leave.type.toLowerCase()} leave</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDateRange(leave.startDate, leave.endDate)} &middot; {leave.days}{" "}
                            day{leave.days === 1 ? "" : "s"}
                          </p>
                        </div>
                        <StatusBadge status={leave.status} />
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent claims</CardTitle>
                <Link to="/dashboard/claims" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
                  View all
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </CardHeader>
              <CardContent>
                {data.recentClaims.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    You haven&apos;t submitted any claims yet.
                  </p>
                ) : (
                  <ul className="divide-y">
                    {data.recentClaims.map((claim) => (
                      <li key={claim.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                        <div>
                          <p className="text-sm font-medium capitalize">{claim.category.toLowerCase()} claim</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(claim.date)} &middot; {formatCurrency(claim.amount)}
                          </p>
                        </div>
                        <StatusBadge status={claim.status} />
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
