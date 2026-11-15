import { CareFooter } from "@/components/CareHeader";
import { Wordmark } from "@/components/Wordmark";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { ESCALATION_STAGES, formatPrice } from "@/lib/care";
import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, ShieldCheck } from "lucide-react";
import { Link } from "react-router";

const NAV = [
  { href: "#platform", label: "Platform" },
  { href: "/catalog", label: "Programs" },
  { href: "#safety", label: "Escalation" },
  { href: "#operators", label: "Operators" },
];

const fade = {
  initial: { opacity: 0, y: 10 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
};

const PLATFORM = [
  {
    number: "01",
    title: "A conversation, not a recording",
    body: "At every dose time the agent calls, names the medicine, describes the tablet by colour and shape, and says exactly where it is kept. The senior can interrupt, ask whether it is before food, or report knee pain. Everything is answered in their own language.",
    spec: "PSTN · 10 languages · two-way",
  },
  {
    number: "02",
    title: "The watch already measures. We listen.",
    body: "Budget smartwatches track more than anyone reads. Carecall pulls heart rate, blood oxygen and sleep through Google Health Connect or Apple HealthKit, keeps a baseline per senior, and treats any deviation as a signal worth checking.",
    spec: "Health Connect · 10-minute sync",
  },
  {
    number: "03",
    title: "Three stages. No silent failures.",
    body: "A missed dose or a critical reading does not end at a notification. The ladder is fixed: retry the senior, alert the guardian, then route to a named neighbour and the nearest ambulance desk with the address and latest vitals attached.",
    spec: "Guardian → neighbour → ambulance",
  },
];

export default function Landing() {
  const plans = useQuery(api.catalog.listPublished);
  const previewPlans = (plans ?? []).slice(0, 4);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-6">
          <div className="flex items-center gap-9">
            <Wordmark />
            <nav className="hidden items-center gap-7 md:flex">
              {NAV.map((item) =>
                item.href.startsWith("/") ? (
                  <Link
                    key={item.href}
                    to={item.href}
                    className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <a
                    key={item.href}
                    href={item.href}
                    className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {item.label}
                  </a>
                ),
              )}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/auth?returnTo=%2Fdashboard"
              className="hidden text-xs text-muted-foreground transition-colors hover:text-foreground sm:inline"
            >
              Sign in
            </Link>
            <Button asChild size="sm" className="rounded-md px-4 font-mono text-[10px] tracking-[0.08em] uppercase">
              <Link to="/auth?returnTo=%2Fdashboard">Open workspace</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="border-b border-border">
          <div className="mx-auto max-w-6xl px-6 pt-16 pb-14 md:pt-24 md:pb-20">
            <div className="grid gap-14 lg:grid-cols-[1.12fr_0.88fr] lg:gap-16">
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              >
                <p className="label-eyebrow flex items-center gap-2">
                  <span
                    className="size-1 rounded-full bg-[var(--chart-1)]"
                    aria-hidden
                  />
                  Elder-care infrastructure · v1.0
                </p>
                <h1 className="mt-7 text-[clamp(2.7rem,5.8vw,4.75rem)] leading-[0.98] font-medium tracking-[-0.045em]">
                  Elder care that
                  <br />
                  <span className="text-muted-foreground">
                    answers the phone.
                  </span>
                </h1>
                <p className="mt-8 max-w-lg text-sm leading-7 text-muted-foreground">
                  Carecall runs the layer between a family and their ageing
                  parent: regional AI voice calls for medication, passive vitals
                  from the watch already on the wrist, and an escalation path
                  that reaches a guardian, a neighbour, then an ambulance — in
                  that order.
                </p>

                <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3">
                  <Button asChild size="lg" className="rounded-md px-6">
                    <Link to="/catalog">
                      Browse care programs
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                  <Link
                    to="/auth?returnTo=%2Fonboarding"
                    className="text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
                  >
                    Enrol a parent
                  </Link>
                </div>

                <dl className="mt-14 grid max-w-lg grid-cols-1 gap-6 border-t border-border pt-6 sm:grid-cols-3">
                  {[
                    ["Zero-app", "Nothing to install or open"],
                    ["10 languages", "Native-reviewed scripts"],
                    ["3 stages", "Escalation with an audit trail"],
                  ].map(([term, detail]) => (
                    <div key={term}>
                      <dt className="font-mono text-[11px] text-foreground">
                        {term}
                      </dt>
                      <dd className="mt-1.5 text-[11px] leading-5 text-muted-foreground">
                        {detail}
                      </dd>
                    </div>
                  ))}
                </dl>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.7,
                  delay: 0.12,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="lg:pt-2"
              >
                <div className="border border-border">
                  <div className="flex items-center justify-between border-b border-border px-5 py-3">
                    <p className="flex items-center gap-2 font-mono text-[9px] tracking-[0.14em] text-muted-foreground uppercase">
                      <span className="relative flex size-1.5">
                        <span className="absolute inline-flex size-full animate-ping rounded-full bg-[var(--chart-1)] opacity-60" />
                        <span className="relative inline-flex size-1.5 rounded-full bg-[var(--chart-1)]" />
                      </span>
                      Care call · 20:30 IST
                    </p>
                    <span className="font-mono text-[9px] tracking-[0.14em] text-muted-foreground uppercase">
                      Telugu
                    </span>
                  </div>

                  <div className="px-5 pt-6 pb-5">
                    <p className="label-eyebrow">Spoken aloud</p>
                    <p className="mt-3 text-xl leading-snug font-medium">
                      “లక్ష్మి గారూ, ఈ మందు తీసుకున్నారా?”
                    </p>
                    <p className="mt-2 text-[11px] leading-5 text-muted-foreground italic">
                      “Lakshmi garu, have you taken this medicine?”
                    </p>

                    <div className="mt-6 border-t border-border">
                      {[
                        ["Program", "Daily Voice Care"],
                        ["Medicine", "Metformin · 500 mg"],
                        ["Timing", "After dinner"],
                        ["Location", "Kitchen drawer"],
                        ["Guardrail", "Diabetes · sugar restricted"],
                      ].map(([label, value]) => (
                        <div
                          key={label}
                          className="flex items-baseline justify-between gap-4 border-b border-border py-3"
                        >
                          <span className="font-mono text-[9px] tracking-[0.12em] text-muted-foreground uppercase">
                            {label}
                          </span>
                          <span className="max-w-[62%] text-right font-mono text-[10px] leading-5">
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>

                    <p className="mt-4 flex items-start gap-2 text-[11px] leading-5 text-muted-foreground">
                      <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-[var(--chart-1)]" />
                      Two missed attempts become a guardian alert. No stage is
                      skipped silently.
                    </p>
                  </div>
                </div>
                <p className="mt-3 font-mono text-[10px] leading-5 text-muted-foreground">
                  Answered on the landline beside the bed. No app, no settings,
                  no login.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Principle */}
        <section className="border-b border-border">
          <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-[0.95fr_1.05fr] md:py-20">
            <motion.p
              {...fade}
              className="max-w-md text-[clamp(1.7rem,3.1vw,2.4rem)] leading-[1.15] font-medium tracking-[-0.03em]"
            >
              The only interface they should have to learn is the one they
              already answer.
            </motion.p>
            <motion.div
              {...fade}
              className="grid gap-6 sm:grid-cols-2 md:border-l md:border-border md:pl-10"
            >
              <p className="text-sm leading-7 text-muted-foreground">
                Missed doses rarely announce themselves. A strip sits untouched,
                a name is skipped, a week disappears. The people who would
                notice are usually in another city, in another meeting, on
                another call.
              </p>
              <p className="text-sm leading-7 text-muted-foreground">
                So Carecall does not ask your parent to adopt software. It uses
                the phone that already rings, in the language they already
                think in, and writes down what happened so a family can see it
                from anywhere.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Platform */}
        <section id="platform" className="scroll-mt-16 border-b border-border">
          <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="label-eyebrow">The platform</p>
                <h2 className="mt-4 max-w-xl text-[clamp(1.9rem,3.6vw,2.9rem)] leading-[1.04] font-medium tracking-[-0.035em]">
                  Three layers. One care record.
                </h2>
              </div>
              <p className="max-w-xs text-xs leading-6 text-muted-foreground">
                Every program in the catalog is assembled from these layers, so
                a family can start with one and add the next without a new
                setup.
              </p>
            </div>

            <div className="mt-12 grid gap-10 md:grid-cols-3 md:gap-0">
              {PLATFORM.map((layer, index) => (
                <motion.div
                  key={layer.number}
                  {...fade}
                  className={
                    index === 0
                      ? "border-t border-border pt-6 md:border-t-0 md:pt-0"
                      : "border-t border-border pt-6 md:border-t-0 md:border-l md:border-border md:px-8 md:pt-0"
                  }
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground tabular-nums">
                      {layer.number}
                    </span>
                    <ArrowUpRight className="size-3.5 text-muted-foreground/60" />
                  </div>
                  <h3 className="mt-6 text-base leading-6 font-medium tracking-[-0.01em]">
                    {layer.title}
                  </h3>
                  <p className="mt-3 text-xs leading-6 text-muted-foreground">
                    {layer.body}
                  </p>
                  <p className="mt-5 border-t border-border pt-3 font-mono text-[10px] tracking-[0.04em] text-muted-foreground">
                    {layer.spec}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Catalog */}
        <section id="programs" className="scroll-mt-16 border-b border-border">
          <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="label-eyebrow">The catalog</p>
                <h2 className="mt-4 max-w-xl text-[clamp(1.9rem,3.6vw,2.9rem)] leading-[1.04] font-medium tracking-[-0.035em]">
                  Programs you can turn on this week.
                </h2>
              </div>
              <Link
                to="/catalog"
                className="inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.1em] text-muted-foreground uppercase transition-colors hover:text-foreground"
              >
                View all programs
                <ArrowUpRight className="size-3.5" />
              </Link>
            </div>

            <div className="mt-10 border-t border-border">
              {plans === undefined ? (
                [0, 1, 2, 3].map((row) => (
                  <div
                    key={row}
                    className="grid grid-cols-[1fr_auto] gap-6 border-b border-border py-6"
                  >
                    <div className="space-y-3">
                      <span className="block h-3.5 w-44 animate-pulse bg-muted" />
                      <span className="block h-2.5 w-full max-w-sm animate-pulse bg-muted" />
                    </div>
                    <span className="h-3 w-16 animate-pulse bg-muted" />
                  </div>
                ))
              ) : previewPlans.length === 0 ? (
                <p className="border-b border-border py-10 text-sm text-muted-foreground">
                  The catalog is being prepared. Operators can publish programs
                  from the console.
                </p>
              ) : (
                previewPlans.map((plan) => (
                  <Link
                    key={plan._id}
                    to={`/catalog/${plan.slug}`}
                    className="group grid grid-cols-[1fr_auto] items-baseline gap-6 border-b border-border py-6 transition-colors hover:bg-secondary/20"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <h3 className="text-sm font-medium">{plan.name}</h3>
                        <span className="font-mono text-[9px] tracking-[0.12em] text-muted-foreground uppercase">
                          {plan.category}
                        </span>
                      </div>
                      <p className="mt-2 max-w-xl text-xs leading-6 text-muted-foreground">
                        {plan.tagline}
                      </p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="font-mono text-xs">
                          {formatPrice(plan.price)}
                        </p>
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          {plan.unit}
                        </p>
                      </div>
                      <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Safety */}
        <section id="safety" className="scroll-mt-16 border-b border-border">
          <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
            <div className="grid gap-12 md:grid-cols-[0.85fr_1.15fr] md:gap-16">
              <div>
                <p className="label-eyebrow">Escalation</p>
                <h2 className="mt-4 text-[clamp(1.9rem,3.6vw,2.9rem)] leading-[1.04] font-medium tracking-[-0.035em]">
                  A sequence,
                  <br />
                  not a setting.
                </h2>
                <p className="mt-5 max-w-sm text-xs leading-6 text-muted-foreground">
                  Each rung is named on the day a family enrols: the senior's
                  phone, the primary guardian, a local contact, and the nearest
                  ambulance desk. Skipping a stage requires an explicit
                  override, and every override is logged.
                </p>
                <div className="mt-8 flex items-center gap-2 border-t border-border pt-5">
                  <ShieldCheck className="size-3.5 text-[var(--chart-1)]" />
                  <p className="font-mono text-[10px] text-muted-foreground">
                    Configured in the workspace · active with the care plan
                  </p>
                </div>
              </div>

              <div className="border-t border-border">
                {ESCALATION_STAGES.map((stage) => (
                  <motion.div
                    key={stage.stage}
                    {...fade}
                    className="grid grid-cols-[58px_1fr] gap-4 border-b border-border py-6 sm:grid-cols-[84px_1fr] sm:gap-6"
                  >
                    <span className="font-mono text-[9px] tracking-[0.12em] text-muted-foreground uppercase">
                      {stage.stage}
                    </span>
                    <div>
                      <h3 className="text-sm leading-6 font-medium">
                        {stage.title}
                      </h3>
                      <p className="mt-2 max-w-md text-xs leading-6 text-muted-foreground">
                        {stage.detail}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Operators */}
        <section id="operators" className="scroll-mt-16 border-b border-border">
          <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 md:grid-cols-2 md:gap-16 md:py-20">
            <div>
              <p className="label-eyebrow">For operators</p>
              <h2 className="mt-4 text-[clamp(1.9rem,3.6vw,2.9rem)] leading-[1.04] font-medium tracking-[-0.035em]">
                Built for the business
                <br />
                behind the care.
              </h2>
              <p className="mt-5 max-w-md text-sm leading-7 text-muted-foreground">
                Care providers run Carecall under their own service. Operators
                publish the catalog their customers browse, review every
                enrolment across the base, and step into the comment thread when
                a family has a question.
              </p>
              <ul className="mt-8 border-t border-border">
                {[
                  "Program catalog with draft and published states",
                  "Enrolment overview across every customer",
                  "Comment moderation on program pages",
                  "Role-gated access, attributed changes",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 border-b border-border py-3 text-xs leading-6 text-muted-foreground"
                  >
                    <span
                      className="mt-2 size-1 shrink-0 rounded-full bg-[var(--chart-1)]"
                      aria-hidden
                    />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                to="/admin"
                className="mt-8 inline-flex items-center gap-2 text-xs text-foreground underline-offset-4 hover:underline"
              >
                Open the operator console
                <ArrowRight className="size-3.5" />
              </Link>
            </div>

            <div className="md:border-l md:border-border md:pl-16">
              <div className="border border-border">
                <div className="flex items-center justify-between border-b border-border px-5 py-3">
                  <p className="font-mono text-[9px] tracking-[0.14em] text-muted-foreground uppercase">
                    Operator console
                  </p>
                  <span className="font-mono text-[9px] text-muted-foreground">
                    3 sections
                  </span>
                </div>
                <div className="px-5">
                  {[
                    [
                      "Catalog",
                      plans
                        ? `${plans.length} program${plans.length === 1 ? "" : "s"} · live`
                        : "Loading catalog",
                    ],
                    ["Enrolments", "Every senior under care"],
                    ["Comments", "Questions, in one queue"],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="flex items-baseline justify-between gap-6 border-b border-border py-4 last:border-b-0"
                    >
                      <span className="text-xs">{label}</span>
                      <span className="text-right font-mono text-[10px] text-muted-foreground">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border px-5 py-3">
                  <p className="font-mono text-[10px] text-muted-foreground">
                    access: operator role only
                  </p>
                </div>
              </div>
              <p className="mt-4 text-[11px] leading-5 text-muted-foreground">
                The first signed-in account on a fresh deployment can claim
                operator access once. After that, the console stays locked.
              </p>
            </div>
          </div>
        </section>

        {/* Closing */}
        <section>
          <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
            <motion.div {...fade} className="max-w-3xl">
              <p className="label-eyebrow">Start small</p>
              <h2 className="mt-6 text-[clamp(2.2rem,5vw,3.8rem)] leading-[1.02] font-medium tracking-[-0.04em]">
                One parent.
                <br />
                One prescription.
                <br />
                <span className="text-muted-foreground">One phone call.</span>
              </h2>
              <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3">
                <Button asChild size="lg" className="rounded-md px-6">
                  <Link to="/catalog">
                    Browse care programs
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Link
                  to="/auth?returnTo=%2Fonboarding"
                  className="text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
                >
                  Enrol a parent
                </Link>
              </div>
              <p className="mt-6 max-w-md font-mono text-[10px] leading-5 text-muted-foreground">
                No app for the senior · billing per program · cancel from the
                workspace
              </p>
            </motion.div>
          </div>
        </section>
      </main>

      <CareFooter />
    </div>
  );
}
