import { CareFooter, FreeInitiativeBar } from "@/components/CareHeader";
import { FreeBadge, FREE_LINE } from "@/components/FreeBadge";
import { Wordmark } from "@/components/Wordmark";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { ESCALATION_STAGES } from "@/lib/care";
import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  HeartHandshake,
  PhoneCall,
  ShieldCheck,
  Sparkles,
  Watch,
} from "lucide-react";
import { Link } from "react-router";

const NAV = [
  { href: "#how", label: "How it works" },
  { href: "/catalog", label: "Free programs" },
  { href: "#safety", label: "Safety net" },
  { href: "#guardians", label: "Guardians" },
];

const fade = {
  initial: { opacity: 0, y: 10 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
};

const FREE_PILLARS = [
  {
    icon: <HeartHandshake className="size-4" />,
    title: "No fee, at any point",
    body: "Enrolment, calls, watch sync and escalation are all included. There is no paid tier waiting behind a screen later.",
  },
  {
    icon: <ShieldCheck className="size-4" />,
    title: "No card, no trial",
    body: "We never ask for payment details, so there is nothing to cancel and no date when the free period quietly ends.",
  },
  {
    icon: <Sparkles className="size-4" />,
    title: "No paywall on health data",
    body: "Every medication record, vital reading and safety contact stays visible to the family. Nothing important is held back.",
  },
];

const STEPS = [
  {
    number: "01",
    title: "Enrol in about five minutes",
    body: "A guardian adds their parent's name, phone number and mother tongue, then uploads a prescription photo. We turn it into pill-by-pill guidance for approval.",
  },
  {
    number: "02",
    title: "A call in their own language",
    body: "At each dose time the AI phones them, describes the tablet by colour, shape and where it is kept, and stays on the line for real questions.",
  },
  {
    number: "03",
    title: "Quiet monitoring, visible to you",
    body: "Vitals sync from the watch already on their wrist. Missed doses and worrying readings reach you — and, if needed, the neighbour and ambulance desk.",
  },
];

export default function Landing() {
  const plans = useQuery(api.catalog.listPublished);
  const previewPlans = (plans ?? []).slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <FreeInitiativeBar />
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-sm">
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
            <Button asChild size="sm" className="rounded-full px-4">
              <Link to="/auth?returnTo=%2Fonboarding">Start free</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="border-b border-border">
          <div className="mx-auto max-w-6xl px-6 pt-14 pb-14 md:pt-20 md:pb-20">
            <div className="grid gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              >
                <FreeBadge label="100% Free Forever for Every Family" />
                <h1 className="mt-7 font-display text-[clamp(2.8rem,6vw,5rem)] leading-[0.98] tracking-[-0.02em]">
                  Care that reaches them,
                  <br />
                  <span className="text-primary italic">
                    without a single tap.
                  </span>
                </h1>
                <p className="mt-7 max-w-lg text-sm leading-7 text-muted-foreground">
                  CareCall is a free community health service for elders and the
                  families who look after them from a distance. A phone call in
                  their mother tongue for every medicine, quiet watch vitals in
                  the background, and a safety net that never stops at a
                  notification.
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
                  <Button asChild size="lg" className="rounded-full px-6">
                    <Link to="/auth?returnTo=%2Fonboarding">
                      Start free onboarding
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                  <Link
                    to="/catalog"
                    className="text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
                  >
                    Browse free programs
                  </Link>
                </div>

                <p className="mt-6 text-[11px] font-medium tracking-wide text-muted-foreground">
                  {FREE_LINE} — for as long as your family needs it.
                </p>

                <dl className="mt-10 grid max-w-lg grid-cols-1 gap-6 border-t border-border pt-6 sm:grid-cols-3">
                  {[
                    ["No app", "Nothing to install or open"],
                    ["10 languages", "Native-reviewed scripts"],
                    ["3 stages", "Guardian, neighbour, ambulance"],
                  ].map(([term, detail]) => (
                    <div key={term}>
                      <dt className="text-xs font-medium text-foreground">
                        {term}
                      </dt>
                      <dd className="mt-1 text-[11px] leading-5 text-muted-foreground">
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
                <div className="overflow-hidden rounded-xl border border-border bg-card">
                  <div className="flex items-center justify-between border-b border-border bg-accent/50 px-5 py-3">
                    <p className="flex items-center gap-2 text-[10px] font-medium tracking-[0.12em] text-accent-foreground uppercase">
                      <span className="relative flex size-1.5">
                        <span className="absolute inline-flex size-full animate-ping rounded-full bg-[var(--chart-1)] opacity-60" />
                        <span className="relative inline-flex size-1.5 rounded-full bg-[var(--chart-1)]" />
                      </span>
                      Care call · 8:30 PM
                    </p>
                    <span className="text-[10px] font-medium text-accent-foreground">
                      Telugu
                    </span>
                  </div>

                  <div className="px-5 pt-6 pb-5">
                    <p className="label-eyebrow">Spoken aloud</p>
                    <p className="mt-3 font-display text-2xl leading-snug">
                      “లక్ష్మి గారూ, ఈ మందు తీసుకున్నారా?”
                    </p>
                    <p className="mt-2 text-[11px] leading-5 text-muted-foreground italic">
                      “Lakshmi garu, have you taken this medicine?”
                    </p>

                    <div className="mt-6 space-y-0 border-t border-border">
                      {[
                        ["Medicine", "Metformin · 500 mg"],
                        ["Timing", "After dinner, not before"],
                        ["Where", "White strip in the kitchen drawer"],
                        ["Guardrail", "Sugar restricted · diabetes on file"],
                      ].map(([label, value]) => (
                        <div
                          key={label}
                          className="flex items-baseline justify-between gap-4 border-b border-border py-3"
                        >
                          <span className="text-[10px] font-medium tracking-[0.1em] text-muted-foreground uppercase">
                            {label}
                          </span>
                          <span className="max-w-[62%] text-right text-[11px] leading-5 text-foreground">
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>

                    <p className="mt-4 flex items-start gap-2 text-[11px] leading-5 text-muted-foreground">
                      <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-[var(--chart-1)]" />
                      If she misses two attempts, you hear about it next — not
                      next week.
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <p className="text-[10px] leading-5 text-muted-foreground">
                    Answered on the landline beside the bed.
                  </p>
                  <FreeBadge compact label="Zero cost to the senior" />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Principle */}
        <section className="border-b border-border">
          <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-[0.95fr_1.05fr] md:py-20">
            <motion.p
              {...fade}
              className="max-w-md font-display text-[clamp(1.9rem,3.4vw,2.7rem)] leading-[1.12] tracking-[-0.01em]"
            >
              Care should feel like companionship, not surveillance.
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
                So we did not build another app for your parents. We built a
                phone call — the one interface that already belongs in their
                routine — and we made it free, because care should not depend
                on what a family can afford.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Free promise */}
        <section className="border-b border-border bg-accent/25">
          <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="label-eyebrow text-accent-foreground">
                  Zero Cost Community Health Initiative
                </p>
                <h2 className="mt-4 max-w-xl font-display text-[clamp(2rem,4vw,3rem)] leading-[1.06] tracking-[-0.01em]">
                  Free is the product,
                  <br />
                  not the trial.
                </h2>
              </div>
              <FreeBadge label="100% Free Forever for Every Family" />
            </div>

            <div className="mt-12 grid gap-8 md:grid-cols-3 md:gap-0">
              {FREE_PILLARS.map((pillar, index) => (
                <motion.div
                  key={pillar.title}
                  {...fade}
                  className={
                    index === 0
                      ? "border-t border-[var(--chart-1)]/25 pt-6 md:border-t-0 md:pt-0"
                      : "border-t border-[var(--chart-1)]/25 pt-6 md:border-t-0 md:border-l md:border-[var(--chart-1)]/25 md:px-8 md:pt-0"
                  }
                >
                  <span className="flex size-9 items-center justify-center rounded-full border border-[var(--chart-1)]/30 bg-card text-[var(--chart-1)]">
                    {pillar.icon}
                  </span>
                  <h3 className="mt-5 text-sm font-medium">{pillar.title}</h3>
                  <p className="mt-2 text-xs leading-6 text-muted-foreground">
                    {pillar.body}
                  </p>
                </motion.div>
              ))}
            </div>

            <p className="mt-10 max-w-2xl text-xs leading-6 text-muted-foreground">
              CareCall is run as a public-good initiative for daily use. There are
              no advertisements, no data sold to insurers, and no paid tier that
              unlocks better care. Every family gets the same service.
            </p>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="scroll-mt-16 border-b border-border">
          <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="label-eyebrow">
                  How it works · Zero tech friction for seniors
                </p>
                <h2 className="mt-4 max-w-xl font-display text-[clamp(2rem,4vw,3rem)] leading-[1.06] tracking-[-0.01em]">
                  Three steps, none of them theirs.
                </h2>
              </div>
              <p className="max-w-xs text-xs leading-6 text-muted-foreground">
                Your parent never sees a screen, a password or a menu. You set
                it up once; the phone does the rest.
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {STEPS.map((step) => (
                <motion.div
                  key={step.number}
                  {...fade}
                  className="rounded-xl border border-border bg-card p-6"
                >
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-[10px] font-medium tracking-[0.14em] tabular-nums">
                      {step.number}
                    </span>
                    <ArrowUpRight className="size-3.5" />
                  </div>
                  <h3 className="mt-6 text-sm leading-6 font-medium">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-xs leading-6 text-muted-foreground">
                    {step.body}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Free programs */}
        <section id="programs" className="scroll-mt-16 border-b border-border">
          <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="label-eyebrow">Free care programs</p>
                <h2 className="mt-4 max-w-xl font-display text-[clamp(2rem,4vw,3rem)] leading-[1.06] tracking-[-0.01em]">
                  Choose the support
                  <br />
                  your family needs.
                </h2>
              </div>
              <Link
                to="/catalog"
                className="inline-flex items-center gap-2 text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
              >
                View every free program
                <ArrowUpRight className="size-3.5" />
              </Link>
            </div>
            <p className="mt-4 max-w-xl text-xs leading-6 text-muted-foreground">
              Each program is included at no cost. Combine them freely; nothing
              is unlocked by paying more.
            </p>

            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {plans === undefined
                ? [0, 1, 2].map((row) => (
                    <div
                      key={row}
                      className="rounded-xl border border-border p-6"
                    >
                      <div className="h-2.5 w-20 animate-pulse rounded bg-muted" />
                      <div className="mt-4 h-4 w-40 animate-pulse rounded bg-muted" />
                      <div className="mt-3 h-2.5 w-full animate-pulse rounded bg-muted" />
                    </div>
                  ))
                : previewPlans.map((plan) => (
                    <motion.div key={plan._id} {...fade}>
                      <Link
                        to={`/catalog/${plan.slug}`}
                        className="group flex h-full flex-col rounded-xl border border-border bg-card p-6 transition-colors hover:border-[var(--chart-1)]/40"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="rounded-full bg-accent px-2.5 py-1 text-[10px] font-medium text-accent-foreground">
                            {plan.category}
                          </span>
                          <span className="text-[10px] font-medium text-[var(--chart-1)]">
                            Free
                          </span>
                        </div>
                        <h3 className="mt-5 text-base font-medium">
                          {plan.name}
                        </h3>
                        <p className="mt-2 flex-1 text-xs leading-6 text-muted-foreground">
                          {plan.tagline}
                        </p>
                        <span className="mt-6 inline-flex items-center gap-2 text-[11px] text-muted-foreground transition-colors group-hover:text-foreground">
                          See what is included
                          <ArrowRight className="size-3.5" />
                        </span>
                      </Link>
                    </motion.div>
                  ))}
            </div>
          </div>
        </section>

        {/* Safety */}
        <section id="safety" className="scroll-mt-16 border-b border-border">
          <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
            <div className="grid gap-12 md:grid-cols-[0.85fr_1.15fr] md:gap-16">
              <div>
                <p className="label-eyebrow">The safety net</p>
                <h2 className="mt-4 font-display text-[clamp(2rem,4vw,3rem)] leading-[1.04] tracking-[-0.01em]">
                  Nobody is left
                  <br />
                  waiting alone.
                </h2>
                <p className="mt-5 max-w-sm text-xs leading-6 text-muted-foreground">
                  Escalation is an ordered ladder, not a notification setting.
                  Every rung is named on the day you enrol — and it is the same
                  for every family, free of charge.
                </p>
                <div className="mt-8 flex items-center gap-2 border-t border-border pt-5">
                  <ShieldCheck className="size-3.5 text-[var(--chart-1)]" />
                  <p className="text-[11px] text-muted-foreground">
                    Set up in the workspace · active with the care plan
                  </p>
                </div>
              </div>

              <div className="border-t border-border">
                {ESCALATION_STAGES.map((stage) => (
                  <motion.div
                    key={stage.stage}
                    {...fade}
                    className="grid grid-cols-[64px_1fr] gap-4 border-b border-border py-6 sm:grid-cols-[92px_1fr] sm:gap-6"
                  >
                    <span className="text-[10px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
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

        {/* Watch + guardians */}
        <section id="guardians" className="scroll-mt-16 border-b border-border">
          <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 md:grid-cols-2 md:gap-16 md:py-20">
            <div>
              <p className="label-eyebrow">The wrist does the work</p>
              <h2 className="mt-4 font-display text-[clamp(1.9rem,3.6vw,2.75rem)] leading-[1.08] tracking-[-0.01em]">
                A budget watch,
                <br />
                read like a medical one.
              </h2>
              <p className="mt-5 max-w-md text-sm leading-7 text-muted-foreground">
                Noise, Fire-Boltt and Amazfit already measure more than anyone
                looks at. CareCall reads those measurements through Google Health
                Connect or Apple HealthKit — no new device to buy, no settings
                for your parent to touch.
              </p>
              <div className="mt-8 overflow-hidden rounded-xl border border-border">
                {[
                  ["Heart rate", "Resting 68 bpm · steady"],
                  ["Blood oxygen", "97% overnight average"],
                  ["Sleep", "7.2 hrs · 6h 20m deep + light"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-baseline justify-between gap-6 border-b border-border bg-card px-4 py-3.5 last:border-b-0"
                  >
                    <span className="flex items-center gap-2 text-xs text-foreground">
                      <Watch className="size-3.5 text-muted-foreground" />
                      {label}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="md:border-l md:border-border md:pl-16">
              <p className="label-eyebrow">For the guardian</p>
              <h2 className="mt-4 font-display text-[clamp(1.9rem,3.6vw,2.75rem)] leading-[1.08] tracking-[-0.01em]">
                One calm page,
                <br />
                from any timezone.
              </h2>
              <p className="mt-5 max-w-md text-sm leading-7 text-muted-foreground">
                No group chats asking whether Amma took her tablet. The
                dashboard shows the last 36 hours of vitals, today's calls and
                the care circle behind them — and you can share it with siblings
                at no extra cost.
              </p>
              <ul className="mt-8 space-y-3 border-t border-border pt-5">
                {[
                  "Senior profile, conditions and uploaded records",
                  "Prescription parsed into pill-level guidance",
                  "Guardian, neighbour and ambulance routing in order",
                  "A health summary built for a glance, not a study",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-xs leading-6 text-muted-foreground"
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
                to="/auth?returnTo=%2Fonboarding"
                className="mt-8 inline-flex items-center gap-2 text-xs text-foreground underline-offset-4 hover:underline"
              >
                Begin free onboarding
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Closing */}
        <section>
          <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
            <motion.div {...fade} className="max-w-3xl">
              <FreeBadge label="Zero Cost Community Health Initiative" />
              <h2 className="mt-6 font-display text-[clamp(2.3rem,5.2vw,4rem)] leading-[1.02] tracking-[-0.015em]">
                Free for every family.
                <br />
                <span className="text-muted-foreground italic">
                  For as long as you need it.
                </span>
              </h2>
              <p className="mt-5 max-w-lg text-sm leading-7 text-muted-foreground">
                No subscription, no payment page, no hidden costs. Add one
                parent, one prescription, one phone call — and let CareCall keep
                watch alongside you.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3">
                <Button asChild size="lg" className="rounded-full px-6">
                  <Link to="/auth?returnTo=%2Fonboarding">
                    Start free onboarding
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Link
                  to="/catalog"
                  className="text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
                >
                  Browse free programs
                </Link>
              </div>
              <p className="mt-6 flex items-center gap-2 text-[11px] text-muted-foreground">
                <PhoneCall className="size-3.5" />
                {FREE_LINE} · no advertisements · no data sold
              </p>
            </motion.div>
          </div>
        </section>
      </main>

      <CareFooter />
    </div>
  );
}
