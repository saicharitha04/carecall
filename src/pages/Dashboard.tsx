import { EscalationPanel } from "@/components/EscalationPanel";
import { FreeBadge } from "@/components/FreeBadge";
import { Wordmark } from "@/components/Wordmark";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { useAuth } from "@/hooks/use-auth";
import { formatPhone, formatTime12, initialsOf } from "@/lib/care";
import { cn } from "@/lib/utils";
import { useQuery } from "convex/react";
import {
  Activity,
  CircleDot,
  FileText,
  HeartPulse,
  Loader2,
  LogOut,
  Moon,
  Phone,
  Plus,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type DoseStatus = "taken" | "due" | "upcoming";

function doseStatusOf(time: string): DoseStatus {
  const [hours, minutes] = time.split(":").map(Number);
  if (Number.isNaN(hours)) return "upcoming";
  const dose = hours * 60 + (minutes || 0);
  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();
  if (dose > current) return "upcoming";
  if (current - dose < 90) return "due";
  return "taken";
}

const STATUS_COPY: Record<DoseStatus, string> = {
  taken: "Confirmed",
  due: "Call in progress",
  upcoming: "Scheduled",
};

function relativeSync(timestamp: number) {
  const minutes = Math.max(1, Math.round((Date.now() - timestamp) / 60000));
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  return `${hours} hr ago`;
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const seniors = useQuery(api.seniors.listMine);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (seniors === undefined) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </main>
    );
  }

  const senior =
    seniors.find((item) => item._id === selectedId) ?? seniors[0] ?? null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Wordmark to="/dashboard" />
          <div className="flex items-center gap-5 sm:gap-6">
            <Link
              to="/catalog"
              className="hidden text-xs text-muted-foreground transition-colors hover:text-foreground sm:inline"
            >
              Programs
            </Link>
            <Link
              to="/admin"
              className="hidden text-xs text-muted-foreground transition-colors hover:text-foreground sm:inline"
            >
              Admin
            </Link>
            <FreeBadge compact className="hidden lg:inline-flex" />
            <div className="hidden h-4 w-px bg-border sm:block" />
            <span className="hidden max-w-[180px] truncate text-xs text-muted-foreground md:inline">
              {user?.name || user?.email}
            </span>
            <button
              type="button"
              onClick={() => void handleSignOut()}
              className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <LogOut className="size-3.5" />
              Sign out
            </button>
          </div>
        </div>
      </header>

      {!senior ? (
        <main className="mx-auto max-w-3xl px-6 py-24">
          <p className="label-eyebrow">CareCall workspace</p>
          <div className="mt-4">
            <FreeBadge label="100% Free Forever for Every Family" />
          </div>
          <h1 className="mt-4 font-display text-4xl leading-tight tracking-tight sm:text-5xl">
            Nobody is enrolled yet.
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-6 text-muted-foreground">
            Add your parent once. After that their medication calls, watch
            vitals and safety contacts sit on this page — no app for them, no
            chasing for you.
          </p>
          <div className="mt-10 border border-border">
            <div className="flex items-start gap-4 border-b border-border px-6 py-5">
              <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border border-border text-[10px] tabular-nums text-muted-foreground">
                01
              </span>
              <div>
                <p className="text-sm">Tell us who to call</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Name, age, phone number and the language they think in.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 border-b border-border px-6 py-5">
              <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border border-border text-[10px] tabular-nums text-muted-foreground">
                02
              </span>
              <div>
                <p className="text-sm">Add prescriptions and conditions</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Upload the slip — we turn it into pill-by-pill phone calls.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 px-6 py-5">
              <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border border-border text-[10px] tabular-nums text-muted-foreground">
                03
              </span>
              <div>
                <p className="text-sm">Set the escalation ladder</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  You, a neighbour, and the nearest hospital — in that order.
                </p>
              </div>
            </div>
          </div>
          <Button
            asChild
            className="mt-8 rounded-full px-6"
          >
            <Link to="/onboarding">
              Enrol your parent
              <Plus className="size-4" />
            </Link>
          </Button>
        </main>
      ) : (
        <SeniorSummary
          senior={senior}
          seniors={seniors.map(({ _id, fullName }) => ({ _id, fullName }))}
          onSelect={setSelectedId}
          guardianName={user?.name}
        />
      )}
    </div>
  );
}

