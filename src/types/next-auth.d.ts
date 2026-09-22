import type {
  DefaultSession,
} from "next-auth";

import type {
  Plan,
} from "@/lib/supabaseDb";

declare module "next-auth" {
  interface Session {
    user?:
      DefaultSession["user"] & {
        // RepoMind UUID
        id: string;

        plan: Plan;

        creditsRemaining:
          number;

        githubUserId:
          string;

        githubUsername:
          string;
      };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;

    plan?: Plan;

    creditsRemaining?: number;

    githubUserId?: string;

    githubUsername?: string;
  }
}
