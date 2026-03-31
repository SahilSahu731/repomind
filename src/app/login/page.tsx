"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { FormEvent, useState } from "react";
import { loginSchema } from "@/lib/validations/auth";

export default function LoginPage() {
  const router = useRouter();
  const [callbackUrl] = useState(() => {
    if (typeof window === "undefined") {
      return "/";
    }

    const params = new URLSearchParams(window.location.search);
    return params.get("callbackUrl") ?? "/";
  });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
    <main className="relative min-h-screen bg-[linear-gradient(165deg,#fffdf8_0%,#fff8ed_48%,#fffefb_100%)] px-6 py-12 sm:px-10 lg:px-16">
      <div className="mx-auto grid w-full max-w-[1080px] gap-10 rounded-3xl border border-[#ead8c1] bg-white/85 p-6 shadow-[0_30px_100px_-50px_rgba(32,19,8,0.45)] sm:p-8 lg:grid-cols-[1.1fr_0.9fr] lg:p-10">
        <section className="rounded-2xl border border-[#f0e2d2] bg-[#fffdf9] p-6 sm:p-8">
          <p className="text-xs font-medium uppercase tracking-[0.1em] text-[#876f55]">
            Welcome Back
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#231c15] sm:text-4xl">
            Sign in to RepoMind
          </h1>
          <p className="mt-3 max-w-[42ch] text-sm leading-7 text-[#66584a]">
            Continue where you left off and analyze repositories with architecture maps,
            dependency graphs, and onboarding guides.
          </p>

          <form className="mt-8 space-y-5" onSubmit={onSubmit}>
            <label className="block">
              <span className="text-sm font-medium text-[#3b2f23]">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-xl border border-[#dccab3] bg-white px-4 py-3 text-sm text-[#231c15] outline-none transition focus:border-[#9f7c55] focus:ring-2 focus:ring-[#e7d6c3]"
                placeholder="you@example.com"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-[#3b2f23]">Password</span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 w-full rounded-xl border border-[#dccab3] bg-white px-4 py-3 text-sm text-[#231c15] outline-none transition focus:border-[#9f7c55] focus:ring-2 focus:ring-[#e7d6c3]"
                placeholder="Your password"
              />
            </label>

            {errorMessage ? (
              <p className="rounded-lg border border-[#efc7c0] bg-[#fff3f1] px-3 py-2 text-sm text-[#7b3026]">
                {errorMessage}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[#1f1a15] px-6 text-sm font-medium text-[#f8efe5] transition hover:bg-[#16110c] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#e6d7c5]" />
            <span className="text-xs uppercase tracking-[0.08em] text-[#8b7b69]">or</span>
            <div className="h-px flex-1 bg-[#e6d7c5]" />
          </div>

          <button
            type="button"
            onClick={loginWithGithub}
            disabled={isSubmitting}
            className="inline-flex h-12 w-full items-center justify-center rounded-full border border-[#d7c2a8] bg-white px-6 text-sm font-medium text-[#2a2118] transition hover:bg-[#fffaf2] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Continue with GitHub
          </button>

          <p className="mt-6 text-sm text-[#66584a]">
            New to RepoMind?{" "}
            <Link className="font-medium text-[#2f2418] underline underline-offset-2" href="/signup">
              Create an account
            </Link>
          </p>
        </section>

        <aside className="rounded-2xl border border-[#ebdcc9] bg-[linear-gradient(180deg,#fff8ee_0%,#fffdf9_100%)] p-6 sm:p-8">
          <h2 className="text-lg font-semibold tracking-tight text-[#2a2118]">
            Why teams use RepoMind
          </h2>
          <ul className="mt-4 space-y-4 text-sm leading-7 text-[#66584a]">
            <li>Architecture summaries grounded in repository structure.</li>
            <li>Dependency map to spot hotspots before making changes.</li>
            <li>Instant onboarding path for new contributors.</li>
            <li>Share analysis links for aligned technical discussions.</li>
          </ul>
        </aside>
      </div>
    </main>
  );
}
