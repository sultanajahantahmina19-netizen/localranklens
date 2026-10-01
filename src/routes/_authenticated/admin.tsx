import { createFileRoute, Link, Outlet } from "@tanstack/react-router";

import { AppShell, EmptyState, useProfile } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ name: "robots", content: "noindex" }] }),
  component: AdminLayout,
});

/**
 * UI gate only. Every admin server function re-checks the role with has_role(),
 * so hiding this area is a convenience, not the security boundary.
 */
function AdminLayout() {
  const profile = useProfile();

  if (profile.isLoading) {
    return (
      <AppShell title="Admin">
        <Skeleton className="h-40 rounded-xl" />
      </AppShell>
    );
  }

  if (!profile.data?.isAdmin) {
    return (
      <AppShell title="Admin">
        <EmptyState
          title="Administrators only"
          description="Your account doesn't have admin access. On a fresh install, the first account can claim it from Settings."
          action={
            <Button asChild>
              <Link to="/settings">Go to settings</Link>
            </Button>
          }
        />
      </AppShell>
    );
  }

  return <Outlet />;
}
