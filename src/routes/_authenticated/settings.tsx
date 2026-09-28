import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { AppShell, profileQueryKey, useProfile } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { claimFirstAdmin, updateMyProfile } from "@/lib/api/profile.functions";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [{ title: "Settings — LocalRankLens" }, { name: "robots", content: "noindex" }],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const queryClient = useQueryClient();
  const profile = useProfile();
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    if (profile.data?.profile) {
      setFullName(profile.data.profile.full_name ?? "");
      setCompanyName(profile.data.profile.company_name ?? "");
    }
  }, [profile.data]);

  const save = useMutation({
    mutationFn: () => updateMyProfile({ data: { fullName, companyName } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileQueryKey });
      toast.success("Profile updated");
    },
    onError: () => toast.error("Your profile could not be updated"),
  });

  const changePassword = useMutation({
    mutationFn: async () => {
      if (newPassword.length < 8) throw new Error("Use at least 8 characters");
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
        // Cloud may require the current password for signed-in changes.
        ...(currentPassword ? { current_password: currentPassword } : {}),
      } as Parameters<typeof supabase.auth.updateUser>[0]);
      if (error) throw error;
    },
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      toast.success("Password changed");
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "The password could not be changed"),
  });

  const claimAdmin = useMutation({
    mutationFn: () => claimFirstAdmin(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileQueryKey });
      toast.success("You now have administrator access");
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Admin access could not be granted"),
  });

  return (
    <AppShell title="Settings" description="Your account details and password.">
      <div className="max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profile</CardTitle>
            <CardDescription>
              Your name and company appear on the reports you print for clients.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {profile.isLoading ? (
              <Skeleton className="h-32 rounded-lg" />
            ) : (
              <>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    className="mt-2"
                    value={profile.data?.profile?.email ?? ""}
                    disabled
                    readOnly
                  />
                </div>
                <div>
                  <Label htmlFor="fullName">Full name</Label>
                  <Input
                    id="fullName"
                    className="mt-2"
                    value={fullName}
                    maxLength={120}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="companyName">Company</Label>
                  <Input
                    id="companyName"
                    className="mt-2"
                    value={companyName}
                    maxLength={120}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>
                <Button onClick={() => save.mutate()} disabled={save.isPending}>
                  {save.isPending ? "Saving…" : "Save changes"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Password</CardTitle>
            <CardDescription>Choose something at least 8 characters long.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="currentPassword">Current password</Label>
              <Input
                id="currentPassword"
                type="password"
                autoComplete="current-password"
                className="mt-2"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="newPassword">New password</Label>
              <Input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                className="mt-2"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              onClick={() => changePassword.mutate()}
              disabled={changePassword.isPending || newPassword.length === 0}
            >
              {changePassword.isPending ? "Updating…" : "Change password"}
            </Button>
          </CardContent>
        </Card>

        {profile.data && !profile.data.isAdmin ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Administrator access</CardTitle>
              <CardDescription>
                The first account on a fresh install can claim admin access once. After that, an
                existing administrator grants it from the admin area.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                onClick={() => claimAdmin.mutate()}
                disabled={claimAdmin.isPending}
              >
                {claimAdmin.isPending ? "Checking…" : "Claim admin access"}
              </Button>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </AppShell>
  );
}
