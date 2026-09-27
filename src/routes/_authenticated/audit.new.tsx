import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { AppShell } from "@/components/app/AppShell";
import { AuditForm } from "@/components/audit/AuditForm";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { createAudit, getUsage } from "@/lib/api/audits.functions";
import { listLocations } from "@/lib/api/locations.functions";

export const Route = createFileRoute("/_authenticated/audit/new")({
  head: () => ({
    meta: [{ title: "New audit — LocalRankLens" }, { name: "robots", content: "noindex" }],
  }),
  component: NewAuditPage,
});

function NewAuditPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const usage = useQuery({ queryKey: ["usage"], queryFn: () => getUsage() });
  const locations = useQuery({ queryKey: ["locations"], queryFn: () => listLocations() });

  const mutation = useMutation({
    mutationFn: (values: Parameters<typeof createAudit>[0] extends never ? never : object) =>
      createAudit({ data: values as never }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["audits"] });
      queryClient.invalidateQueries({ queryKey: ["usage"] });
      toast.success(`Audit complete — score ${result.score} (grade ${result.grade})`);
      navigate({ to: "/audits/$auditId", params: { auditId: result.auditId } });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "The audit could not be saved");
    },
  });

  const quotaReached =
    usage.data && usage.data.limit !== null && usage.data.used >= usage.data.limit;

  return (
    <AppShell
      title="New audit"
      description="Record what you can see on the Google Business Profile — we score it against 24 ranking checks."
    >
      <div className="mx-auto max-w-4xl space-y-6">
        {usage.isLoading ? (
          <Skeleton className="h-16 rounded-xl" />
        ) : quotaReached ? (
          <Alert variant="destructive">
            <AlertTitle>You've used this month's audits</AlertTitle>
            <AlertDescription className="flex flex-wrap items-center gap-3">
              <span>
                Your {usage.data?.plan} plan includes {usage.data?.limit} audits per month. Your
                quota resets on the 1st.
              </span>
              <Button asChild size="sm" variant="outline">
                <Link to="/billing">See plans</Link>
              </Button>
            </AlertDescription>
          </Alert>
        ) : (
          <p className="text-sm text-muted-foreground">
            {usage.data?.limit === null
              ? "Unlimited audits on your plan."
              : `${usage.data?.remaining ?? 0} of ${usage.data?.limit} audits left this month.`}
          </p>
        )}

        <AuditForm
          locations={locations.data ?? []}
          submitting={mutation.isPending}
          submitLabel={mutation.isPending ? "Scoring…" : "Run audit"}
          onSubmit={async (values) => {
            if (quotaReached) {
              toast.error("You've reached this month's audit limit.");
              return;
            }
            await mutation.mutateAsync(values as never);
          }}
        />
      </div>
    </AppShell>
  );
}
