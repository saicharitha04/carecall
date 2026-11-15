import { Link } from "react-router";
import { cn } from "@/lib/utils";

export function Wordmark({
  to = "/",
  className,
}: {
  to?: string;
  className?: string;
}) {
  return (
    <Link
      to={to}
      className={cn("group inline-flex items-baseline gap-2", className)}
      aria-label="Sahyog Care home"
    >
      <span
        className="mb-1 size-1.5 shrink-0 rounded-full bg-[var(--chart-1)]"
        aria-hidden
      />
      <span className="font-display text-xl leading-none tracking-tight text-foreground">
        Sahyog
      </span>
      <span className="text-[10px] leading-none tracking-[0.24em] text-muted-foreground uppercase">
        Care
      </span>
    </Link>
  );
}
