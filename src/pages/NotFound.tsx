import { CareHeader } from "@/components/CareHeader";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Link } from "react-router";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <CareHeader />
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center px-6 py-24">
        <p className="label-eyebrow">Error 404</p>
        <h1 className="mt-5 text-[clamp(2.4rem,5vw,3.6rem)] leading-[1.02] font-medium tracking-[-0.04em]">
          This page is not
          <br />
          <span className="text-muted-foreground">in the care record.</span>
        </h1>
        <p className="mt-5 max-w-md text-sm leading-7 text-muted-foreground">
          The link may be out of date. The catalog, the workspace, and the
          operator console are all still where they should be.
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Button asChild variant="outline" className="rounded-md">
            <Link to="/">
              <ArrowLeft className="size-4" />
              Home
            </Link>
          </Button>
          <Button asChild className="rounded-md">
            <Link to="/catalog">
              Browse programs
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </main>
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <p className="text-[11px] text-muted-foreground">Carecall</p>
          <p className="font-mono text-[10px] text-muted-foreground">
            elder care infrastructure
          </p>
        </div>
      </footer>
    </div>
  );
}
