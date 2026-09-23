import { useApi } from "@/lib/api";
import { useSession } from "@/lib/session";
import type { Claim, WithUser } from "@/lib/types";
import { PageState } from "@/components/page-state";
import { SubmitClaimDialog } from "@/components/claims/submit-claim-dialog";
import { ClaimHistoryTable } from "@/components/claims/claim-history-table";
import { ClaimApprovalTable } from "@/components/claims/claim-approval-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export function ClaimsPage() {
  const { user } = useSession();
  const isAdmin = user.role === "ADMIN";
  const mine = useApi<{ claims: Claim[] }>("/api/claims");
  const team = useApi<{ claims: WithUser<Claim>[] }>(isAdmin ? "/api/claims?scope=all" : null);

  const refresh = () => Promise.all([mine.reload(), isAdmin ? team.reload() : undefined]).then(() => {});
  const pendingCount = team.data?.claims.filter((claim) => claim.status === "PENDING").length ?? 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Claims</h1>
          <p className="mt-1 text-muted-foreground">
            Submit expense claims for food, travel, medical and more.
          </p>
        </div>
        <SubmitClaimDialog onSubmitted={refresh} />
      </div>

      {!mine.data || (isAdmin && !team.data) ? (
        <PageState error={mine.error ?? team.error} />
      ) : isAdmin && team.data ? (
        <Tabs defaultValue="mine">
          <TabsList>
            <TabsTrigger value="mine">My Claims</TabsTrigger>
            <TabsTrigger value="team">
              Team Claims
              {pendingCount > 0 && (
                <Badge variant="secondary" className="ml-1.5">
                  {pendingCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="mine" className="mt-4">
            <ClaimHistoryTable claims={mine.data.claims} />
          </TabsContent>
          <TabsContent value="team" className="mt-4">
            <ClaimApprovalTable claims={team.data.claims} onDecided={refresh} />
          </TabsContent>
        </Tabs>
      ) : (
        <ClaimHistoryTable claims={mine.data.claims} />
      )}
    </div>
  );
}
