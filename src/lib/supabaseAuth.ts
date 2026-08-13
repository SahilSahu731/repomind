import { env } from "@/lib/env";
import {
  localSignInWithPassword,
  localSignUpWithPassword,
} from "@/lib/localAuth";

interface SupabaseAuthUser {
  id: string;
  email?: string;
  email_confirmed_at?: string | null;
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

function getSupabaseAdminAuthConfig(): { url: string; key: string } | null {
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }

  return { url: env.SUPABASE_URL, key: env.SUPABASE_SERVICE_ROLE_KEY };
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

async function createConfirmedSupabaseUser(
  name: string,
  email: string,
  password: string
): Promise<(SupabaseAuthResponse & { requiresEmailConfirmation: false }) | null> {
  const config = getSupabaseAdminAuthConfig();
  if (!config) return null;

  const response = await fetch(`${config.url}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        full_name: name,
      },
    }),
  });

  const payload = (await response.json().catch(() => ({}))) as
    | SupabaseAuthUser
    | SupabaseAuthResponse;

  if (!response.ok) {
    const errorPayload = payload as SupabaseAuthResponse;
    const message =
      errorPayload.error?.message ??
      errorPayload.message ??
      errorPayload.msg ??
      errorPayload.error_description ??
      "Supabase authentication failed";

    if (/already (?:been )?registered|already exists/i.test(message)) {
      const recovered = await recoverUnconfirmedSupabaseUser(
        config,
        name,
        email,
        password
      );
      if (recovered) return recovered;
    }

    return {
      error: { message },
      requiresEmailConfirmation: false,
    };
  }

  const user = "id" in payload ? payload : payload.user;
  return { user, requiresEmailConfirmation: false };
}

async function recoverUnconfirmedSupabaseUser(
  config: { url: string; key: string },
  name: string,
  email: string,
  password: string
): Promise<(SupabaseAuthResponse & { requiresEmailConfirmation: false }) | null> {
  const listResponse = await fetch(`${config.url}/auth/v1/admin/users?page=1&per_page=1000`, {
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
    },
  });

  if (!listResponse.ok) return null;

  const list = (await listResponse.json()) as { users?: SupabaseAuthUser[] };
  const user = list.users?.find(
    (candidate) =>
      candidate.email?.toLowerCase() === email.toLowerCase() &&
      !candidate.email_confirmed_at
  );
  if (!user) return null;

  const updateResponse = await fetch(
    `${config.url}/auth/v1/admin/users/${encodeURIComponent(user.id)}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        apikey: config.key,
        Authorization: `Bearer ${config.key}`,
      },
      body: JSON.stringify({
        password,
        email_confirm: true,
        user_metadata: { name, full_name: name },
      }),
    }
  );

  if (!updateResponse.ok) return null;

  const updated = (await updateResponse.json()) as SupabaseAuthUser | { user?: SupabaseAuthUser };
  return {
    user: "id" in updated ? updated : updated.user,
    requiresEmailConfirmation: false,
  };
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

  const confirmedUser = await createConfirmedSupabaseUser(name, email, password);
  if (confirmedUser) {
    return confirmedUser;
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
