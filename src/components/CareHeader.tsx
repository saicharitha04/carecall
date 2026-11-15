import { FreeBadge } from "@/components/FreeBadge";
import { Wordmark } from "@/components/Wordmark";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Link } from "react-router";

const LINKS = [
  { to: "/catalog", label: "Free programs", key: "programs" },
  { to: "/dashboard", label: "Guardians", key: "guardians" },
  { to: "/admin", label: "Admin", key: "operator" },
] as const;

export function FreeInitiativeBar() {
  return (
    <div className="border-b border-[var(--chart-1)]/15 bg-accent/70">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-2 gap-y-1 px-6 py-2 text-center">
        <span className="text-[10px] font-medium tracking-[0.12em] text-accent-foreground uppercase">
          Zero Cost Community Health Initiative
        </span>
        <span className="text-accent-foreground/40" aria-hidden>
          ·
        </span>
        <span className="text-[11px] text-accent-foreground">
          Free for every family, forever — no card, no subscription, no ads.
        </span>
      </div>
    </div>
  );
}

export function CareHeader({
  active,
}: {
  active?: "programs" | "guardians" | "operator";
}) {
  const { isAuthenticated } = useAuth();

  return (
    <>
      <FreeInitiativeBar />
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-sm">
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

          <div className="flex items-center gap-4">
            <FreeBadge compact className="hidden lg:inline-flex" />
            {!isAuthenticated && (
              <Link
                to="/auth?returnTo=%2Fdashboard"
                className="hidden text-xs text-muted-foreground transition-colors hover:text-foreground sm:inline"
              >
                Sign in
              </Link>
            )}
            <Button asChild size="sm" className="rounded-full px-4">
              <Link
                to={
                  isAuthenticated
                    ? "/dashboard"
                    : "/auth?returnTo=%2Fonboarding"
                }
              >
                {isAuthenticated ? "Workspace" : "Start free"}
              </Link>
            </Button>
          </div>
        </div>
      </header>
    </>
  );
}

export function CareFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3">
            <Wordmark tag={null} />
            <p className="max-w-xs text-[11px] leading-5 text-muted-foreground">
              A free community health service for elders and the families who
              care for them from a distance.
            </p>
          </div>
          <FreeBadge />
          <nav className="flex flex-wrap gap-x-6 gap-y-2">
            {[
              { to: "/catalog", label: "Free programs" },
              { to: "/dashboard", label: "Guardian workspace" },
              { to: "/admin", label: "Admin console" },
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
        </div>
        <p className="mt-6 border-t border-border pt-4 text-[10px] text-muted-foreground">
          CareCall · Zero Cost Community Health Initiative · Built for public good,
          not for profit.
        </p>
      </div>
    </footer>
  );
}
