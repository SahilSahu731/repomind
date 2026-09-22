import type {
  NextAuthOptions,
} from "next-auth";

import GitHubProvider
  from "next-auth/providers/github";

import {
  env,
} from "@/lib/env";

import {
  saveGitHubUserCredentials,
  upsertGitHubUserIdentity,
} from "@/lib/github/db";

import {
  isGitHubAuthProfile,
} from "@/types/auth";

export const authOptions:
  NextAuthOptions = {
  secret:
    env.NEXTAUTH_SECRET,

  providers: [
    GitHubProvider({
      clientId:
        env.GITHUB_CLIENT_ID,

      clientSecret:
        env.GITHUB_CLIENT_SECRET,

      profile(profile) {
        return {
          /*
           * Temporary provider identity.
           *
           * The jwt callback below replaces this with
           * RepoMind's own immutable UUID.
           */
          id:
            String(
              profile.id,
            ),

          name:
            profile.name ||
            profile.login,

          email:
            profile.email ??
            null,

          image:
            profile.avatar_url,
        };
      },
    }),
  ],

  callbacks: {
    async signIn({
      account,
      profile,
    }) {
      return (
        account?.provider ===
          "github" &&
        isGitHubAuthProfile(
          profile,
        )
      );
    },

    async jwt({
      token,
      account,
      profile,
    }) {
      if (
        account?.provider ===
          "github" &&
        isGitHubAuthProfile(
          profile,
        )
      ) {
        const authUser =
          await upsertGitHubUserIdentity(
            {
              githubUserId:
                String(
                  profile.id,
                ),

              login:
                profile.login,

              name:
                profile.name ??
                profile.login,

              email:
                profile.email ??
                null,

              avatarUrl:
                profile.avatar_url ??
                null,
            },
          );

        // Canonical RepoMind identity.
        token.id =
          authUser.id;

        token.plan =
          authUser.plan;

        token.creditsRemaining =
          authUser.creditsRemaining;

        token.githubUserId =
          authUser.githubUserId;

        token.githubUsername =
          authUser.githubUsername;

        if (
          typeof account.access_token ===
          "string"
        ) {
          const accountWithRefresh =
            account as
              typeof account & {
                refresh_token?:
                  string;

                refresh_token_expires_in?:
                  number;
              };

          const now =
            Math.floor(
              Date.now() /
                1000,
            );

          /*
           * Tokens are NOT stored in the session JWT.
           *
           * They are encrypted in the server database.
           */
          await saveGitHubUserCredentials({
            userId:
              authUser.id,

            accessToken:
              account.access_token,

            accessTokenExpiresAt:
              typeof account.expires_at ===
              "number"
                ? account.expires_at
                : null,

            refreshToken:
              typeof accountWithRefresh.refresh_token ===
              "string"
                ? accountWithRefresh.refresh_token
                : null,

            refreshTokenExpiresAt:
              typeof accountWithRefresh.refresh_token_expires_in ===
              "number"
                ? now +
                  accountWithRefresh.refresh_token_expires_in
                : null,
          });
        }
      }

      return token;
    },

    async session({
      session,
      token,
    }) {
      if (
        !session.user ||
        typeof token.id !==
          "string" ||
        !token.githubUserId
      ) {
        // Any session without a GitHub identity is treated as signed out.
        return {
          ...session,
          user: undefined,
        };
      }

      session.user.id =
        token.id;

      session.user.plan =
        token.plan ??
        "FREE";

      session.user.creditsRemaining =
        token.creditsRemaining ??
        3;

      session.user.githubUserId =
        token.githubUserId;

      session.user.githubUsername =
        token.githubUsername ??
        "github-user";

      return session;
    },

    async redirect({
      url,
      baseUrl,
    }) {
      const dashboardUrl =
        `${baseUrl}/user/dashboard`;

      let resolvedUrl =
        dashboardUrl;

      if (
        url.startsWith("/")
      ) {
        resolvedUrl =
          `${baseUrl}${url}`;
      } else {
        try {
          const parsedUrl =
            new URL(url);

          if (
            parsedUrl.origin !==
            baseUrl
          ) {
            return dashboardUrl;
          }

          resolvedUrl =
            parsedUrl.toString();
        } catch {
          return dashboardUrl;
        }
      }

      const pathname =
        new URL(
          resolvedUrl,
        ).pathname;

      if (
        pathname === "/" ||
        pathname.startsWith(
          "/login",
        )
      ) {
        return dashboardUrl;
      }

      return resolvedUrl;
    },
  },

  pages: {
    signIn:
      "/login",

    error:
      "/login",
  },

  session: {
    strategy:
      "jwt",

    maxAge:
      30 *
      24 *
      60 *
      60,
  },
};
