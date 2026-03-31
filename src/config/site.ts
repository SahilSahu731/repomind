export const siteConfig = {
  name: "RepoMind",
  description:
    "Understand any GitHub repository in under 60 seconds with AI architecture maps and onboarding guides.",
  url: process.env.NEXTAUTH_URL ?? "http://localhost:3000",
  links: {
    github: "https://github.com",
    x: "https://x.com",
  },
};

export type SiteConfig = typeof siteConfig;
