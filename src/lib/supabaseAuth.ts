import { env } from "@/lib/env";
import {
  localSignInWithPassword,
  localSignUpWithPassword,
} from "@/lib/localAuth";

interface SupabaseAuthUser {
  id: string;
  email?: string;
  user_metadata?: {
    name?: string;
    full_name?: string;
    avatar_url?: string;
    user_name?: string;
  };
}

interface SupabaseAuthResponse {
  user?: SupabaseAuthUser;
  access_token?: string;
  error?: {
    message?: string;
  };
  error_description?: string;
  message?: string;
  msg?: string;
}

function getSupabaseAuthConfig(): { url: string; key: string } {
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Supabase auth is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY.");
  }

  return { url, key };
}

function hasConfiguredSupabaseAuth(): boolean {
  try {
    const hostname = new URL(env.SUPABASE_URL).hostname;
    const normalizedKey = env.SUPABASE_ANON_KEY.toLowerCase();

    return (
      hostname !== "example.supabase.co" &&
      !hostname.startsWith("your-") &&
      !normalizedKey.includes("placeholder") &&
      !normalizedKey.startsWith("your_")
    );
  } catch {
    return false;
  }
}

function canUseLocalAuth(): boolean {
  return env.NODE_ENV !== "production" && !hasConfiguredSupabaseAuth();
}

async function callSupabaseAuth(
  path: string,
  body: Record<string, unknown>
): Promise<SupabaseAuthResponse> {
  const { url, key } = getSupabaseAuthConfig();

  const response = await fetch(`${url}/auth/v1/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  });

  const payload = (await response.json().catch(() => ({}))) as SupabaseAuthResponse;

  if (!response.ok) {
    return {
      error: {
        message:
          payload.error?.message ??
          payload.message ??
          payload.msg ??
          payload.error_description ??
          "Supabase authentication failed",
      },
    };
  }

  return payload;
}

export async function supabaseSignInWithPassword(email: string, password: string) {
  if (canUseLocalAuth()) {
    return localSignInWithPassword(email, password);
  }

  return callSupabaseAuth("token?grant_type=password", {
    email,
    password,
  });
}

export async function supabaseSignUpWithPassword(
  name: string,
  email: string,
  password: string
) {
  if (canUseLocalAuth()) {
    return {
      ...(await localSignUpWithPassword(name, email, password)),
      requiresEmailConfirmation: false,
    };
  }

  const result = await callSupabaseAuth("signup", {
    email,
    password,
    data: {
      name,
      full_name: name,
    },
  });

  return {
    ...result,
    requiresEmailConfirmation: Boolean(result.user?.id && !result.access_token),
  };
}
