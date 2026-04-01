import { env } from "@/lib/env";

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
  error?: {
    message?: string;
  };
}

function getSupabaseAuthConfig(): { url: string; key: string } {
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Supabase auth is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY.");
  }

  return { url, key };
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
        message: payload.error?.message ?? "Supabase authentication failed",
      },
    };
  }

  return payload;
}

export async function supabaseSignInWithPassword(email: string, password: string) {
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
  return callSupabaseAuth("signup", {
    email,
    password,
    data: {
      name,
      full_name: name,
    },
  });
}
