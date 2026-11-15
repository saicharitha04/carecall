import { Link } from "react-router";
import { cn } from "@/lib/utils";

export function Wordmark({
  to = "/",
  className,
  tag = "care ops",
}: {
  to?: string;
  className?: string;
  tag?: string | null;
}) {
  return (
    <Link
      to={to}
      className={cn("group inline-flex items-baseline gap-2", className)}
      aria-label="Carecall home"
    >
      <span
        className="size-1.5 shrink-0 self-center rounded-full bg-[var(--chart-1)]"
        aria-hidden
      />
      <span className="text-[17px] leading-none font-medium tracking-[-0.02em] text-foreground">
        carecall
      </span>
      {tag ? (
        <span className="font-mono text-[9px] leading-none tracking-[0.18em] text-muted-foreground uppercase">
          {tag}
        </span>
      ) : null}
    </Link>
  );
}
