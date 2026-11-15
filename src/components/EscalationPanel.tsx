import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { STAGE_TITLES } from "@/convex/lib/escalation";
import { relativeTime } from "@/lib/care";
import { cn } from "@/lib/utils";
import { useAction, useMutation, useQuery } from "convex/react";
import { ArrowUpRight, Loader2, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

/**
 * Operator-facing view of the safety net. The "test escalation" control walks
 * the same engine that a missed dose or a critical reading would trigger, and
 * the log shows exactly which channel reached which number.
 */
export function EscalationPanel({ seniorId }: { seniorId: Id<"seniors"> }) {
  const incidents = useQuery(api.escalations.listRecent, { seniorId });
  const startEscalation = useAction(api.escalations.start);
  const advanceEscalation = useAction(api.escalations.advance);
  const acknowledge = useMutation(api.escalations.acknowledge);
  const resolve = useMutation(api.escalations.resolve);

  const [busy, setBusy] = useState<"start" | "advance" | "close" | null>(null);
  const latest = incidents?.[0];

  async function handleStart() {
    setBusy("start");
    try {
      const result = await startEscalation({
        seniorId,
        kind: "missed_dose",
      });
      if (!result.started) {
        toast.info(result.reason ?? "The escalation was not started.");
      } else {
        toast.success(
          `Stage ${result.stage} dispatched${result.deliveries.some((d) => d.status === "simulated") ? " (simulated)" : ""}`,
        );
        if (result.warnings.length)
          toast.warning(result.warnings.join(" "));
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not start the drill.",
      );
    } finally {
      setBusy(null);
    }
  }

  async function handleAdvance() {
    if (!latest) return;
    setBusy("advance");
    try {
      const result = await advanceEscalation({ escalationId: latest._id });
      if (result.advanced) {
        toast.success(`Stage ${result.stage} dispatched`);
        if (result.warnings.length) toast.warning(result.warnings.join(" "));
      } else {
        toast.info(result.reason ?? "There is no next stage.");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not advance the alert.",
      );
    } finally {
      setBusy(null);
    }
  }

  async function handleClose(kind: "acknowledge" | "resolve") {
    if (!latest) return;
    setBusy("close");
    try {
      if (kind === "acknowledge") await acknowledge({ id: latest._id });
      else await resolve({ id: latest._id });
      toast.success(
        kind === "acknowledge" ? "Alert acknowledged" : "Alert resolved",
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not update the alert.",
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mt-10">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-sm">Safety net</h2>
        <span className="text-[10px] text-muted-foreground">3-stage engine</span>
      </div>

      <div className="mt-4 border-t border-border">
        {incidents === undefined ? (
          <p className="py-4 text-[11px] text-muted-foreground">Loading…</p>
        ) : !latest ? (
          <p className="py-4 text-[11px] leading-5 text-muted-foreground">
            No incidents logged. A missed dose starts at stage 1 and climbs to
            the guardian, then the neighbourhood, if nothing is confirmed.
          </p>
        ) : (
          <div className="py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-medium">
                  Stage {latest.stage} · {STAGE_TITLES[latest.stage as 1 | 2 | 3]}
                </p>
                <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                  {latest.trigger}
                </p>
              </div>
              <span
                className={cn(
                  "shrink-0 rounded-full border px-2 py-0.5 text-[10px]",
                  latest.status === "open" &&
                    "border-primary/40 text-primary",
                  latest.status === "acknowledged" &&
                    "border-[var(--chart-1)]/40 text-[var(--chart-1)]",
                  latest.status === "resolved" &&
                    "border-border text-muted-foreground",
                )}
              >
                {latest.status}
              </span>
            </div>

            <ul className="mt-3 space-y-2">
              {latest.deliveries.map((delivery, index) => (
                <li
                  key={`${delivery.channel}-${delivery.target}-${index}`}
                  className="flex items-center justify-between gap-3 text-[10px]"
                >
                  <span className="truncate text-muted-foreground">
                    {delivery.channel} → {delivery.target}
                  </span>
                  <span
                    className={cn(
                      "shrink-0",
                      delivery.status === "sent"
                        ? "text-[var(--chart-1)]"
                        : delivery.status === "failed"
                          ? "text-destructive"
                          : "text-muted-foreground/70",
                    )}
                  >
                    {delivery.status}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
              {latest.status === "open" && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 rounded-full px-3 text-[10px]"
                    disabled={busy !== null || latest.stage >= 3}
                    onClick={() => void handleAdvance()}
                  >
                    {busy === "advance" ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      <ArrowUpRight className="size-3" />
                    )}
                    Advance
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 rounded-full px-3 text-[10px]"
                    disabled={busy !== null}
                    onClick={() => void handleClose("acknowledge")}
                  >
                    I am on it
                  </Button>
                </>
              )}
              {latest.status === "acknowledged" && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 rounded-full px-3 text-[10px]"
                  disabled={busy !== null}
                  onClick={() => void handleClose("resolve")}
                >
                  Mark resolved
                </Button>
              )}
              <span className="ml-auto text-[10px] text-muted-foreground">
                {relativeTime(latest.createdAt)}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-start gap-2">
        <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-[var(--chart-1)]" />
        <div>
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => void handleStart()}
            className="inline-flex items-center gap-1.5 text-[11px] text-foreground underline-offset-4 hover:underline disabled:opacity-50"
          >
            {busy === "start" && <Loader2 className="size-3 animate-spin" />}
            Test the safety net
          </button>
          <p className="mt-1 text-[10px] leading-4 text-muted-foreground">
            Runs a stage-1 drill against your saved contacts. Unconfigured
            channels are logged as simulated, never claimed as sent.
          </p>
        </div>
      </div>
    </div>
  );
}
