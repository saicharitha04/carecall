import { CareFooter, CareHeader } from "@/components/CareHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { formatPrice, relativeTime } from "@/lib/care";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, ArrowRight, Loader2, MessageSquare } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router";
import { toast } from "sonner";

export default function ProgramDetail() {
  const { slug = "" } = useParams();
  const { isAuthenticated, user } = useAuth();
  const plan = useQuery(api.catalog.getBySlug, { slug });
  const comments = useQuery(
    api.catalog.listComments,
    plan ? { planId: plan._id } : "skip",
  );
  const addComment = useMutation(api.catalog.addComment);

  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayName =
    name || user?.name || user?.email?.split("@")[0] || "";
  const returnTo = encodeURIComponent(`/catalog/${slug}`);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!plan) return;
    setPosting(true);
    setError(null);
    try {
      await addComment({
        planId: plan._id,
        authorName: displayName,
        body,
      });
      setBody("");
      toast.success("Comment posted");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not post that comment.",
      );
    } finally {
      setPosting(false);
    }
  }

  if (plan === null) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <CareHeader active="programs" />
        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 py-24">
          <p className="label-eyebrow">404 / program</p>
          <h1 className="mt-4 max-w-xl text-4xl font-medium tracking-[-0.03em]">
            This program is not published.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">
            It may have been retired by the operator, or the link may have
            changed. The rest of the catalog is still open.
          </p>
          <Button asChild variant="outline" className="mt-8 w-fit rounded-md">
            <Link to="/catalog">
              <ArrowLeft className="size-4" />
              All programs
            </Link>
          </Button>
        </main>
        <CareFooter />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <CareHeader active="programs" />

      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-6 pt-8">
          <Link
            to="/catalog"
            className="inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.1em] text-muted-foreground uppercase transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3" />
            All programs
          </Link>
        </div>

        {plan === undefined ? (
          <div className="mx-auto max-w-6xl px-6 py-16">
            <div className="h-2.5 w-24 animate-pulse bg-muted" />
            <div className="mt-6 h-10 w-2/3 max-w-lg animate-pulse bg-muted" />
            <div className="mt-4 h-3 w-full max-w-md animate-pulse bg-muted" />
            <div className="mt-12 h-40 animate-pulse border border-border bg-secondary/20" />
          </div>
        ) : (
          <section className="mx-auto max-w-6xl px-6 pt-8 pb-16">
            <div className="grid gap-12 lg:grid-cols-[1.55fr_1fr] lg:gap-0">
              <div className="min-w-0 lg:pr-14">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="border border-border px-2 py-0.5 font-mono text-[9px] tracking-[0.12em] text-muted-foreground uppercase">
                    {plan.category}
                  </span>
                  <span className="font-mono text-[9px] tracking-[0.12em] text-muted-foreground uppercase">
                    published
                  </span>
                </div>
                <h1 className="mt-5 text-[clamp(2.1rem,4.4vw,3.25rem)] leading-[1.02] font-medium tracking-[-0.035em]">
                  {plan.name}
                </h1>
                <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
                  {plan.tagline}
                </p>
                <p className="mt-7 max-w-2xl text-sm leading-7">
                  {plan.summary}
                </p>

                <div className="mt-12">
                  <div className="flex items-baseline justify-between">
                    <h2 className="label-eyebrow">Included</h2>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {plan.features.length} items
                    </span>
                  </div>
                  <ul className="mt-4 border-t border-border">
                    {plan.features.map((feature, index) => (
                      <li
                        key={feature}
                        className="flex items-start gap-4 border-b border-border py-4"
                      >
                        <span className="w-5 shrink-0 pt-0.5 font-mono text-[10px] text-muted-foreground tabular-nums">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="text-sm leading-6">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-12">
                  <h2 className="label-eyebrow">Specification</h2>
                  <dl className="mt-4 border-t border-border">
                    {plan.specs.map((spec) => (
                      <div
                        key={spec.label}
                        className="flex items-baseline justify-between gap-8 border-b border-border py-3.5"
                      >
                        <dt className="text-xs text-muted-foreground">
                          {spec.label}
                        </dt>
                        <dd className="spec-value text-right text-[11px]">
                          {spec.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>

                <div className="mt-14">
                  <div className="flex items-baseline justify-between">
                    <h2 className="text-sm font-medium">Conversation</h2>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {comments === undefined
                        ? "—"
                        : `${comments.length} comment${comments.length === 1 ? "" : "s"}`}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    Questions from families, answers from the operator. Keep
                    medical details out of the thread.
                  </p>

                  {isAuthenticated ? (
                    <form
                      onSubmit={handleSubmit}
                      className="mt-5 border border-border p-5"
                    >
                      <label
                        htmlFor="comment-name"
                        className="label-eyebrow block"
                      >
                        Name
                      </label>
                      <Input
                        id="comment-name"
                        value={displayName}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="Your name"
                        maxLength={60}
                        className="mt-2 h-9 rounded-none border-0 border-b border-input bg-transparent px-0 text-sm shadow-none focus-visible:border-foreground focus-visible:ring-0"
                      />
                      <label
                        htmlFor="comment-body"
                        className="label-eyebrow mt-5 block"
                      >
                        Comment
                      </label>
                      <Textarea
                        id="comment-body"
                        value={body}
                        onChange={(event) => setBody(event.target.value)}
                        placeholder="Ask about eligibility, timings, or how the calls work."
                        maxLength={800}
                        className="mt-2 min-h-24 rounded-none border-border bg-transparent text-sm shadow-none focus-visible:border-foreground focus-visible:ring-0"
                      />
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                        <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
                          {body.length} / 800
                        </span>
                        <Button
                          type="submit"
                          size="sm"
                          disabled={posting || body.trim().length < 3}
                          className="rounded-md"
                        >
                          {posting ? (
                            <>
                              <Loader2 className="size-3.5 animate-spin" />
                              Posting
                            </>
                          ) : (
                            <>
                              Post comment
                              <ArrowRight className="size-3.5" />
                            </>
                          )}
                        </Button>
                      </div>
                      {error && (
                        <p className="mt-3 text-xs leading-5 text-destructive">
                          {error}
                        </p>
                      )}
                    </form>
                  ) : (
                    <div className="mt-5 flex flex-col gap-3 border border-border p-5 sm:flex-row sm:items-center sm:justify-between">
                      <p className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MessageSquare className="size-3.5" />
                        Sign in to join the conversation.
                      </p>
                      <Button asChild size="sm" variant="outline" className="rounded-md">
                        <Link to={`/auth?returnTo=${returnTo}`}>Sign in</Link>
                      </Button>
                    </div>
                  )}

                  {comments === undefined ? (
                    <div className="mt-6 space-y-4">
                      <div className="h-3 w-1/3 animate-pulse bg-muted" />
                      <div className="h-3 w-2/3 animate-pulse bg-muted" />
                    </div>
                  ) : comments.length === 0 ? (
                    <p className="mt-6 border-t border-border pt-6 text-xs text-muted-foreground">
                      No comments yet. Ask the first question.
                    </p>
                  ) : (
                    <div className="mt-6 border-t border-border">
                      {comments.map((comment) => (
                        <article
                          key={comment._id}
                          className="border-b border-border py-5"
                        >
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <p className="text-xs font-medium">
                              {comment.authorName}
                            </p>
                            <p className="font-mono text-[10px] text-muted-foreground">
                              {relativeTime(comment.createdAt)}
                            </p>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-muted-foreground">
                            {comment.body}
                          </p>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <aside className="min-w-0">
                <div className="lg:sticky lg:top-24">
                  <div className="border border-border p-6">
                    <p className="label-eyebrow">Program fee</p>
                    <p className="mt-3 font-mono text-4xl leading-none tracking-tight">
                      {formatPrice(plan.price)}
                    </p>
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      {plan.unit}
                    </p>
                    <Button asChild className="mt-6 w-full rounded-md">
                      <Link to="/auth?returnTo=%2Fonboarding">
                        Enrol a parent
                        <ArrowRight className="size-4" />
                      </Link>
                    </Button>
                    <p className="mt-3 text-[11px] leading-5 text-muted-foreground">
                      Billed monthly from the family workspace. Change or cancel
                      a program at any time.
                    </p>
                  </div>

                  <dl className="mt-8 border-t border-border">
                    <div className="flex items-baseline justify-between gap-6 border-b border-border py-3">
                      <dt className="text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
                        Program ID
                      </dt>
                      <dd className="spec-value text-[11px]">{plan.slug}</dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-6 border-b border-border py-3">
                      <dt className="text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
                        Category
                      </dt>
                      <dd className="text-[11px]">{plan.category}</dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-6 border-b border-border py-3">
                      <dt className="text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
                        Languages
                      </dt>
                      <dd className="spec-value text-[11px]">
                        {plan.languages.length}
                      </dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-6 border-b border-border py-3">
                      <dt className="text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
                        Updated
                      </dt>
                      <dd className="spec-value text-[11px]">
                        {relativeTime(plan.updatedAt)}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-6">
                    <p className="label-eyebrow">Languages</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {plan.languages.map((language) => (
                        <span
                          key={language}
                          className="border border-border px-2 py-0.5 font-mono text-[10px] text-muted-foreground"
                        >
                          {language}
                        </span>
                      ))}
                    </div>
                  </div>

                  <p className="mt-8 border-t border-border pt-5 text-[11px] leading-5 text-muted-foreground">
                    Operated by your care provider on Carecall.{" "}
                    <Link
                      to="/admin"
                      className="underline underline-offset-4 hover:text-foreground"
                    >
                      Operator console
                    </Link>
                  </p>
                </div>
              </aside>
            </div>
          </section>
        )}
      </main>

      <CareFooter />
    </div>
  );
}
