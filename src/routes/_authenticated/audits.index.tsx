import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

import { AppShell, EmptyState } from "@/components/app/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteAudit, listAudits } from "@/lib/api/audits.functions";

export const Route = createFileRoute("/_authenticated/audits/")({
  head: () => ({
    meta: [{ title: "Audit history — LocalRankLens" }, { name: "robots", content: "noindex" }],
  }),
  component: AuditsPage,
});

const PAGE_SIZE = 15;

function AuditsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const audits = useQuery({ queryKey: ["audits"], queryFn: () => listAudits() });

  const removal = useMutation({
    mutationFn: (auditId: string) => deleteAudit({ data: { auditId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["audits"] });
      toast.success("Audit deleted");
    },
    onError: () => toast.error("The audit could not be deleted"),
  });

  const term = search.trim().toLowerCase();
  const filtered = (audits.data ?? []).filter((row) =>
    term
      ? `${row.business_name} ${row.city} ${row.primary_category}`.toLowerCase().includes(term)
      : true,
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  return (
    <AppShell
      title="Audit history"
      description="Every audit you've run, newest first."
      actions={
        <Button asChild>
          <Link to="/audit/new">New audit</Link>
        </Button>
      }
    >
      <div className="space-y-4">
        <Input
          placeholder="Search by business, city or category"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          className="max-w-sm"
          aria-label="Search audits"
        />

        {audits.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : audits.isError ? (
          <p className="text-sm text-destructive">We couldn't load your audits.</p>
        ) : filtered.length === 0 ? (
          <EmptyState
            title={term ? "No matching audits" : "No audits yet"}
            description={
              term
                ? "Try a different business name or city."
                : "Run your first audit to start tracking profile health over time."
            }
            action={
              term ? undefined : (
                <Button asChild>
                  <Link to="/audit/new">Run an audit</Link>
                </Button>
              )
            }
          />
        ) : (
          <Card>
            <CardContent className="p-0">
              <ul className="divide-y divide-border">
                {visible.map((row) => (
                  <li key={row.id} className="flex items-center gap-3 px-4 py-3">
                    <Link
                      to="/audits/$auditId"
                      params={{ auditId: row.id }}
                      className="min-w-0 flex-1 transition-colors hover:text-primary"
                    >
                      <span className="block truncate font-medium">{row.business_name}</span>
                      <span className="block truncate text-sm text-muted-foreground">
                        {row.primary_category} · {row.city} ·{" "}
                        {new Date(row.created_at).toLocaleDateString()}
                      </span>
                    </Link>
                    <Badge variant="secondary">
                      {row.overall_score} · {row.grade}
                    </Badge>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`Delete audit for ${row.business_name}`}
                      onClick={() => setPendingDelete(row.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {pageCount > 1 ? (
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page + 1} of {pageCount}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page + 1 >= pageCount}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        ) : null}
      </div>

      <AlertDialog open={pendingDelete !== null} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this audit?</AlertDialogTitle>
            <AlertDialogDescription>
              The report and its findings are removed permanently. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingDelete) removal.mutate(pendingDelete);
                setPendingDelete(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
