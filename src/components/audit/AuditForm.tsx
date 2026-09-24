import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { auditInputDefaults, auditInputSchema, type AuditInputPayload } from "@/lib/audit/schema";
import type { AuditInput } from "@/lib/audit/types";

type NumericField = {
  kind: "number";
  name: keyof AuditInput;
  label: string;
  help?: string;
  step?: string;
};
type SwitchField = { kind: "switch"; name: keyof AuditInput; label: string; help?: string };
type Field = NumericField | SwitchField;

const GROUPS: { title: string; description: string; fields: Field[] }[] = [
  {
    title: "Profile completeness",
    description: "The basics Google uses to decide whether the listing is trustworthy.",
    fields: [
      { kind: "switch", name: "isVerified", label: "Profile is claimed and verified" },
      {
        kind: "switch",
        name: "nameFreeOfKeywordStuffing",
        label: "Business name matches real-world signage",
        help: "No extra keywords or city names appended.",
      },
      {
        kind: "number",
        name: "descriptionLength",
        label: "Description length (characters)",
        help: "The limit is 750.",
      },
      { kind: "switch", name: "regularHoursSet", label: "Regular opening hours are set" },
      { kind: "switch", name: "holidayHoursSet", label: "Holiday / special hours are set" },
      { kind: "switch", name: "localPhoneNumber", label: "Primary phone is a local number" },
      { kind: "switch", name: "websiteLinked", label: "Website is linked on the profile" },
    ],
  },
  {
    title: "Categories & services",
    description: "The strongest ranking levers you directly control.",
    fields: [
      {
        kind: "switch",
        name: "primaryCategoryMatchesSearchTerm",
        label: "Primary category matches the main search term",
        help: "Compare with the top three competitors in the local pack.",
      },
      { kind: "number", name: "secondaryCategoryCount", label: "Number of secondary categories" },
      { kind: "number", name: "servicesOrProductsListed", label: "Services or products listed" },
      { kind: "switch", name: "attributesCompleted", label: "Attributes are filled in" },
    ],
  },
  {
    title: "Reviews & reputation",
    description: "Volume, rating, freshness and responsiveness.",
    fields: [
      { kind: "number", name: "reviewCount", label: "Total reviews" },
      { kind: "number", name: "averageRating", label: "Average rating", step: "0.1" },
      { kind: "number", name: "reviewsLast30Days", label: "New reviews in the last 30 days" },
      { kind: "number", name: "ownerResponseRatePercent", label: "Reviews replied to (%)" },
      {
        kind: "number",
        name: "reviewsMentioningServices",
        label: "Reviews that mention a specific service",
      },
    ],
  },
  {
    title: "Photos & media",
    description: "Visual completeness and how recently anything was added.",
    fields: [
      { kind: "number", name: "photoCount", label: "Total photos on the profile" },
      { kind: "number", name: "photosLast30Days", label: "Photos added in the last 30 days" },
      { kind: "switch", name: "logoAndCoverSet", label: "Logo and cover photo are set" },
      { kind: "switch", name: "videoUploaded", label: "At least one video uploaded" },
    ],
  },
  {
    title: "Activity & engagement",
    description: "Signals that the business is actively managing the profile.",
    fields: [
      { kind: "number", name: "postsLast30Days", label: "Posts in the last 30 days" },
      { kind: "number", name: "answeredQuestions", label: "Answered questions in Q&A" },
      { kind: "switch", name: "messagingEnabled", label: "Messaging is enabled and monitored" },
    ],
  },
  {
    title: "Website & citations",
    description: "How the profile is supported off Google.",
    fields: [
      {
        kind: "switch",
        name: "napConsistentAcrossDirectories",
        label: "Name, address and phone are consistent elsewhere",
      },
      {
        kind: "switch",
        name: "locationPageWithMap",
        label: "Website has a location page with an embedded map",
      },
      { kind: "number", name: "directoryCitationCount", label: "Directory listings claimed" },
    ],
  },
];

export interface AuditFormProps {
  onSubmit: (values: AuditInputPayload & { locationId?: string | null }) => Promise<void> | void;
  submitting?: boolean;
  submitLabel?: string;
  locations?: { id: string; business_name: string; primary_category: string; city: string }[];
  defaults?: Partial<AuditInput>;
}

