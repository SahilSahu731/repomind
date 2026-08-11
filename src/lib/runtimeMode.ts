import { env } from "@/lib/env";

function isPlaceholder(value: string | undefined): boolean {
  if (!value) {
    return true;
  }

  const normalized = value.trim().toLowerCase();
  return (
    normalized.length === 0 ||
    normalized.includes("placeholder") ||
    normalized.startsWith("your_") ||
    normalized.startsWith("your-")
  );
}

export function hasConfiguredSupabaseDatabase(): boolean {
  const key = env.SUPABASE_SERVICE_ROLE_KEY;

  try {
    const hostname = new URL(env.SUPABASE_URL).hostname.toLowerCase();
    return (
      hostname !== "example.supabase.co" &&
      !hostname.startsWith("your-") &&
      !isPlaceholder(key)
    );
  } catch {
    return false;
  }
}

/**
 * Local persistence is deliberately development/test-only. Production never
 * silently falls back to the filesystem when its database is misconfigured.
 */
export function shouldUseLocalWorkspaceDatabase(): boolean {
  return env.NODE_ENV !== "production" && !hasConfiguredSupabaseDatabase();
}
