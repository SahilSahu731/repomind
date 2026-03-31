"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { FormEvent, useState } from "react";
import { signupSchema } from "@/lib/validations/auth";

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
      callbackUrl: "/",
    });

    setIsSubmitting(false);

    if (!loginResult || loginResult.error) {
      router.push("/login");
      return;
    }

    router.push(loginResult.url ?? "/");
    router.refresh();
  }

  async function signupWithGithub() {
    setErrorMessage(null);
    setIsSubmitting(true);
    await signIn("github", { callbackUrl: "/" });
  }

  return (
    <main className="relative min-h-screen bg-[linear-gradient(160deg,#fffdf8_0%,#fff5e9_45%,#fffefc_100%)] px-6 py-12 sm:px-10 lg:px-16">
      <div className="mx-auto grid w-full max-w-[1080px] gap-10 rounded-3xl border border-[#ead8c1] bg-white/85 p-6 shadow-[0_30px_100px_-50px_rgba(32,19,8,0.45)] sm:p-8 lg:grid-cols-[1.1fr_0.9fr] lg:p-10">
        <section className="rounded-2xl border border-[#f0e2d2] bg-[#fffdf9] p-6 sm:p-8">
          <p className="text-xs font-medium uppercase tracking-[0.1em] text-[#876f55]">
            Get Started
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#231c15] sm:text-4xl">
            Create your RepoMind account
          </h1>
          <p className="mt-3 max-w-[42ch] text-sm leading-7 text-[#66584a]">
            Create your account in seconds and start analyzing repositories with
            segmented architecture insights.
          </p>

          <form className="mt-8 space-y-5" onSubmit={onSubmit}>
            <label className="block">
              <span className="text-sm font-medium text-[#3b2f23]">Full Name</span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2 w-full rounded-xl border border-[#dccab3] bg-white px-4 py-3 text-sm text-[#231c15] outline-none transition focus:border-[#9f7c55] focus:ring-2 focus:ring-[#e7d6c3]"
                placeholder="Jane Doe"
              />
            </label>

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
                placeholder="At least 8 chars, with A-z and number"
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
              {isSubmitting ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#e6d7c5]" />
            <span className="text-xs uppercase tracking-[0.08em] text-[#8b7b69]">or</span>
            <div className="h-px flex-1 bg-[#e6d7c5]" />
          </div>

          <button
            type="button"
            onClick={signupWithGithub}
            disabled={isSubmitting}
            className="inline-flex h-12 w-full items-center justify-center rounded-full border border-[#d7c2a8] bg-white px-6 text-sm font-medium text-[#2a2118] transition hover:bg-[#fffaf2] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Continue with GitHub
          </button>

          <p className="mt-6 text-sm text-[#66584a]">
            Already have an account?{" "}
            <Link className="font-medium text-[#2f2418] underline underline-offset-2" href="/login">
              Sign in
            </Link>
          </p>
        </section>

        <aside className="rounded-2xl border border-[#ebdcc9] bg-[linear-gradient(180deg,#fff8ee_0%,#fffdf9_100%)] p-6 sm:p-8">
          <h2 className="text-lg font-semibold tracking-tight text-[#2a2118]">
            Account security defaults
          </h2>
          <ul className="mt-4 space-y-4 text-sm leading-7 text-[#66584a]">
            <li>Passwords are hashed with bcrypt before storage.</li>
            <li>Email uniqueness is enforced at the database level.</li>
            <li>Session handling is managed by NextAuth with database sessions.</li>
            <li>GitHub OAuth remains available as a one-click alternative.</li>
          </ul>
        </aside>
      </div>
    </main>
  );
}
