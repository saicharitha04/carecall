import { Wordmark } from "@/components/Wordmark";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Link } from "react-router";

const LINKS = [
  { to: "/catalog", label: "Programs", key: "programs" },
  { to: "/dashboard", label: "Guardians", key: "guardians" },
  { to: "/admin", label: "Operator", key: "operator" },
] as const;

export function CareHeader({
  active,
}: {
  active?: "programs" | "guardians" | "operator";
}) {
  const { isAuthenticated } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-6">
        <div className="flex items-center gap-9">
          <Wordmark to="/" />
          <nav className="hidden items-center gap-7 md:flex">
            {LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  "text-xs transition-colors hover:text-foreground",
                  active === link.key
                    ? "text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-5">
          <span className="hidden items-center gap-2 lg:flex">
            <span className="size-1 rounded-full bg-[var(--chart-1)]" aria-hidden />
            <span className="font-mono text-[9px] tracking-[0.14em] text-muted-foreground uppercase">
              All systems operational
            </span>
          </span>
          {!isAuthenticated && (
            <Link
              to="/auth?returnTo=%2Fdashboard"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Sign in
            </Link>
          )}
          <Button asChild size="sm" className="rounded-md px-4 font-mono text-[10px] tracking-[0.08em] uppercase">
            <Link to={isAuthenticated ? "/dashboard" : "/auth?returnTo=%2Fdashboard"}>
              {isAuthenticated ? "Workspace" : "Open workspace"}
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

export function CareFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2">
            <Wordmark tag={null} />
            <p className="max-w-xs text-[11px] leading-5 text-muted-foreground">
              Elder-care infrastructure for providers and the families they
              serve.
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2">
            {[
              { to: "/catalog", label: "Programs" },
              { to: "/dashboard", label: "Workspace" },
              { to: "/admin", label: "Operator console" },
            ].map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-[11px] text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <p className="font-mono text-[10px] tracking-[0.08em] text-muted-foreground uppercase">
            Carecall · v1.0
          </p>
        </div>
      </div>
    </footer>
  );
}
