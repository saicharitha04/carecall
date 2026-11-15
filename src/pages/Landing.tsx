import { Wordmark } from "@/components/Wordmark";
import { Button } from "@/components/ui/button";
import { ESCALATION_STAGES } from "@/lib/care";
import { motion } from "framer-motion";
import { ArrowRight, MoonStar, ShieldCheck, Waves } from "lucide-react";
import { Link } from "react-router";

const NAV = [
  { href: "#how", label: "How it works" },
  { href: "#safety", label: "Safety net" },
  { href: "#guardians", label: "For guardians" },
];

const fade = {
  initial: { opacity: 0, y: 10 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
};

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Wordmark />
          <nav className="hidden items-center gap-8 md:flex">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <Link
              to="/auth?returnTo=%2Fdashboard"
              className="hidden text-xs text-muted-foreground transition-colors hover:text-foreground sm:inline"
            >
              Sign in
            </Link>
            <Button asChild size="sm" className="rounded-full px-4">
              <Link to="/auth?returnTo=%2Fonboarding">
                Start onboarding
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="border-b border-border">
          <div className="mx-auto max-w-6xl px-6 pt-16 pb-14 md:pt-24 md:pb-20">
            <div className="grid gap-14 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              >
                <p className="label-eyebrow flex items-center gap-2">
                  <span
                    className="size-1.5 rounded-full bg-[var(--chart-1)]"
                    aria-hidden
                  />
                  Zero tech friction for seniors
                </p>
                <h1 className="mt-7 font-display text-[clamp(2.9rem,6.4vw,5.25rem)] leading-[0.94] tracking-[-0.015em]">
                  Care that reaches them,
                  <br />
                  <span className="text-muted-foreground italic">
                    without a single tap.
                  </span>
                </h1>
                <p className="mt-8 max-w-md text-sm leading-7 text-muted-foreground">
                  Sahyog Care phones your parent in the language they dream in.
                  It reminds them of the right tablet, answers their questions,
                  and quietly reads the watch on their wrist. You see the whole
                  picture from wherever you are.
                </p>

                <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3">
                  <Button asChild size="lg" className="rounded-full px-7">
                    <Link to="/auth?returnTo=%2Fonboarding">
                      Enrol your parent
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                  <a
                    href="#how"
                    className="text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
                  >
                    See how a call works
                  </a>
                </div>

                <dl className="mt-14 grid max-w-lg grid-cols-1 gap-6 border-t border-border pt-6 sm:grid-cols-3">
                  {[
                    ["No app", "Nothing to install or open"],
                    ["No typing", "A voice, a keypad, a yes"],
                    ["No guessing", "Every dose logged honestly"],
                  ].map(([term, detail]) => (
                    <div key={term}>
                      <dt className="text-xs text-foreground">{term}</dt>
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
                <div className="border border-border">
                  <div className="flex items-center justify-between border-b border-border px-5 py-3">
                    <p className="flex items-center gap-2 text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
                      <span className="relative flex size-1.5">
                        <span className="absolute inline-flex size-full animate-ping rounded-full bg-[var(--chart-1)] opacity-60" />
                        <span className="relative inline-flex size-1.5 rounded-full bg-[var(--chart-1)]" />
                      </span>
                      Care call · 8:30 PM
                    </p>
                    <span className="text-[10px] text-muted-foreground">
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
                          <span className="text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
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
                      If she misses the call twice, you hear about it next — not
                      next week.
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-[10px] leading-5 text-muted-foreground">
                  Answered on the phone already on her bedside table. A landline
                  works just as well.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Principle */}
        <section className="border-b border-border">
          <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-[0.9fr_1.1fr] md:py-20">
            <motion.p
              {...fade}
              className="max-w-sm font-display text-[clamp(1.8rem,3.4vw,2.6rem)] leading-[1.14] tracking-tight"
            >
              Their day should not depend on remembering how an app works.
            </motion.p>
            <motion.div
              {...fade}
              className="grid gap-6 sm:grid-cols-2 md:pl-10 md:border-l md:border-border"
            >
              <p className="text-sm leading-7 text-muted-foreground">
                Missed doses rarely announce themselves. A strip sits untouched;
                a name is skipped; a week quietly goes by. The people who would
                notice are usually in another city, in another meeting.
              </p>
              <p className="text-sm leading-7 text-muted-foreground">
                So we did not build an app for your parents. We built a phone
                call — the one interface that already has a place in their
                routine. Everything else happens quietly, around it.
              </p>
            </motion.div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="scroll-mt-16 border-b border-border">
          <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="label-eyebrow">How it works</p>
                <h2 className="mt-4 max-w-lg font-display text-[clamp(2rem,4vw,3rem)] leading-[1.06] tracking-tight">
                  Three things, done properly.
                </h2>
              </div>
              <p className="max-w-xs text-xs leading-6 text-muted-foreground">
                Version one is deliberately small: enrol a parent, build their
                profile, and see their health summary in one place.
              </p>
            </div>

            <div className="mt-12 grid gap-px border-t border-border md:grid-cols-3 md:gap-0">
              {[
                {
                  number: "01",
                  title: "A five-minute enrolment",
                  body: "You add your parent's name, phone number and mother tongue. Upload a prescription photo — medicines, dosages and timings come back for your approval.",
                  icon: <ArrowRight className="size-4" />,
                },
                {
                  number: "02",
                  title: "A call in their language",
                  body: "At each dose time the AI rings them, describes the tablet by colour and the place it is kept, and stays on the line for real questions.",
                  icon: <Waves className="size-4" />,
                },
                {
                  number: "03",
                  title: "A summary you can trust",
                  body: "Heart rate, SpO₂ and sleep sync from their smartwatch. Doses are marked confirmed or missed — never assumed. You see it all in one quiet page.",
                  icon: <MoonStar className="size-4" />,
                },
              ].map((step) => (
                <motion.div
                  key={step.number}
                  {...fade}
                  className="border-t border-border pt-6 md:border-t-0 md:border-l md:px-8 md:pt-0 md:first:border-l-0 md:first:pl-0 md:last:pr-0"
                >
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-[10px] tracking-[0.16em] tabular-nums">
                      {step.number}
                    </span>
                    {step.icon}
                  </div>
                  <h3 className="mt-6 text-base leading-6">{step.title}</h3>
                  <p className="mt-3 text-xs leading-6 text-muted-foreground">
                    {step.body}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Safety net */}
        <section id="safety" className="scroll-mt-16 border-b border-border">
          <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
            <div className="grid gap-12 md:grid-cols-[0.8fr_1.2fr] md:gap-16">
              <div>
                <p className="label-eyebrow">The safety net</p>
                <h2 className="mt-4 font-display text-[clamp(2rem,4vw,3rem)] leading-[1.06] tracking-tight">
                  Nobody is left
                  <br />
                  waiting alone.
                </h2>
                <p className="mt-5 max-w-sm text-xs leading-6 text-muted-foreground">
                  Escalation is not a notification setting. It is an ordered
                  ladder, and every rung is already named on the day you enrol.
                </p>
                <div className="mt-8 flex items-center gap-2 border-t border-border pt-5">
                  <ShieldCheck className="size-3.5 text-[var(--chart-1)]" />
                  <p className="text-[11px] text-muted-foreground">
                    Configured in version 1 · activated with your care plan
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
                    <span className="text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
                      {stage.stage}
                    </span>
                    <div>
                      <h3 className="text-sm leading-6">{stage.title}</h3>
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
              <h2 className="mt-4 font-display text-[clamp(1.9rem,3.6vw,2.75rem)] leading-[1.08] tracking-tight">
                A budget watch,
                <br />
                read like a medical one.
              </h2>
              <p className="mt-5 max-w-md text-sm leading-7 text-muted-foreground">
                Noise, Fire-Boltt and Amazfit already measure more than anyone
                looks at. Sahyog Care reads those measurements through Google
                Health Connect or Apple HealthKit — no new device, no settings
                for your parent to touch.
              </p>
              <div className="mt-8 border-t border-border">
                {[
                  ["Heart rate", "Resting 68 bpm · steady"],
                  ["Blood oxygen", "97% overnight average"],
                  ["Sleep", "7.2 hrs · 6h 20m deep + light"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-baseline justify-between gap-6 border-b border-border py-3.5"
                  >
                    <span className="text-xs text-foreground">{label}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="md:border-l md:border-border md:pl-16">
              <p className="label-eyebrow">For the guardian</p>
              <h2 className="mt-4 font-display text-[clamp(1.9rem,3.6vw,2.75rem)] leading-[1.08] tracking-tight">
                One page,
                <br />
                from any timezone.
              </h2>
              <p className="mt-5 max-w-md text-sm leading-7 text-muted-foreground">
                No group chats asking whether Amma took her tablet. The
                dashboard shows the last 36 hours of vitals, today's calls and
                the care circle that stands behind them — in one calm view.
              </p>
              <ul className="mt-8 space-y-3 border-t border-border pt-5">
                {[
                  "Senior profile, conditions and uploaded records",
                  "Prescription parsed into pill-level guidance",
                  "Guardian, neighbour and ambulance routing in order",
                  "Health summary built for a glance, not a study",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-xs leading-6 text-muted-foreground"
                  >
                    <span
                      className="mt-2 size-1 shrink-0 rounded-full bg-foreground/40"
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
                Begin guardian onboarding
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Closing */}
        <section>
          <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
            <motion.div {...fade} className="max-w-3xl">
              <p className="label-eyebrow">Sahyog — together</p>
              <h2 className="mt-6 font-display text-[clamp(2.3rem,5.4vw,4rem)] leading-[1.02] tracking-[-0.01em]">
                Start with one parent,
                <br />
                one prescription,
                <br />
                <span className="text-muted-foreground italic">
                  one phone call.
                </span>
              </h2>
              <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3">
                <Button asChild size="lg" className="rounded-full px-7">
                  <Link to="/auth?returnTo=%2Fonboarding">
                    Enrol your parent
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <p className="text-[11px] text-muted-foreground">
                  Free to set up · no app for the senior · cancel the calls
                  anytime
                </p>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
          <Wordmark />
          <p className="text-[11px] leading-5 text-muted-foreground">
            An interconnected care platform for elders and the people who love
            them from a distance.
          </p>
          <p className="text-[11px] text-muted-foreground">
            Version 1 · Guardian onboarding & health summary
          </p>
        </div>
      </footer>
    </div>
  );
}
