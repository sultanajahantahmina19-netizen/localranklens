import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  CreditCard,
  FilePlus2,
  Files,
  Inbox,
  LayoutDashboard,
  LogOut,
  MapPinned,
  Menu,
  Settings,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/site/Logo";
import { supabase } from "@/integrations/supabase/client";
import { getMyProfile } from "@/lib/api/profile.functions";

export const profileQueryKey = ["my-profile"] as const;

export function useProfile() {
  return useQuery({
    queryKey: profileQueryKey,
    queryFn: () => getMyProfile(),
    staleTime: 60_000,
  });
}

const MAIN_NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/audit/new", label: "New audit", icon: FilePlus2 },
  { to: "/audits", label: "Audit history", icon: Files },
  { to: "/locations", label: "Locations", icon: MapPinned },
  { to: "/billing", label: "Plan & billing", icon: CreditCard },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

const ADMIN_NAV = [
  { to: "/admin", label: "Overview", icon: ShieldCheck },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/messages", label: "Messages", icon: Inbox },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
] as const;

export function AppShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const { data } = useProfile();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const nav = (
    <nav className="flex flex-1 flex-col gap-1" aria-label="Application">
      {MAIN_NAV.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground font-medium" }}
          activeOptions={{ exact: item.to === "/dashboard" }}
        >
          <item.icon className="h-4 w-4" aria-hidden />
          {item.label}
        </Link>
      ))}

      {data?.isAdmin ? (
        <>
          <p className="mt-6 px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50">
            Admin
          </p>
          {ADMIN_NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground font-medium" }}
              activeOptions={{ exact: item.to === "/admin" }}
            >
              <item.icon className="h-4 w-4" aria-hidden />
              {item.label}
            </Link>
          ))}
        </>
      ) : null}
    </nav>
  );

  const sidebarFooter = (
    <div className="border-t border-sidebar-border pt-4">
      <p className="truncate px-3 text-sm text-sidebar-foreground">
        {data?.profile?.full_name || data?.profile?.email || "Your account"}
      </p>
      <div className="mt-2 flex items-center justify-between px-3">
        <Badge variant="secondary" className="capitalize">
          {data?.profile?.plan ?? "free"} plan
        </Badge>
        <button
          type="button"
          onClick={handleSignOut}
          className="inline-flex items-center gap-1.5 text-sm text-sidebar-foreground/70 transition-colors hover:text-sidebar-foreground"
        >
          <LogOut className="h-4 w-4" aria-hidden />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 flex-col gap-6 bg-sidebar p-4 lg:flex">
        <Link to="/" className="px-2">
          <span className="text-sidebar-foreground">
            <Logo />
          </span>
        </Link>
        {nav}
        {sidebarFooter}
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-ink/60"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <aside className="relative flex h-full w-72 flex-col gap-6 bg-sidebar p-4">
            <div className="flex items-center justify-between px-2">
              <span className="text-sidebar-foreground">
                <Logo />
              </span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="text-sidebar-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {nav}
            {sidebarFooter}
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-border px-4 py-4 lg:px-8">
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-xl font-semibold">{title}</h1>
            {description ? (
              <p className="truncate text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
        </header>
        <div className="flex-1 px-4 py-6 lg:px-8">{children}</div>
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-surface-subtle p-10 text-center">
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-panel">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function Button_(props: never) {
  return <Button {...(props as object)} />;
}
