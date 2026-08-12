"use client";

import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { FormEvent, useState } from "react";
import { signupSchema } from "@/lib/validations/auth";
import { AuthFrame } from "@/components/auth/AuthFrame";
import { ArrowRight, Eye, EyeOff, Github, LoaderCircle, LockKeyhole, Mail, UserRound } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submittingMethod, setSubmittingMethod] = useState<"github" | "email" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isSubmitting = submittingMethod !== null;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const parsed = signupSchema.safeParse({ name, email, password });
    if (!parsed.success) {
      setErrorMessage(parsed.error.issues[0]?.message ?? "Invalid details");
      return;
    }

    setSubmittingMethod("email");

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const payload = (await response.json().catch(() => null)) as
        | { success: true; data: { user: { id: string; email: string } } }
        | { success: false; error: { code: string; message: string } }
        | null;

      if (!response.ok || !payload?.success) {
        setErrorMessage(
          payload && !payload.success
            ? payload.error.message
            : "Could not create account. Please try again."
        );
        return;
      }

      const loginResult = await signIn("credentials", {
        redirect: false,
        email: parsed.data.email,
        password: parsed.data.password,
        callbackUrl: "/user/dashboard",
      });

      if (!loginResult || loginResult.error) {
        setErrorMessage("Your account was created, but automatic sign-in failed. Please sign in.");
        return;
      }

      router.push(loginResult.url ?? "/user/dashboard");
      router.refresh();
    } catch {
      setErrorMessage("Could not reach the authentication service. Please try again.");
    } finally {
      setSubmittingMethod(null);
    }
  }

  async function signupWithGithub() {
    setErrorMessage(null);
    setSubmittingMethod("github");
    try {
      await signIn("github", { callbackUrl: "/user/dashboard" });
    } catch {
      setSubmittingMethod(null);
      setErrorMessage("Could not start GitHub sign-up. Please try again.");
    }
  }

  return (
    <AuthFrame
      eyebrow="Your first map starts here"
      title="Make complexity legible."
      subtitle="Create your workspace and turn a public repository into architecture, dependencies, and a practical route in."
      visualTitle="The shortest path into unfamiliar code."
      footerLink={{ href: "/login", label: "Sign in", text: "Already have an account?" }}
    >
      <button
        type="button"
        onClick={signupWithGithub}
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

      <div className="my-3.5 flex items-center gap-4 sm:my-4">
        <div className="h-px flex-1 bg-[#292721]/25" />
        <span className="font-mono text-[9px] uppercase tracking-[.16em] text-[#777168]">or use email</span>
        <div className="h-px flex-1 bg-[#292721]/25" />
      </div>

      <form className="space-y-3" onSubmit={onSubmit} noValidate>
        <div>
          <label htmlFor="name" className="mb-1.5 flex items-center gap-2 font-mono text-[9px] font-medium uppercase tracking-[.12em] text-[#5e5952]">
            <UserRound className="h-3.5 w-3.5 text-[#d75c3f]" />
            Full name
          </label>
          <input
            id="name"
            type="text"
            required
            autoComplete="name"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              if (errorMessage) setErrorMessage(null);
            }}
            className="h-11 w-full rounded-xl border border-[#292721]/40 bg-[#f7f2e7]/70 px-4 text-sm text-[#292721] outline-none transition placeholder:text-[#90887c] focus:border-[#292721] focus:bg-[#f7f2e7] focus-visible:ring-2 focus-visible:ring-[#d75c3f]/30 sm:h-12 sm:text-base"
            placeholder="Jane Doe"
          />
        </div>

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
            className="h-11 w-full rounded-xl border border-[#292721]/40 bg-[#f7f2e7]/70 px-4 text-sm text-[#292721] outline-none transition placeholder:text-[#90887c] focus:border-[#292721] focus:bg-[#f7f2e7] focus-visible:ring-2 focus-visible:ring-[#d75c3f]/30 sm:h-12 sm:text-base"
            placeholder="jane@example.com"
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
              autoComplete="new-password"
              aria-describedby="password-requirements"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              className="h-11 w-full rounded-xl border border-[#292721]/40 bg-[#f7f2e7]/70 px-4 pr-13 text-sm text-[#292721] outline-none transition placeholder:text-[#90887c] focus:border-[#292721] focus:bg-[#f7f2e7] focus-visible:ring-2 focus-visible:ring-[#d75c3f]/30 sm:h-12 sm:text-base"
              placeholder="Create a strong password"
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
          <p id="password-requirements" className="mt-1.5 text-[11px] leading-4 text-[#777168]">
            8+ characters with uppercase, lowercase, and a number.
          </p>
        </div>

        {errorMessage && (
          <div role="alert" className="border-l-2 border-[#a33f2b] bg-[#d75c3f]/10 px-4 py-3 text-sm leading-6 text-[#82331f]">
            {errorMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="group flex h-11 w-full items-center justify-center gap-3 rounded-full border border-[#292721] bg-transparent px-5 text-sm font-semibold text-[#292721] transition hover:bg-[#292721] hover:text-[#f7f2e7] disabled:cursor-not-allowed disabled:opacity-60 sm:h-12"
        >
          {submittingMethod === "email" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
          {submittingMethod === "email" ? "Creating workspace" : "Create account with email"}
          {submittingMethod !== "email" ? <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /> : null}
        </button>
      </form>
    </AuthFrame>
  );
}
