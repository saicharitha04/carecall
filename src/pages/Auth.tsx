import { FreeBadge } from "@/components/FreeBadge";
import { Wordmark } from "@/components/Wordmark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useAuth } from "@/hooks/use-auth";
import { ArrowRight, Loader2, Mail, ShieldCheck } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";

interface AuthProps {
  redirectAfterAuth?: string;
}

function resolveRedirectAfterAuth(
  returnTo: string | null,
  fallback = "/dashboard",
) {
  if (returnTo?.startsWith("/") && !returnTo.startsWith("//")) {
    return returnTo;
  }
  return fallback;
}

function Auth({ redirectAfterAuth }: AuthProps = {}) {
  const { isLoading: authLoading, isAuthenticated, signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = resolveRedirectAfterAuth(
    searchParams.get("returnTo"),
    redirectAfterAuth,
  );
  const [step, setStep] = useState<"signIn" | { email: string }>("signIn");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(redirect);
    }
  }, [authLoading, isAuthenticated, navigate, redirect]);

  const handleEmailSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);
      setStep({ email: formData.get("email") as string });
      setIsLoading(false);
    } catch (signInError) {
      setError(
        signInError instanceof Error
          ? signInError.message
          : "Failed to send the verification code. Please try again.",
      );
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);
      navigate(redirect);
    } catch {
      setError("That code is not right. Check the email and try again.");
      setIsLoading(false);
      setOtp("");
    }
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signIn("anonymous");
      navigate(redirect);
    } catch (guestError) {
      setError(
        guestError instanceof Error
          ? guestError.message
          : "Could not start a guest session.",
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Wordmark />
          <Link
            to="/"
            className="text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            Back to home
          </Link>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-6xl flex-1 gap-12 px-6 py-14 md:grid-cols-[1fr_400px] md:gap-20 md:py-20">
        <div className="hidden md:block">
          <p className="label-eyebrow">CareCall workspace</p>
          <div className="mt-5">
            <FreeBadge label="100% Free Forever for Every Family" />
          </div>
          <h1 className="mt-6 max-w-md font-display text-[clamp(2.4rem,4.4vw,3.4rem)] leading-[1.04] tracking-[-0.01em]">
            The care plan is yours to hold.
          </h1>
          <p className="mt-6 max-w-sm text-sm leading-7 text-muted-foreground">
            Your account keeps your parent's medical profile, prescription
            schedule and emergency contacts private. One sign-in, one place to
            look — and no payment step at any point.
          </p>
          <div className="mt-10 max-w-sm border-t border-border pt-5">
            <p className="flex items-start gap-3 text-xs leading-6 text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[var(--chart-1)]" />
              Health data stays scoped to your account. Your parent never needs
              to sign in, install or remember anything.
            </p>
            <Link
              to="/catalog"
              className="mt-6 inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.1em] text-muted-foreground uppercase transition-colors hover:text-foreground"
            >
              Browse care programs
              <ArrowRight className="size-3" />
            </Link>
          </div>
        </div>

        <div className="w-full border border-border p-7 sm:p-8">
          {step === "signIn" ? (
            <>
              <p className="label-eyebrow">
                {redirect.includes("onboarding") ? "New care plan" : "Welcome back"}
              </p>
              <h2 className="mt-3 font-display text-3xl leading-tight tracking-tight">
                {redirect.includes("onboarding")
                  ? "Sign in to enrol"
                  : "Sign in"}
              </h2>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                We will email you a six-digit code. No password to remember.
              </p>

              <form onSubmit={handleEmailSubmit} className="mt-7">
                <label className="label-eyebrow block" htmlFor="email">
                  Email address
                </label>
                <div className="mt-2 flex items-center gap-3 border-b border-input focus-within:border-foreground">
                  <Mail className="size-4 shrink-0 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="name@example.com"
                    required
                    disabled={isLoading}
                    className="h-11 rounded-none border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                  />
                </div>
                {error && (
                  <p className="mt-3 text-xs leading-5 text-destructive">
                    {error}
                  </p>
                )}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="mt-6 w-full rounded-full"
                >
                  {isLoading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <>
                      Send code
                      <ArrowRight className="size-4" />
                    </>
                  )}
                </Button>
              </form>

              <div className="my-6 flex items-center gap-3">
                <span className="h-px flex-1 bg-border" />
                <span className="text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
                  Or
                </span>
                <span className="h-px flex-1 bg-border" />
              </div>

              <Button
                type="button"
                variant="outline"
                disabled={isLoading}
                onClick={() => void handleGuestLogin()}
                className="w-full rounded-full"
              >
                Explore as a guest
              </Button>
              <p className="mt-3 text-center text-[11px] leading-5 text-muted-foreground">
                A guest workspace is deleted when the session ends.
              </p>
            </>
          ) : (
            <>
              <p className="label-eyebrow">One-time code</p>
              <h2 className="mt-3 font-display text-3xl leading-tight tracking-tight">
                Check your email
              </h2>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Sent to {step.email}. The code expires in ten minutes.
              </p>

              <form onSubmit={handleOtpSubmit} className="mt-7">
                <input type="hidden" name="email" value={step.email} />
                <input type="hidden" name="code" value={otp} />
                <InputOTP
                  value={otp}
                  onChange={setOtp}
                  maxLength={6}
                  disabled={isLoading}
                  autoFocus
                >
                  <InputOTPGroup className="w-full justify-between gap-1">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <InputOTPSlot
                        key={index}
                        index={index}
                        className="h-12 w-full rounded-none border-border first:rounded-none last:rounded-none"
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>

                {error && (
                  <p className="mt-3 text-xs leading-5 text-destructive">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={isLoading || otp.length !== 6}
                  className="mt-6 w-full rounded-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Verifying
                    </>
                  ) : (
                    <>
                      Verify and continue
                      <ArrowRight className="size-4" />
                    </>
                  )}
                </Button>
              </form>

              <button
                type="button"
                onClick={() => {
                  setStep("signIn");
                  setOtp("");
                  setError(null);
                }}
                disabled={isLoading}
                className="mt-4 w-full text-center text-[11px] text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
              >
                Use a different email
              </button>
            </>
          )}
        </div>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <p className="text-[11px] text-muted-foreground">
            CareCall · free for every family
          </p>
          <p className="text-[11px] text-muted-foreground">
            Secured by freebuff.com
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function AuthPage(props: AuthProps) {
  return (
    <Suspense>
      <Auth {...props} />
    </Suspense>
  );
}
