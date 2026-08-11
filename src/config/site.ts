export const siteConfig = {
  name: "RepoMind",
  description:
    "Turn a public GitHub repository into an architecture map, dependency graph, contribution score, and onboarding guide.",
  url: process.env.NEXTAUTH_URL ?? "http://localhost:3000",
  links: {
    github: "https://github.com",
    x: "https://x.com",
  },
};

export type SiteConfig = typeof siteConfig;
