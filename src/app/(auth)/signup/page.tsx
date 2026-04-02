"use client";

import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { FormEvent, useState } from "react";
import { signupSchema } from "@/lib/validations/auth";
import { AuthFrame } from "@/components/auth/AuthFrame";

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const parsed = signupSchema.safeParse({ name, email, password });
    if (!parsed.success) {
      setErrorMessage(parsed.error.issues[0]?.message ?? "Invalid details");
      return;
    }

    setIsSubmitting(true);

    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });

    const payload = (await response.json()) as
      | { success: true; data: { user: { id: string; email: string } } }
      | { success: false; error: { code: string; message: string } };

    if (!response.ok || !payload.success) {
      setIsSubmitting(false);
      setErrorMessage(
        payload.success ? "Could not create account" : payload.error.message
      );
      return;
    }

    const loginResult = await signIn("credentials", {
      redirect: false,
      email: parsed.data.email,
      password: parsed.data.password,
      callbackUrl: "/user/dashboard",
    });

    setIsSubmitting(false);

    if (!loginResult || loginResult.error) {
      router.push("/login");
      return;
    }

    router.push(loginResult.url ?? "/user/dashboard");
    router.refresh();
  }

  async function signupWithGithub() {
    setErrorMessage(null);
    setIsSubmitting(true);
    await signIn("github", { callbackUrl: "/user/dashboard" });
  }

  return (
    <AuthFrame
      title="Create account"
      subtitle="Join RepoMind and get your first repository preview into the workspace faster."
      footerLink={{ href: "/login", label: "Sign in", text: "Already have an account?" }}
    >
      <form className="space-y-5" onSubmit={onSubmit}>
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-foreground">
            Full name
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-2 w-full rounded-2xl border border-border bg-surface-2 px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-primary"
            placeholder="Jane Doe"
          />
        </div>

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
            className="mt-2 w-full rounded-2xl border border-border bg-surface-2 px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-primary"
            placeholder="jane@example.com"
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
            className="mt-2 w-full rounded-2xl border border-border bg-surface-2 px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-primary"
            placeholder="Your password"
          />
        </div>

        {errorMessage && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {errorMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-2xl bg-primary px-4 py-3 font-semibold text-background transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Creating account..." : "Create account"}
        </button>
      </form>

      <div className="my-8 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs uppercase tracking-[0.14em] text-muted">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <button
        onClick={signupWithGithub}
        disabled={isSubmitting}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-surface-2 px-4 py-3 font-medium text-foreground transition hover:bg-surface-3 disabled:cursor-not-allowed disabled:opacity-60"
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
