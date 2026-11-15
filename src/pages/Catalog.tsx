import { CareFooter, CareHeader } from "@/components/CareHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import { formatPrice } from "@/lib/care";
import { cn } from "@/lib/utils";
import { useQuery } from "convex/react";
import { ArrowUpRight, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";

export default function Catalog() {
  const plans = useQuery(api.catalog.listPublished);
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(
    searchParams.get("category") ?? "All",
  );

  const categories = useMemo(() => {
    const unique = Array.from(
      new Set((plans ?? []).map((plan) => plan.category)),
    ).sort();
    return ["All", ...unique];
  }, [plans]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (plans ?? []).filter((plan) => {
      const haystack = [
        plan.name,
        plan.tagline,
        plan.category,
        plan.summary,
        ...plan.languages,
      ]
        .join(" ")
        .toLowerCase();
      const matchesQuery = !needle || haystack.includes(needle);
      const matchesCategory =
        category === "All" || plan.category === category;
      return matchesQuery && matchesCategory;
    });
  }, [plans, query, category]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <CareHeader active="programs" />

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-6 pt-14 pb-10 md:pt-20">
          <div className="flex flex-wrap items-end justify-between gap-8">
            <div>
              <p className="label-eyebrow">Care programs</p>
              <h1 className="mt-4 max-w-2xl text-[clamp(2.25rem,4.6vw,3.4rem)] leading-[1.02] font-medium tracking-[-0.035em]">
                Care, packaged into
                <br />
                working programs.
              </h1>
              <p className="mt-5 max-w-xl text-sm leading-7 text-muted-foreground">
                Each program is a live part of the Carecall platform — priced per
                senior, scoped by language, and visible to the family from the
                first call.
              </p>
            </div>
            <div className="border border-border px-4 py-3">
              <p className="font-mono text-[9px] tracking-[0.14em] text-muted-foreground uppercase">
                Catalog
              </p>
              <p className="mt-1 font-mono text-xs">
                {plans === undefined
                  ? "—"
                  : `${plans.length} published program${plans.length === 1 ? "" : "s"}`}
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col gap-4 border-y border-border py-4 md:flex-row md:items-center md:justify-between">
            <div className="flex w-full items-center gap-3 md:max-w-sm">
              <Search className="size-4 shrink-0 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by program, category or language"
                className="h-9 rounded-none border-0 bg-transparent px-0 text-sm shadow-none placeholder:text-muted-foreground/70 focus-visible:ring-0"
                aria-label="Search programs"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCategory(item)}
                  className={cn(
                    "border px-2.5 py-1 font-mono text-[10px] tracking-[0.06em] uppercase transition-colors",
                    category === item
                      ? "border-foreground bg-foreground text-background"
                      : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground",
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-16">
          {plans === undefined ? (
            <div className="border-t border-border">
              {[0, 1, 2, 3].map((row) => (
                <div
                  key={row}
                  className="grid grid-cols-[32px_1fr_auto] gap-5 border-b border-border py-7"
                >
                  <span className="mt-1 h-2 w-4 animate-pulse bg-muted" />
                  <div className="space-y-3">
                    <span className="block h-3.5 w-40 animate-pulse bg-muted" />
                    <span className="block h-2.5 w-full max-w-md animate-pulse bg-muted" />
                  </div>
                  <span className="h-3 w-16 animate-pulse bg-muted" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="border-t border-border py-20 text-center">
              <p className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
                No results
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                {plans.length === 0
                  ? "The catalog is being prepared. An operator can publish the starter programs from the console."
                  : "Nothing matches that search. Try a broader term or a different category."}
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                {plans.length === 0 ? (
                  <Button asChild variant="outline" size="sm" className="rounded-md">
                    <Link to="/admin">Open operator console</Link>
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-md"
                    onClick={() => {
                      setQuery("");
                      setCategory("All");
                    }}
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <>
              <p className="py-4 font-mono text-[10px] tracking-[0.1em] text-muted-foreground uppercase">
                {filtered.length} program{filtered.length === 1 ? "" : "s"}
                {category !== "All" ? ` · ${category}` : ""}
              </p>
              <div className="border-t border-border">
                {filtered.map((plan, index) => (
                  <Link
                    key={plan._id}
                    to={`/catalog/${plan.slug}`}
                    className="group grid grid-cols-[28px_1fr] items-start gap-4 border-b border-border py-7 transition-colors hover:bg-secondary/25 md:grid-cols-[32px_1fr_160px] md:gap-6"
                  >
                    <span className="pt-1 font-mono text-[10px] text-muted-foreground tabular-nums">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
                        <h2 className="text-base font-medium tracking-[-0.01em]">
                          {plan.name}
                        </h2>
                        <span className="border border-border px-1.5 py-0.5 font-mono text-[9px] tracking-[0.1em] text-muted-foreground uppercase">
                          {plan.category}
                        </span>
                      </div>
                      <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                        {plan.tagline}
                      </p>
                      <p className="mt-3 truncate font-mono text-[10px] text-muted-foreground/80">
                        {plan.languages.slice(0, 4).join(" · ")}
                        {plan.languages.length > 4
                          ? ` · +${plan.languages.length - 4}`
                          : ""}
                      </p>
                    </div>
                    <div className="col-start-2 flex items-center justify-between gap-4 md:col-start-3 md:block md:text-right">
                      <div>
                        <p className="font-mono text-sm">{formatPrice(plan.price)}</p>
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          {plan.unit}
                        </p>
                      </div>
                      <ArrowUpRight className="size-4 text-muted-foreground transition-colors group-hover:text-foreground md:mt-4 md:ml-auto" />
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </section>

        <section className="border-t border-border">
          <div className="mx-auto flex max-w-6xl flex-col justify-between gap-6 px-6 py-12 sm:flex-row sm:items-center">
            <div>
              <p className="label-eyebrow">Not sure where to start</p>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Most families begin with Daily Voice Care and add monitoring once
                the first week of calls is behind them.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild className="rounded-md">
                <Link to="/auth?returnTo=%2Fonboarding">Enrol a parent</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-md">
                <Link to="/dashboard">Open the workspace</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <CareFooter />
    </div>
  );
}
