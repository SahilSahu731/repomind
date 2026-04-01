// Prisma has been removed from runtime usage. Keep this module as a guardrail so
// any stale imports fail with a clear migration message.
export const db = new Proxy(
  {},
  {
    get() {
      throw new Error(
        "Prisma client is no longer available. Use Supabase helpers from src/lib/supabaseDb.ts"
      );
    },
  }
);