type Senior = Doc<"seniors">;

function SeniorSummary({
  senior,
  seniors,
  onSelect,
  guardianName,
}: {
  senior: Senior;
  seniors: { _id: string; fullName: string }[];
  onSelect: (id: string) => void;
  guardianName?: string | null;
}) {
  const latest = senior.vitals[senior.vitals.length - 1];
  const heartRates = senior.vitals.map((point) => point.hr);
  const hrLow = heartRates.length ? Math.min(...heartRates) : 0;
  const hrHigh = heartRates.length ? Math.max(...heartRates) : 0;
  const chartData = senior.vitals.map((point) => ({
    ...point,
    label: new Date(point.at).toLocaleTimeString("en-IN", {
      hour: "numeric",
      hour12: true,
    }),
  }));

  const doses = senior.medications
    .flatMap((med) =>
      med.times
        .filter(Boolean)
        .map((time) => ({ key: `${med.key}-${time}`, med, time })),
    )
    .sort((a, b) => a.time.localeCompare(b.time));

  const nextDose =
    doses.find((dose) => doseStatusOf(dose.time) !== "taken") ?? doses[0];
  const takenToday = doses.filter(
    (dose) => doseStatusOf(dose.time) === "taken",
  ).length;

  // The spoken script is generated server-side from the approved prescription,
  // so the dashboard preview and the actual agent cannot drift apart.
  const callScript = useQuery(
    api.voice.getMedicationScript,
    nextDose
      ? { seniorId: senior._id, medicationKey: nextDose.med.key }
      : "skip",
  );

  const guardianFirstName = guardianName?.split(" ")[0];

  return (
    <main className="mx-auto max-w-6xl px-6 pb-20">
      <section className="border-b border-border py-10">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0">
            <p className="label-eyebrow">
              {greeting()}
              {guardianFirstName ? `, ${guardianFirstName}` : ""} · Senior
              health summary
            </p>
            <div className="mt-3 flex items-center gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full border border-border font-display text-lg text-muted-foreground">
                {initialsOf(senior.fullName)}
              </span>
              <div className="min-w-0">
                <h1 className="truncate font-display text-4xl leading-tight tracking-tight">
                  {senior.fullName}
                </h1>
                <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                  <span>{senior.age} yrs</span>
                  <span aria-hidden>·</span>
                  <span className="capitalize">{senior.gender}</span>
                  <span aria-hidden>·</span>
                  <span>{senior.language}</span>
                  <span aria-hidden>·</span>
                  <span className="tabular-nums">
                    {formatPhone(senior.phone)}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start gap-3 sm:items-end">
            <FreeBadge compact label="100% free forever · no card needed" />
            <span className="inline-flex items-center gap-2 border border-border px-3 py-1.5 text-[11px] text-muted-foreground">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-[var(--chart-1)] opacity-60" />
                <span className="relative inline-flex size-1.5 rounded-full bg-[var(--chart-1)]" />
              </span>
              {senior.deviceBrand} synced {relativeSync(senior.lastSyncedAt)}
            </span>
            <div className="flex items-center gap-2">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="rounded-full"
              >
                <Link to="/onboarding">
                  <Plus className="size-3.5" />
                  Add parent
                </Link>
              </Button>
            </div>
            {seniors.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {seniors.map((item) => (
                  <button
                    key={item._id}
                    type="button"
                    onClick={() => onSelect(item._id)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-[11px] transition-colors",
                      item._id === senior._id
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground",
                    )}
                  >
                    {item.fullName.split(" ")[0]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 border-b border-border lg:grid-cols-4">
        <Stat
          label="Resting heart rate"
          value={latest ? `${latest.hr}` : "—"}
          unit="bpm"
          hint={`Range ${hrLow}–${hrHigh} bpm`}
          icon={<HeartPulse className="size-3.5" />}
        />
        <Stat
          label="Blood oxygen"
          value={latest ? `${latest.spo2}` : "—"}
          unit="%"
          hint="Overnight average 97%"
          icon={<Activity className="size-3.5" />}
          className="border-r-0 lg:border-r"
        />
        <Stat
          label="Sleep last night"
          value={`${senior.sleepHours}`}
          unit="hrs"
          hint="6h 20m deep + light"
          icon={<Moon className="size-3.5" />}
        />
        <Stat
          label="Doses confirmed"
          value={`${senior.adherence7d}`}
          unit="%"
          hint={`${takenToday} of ${doses.length} today`}
          icon={<CircleDot className="size-3.5" />}
          className="border-r-0"
        />
      </section>

      <div className="grid gap-10 pt-10 lg:grid-cols-[1.6fr_1fr] lg:gap-0">
        <section className="min-w-0 lg:pr-10">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-sm">Heart rate, last 36 hours</h2>
            <span className="text-[11px] tabular-nums text-muted-foreground">
              {latest ? `${latest.hr} bpm now` : "No readings"}
            </span>
          </div>
          <div className="mt-6 h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 4, right: 4, bottom: 0, left: -18 }}
              >
                <defs>
                  <linearGradient id="hrFade" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor="var(--chart-1)"
                      stopOpacity={0.16}
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--chart-1)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  interval={6}
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  dy={8}
                />
                <YAxis
                  domain={[50, 105]}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  width={40}
                />
                <Tooltip
                  cursor={{
                    stroke: "var(--border)",
                    strokeWidth: 1,
                  }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const point = payload[0].payload as {
                      label: string;
                      hr: number;
                      spo2: number;
                    };
                    return (
                      <div className="border border-border bg-popover px-3 py-2 text-[11px] shadow-sm">
                        <p className="tabular-nums text-muted-foreground">
                          {point.label}
                        </p>
                        <p className="mt-1 tabular-nums">
                          {point.hr} bpm · SpO₂ {point.spo2}%
                        </p>
                      </div>
                    );
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="hr"
                  stroke="var(--chart-1)"
                  strokeWidth={1.5}
                  fill="url(#hrFade)"
                  dot={false}
                  activeDot={{
                    r: 2.5,
                    fill: "var(--chart-1)",
                    stroke: "var(--background)",
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
            <p className="text-[11px] leading-5 text-muted-foreground">
              Synced quietly from {senior.deviceBrand} via Google Health Connect.
            </p>
            <p className="text-[11px] leading-5 text-muted-foreground/80">
              Baseline recorded at enrolment · live readings after pairing
            </p>
          </div>

          <div className="mt-12">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="text-sm">Today's medication calls</h2>
              <span className="text-[11px] text-muted-foreground">
                {senior.medications.length} medicine
                {senior.medications.length === 1 ? "" : "s"} ·{" "}
                {doses.length} call{doses.length === 1 ? "" : "s"}
              </span>
            </div>

            {doses.length === 0 ? (
              <p className="mt-5 border-t border-border pt-6 text-sm text-muted-foreground">
                No prescription is on file yet. Add one and the calls begin with
                the first dose.
              </p>
            ) : (
              <ul className="mt-4 border-t border-border">
                {doses.map(({ key, med, time }) => {
                  const status = doseStatusOf(time);
                  return (
                    <li
                      key={key}
                      className="flex items-start justify-between gap-4 border-b border-border py-4"
                    >
                      <div className="flex min-w-0 items-start gap-5">
                        <span className="w-[74px] shrink-0 text-sm tabular-nums text-muted-foreground">
                          {formatTime12(time)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm">
                            {med.name}
                            <span className="ml-2 text-xs text-muted-foreground">
                              {med.dosage}
                            </span>
                          </p>
                          <p className="mt-1 truncate text-[11px] text-muted-foreground">
                            {med.food} · {med.appearance} · {med.location}
                          </p>
                        </div>
                      </div>
                      <span
                        className={cn(
                          "flex shrink-0 items-center gap-1.5 border px-2.5 py-1 text-[10px] whitespace-nowrap",
                          status === "taken" &&
                            "border-border text-muted-foreground",
                          status === "due" &&
                            "border-foreground/20 bg-accent text-accent-foreground",
                          status === "upcoming" &&
                            "border-dashed border-border text-muted-foreground/80",
                        )}
                      >
                        <span
                          className={cn(
                            "size-1 rounded-full",
                            status === "taken" && "bg-[var(--chart-1)]",
                            status === "due" && "bg-foreground",
                            status === "upcoming" && "bg-muted-foreground/50",
                          )}
                        />
                        {STATUS_COPY[status]}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        <aside className="min-w-0 border-t border-border pt-10 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-10">
          <div className="border border-border p-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="size-3.5 text-primary" />
              <p className="label-eyebrow">Next AI call</p>
            </div>
            <p className="mt-4 font-display text-4xl leading-none tracking-tight tabular-nums">
              {nextDose ? formatTime12(nextDose.time) : "—"}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {nextDose
                ? `${nextDose.med.name} ${nextDose.med.dosage} · ${nextDose.med.food.toLowerCase()}`
                : "No medicines on the schedule yet"}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="border border-border px-2.5 py-1 text-[10px] text-muted-foreground">
                {senior.language}
              </span>
              <span className="border border-border px-2.5 py-1 text-[10px] text-muted-foreground">
                Two-way conversation
              </span>
            </div>
            {callScript && (
              <div className="mt-5 space-y-2 border-t border-border pt-4">
                {callScript.lines.map((line) => (
                  <p key={line} className="text-xs leading-5">
                    {line}
                  </p>
                ))}
                <p className="text-[11px] leading-5 text-muted-foreground">
                  {callScript.confirmationPrompt}
                </p>
                <p className="flex items-center gap-1.5 pt-1 text-[10px] text-muted-foreground">
                  <Phone className="size-3" />
                  Spoken in {callScript.spokenLanguage}
                  {callScript.fallback ? " · English fallback" : ""}
                </p>
              </div>
            )}
            <p className="mt-3 text-[11px] leading-5 text-muted-foreground/80">
              Your parent answers on their phone. Nothing to install, open or
              tap.
            </p>
          </div>

          <div className="mt-10">
            <h2 className="text-sm">Care circle</h2>
            <dl className="mt-4 border-t border-border">
              <ContactRow
                label="You · primary guardian"
                name={senior.emergency.primaryName}
                detail={`${senior.emergency.primaryRelation} · ${formatPhone(
                  senior.emergency.primaryPhone,
                )}`}
              />
              <ContactRow
                label="Local contact · tier A"
                name={senior.emergency.secondaryName || "Not set"}
                detail={
                  senior.emergency.secondaryName
                    ? `${senior.emergency.secondaryRelation} · ${formatPhone(
                        senior.emergency.secondaryPhone,
                      )}`
                    : "Add a neighbour or relative"
                }
              />
              <ContactRow
                label="Ambulance · tier B"
                name={
                  senior.emergency.hospital || "Hospital not set"
                }
                detail={`${senior.emergency.ambulance || "108"} · ${
                  senior.emergency.hospitalPhone || "no direct line"
                }`}
              />
            </dl>
            <p className="mt-4 text-[11px] leading-5 text-muted-foreground/80">
              {senior.emergency.address || "No home address on file."}
            </p>
          </div>

          <EscalationPanel seniorId={senior._id} />
        </aside>
      </div>

      <section className="mt-14 grid gap-10 border-t border-border pt-10 lg:grid-cols-3 lg:gap-0">
        <div className="lg:pr-10">
          <h2 className="text-sm">Medical profile</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {senior.conditions.length ? (
              senior.conditions.map((condition) => (
                <span
                  key={condition}
                  className="border border-border px-2.5 py-1 text-[11px] text-muted-foreground"
                >
                  {condition}
                </span>
              ))
            ) : (
              <span className="text-xs text-muted-foreground">
                No chronic conditions recorded
              </span>
            )}
          </div>
          {senior.medicalNotes && (
            <p className="mt-4 text-xs leading-5 text-muted-foreground">
              {senior.medicalNotes}
            </p>
          )}
          <div className="mt-6">
            <p className="label-eyebrow">Records</p>
            {senior.documents.length ? (
              <ul className="mt-2">
                {senior.documents.map((doc) => (
                  <li
                    key={`${doc.name}-${doc.uploadedAt}`}
                    className="flex items-center gap-2 border-b border-border py-2 text-xs text-muted-foreground last:border-b-0"
                  >
                    <FileText className="size-3.5 shrink-0" />
                    <span className="truncate">{doc.name}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">
                No documents uploaded.
              </p>
            )}
          </div>
        </div>

        <div className="lg:border-l lg:border-border lg:px-10">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-3.5 text-[var(--chart-1)]" />
            <h2 className="text-sm">Safety guardrails</h2>
          </div>
          <ul className="mt-4 space-y-3 border-t border-border pt-4">
            {senior.safetyFlags.map((flag) => (
              <li
                key={flag}
                className="flex items-start gap-2.5 text-xs leading-5 text-muted-foreground"
              >
                <span
                  className="mt-1.5 size-1 shrink-0 rounded-full bg-foreground/40"
                  aria-hidden
                />
                {flag}
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:border-l lg:border-border lg:pl-10">
          <div className="flex items-center gap-2">
            <Sparkles className="size-3.5 text-[var(--chart-1)]" />
            <h2 className="text-sm">What the call covers</h2>
          </div>
          <ul className="mt-4 border-t border-border pt-4 text-xs leading-6 text-muted-foreground">
            <li>Confirmed dose, logged against the prescription.</li>
            <li>Open questions — before or after food, side effects, pain.</li>
            <li>Colour, shape and the exact place the strip is kept.</li>
            <li>Anything worrying is summarised to you after the call.</li>
          </ul>
          <p className="mt-5 text-[11px] leading-5 text-muted-foreground/80">
            Escalation is configured and ready. Stage 1 retry, Stage 2 alert to
            you, Stage 3 neighbourhood and ambulance routing.
          </p>
          <p className="mt-4 border-t border-border pt-4 text-[11px] leading-5 text-muted-foreground">
            CareCall is free for every family — no fee, no card, no subscription,
            and no paid tier for better care.
          </p>
        </div>
      </section>
    </main>
  );
}

function Stat({
  label,
  value,
  unit,
  hint,
  icon,
  className,
}: {
  label: string;
  value: string;
  unit: string;
  hint: string;
  icon: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-r border-border px-1 py-6 last:border-r-0 sm:px-6",
        className,
      )}
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <p className="text-[10px] tracking-[0.12em] uppercase">{label}</p>
      </div>
      <p className="mt-3 flex items-baseline gap-1.5">
        <span className="font-display text-3xl leading-none tabular-nums">
          {value}
        </span>
        <span className="text-[11px] text-muted-foreground">{unit}</span>
      </p>
      <p className="mt-2 text-[11px] leading-4 text-muted-foreground">{hint}</p>
    </div>
  );
}

function ContactRow({
  label,
  name,
  detail,
}: {
  label: string;
  name: string;
  detail: string;
}) {
  return (
    <div className="border-b border-border py-3.5">
      <dt className="text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="mt-1 text-sm">{name}</dd>
      <dd className="mt-0.5 text-[11px] text-muted-foreground">{detail}</dd>
    </div>
  );
}
