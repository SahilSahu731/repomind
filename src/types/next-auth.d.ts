import type { Plan } from "@prisma/client";
import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      plan: Plan;
      creditsRemaining: number;
      githubUsername?: string | null;
    };
  }
}
