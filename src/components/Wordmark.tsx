import { Link } from "react-router";
import { cn } from "@/lib/utils";

export function Wordmark({
  to = "/",
  className,
  tag = "community care",
}: {
  to?: string;
  className?: string;
  tag?: string | null;
}) {
  return (
    <Link
      to={to}
      className={cn("group inline-flex items-baseline gap-2", className)}
      aria-label="CareCall home"
    >
      <span
        className="size-1.5 shrink-0 self-center rounded-full bg-primary"
        aria-hidden
      />
      <span className="font-display text-[23px] leading-none tracking-[-0.01em] text-foreground">
        CareCall
      </span>
      {tag ? (
        <span className="hidden text-[9px] leading-none font-medium tracking-[0.16em] text-muted-foreground uppercase sm:inline">
          {tag}
        </span>
      ) : null}
    </Link>
  );
}
