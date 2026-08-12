"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { FormEvent, useState } from "react";
import { loginSchema } from "@/lib/validations/auth";
import { AuthFrame } from "@/components/auth/AuthFrame";
import { ArrowRight, Eye, EyeOff, Github, LoaderCircle, LockKeyhole, Mail } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  function getSafeCallbackUrl(value: string | null): string {
    if (!value) {
      return "/user/dashboard";
    }

    if (value.startsWith("/login") || value.startsWith("/signup") || value === "/") {
      return "/user/dashboard";
    }

    return value;
  }

  const [callbackUrl] = useState(() => {
    if (typeof window === "undefined") {
      return "/user/dashboard";
    }

    const params = new URLSearchParams(window.location.search);
    return getSafeCallbackUrl(params.get("callbackUrl"));
  });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submittingMethod, setSubmittingMethod] = useState<"github" | "email" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const authError = searchParams.get("error");
  const isSubmitting = submittingMethod !== null;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setErrorMessage(parsed.error.issues[0]?.message ?? "Invalid credentials");
      return;
    }

    setSubmittingMethod("email");

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: parsed.data.email,
        password: parsed.data.password,
        callbackUrl,
      });

      if (!result || result.error) {
        setErrorMessage("Invalid email or password");
        return;
      }

      router.push(result.url ?? callbackUrl);
      router.refresh();
    } catch {
      setErrorMessage("Could not reach the authentication service. Please try again.");
    } finally {
      setSubmittingMethod(null);
    }
  }

  async function loginWithGithub() {
    setErrorMessage(null);
    setSubmittingMethod("github");
    try {
      await signIn("github", { callbackUrl });
    } catch {
      setSubmittingMethod(null);
      setErrorMessage("Could not start GitHub sign-in. Please try again.");
    }
  }

  return (
    <AuthFrame
      eyebrow="Continue your analysis"
      title="Welcome back."
      subtitle="Return to the maps, findings, and onboarding context you have already built."
      visualTitle="Every repository becomes easier to enter."
      footerLink={{ href: "/signup", label: "Create one", text: "Don’t have an account?" }}
    >
      <button
        type="button"
        onClick={loginWithGithub}
        disabled={isSubmitting}
        className="group flex h-12 w-full items-center justify-center gap-3 rounded-full bg-[#292721] px-5 text-sm font-medium text-[#f7f2e7] transition hover:bg-[#d75c3f] disabled:cursor-not-allowed disabled:opacity-60 sm:h-13"
      >
        {submittingMethod === "github" ? (
          <LoaderCircle className="h-4.5 w-4.5 animate-spin" />
        ) : (
          <Github className="h-4.5 w-4.5" />
        )}
        {submittingMethod === "github" ? "Connecting to GitHub" : "Continue with GitHub"}
        {submittingMethod !== "github" ? (
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        ) : null}
      </button>

      <div className="my-4 flex items-center gap-4">
        <div className="h-px flex-1 bg-[#292721]/25" />
        <span className="font-mono text-[9px] uppercase tracking-[.16em] text-[#777168]">or use email</span>
        <div className="h-px flex-1 bg-[#292721]/25" />
      </div>

      <form className="space-y-3.5" onSubmit={onSubmit} noValidate>
        <div>
          <label htmlFor="email" className="mb-1.5 flex items-center gap-2 font-mono text-[9px] font-medium uppercase tracking-[.12em] text-[#5e5952]">
            <Mail className="h-3.5 w-3.5 text-[#d75c3f]" />
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (errorMessage) setErrorMessage(null);
            }}
            className="h-12 w-full rounded-xl border border-[#292721]/40 bg-[#f7f2e7]/70 px-4 text-sm text-[#292721] outline-none transition placeholder:text-[#90887c] focus:border-[#292721] focus:bg-[#f7f2e7] focus-visible:ring-2 focus-visible:ring-[#d75c3f]/30 sm:h-13 sm:text-base"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 flex items-center gap-2 font-mono text-[9px] font-medium uppercase tracking-[.12em] text-[#5e5952]">
            <LockKeyhole className="h-3.5 w-3.5 text-[#d75c3f]" />
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              className="h-12 w-full rounded-xl border border-[#292721]/40 bg-[#f7f2e7]/70 px-4 pr-13 text-sm text-[#292721] outline-none transition placeholder:text-[#90887c] focus:border-[#292721] focus:bg-[#f7f2e7] focus-visible:ring-2 focus-visible:ring-[#d75c3f]/30 sm:h-13 sm:text-base"
              placeholder="Your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full text-[#6d675f] transition hover:bg-[#e9e1d2] hover:text-[#292721]"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {errorMessage && (
          <div role="alert" className="border-l-2 border-[#a33f2b] bg-[#d75c3f]/10 px-4 py-3 text-sm leading-6 text-[#82331f]">
            {errorMessage}
          </div>
        )}

        {authError === "Callback" && !errorMessage && (
          <div role="alert" className="border-l-2 border-[#a33f2b] bg-[#d75c3f]/10 px-4 py-3 text-sm leading-6 text-[#82331f]">
            GitHub sign-in could not be completed. Please try again or use your email.
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="group flex h-12 w-full items-center justify-center gap-3 rounded-full border border-[#292721] bg-transparent px-5 text-sm font-semibold text-[#292721] transition hover:bg-[#292721] hover:text-[#f7f2e7] disabled:cursor-not-allowed disabled:opacity-60 sm:h-13"
        >
          {submittingMethod === "email" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
          {submittingMethod === "email" ? "Signing in" : "Sign in with email"}
          {submittingMethod !== "email" ? <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /> : null}
        </button>
      </form>
    </AuthFrame>
  );
}
