import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { AppShell, EmptyState } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  createLocation,
  deleteLocation,
  listLocations,
  locationSchema,
  updateLocation,
  type LocationRow,
} from "@/lib/api/locations.functions";

export const Route = createFileRoute("/_authenticated/locations")({
  head: () => ({
    meta: [{ title: "Locations — LocalRankLens" }, { name: "robots", content: "noindex" }],
  }),
  component: LocationsPage,
});

type LocationValues = z.infer<typeof locationSchema>;

const emptyValues: LocationValues = {
  businessName: "",
  primaryCategory: "",
  city: "",
  country: "",
  websiteUrl: "",
  phone: "",
  notes: "",
};

function LocationsPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<LocationRow | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<LocationRow | null>(null);

  const locations = useQuery({ queryKey: ["locations"], queryFn: () => listLocations() });

  const form = useForm<LocationValues>({
    resolver: zodResolver(locationSchema),
    defaultValues: emptyValues,
  });

  const openCreate = () => {
    setEditing(null);
    form.reset(emptyValues);
    setDialogOpen(true);
  };

  const openEdit = (row: LocationRow) => {
    setEditing(row);
    form.reset({
      businessName: row.business_name,
      primaryCategory: row.primary_category,
      city: row.city,
      country: row.country ?? "",
      websiteUrl: row.website_url ?? "",
      phone: row.phone ?? "",
      notes: row.notes ?? "",
    });
    setDialogOpen(true);
  };

  const save = useMutation({
    mutationFn: async (values: LocationValues) =>
      editing
        ? updateLocation({ data: { ...values, id: editing.id } })
        : createLocation({ data: values }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      toast.success(editing ? "Location updated" : "Location saved");
      setDialogOpen(false);
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "The location could not be saved"),
  });

  const removal = useMutation({
    mutationFn: (id: string) => deleteLocation({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      toast.success("Location removed");
    },
    onError: () => toast.error("The location could not be removed"),
  });

  const rows = locations.data ?? [];

  return (
    <AppShell
      title="Locations"
      description="Save the profiles you audit regularly so re-audits take seconds."
      actions={
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add location
        </Button>
      }
    >
      {locations.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : locations.isError ? (
        <p className="text-sm text-destructive">We couldn't load your locations.</p>
      ) : rows.length === 0 ? (
        <EmptyState
          title="No saved locations"
          description="Add a business once and its details pre-fill every future audit."
          action={<Button onClick={openCreate}>Add your first location</Button>}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map((row) => (
            <Card key={row.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate font-display text-lg font-semibold">
                      {row.business_name}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {row.primary_category} · {row.city}
                      {row.country ? `, ${row.country}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`Edit ${row.business_name}`}
                      onClick={() => openEdit(row)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`Delete ${row.business_name}`}
                      onClick={() => setPendingDelete(row)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {row.notes ? (
                  <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{row.notes}</p>
                ) : null}
                <div className="mt-4">
                  <Button asChild size="sm" variant="outline">
                    <Link to="/audit/new">Run an audit</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit location" : "Add location"}</DialogTitle>
            <DialogDescription>
              Only the first three fields are required — the rest are for your own reference.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit((values) => save.mutate(values))}
            noValidate
          >
            {(
              [
                ["businessName", "Business name"],
                ["primaryCategory", "Primary category"],
                ["city", "City"],
                ["country", "Country"],
                ["websiteUrl", "Website URL"],
                ["phone", "Phone"],
              ] as const
            ).map(([name, label]) => (
              <div key={name}>
                <Label htmlFor={name}>{label}</Label>
                <Input id={name} className="mt-2" {...form.register(name)} />
                {form.formState.errors[name] ? (
                  <p className="mt-1 text-sm text-destructive">
                    {form.formState.errors[name]?.message}
                  </p>
                ) : null}
              </div>
            ))}
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" className="mt-2" rows={3} {...form.register("notes")} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={save.isPending}>
                {save.isPending ? "Saving…" : "Save location"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {pendingDelete?.business_name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Past audits stay in your history — only the saved location details are removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingDelete) removal.mutate(pendingDelete.id);
                setPendingDelete(null);
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