export function AuditForm({
  onSubmit,
  submitting = false,
  submitLabel = "Run audit",
  locations = [],
  defaults,
}: AuditFormProps) {
  const form = useForm<AuditInputPayload>({
    resolver: zodResolver(auditInputSchema),
    defaultValues: { ...auditInputDefaults, ...defaults } as AuditInputPayload,
    mode: "onBlur",
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = form;

  const [locationId, setLocationId] = [watch("businessName"), setValue] as const;
  void locationId;
  const selectedLocation = watch("city");
  void selectedLocation;

  const handleLocationPick = (value: string) => {
    if (value === "none") {
      setValue("__locationId" as never, null as never);
      return;
    }
    const location = locations.find((l) => l.id === value);
    if (!location) return;
    setValue("businessName", location.business_name);
    setValue("primaryCategory", location.primary_category);
    setValue("city", location.city);
    setValue("__locationId" as never, location.id as never);
  };

  return (
    <form
      className="space-y-6"
      onSubmit={handleSubmit(async (values) => {
        const raw = values as AuditInputPayload & { __locationId?: string | null };
        await onSubmit({ ...values, locationId: raw.__locationId ?? null });
      })}
      noValidate
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-base">The business</CardTitle>
          <CardDescription>
            Everything below is what you can see on the profile — nothing is guessed for you.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {locations.length > 0 ? (
            <div className="md:col-span-2">
              <Label htmlFor="saved-location">Use a saved location</Label>
              <Select onValueChange={handleLocationPick}>
                <SelectTrigger id="saved-location" className="mt-2">
                  <SelectValue placeholder="Start from scratch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Start from scratch</SelectItem>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.business_name} — {location.city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <div>
            <Label htmlFor="businessName">Business name</Label>
            <Input id="businessName" className="mt-2" {...register("businessName")} />
            {errors.businessName ? (
              <p className="mt-1 text-sm text-destructive">{errors.businessName.message}</p>
            ) : null}
          </div>
          <div>
            <Label htmlFor="primaryCategory">Primary category</Label>
            <Input
              id="primaryCategory"
              className="mt-2"
              placeholder="e.g. Plumber"
              {...register("primaryCategory")}
            />
            {errors.primaryCategory ? (
              <p className="mt-1 text-sm text-destructive">{errors.primaryCategory.message}</p>
            ) : null}
          </div>
          <div>
            <Label htmlFor="city">City or town</Label>
            <Input id="city" className="mt-2" {...register("city")} />
            {errors.city ? (
              <p className="mt-1 text-sm text-destructive">{errors.city.message}</p>
            ) : null}
          </div>
          <div>
            <Label htmlFor="websiteUrl">Website (optional)</Label>
            <Input
              id="websiteUrl"
              className="mt-2"
              placeholder="https://"
              {...register("websiteUrl")}
            />
            {errors.websiteUrl ? (
              <p className="mt-1 text-sm text-destructive">{errors.websiteUrl.message}</p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {GROUPS.map((group) => (
        <Card key={group.title}>
          <CardHeader>
            <CardTitle className="text-base">{group.title}</CardTitle>
            <CardDescription>{group.description}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 md:grid-cols-2">
            {group.fields.map((field) =>
              field.kind === "switch" ? (
                <div
                  key={field.name}
                  className="flex items-start justify-between gap-4 rounded-lg border border-border p-3"
                >
                  <div>
                    <Label htmlFor={field.name} className="text-sm font-medium">
                      {field.label}
                    </Label>
                    {field.help ? (
                      <p className="mt-1 text-xs text-muted-foreground">{field.help}</p>
                    ) : null}
                  </div>
                  <Switch
                    id={field.name}
                    checked={Boolean(watch(field.name as keyof AuditInputPayload))}
                    onCheckedChange={(checked) =>
                      setValue(field.name as keyof AuditInputPayload, checked as never, {
                        shouldValidate: true,
                      })
                    }
                  />
                </div>
              ) : (
                <div key={field.name}>
                  <Label htmlFor={field.name}>{field.label}</Label>
                  <Input
                    id={field.name}
                    type="number"
                    inputMode="decimal"
                    step={field.step ?? "1"}
                    min="0"
                    className="mt-2"
                    {...register(field.name as keyof AuditInputPayload)}
                  />
                  {field.help ? (
                    <p className="mt-1 text-xs text-muted-foreground">{field.help}</p>
                  ) : null}
                  {errors[field.name as keyof AuditInputPayload] ? (
                    <p className="mt-1 text-sm text-destructive">
                      {String(errors[field.name as keyof AuditInputPayload]?.message)}
                    </p>
                  ) : null}
                </div>
              ),
            )}
          </CardContent>
        </Card>
      ))}

      <div className="flex items-center gap-3">
        <Button type="submit" size="lg" disabled={submitting}>
          {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {submitLabel}
        </Button>
        <p className="text-sm text-muted-foreground">Scoring runs on the server and is saved to your history.</p>
      </div>
    </form>
  );
}
