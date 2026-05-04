"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { FormEvent, useState } from "react";
import { loginSchema } from "@/lib/validations/auth";
import { AuthFrame } from "@/components/auth/AuthFrame";

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const authError = searchParams.get("error");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setErrorMessage(parsed.error.issues[0]?.message ?? "Invalid credentials");
      return;
    }

    setIsSubmitting(true);

    const result = await signIn("credentials", {
      redirect: false,
      email: parsed.data.email,
      password: parsed.data.password,
      callbackUrl,
    });

    setIsSubmitting(false);

    if (!result || result.error) {
      setErrorMessage("Invalid email or password");
      return;
    }

    router.push(result.url ?? callbackUrl);
    router.refresh();
  }

  async function loginWithGithub() {
    setErrorMessage(null);
    setIsSubmitting(true);
    await signIn("github", { callbackUrl });
  }

  return (
    <AuthFrame
      title="Welcome back"
      subtitle="Sign in to continue with your repository workspace."
      footerLink={{ href: "/signup", label: "Sign up", text: "Don’t have an account?" }}
    >
      <form className="space-y-5" onSubmit={onSubmit}>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-foreground">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-foreground"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-foreground">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-foreground"
            placeholder="Your password"
          />
        </div>

        {errorMessage && (
          <div className="rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm text-foreground">
            {errorMessage}
          </div>
        )}

        {authError === "Callback" && !errorMessage && (
          <div className="rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm text-foreground">
            OAuth callback failed. Verify NEXTAUTH_URL, NEXTAUTH_SECRET, and GitHub OAuth callback URL configuration.
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl border border-border bg-foreground px-4 py-3 font-semibold text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <div className="my-8 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs uppercase tracking-[0.14em] text-muted">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <button
        onClick={loginWithGithub}
        disabled={isSubmitting}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface-2 px-4 py-3 font-medium text-foreground transition hover:bg-surface-3 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.868-.013-1.703-2.782.603-3.369-1.343-3.369-1.343-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.544 2.914 1.19.092-.926.35-1.557.636-1.914-2.22-.253-4.555-1.113-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0110 4.817a9.6 9.6 0 012.502.075c1.908-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C17.138 18.194 20 14.44 20 10.017 20 4.484 15.522 0 10 0z"
            clipRule="evenodd"
          />
        </svg>
        Continue with GitHub
      </button>
    </AuthFrame>
  );
}
