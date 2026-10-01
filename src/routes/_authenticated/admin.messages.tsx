import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { AppShell, EmptyState } from "@/components/app/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { listMessages, setMessageStatus } from "@/lib/api/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/messages")({
  head: () => ({ meta: [{ title: "Messages — LocalRankLens admin" }] }),
  component: AdminMessagesPage,
});

function AdminMessagesPage() {
  const queryClient = useQueryClient();
  const messages = useQuery({ queryKey: ["admin", "messages"], queryFn: () => listMessages() });

  const update = useMutation({
    mutationFn: (vars: { id: string; status: "new" | "read" | "archived" }) =>
      setMessageStatus({ data: vars }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin"] }),
    onError: () => toast.error("The message could not be updated"),
  });

  const rows = (messages.data ?? []).filter((m) => m.status !== "archived");

  return (
    <AppShell title="Contact messages" description="Submissions from the public contact form.">
      {messages.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : messages.isError ? (
        <p className="text-sm text-destructive">Messages could not be loaded.</p>
      ) : rows.length === 0 ? (
        <EmptyState title="Inbox empty" description="New contact form messages appear here." />
      ) : (
        <div className="space-y-4">
          {rows.map((message) => (
            <Card key={message.id}>
              <CardContent className="pt-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">{message.subject}</p>
                    <p className="text-sm text-muted-foreground">
                      {message.name} ·{" "}
                      <a href={`mailto:${message.email}`} className="underline">
                        {message.email}
                      </a>{" "}
                      · {new Date(message.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {message.status === "new" ? <Badge>New</Badge> : null}
                    {message.is_demo ? <Badge variant="outline">Demo</Badge> : null}
                  </div>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm">{message.message}</p>
                <div className="mt-4 flex gap-2">
                  {message.status === "new" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => update.mutate({ id: message.id, status: "read" })}
                    >
                      Mark as read
                    </Button>
                  ) : null}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => update.mutate({ id: message.id, status: "archived" })}
                  >
                    Archive
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
