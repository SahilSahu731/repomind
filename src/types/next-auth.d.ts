import "next-auth";
import "next-auth/jwt";

type UserPlan = "FREE" | "PRO" | "ENTERPRISE";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      plan: UserPlan;
      creditsRemaining: number;
      githubUsername?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    plan?: UserPlan;
    creditsRemaining?: number;
    githubUsername?: string | null;
  }
}
