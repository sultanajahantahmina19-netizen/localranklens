import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { AppShell, EmptyState } from "@/components/app/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { listUsers, setUserPlan, setUserRole } from "@/lib/api/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/users")({
  head: () => ({ meta: [{ title: "Users — LocalRankLens admin" }] }),
  component: AdminUsersPage,
});

const PAGE_SIZE = 20;

function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [term, setTerm] = useState("");
  const [roleChange, setRoleChange] = useState<null | { userId: string; email: string; grant: boolean }>(null);

  const users = useQuery({
    queryKey: ["admin", "users", page, term],
    queryFn: () => listUsers({ data: { page, pageSize: PAGE_SIZE, search: term || undefined } }),
    placeholderData: keepPreviousData,
  });

  const planMutation = useMutation({
    mutationFn: (vars: { userId: string; plan: "free" | "pro" | "agency" }) => setUserPlan({ data: vars }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      toast.success("Plan updated");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Plan could not be updated"),
  });

  const roleMutation = useMutation({
    mutationFn: (vars: { userId: string; grant: boolean }) =>
      setUserRole({ data: { userId: vars.userId, role: "admin", grant: vars.grant } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      toast.success("Role updated");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Role could not be updated"),
  });

  const total = users.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <AppShell title="Users" description={`${total} registered accounts`}>
      <form
        className="mb-4 flex max-w-md gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setTerm(search.trim());
        }}
      >
        <Input
          placeholder="Search email or name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search users"
          maxLength={120}
        />
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>

      {users.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : users.isError ? (
        <p className="text-sm text-destructive">Users could not be loaded.</p>
      ) : (users.data?.users.length ?? 0) === 0 ? (
        <EmptyState title="No users found" description="Try a different search." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {users.data?.users.map((user) => {
                const isAdmin = user.roles.includes("admin");
                return (
                  <li key={user.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{user.email}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {user.full_name || "—"} · {user.auditCount} audits · joined{" "}
                        {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {isAdmin ? <Badge>Admin</Badge> : null}
                    <Select
                      value={user.plan}
                      onValueChange={(plan) =>
                        planMutation.mutate({ userId: user.id, plan: plan as "free" | "pro" | "agency" })
                      }
                    >
                      <SelectTrigger className="w-32" aria-label={`Plan for ${user.email}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="pro">Pro</SelectItem>
                        <SelectItem value="agency">Agency</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setRoleChange({ userId: user.id, email: user.email ?? "", grant: !isAdmin })
                      }
                    >
                      {isAdmin ? "Remove admin" : "Make admin"}
                    </Button>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}

      {pageCount > 1 ? (
        <div className="mt-4 flex items-center justify-between">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {pageCount}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pageCount}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      ) : null}

      <AlertDialog open={roleChange !== null} onOpenChange={(open) => !open && setRoleChange(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {roleChange?.grant ? "Grant admin access?" : "Remove admin access?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {roleChange?.grant
                ? `${roleChange?.email} will be able to see all users, change plans and read contact messages.`
                : `${roleChange?.email} will lose access to the admin area.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (roleChange) roleMutation.mutate({ userId: roleChange.userId, grant: roleChange.grant });
                setRoleChange(null);
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
