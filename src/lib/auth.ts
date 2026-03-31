import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import { compare } from "bcryptjs";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { isGitHubAuthProfile } from "@/types/auth";

if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
  throw new Error("GitHub OAuth credentials (GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET) are required");
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
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

        const user = await db.user.findUnique({
          where: { email },
        });

        if (!user?.passwordHash) {
          return null;
        }

        const isValid = await compare(password, user.passwordHash);
        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
    GitHubProvider({
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: profile.name || profile.login,
          email: profile.email,
          image: profile.avatar_url,
          githubId: profile.id.toString(),
          githubUsername: profile.login,
        };
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        const dbUser = await db.user.findUnique({
          where: { id: user.id },
          select: {
            plan: true,
            creditsRemaining: true,
            githubUsername: true,
          },
        });

        if (dbUser) {
          session.user.plan = dbUser.plan;
          session.user.creditsRemaining = dbUser.creditsRemaining;
          session.user.githubUsername = dbUser.githubUsername;
        }
      }

      return session;
    },
    async signIn({ user, profile }) {
      if (profile && isGitHubAuthProfile(profile)) {
        await db.user
          .update({
            where: { id: user.id },
            data: {
              githubId: profile.id.toString(),
              githubUsername: profile.login,
              image: profile.avatar_url,
            },
          })
          .catch(() => {
            return null;
          });
      }

      return true;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "database",
  },
};
