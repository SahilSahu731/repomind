import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import { env } from "@/lib/env";
import { supabaseSignInWithPassword } from "@/lib/supabaseAuth";

if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
  throw new Error("GitHub OAuth credentials (GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET) are required");
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password;

        if (!email || !password) {
          return null;
        }

        const result = await supabaseSignInWithPassword(email, password);

        if (!result.user?.id) {
          return null;
        }

        return {
          id: result.user.id,
          name:
            result.user.user_metadata?.name ??
            result.user.user_metadata?.full_name ??
            null,
          email: result.user.email ?? email,
          image: result.user.user_metadata?.avatar_url ?? null,
        };
      },
    }),
    GitHubProvider({
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
      profile(profile) {
        const normalizedEmail =
          profile.email ?? `${profile.login}@users.noreply.github.com`;

        return {
          id: profile.id.toString(),
          name: profile.name || profile.login,
          email: normalizedEmail,
          image: profile.avatar_url,
          githubId: profile.id.toString(),
          githubUsername: profile.login,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, profile }) {
      if (user) {
        token.id = user.id;
        token.plan = "FREE";
        token.creditsRemaining = 3;
      }

      if (profile && typeof profile === "object" && "login" in profile) {
        const username = profile.login;
        if (typeof username === "string") {
          token.githubUsername = username;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id =
          (typeof token.id === "string" ? token.id : null) ??
          (typeof token.sub === "string" ? token.sub : "");
        session.user.plan = "FREE";
        session.user.creditsRemaining =
          typeof token.creditsRemaining === "number" ? token.creditsRemaining : 3;
        session.user.githubUsername =
          typeof token.githubUsername === "string" ? token.githubUsername : null;
      }

      return session;
    },
    async redirect({ url, baseUrl }) {
      const dashboardUrl = `${baseUrl}/user/dashboard`;
      let resolvedUrl = dashboardUrl;

      if (url.startsWith("/")) {
        resolvedUrl = `${baseUrl}${url}`;
      } else {
        try {
          const parsedUrl = new URL(url);
          if (parsedUrl.origin !== baseUrl) {
            return dashboardUrl;
          }

          resolvedUrl = parsedUrl.toString();
        } catch {
          return dashboardUrl;
        }
      }

      const resolvedPathname = new URL(resolvedUrl).pathname;

      if (
        resolvedPathname === "/" ||
        resolvedPathname.startsWith("/login") ||
        resolvedPathname.startsWith("/signup")
      ) {
        return dashboardUrl;
      }

      return resolvedUrl;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
};
