const configuredUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";

export const siteConfig = {
  name: "RepoMind",
  shortName: "RepoMind",
  tagline: "Understand the code before you change it.",
  description:
    "Analyze any public GitHub repository to map its architecture, dependencies, entry points, technology stack, risks, and practical onboarding path.",
  url: configuredUrl.replace(/\/$/, ""),
  locale: "en_US",
  keywords: [
    "GitHub repository analyzer",
    "AI codebase analysis",
    "software architecture map",
    "code dependency graph",
    "developer onboarding",
    "repository intelligence",
    "codebase documentation",
    "engineering productivity",
  ],
  features: [
    "Architecture and module mapping",
    "Dependency and connection analysis",
    "Technology stack detection",
    "Entry-point discovery",
    "Maintainability and readiness signals",
    "Project-aware onboarding guidance",
  ],
  links: {
    github: "https://github.com/SahilSahu731/repomind",
    creator: "https://github.com/SahilSahu731",
  },
};

export type SiteConfig = typeof siteConfig;
