import { HeartHandshake } from "lucide-react";
import { cn } from "@/lib/utils";

export function FreeBadge({
  className,
  label = "100% free forever for every family",
  compact = false,
}: {
  className?: string;
  label?: string;
  compact?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-[var(--chart-1)]/25 bg-accent font-medium text-accent-foreground",
        compact ? "px-2.5 py-1 text-[10px]" : "px-3.5 py-1.5 text-[11px]",
        className,
      )}
    >
      <HeartHandshake
        className={compact ? "size-3" : "size-3.5"}
        aria-hidden
      />
      {label}
    </span>
  );
}

export const FREE_LINE = "No fee · no card · no subscription";
