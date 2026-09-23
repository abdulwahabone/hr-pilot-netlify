import { CalendarDays, HeartPulse } from "lucide-react";
import { useApi } from "@/lib/api";
import { useSession } from "@/lib/session";
import type { Leave, LeaveBalance, WithUser } from "@/lib/types";
import { StatCard } from "@/components/stat-card";
import { PageState } from "@/components/page-state";
import { ApplyLeaveDialog } from "@/components/leaves/apply-leave-dialog";
import { LeaveHistoryTable } from "@/components/leaves/leave-history-table";
import { LeaveApprovalTable } from "@/components/leaves/leave-approval-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export function LeavesPage() {
  const { user } = useSession();
  const isAdmin = user.role === "ADMIN";
  const mine = useApi<{ leaves: Leave[]; balance: LeaveBalance }>("/api/leaves");
  const team = useApi<{ leaves: WithUser<Leave>[] }>(isAdmin ? "/api/leaves?scope=all" : null);

  const refresh = () => Promise.all([mine.reload(), isAdmin ? team.reload() : undefined]).then(() => {});
  const pendingCount = team.data?.leaves.filter((leave) => leave.status === "PENDING").length ?? 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Leaves</h1>
          <p className="mt-1 text-muted-foreground">
            Apply for leave and keep track of your balance and requests.
          </p>
        </div>
        <ApplyLeaveDialog onSubmitted={refresh} />
      </div>

      {!mine.data || (isAdmin && !team.data) ? (
        <PageState error={mine.error ?? team.error} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <StatCard
              icon={CalendarDays}
              label="Annual leave balance"
              value={`${mine.data.balance.annual.remaining} / ${mine.data.balance.annual.total} days`}
              hint={`${mine.data.balance.annual.used} days taken this year`}
            />
            <StatCard
              icon={HeartPulse}
              label="Sick leave balance"
              value={`${mine.data.balance.sick.remaining} / ${mine.data.balance.sick.total} days`}
              hint={`${mine.data.balance.sick.used} days taken this year`}
            />
          </div>

          {isAdmin && team.data ? (
            <Tabs defaultValue="mine">
              <TabsList>
                <TabsTrigger value="mine">My Leaves</TabsTrigger>
                <TabsTrigger value="team">
                  Team Requests
                  {pendingCount > 0 && (
                    <Badge variant="secondary" className="ml-1.5">
                      {pendingCount}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="mine" className="mt-4">
                <LeaveHistoryTable leaves={mine.data.leaves} />
              </TabsContent>
              <TabsContent value="team" className="mt-4">
                <LeaveApprovalTable leaves={team.data.leaves} onDecided={refresh} />
              </TabsContent>
            </Tabs>
          ) : (
            <LeaveHistoryTable leaves={mine.data.leaves} />
          )}
        </>
      )}
    </div>
  );
}
