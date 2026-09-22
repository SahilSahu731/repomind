"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  useSearchParams,
} from "next/navigation";

import {
  signIn,
} from "next-auth/react";

import {
  ArrowRight,
  Github,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";

import {
  AuthFrame,
} from "@/components/auth/AuthFrame";

function safeCallbackUrl(
  value: string | null,
): string {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//")
  ) {
    return "/user/dashboard";
  }

  if (
    value === "/" ||
    value.startsWith(
      "/login",
    )
  ) {
    return "/user/dashboard";
  }

  return value;
}

function authErrorMessage(
  error: string | null,
): string | null {
  if (!error) {
    return null;
  }

  if (
    error ===
    "AccessDenied"
  ) {
    return (
      "GitHub authorization was denied. " +
      "RepoMind cannot sign you in without GitHub."
    );
  }

  if (
    error ===
      "OAuthCallback" ||
    error ===
      "Callback"
  ) {
    return (
      "GitHub sign-in could not be completed. " +
      "Check the GitHub App callback URL and try again."
    );
  }

  if (
    error ===
    "OAuthAccountNotLinked"
  ) {
    return (
      "This GitHub account could not be linked " +
      "to the existing account."
    );
  }

  return (
    "Authentication failed. " +
    "Please try Continue with GitHub again."
  );
}

export default function LoginPage() {
  const searchParams =
    useSearchParams();

  const callbackUrl =
    useMemo(
      () =>
        safeCallbackUrl(
          searchParams.get(
            "callbackUrl",
          ),
        ),
      [searchParams],
    );

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    localError,
    setLocalError,
  ] =
    useState<
      string | null
    >(null);

  const error =
    localError ??
    authErrorMessage(
      searchParams.get(
        "error",
      ),
    );

  async function loginWithGitHub() {
    setLocalError(null);

    setIsSubmitting(true);

    try {
      await signIn(
        "github",
        {
          callbackUrl,
        },
      );
    } catch {
      setIsSubmitting(
        false,
      );

      setLocalError(
        "Could not start GitHub sign-in. Please try again.",
      );
    }
  }

  return (
    <AuthFrame
      eyebrow="Developer access"
      title="Continue with GitHub."
      subtitle="One identity for your RepoMind account. Repository access is granted separately through the RepoMind GitHub App."
      visualTitle="Your repositories stay connected to the identity you already use to build them."
    >
      <button
        type="button"
        onClick={
          loginWithGitHub
        }
        disabled={
          isSubmitting
        }
        className="group flex h-13 w-full items-center justify-center gap-3 rounded-full bg-[#292721] px-5 text-sm font-medium text-[#f7f2e7] transition hover:bg-[#d75c3f] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? (
          <LoaderCircle className="h-4.5 w-4.5 animate-spin" />
        ) : (
          <Github className="h-4.5 w-4.5" />
        )}

        {isSubmitting
          ? "Connecting to GitHub"
          : "Continue with GitHub"}

        {!isSubmitting ? (
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        ) : null}
      </button>

      {error ? (
        <div
          role="alert"
          className="mt-4 border-l-2 border-[#a33f2b] bg-[#d75c3f]/10 px-4 py-3 text-sm leading-6 text-[#82331f]"
        >
          {error}
        </div>
      ) : null}

      <div className="mt-6 border-t border-[#292721]/20 pt-5">
        <div className="flex items-start gap-3 text-xs leading-5 text-[#6d675f]">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#667a60]" />

          <p>
            Signing in identifies you.
            RepoMind does not receive
            access to private repositories
            until you explicitly install
            the GitHub App and choose
            repositories.
          </p>
        </div>
      </div>
    </AuthFrame>
  );
}
