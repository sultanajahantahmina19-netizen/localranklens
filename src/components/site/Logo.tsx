import { MapPin } from "lucide-react";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <MapPin className="h-4 w-4" strokeWidth={2.5} />
      </span>
      {compact ? null : (
        <span className="font-display text-lg font-semibold tracking-tight">LocalRankLens</span>
      )}
    </span>
  );
}
