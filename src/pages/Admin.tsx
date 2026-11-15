import { CareFooter, CareHeader } from "@/components/CareHeader";
import { FreeBadge } from "@/components/FreeBadge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/hooks/use-auth";
import { relativeTime } from "@/lib/care";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowLeft,
  BookOpen,
  ExternalLink,
  Loader2,
  MessageSquare,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

type PlanStatus = "published" | "draft" | "archived";

type AdminProgram = {
  _id: Id<"plans">;
  name: string;
  slug: string;
  tagline: string;
  category: string;
  summary: string;
  status: PlanStatus;
  price: number;
  unit: string;
  languages: string[];
  features: string[];
  specs: { label: string; value: string }[];
  updatedAt: number;
};

const fieldLine =
  "h-10 rounded-none border-0 border-b border-input bg-transparent px-0 text-sm shadow-none placeholder:text-muted-foreground/60 focus-visible:border-foreground focus-visible:ring-0";

export default function Admin() {
  const { user } = useAuth();
  const isOperator = useQuery(api.admin.isOperator);
  const overview = useQuery(api.admin.overview, isOperator ? {} : "skip");
  const claimOperator = useMutation(api.admin.claimOperator);
  const setPlanStatus = useMutation(api.catalog.setPlanStatus);
  const deletePlan = useMutation(api.catalog.deletePlan);
  const deleteComment = useMutation(api.catalog.deleteComment);
  const deleteEnrollment = useMutation(api.admin.deleteEnrollment);

  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdminProgram | null>(null);

  async function handleClaim() {
    setClaiming(true);
    setClaimError(null);
    try {
      await claimOperator();
      toast.success("Admin access granted");
    } catch (error) {
      setClaimError(
        error instanceof Error
          ? error.message
          : "Could not grant admin access.",
      );
    } finally {
      setClaiming(false);
    }
  }

  async function handleStatus(plan: AdminProgram) {
    const next: PlanStatus =
      plan.status === "published" ? "draft" : "published";
    try {
      await setPlanStatus({ id: plan._id, status: next });
      toast.success(
        next === "published"
          ? `${plan.name} is live in the catalog`
          : `${plan.name} moved to draft`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed.");
    }
  }

  async function handleDeletePlan(plan: AdminProgram) {
    if (
      !window.confirm(
        `Delete “${plan.name}”? Its comments are removed as well. This cannot be undone.`,
      )
    )
      return;
    try {
      await deletePlan({ id: plan._id });
      toast.success("Program deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed.");
    }
  }

  async function handleDeleteComment(id: Id<"planComments">) {
    try {
      await deleteComment({ id });
      toast.success("Comment removed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed.");
    }
  }

  async function handleDeleteEnrollment(id: Id<"seniors">, name: string) {
    if (
      !window.confirm(
        `Remove ${name}'s enrolment? Their profile and care plan are deleted.`,
      )
    )
      return;
    try {
      await deleteEnrollment({ id });
      toast.success("Enrolment removed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed.");
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <CareHeader active="operator" />

      {isOperator === undefined ? (
        <main className="flex flex-1 items-center justify-center">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </main>
      ) : !isOperator ? (
        <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-20">
          <p className="label-eyebrow">Admin console · restricted</p>
          <h1 className="mt-4 text-[clamp(2rem,4vw,3rem)] leading-[1.04] font-medium tracking-[-0.035em]">
            Run the catalog your
            <br />
            families see.
          </h1>
          <p className="mt-5 max-w-lg text-sm leading-7 text-muted-foreground">
            Administrators publish free care programs, review every enrolment
            across the community, and moderate the conversation on each program
            page. Access is granted once per deployment.
          </p>

          <div className="mt-10 border border-border p-6">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-[var(--chart-1)]" />
              <p className="text-sm font-medium">Claim admin access</p>
            </div>
            <p className="mt-2 max-w-md text-xs leading-5 text-muted-foreground">
              Available only while this deployment has no administrator, and
              only to a full email account. Once claimed, later accounts cannot
              take the console.
            </p>
            <Button
              type="button"
              onClick={() => void handleClaim()}
              disabled={claiming}
              className="mt-5 rounded-md"
            >
              {claiming ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Claiming
                </>
              ) : (
                "Claim admin access"
              )}
            </Button>
            {claimError && (
              <p className="mt-3 text-xs leading-5 text-destructive">
                {claimError}
              </p>
            )}
            <p className="mt-4 font-mono text-[10px] text-muted-foreground">
              signed in as {user?.email || "anonymous workspace"}
            </p>
          </div>

          <Link
            to="/catalog"
            className="mt-8 inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.1em] text-muted-foreground uppercase hover:text-foreground"
          >
            <ArrowLeft className="size-3" />
            Back to programs
          </Link>
        </main>
      ) : overview === undefined ? (
        <main className="flex flex-1 items-center justify-center">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </main>
      ) : (
        <main className="mx-auto w-full max-w-6xl flex-1 px-6 pb-20">
          <section className="border-b border-border py-10">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div>
                <p className="label-eyebrow">CareCall / admin</p>
                <h1 className="mt-3 text-[clamp(2rem,4vw,2.75rem)] leading-[1.04] font-medium tracking-[-0.035em]">
                  Admin console
                </h1>
                <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
                  Publish free programs, watch enrolments, and moderate the
                  conversation. Every change is attributed to your admin
                  account.
                </p>
                <div className="mt-4">
                  <FreeBadge label="Zero Cost Community Health Initiative" />
                </div>
              </div>
              <div className="flex flex-col items-start gap-2 rounded-xl border border-border bg-card px-3 py-2 sm:items-end">
                <span className="text-[9px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
                  Admin · active
                </span>
                <span className="max-w-[240px] truncate text-[11px]">
                  {user?.email || "anonymous workspace"}
                </span>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-2 border-b border-border lg:grid-cols-4">
            <Stat
              label="Published programs"
              value={`${overview.stats.published}`}
              hint={`${overview.stats.programs} in catalog`}
            />
            <Stat
              label="Enrolments"
              value={`${overview.stats.enrollments}`}
              hint="Seniors under care"
              className="border-r-0 lg:border-r"
            />
            <Stat
              label="Comments"
              value={`${overview.stats.comments}`}
              hint="Across program pages"
            />
            <Stat
              label="Members"
              value={`${overview.stats.members}`}
              hint="Guardian accounts"
              className="border-r-0"
            />
          </section>

          <section className="pt-12">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="label-eyebrow">Catalog</p>
                <h2 className="mt-2 text-lg font-medium tracking-[-0.01em]">
                  Programs
                </h2>
              </div>
              <Button
                type="button"
                size="sm"
                className="rounded-md"
                onClick={() => {
                  setEditing(null);
                  setDialogOpen(true);
                }}
              >
                <Plus className="size-3.5" />
                New program
              </Button>
            </div>

            <div className="mt-5 border-t border-border">
              {overview.programs.length === 0 ? (
                <p className="border-b border-border py-8 text-sm text-muted-foreground">
                  No programs yet. Create the first one — it can stay a draft
                  until you are ready to publish.
                </p>
              ) : (
                overview.programs.map((plan) => (
                  <div
                    key={plan._id}
                    className="flex flex-col gap-4 border-b border-border py-5 sm:grid sm:grid-cols-[1fr_auto] sm:items-start"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium">{plan.name}</p>
                        <span
                          className={cn(
                            "border px-1.5 py-0.5 font-mono text-[9px] tracking-[0.1em] uppercase",
                            plan.status === "published"
                              ? "border-[var(--chart-1)]/40 text-[var(--chart-1)]"
                              : plan.status === "draft"
                                ? "border-border text-muted-foreground"
                                : "border-border text-muted-foreground/60",
                          )}
                        >
                          {plan.status}
                        </span>
                      </div>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        /{plan.slug} · {plan.category} · free to every family
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1">
                      {plan.status === "published" && (
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="rounded-md text-muted-foreground"
                        >
                          <Link to={`/catalog/${plan.slug}`}>
                            <ExternalLink className="size-3.5" />
                            View
                          </Link>
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="rounded-md text-muted-foreground"
                        onClick={() => void handleStatus(plan)}
                      >
                        {plan.status === "published" ? "Unpublish" : "Publish"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="rounded-md text-muted-foreground"
                        onClick={() => {
                          setEditing(plan as AdminProgram);
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil className="size-3.5" />
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="rounded-md text-muted-foreground hover:text-destructive"
                        onClick={() => void handleDeletePlan(plan as AdminProgram)}
                      >
                        <Trash2 className="size-3.5" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="pt-14">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="label-eyebrow">Customers</p>
                <h2 className="mt-2 text-lg font-medium tracking-[-0.01em]">
                  Enrolments
                </h2>
              </div>
              <span className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground">
                <Users className="size-3.5" />
                {overview.enrollments.length} total
              </span>
            </div>

            <div className="mt-5 border-t border-border">
              {overview.enrollments.length === 0 ? (
                <p className="border-b border-border py-8 text-sm text-muted-foreground">
                  No seniors enrolled yet. Enrolments appear here the moment a
                  guardian completes onboarding.
                </p>
              ) : (
                overview.enrollments.map((senior) => (
                  <div
                    key={senior._id}
                    className="flex flex-col gap-2 border-b border-border py-4 sm:grid sm:grid-cols-[1.2fr_1fr_auto] sm:items-center sm:gap-6"
                  >
                    <div>
                      <p className="text-sm">{senior.fullName}</p>
                      <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                        {senior.age} yrs · {senior.language} · {senior.phone}
                      </p>
                    </div>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {senior.guardianEmail || "guardian account removed"}
                    </p>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {relativeTime(senior.createdAt)}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="rounded-md text-muted-foreground hover:text-destructive"
                        onClick={() =>
                          void handleDeleteEnrollment(senior._id, senior.fullName)
                        }
                      >
                        <Trash2 className="size-3.5" />
                        Remove
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="pt-14">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="label-eyebrow">Moderation</p>
                <h2 className="mt-2 text-lg font-medium tracking-[-0.01em]">
                  Recent comments
                </h2>
              </div>
              <span className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground">
                <MessageSquare className="size-3.5" />
                {overview.comments.length} shown
              </span>
            </div>

            <div className="mt-5 border-t border-border">
              {overview.comments.length === 0 ? (
                <p className="border-b border-border py-8 text-sm text-muted-foreground">
                  No comments yet. Families can ask questions from any program
                  detail page.
                </p>
              ) : (
                overview.comments.map((comment) => (
                  <div
                    key={comment._id}
                    className="border-b border-border py-5"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="text-xs">
                        <span className="font-medium">{comment.authorName}</span>
                        <span className="text-muted-foreground">
                          {" "}
                          on {comment.planName}
                        </span>
                      </p>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {relativeTime(comment.createdAt)}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 rounded-md px-2 text-muted-foreground hover:text-destructive"
                          onClick={() => void handleDeleteComment(comment._id)}
                        >
                          <Trash2 className="size-3.5" />
                          Remove
                        </Button>
                      </div>
                    </div>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                      {comment.body}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>
        </main>
      )}

      {dialogOpen && (
        <ProgramDialog
          plan={editing}
          onClose={() => {
            setDialogOpen(false);
            setEditing(null);
          }}
        />
      )}

      <CareFooter />
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: string;
  hint: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-r border-border px-1 py-6 last:border-r-0 sm:px-6",
        className,
      )}
    >
      <p className="font-mono text-[9px] tracking-[0.12em] text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-3 font-mono text-3xl leading-none tabular-nums">
        {value}
      </p>
      <p className="mt-2 text-[11px] leading-4 text-muted-foreground">{hint}</p>
    </div>
  );
}

function ProgramDialog({
  plan,
  onClose,
}: {
  plan: AdminProgram | null;
  onClose: () => void;
}) {
  const upsertPlan = useMutation(api.catalog.upsertPlan);
  const [name, setName] = useState(plan?.name ?? "");
  const [tagline, setTagline] = useState(plan?.tagline ?? "");
  const [category, setCategory] = useState(plan?.category ?? "Medication");
  const [summary, setSummary] = useState(plan?.summary ?? "");
  const [status, setStatus] = useState<PlanStatus>(plan?.status ?? "published");
  const [languages, setLanguages] = useState(
    plan?.languages.join(", ") ?? "English",
  );
  const [features, setFeatures] = useState(plan?.features.join("\n") ?? "");
  const [specs, setSpecs] = useState(
    plan?.specs.map((spec) => `${spec.label}: ${spec.value}`).join("\n") ?? "",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const parsedSpecs = specs
        .split("\n")
        .map((line) => {
          const separator = line.indexOf(":");
          if (separator === -1) return null;
          const label = line.slice(0, separator).trim();
          const value = line.slice(separator + 1).trim();
          return label && value ? { label, value } : null;
        })
        .filter((spec): spec is { label: string; value: string } =>
          Boolean(spec),
        );

      await upsertPlan({
        id: plan?._id,
        name,
        tagline,
        category,
        summary,
        price: 0,
        unit: "Free for every family",
        languages: languages
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        features: features
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean),
        specs: parsedSpecs,
        status,
      });
      toast.success(plan ? "Program updated" : "Program created");
      onClose();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not save the program.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-base font-medium">
            {plan ? "Edit program" : "New program"}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Published programs appear in the free catalog and can be enrolled
            from their detail page. Nothing here carries a price.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-2 space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Name">
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Daily Voice Care"
                className={fieldLine}
                required
              />
            </Field>
            <Field label="Category">
              <Input
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                placeholder="Medication"
                className={fieldLine}
              />
            </Field>
            <Field label="Tagline" className="sm:col-span-2">
              <Input
                value={tagline}
                onChange={(event) => setTagline(event.target.value)}
                placeholder="Scheduled medicine calls in the family's language."
                className={fieldLine}
                required
              />
            </Field>
          </div>

          <Field label="Summary">
            <Textarea
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              placeholder="What the customer receives, and how it works."
              className="min-h-24 rounded-none border-border bg-transparent text-sm shadow-none focus-visible:border-foreground focus-visible:ring-0"
              required
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Status">
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as PlanStatus)}
              >
                <SelectTrigger className="h-10 w-full rounded-none border-0 border-b border-input px-0 shadow-none focus-visible:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <div className="flex items-end pb-2">
              <p className="text-[11px] leading-5 text-muted-foreground">
                Every program is free. There is no price, billing or payment
                field to configure.
              </p>
            </div>
          </div>

          <Field label="Languages" hint="Comma separated.">
            <Input
              value={languages}
              onChange={(event) => setLanguages(event.target.value)}
              placeholder="Telugu, Hindi, English"
              className={fieldLine}
            />
          </Field>

          <Field label="Included" hint="One item per line.">
            <Textarea
              value={features}
              onChange={(event) => setFeatures(event.target.value)}
              placeholder={"Outbound AI calls at each dose time\nVoice or keypad confirmation"}
              className="min-h-24 rounded-none border-border bg-transparent text-sm shadow-none focus-visible:border-foreground focus-visible:ring-0"
            />
          </Field>

          <Field
            label="Specification"
            hint="One per line, formatted as Label: value."
          >
            <Textarea
              value={specs}
              onChange={(event) => setSpecs(event.target.value)}
              placeholder={"Call window: ±10 minutes\nRetry cadence: 10 minutes"}
              className="min-h-20 rounded-none border-border bg-transparent text-sm shadow-none focus-visible:border-foreground focus-visible:ring-0"
            />
          </Field>

          {error && (
            <p className="text-xs leading-5 text-destructive">{error}</p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-md"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="rounded-md"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Saving
                </>
              ) : (
                <>
                  <BookOpen className="size-3.5" />
                  {plan ? "Save changes" : "Create program"}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <span className="label-eyebrow block">{label}</span>
      <div className="mt-2">{children}</div>
      {hint ? (
        <span className="mt-1 block text-[10px] leading-4 text-muted-foreground">
          {hint}
        </span>
      ) : null}
    </div>
  );
}
