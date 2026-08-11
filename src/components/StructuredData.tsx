import { siteConfig } from "@/config/site";

export function StructuredData() {
  const organizationId = `${siteConfig.url}/#organization`;
  const websiteId = `${siteConfig.url}/#website`;

  const json = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": organizationId,
        name: siteConfig.name,
        url: siteConfig.url,
        logo: `${siteConfig.url}/icon.svg`,
        sameAs: [siteConfig.links.github],
      },
      {
        "@type": "WebSite",
        "@id": websiteId,
        url: siteConfig.url,
        name: siteConfig.name,
        alternateName: "RepoMind Repository Intelligence",
        description: siteConfig.description,
        inLanguage: "en",
        publisher: { "@id": organizationId },
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${siteConfig.url}/#software`,
        name: siteConfig.name,
        applicationCategory: "DeveloperApplication",
        applicationSubCategory: "Code analysis tool",
        operatingSystem: "Web",
        url: siteConfig.url,
        description: siteConfig.description,
        featureList: siteConfig.features,
        isAccessibleForFree: true,
        publisher: { "@id": organizationId },
      },
      {
        "@type": "FAQPage",
        "@id": `${siteConfig.url}/#faq`,
        mainEntity: [
          {
            "@type": "Question",
            name: "Which repositories can I analyze?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "RepoMind currently supports public GitHub repositories. You can submit the repository URL or a GitHub URL that points to a specific branch.",
            },
          },
          {
            "@type": "Question",
            name: "Does RepoMind change my repository?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "No. The analysis is read-only: RepoMind does not commit code, open pull requests, or request repository write access.",
            },
          },
          {
            "@type": "Question",
            name: "What appears in a report?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Reports combine a structural overview, detected technology and dependency signals, likely entry points, module responsibilities, file context, risks worth reviewing, and an onboarding guide.",
            },
          },
          {
            "@type": "Question",
            name: "How deep is the analysis?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Depth varies by repository and language. RepoMind is strongest at structural orientation and detected relationships; its output should guide closer engineering review rather than replace it.",
            },
          },
          {
            "@type": "Question",
            name: "Is RepoMind a security scanner?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "No. It may highlight structural concerns, but it is not a vulnerability scanner, penetration test, compliance review, or substitute for a dedicated security audit.",
            },
          },
          {
            "@type": "Question",
            name: "Why do I need an account?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "An account lets RepoMind associate an analysis with your workspace, show progress, and make the completed report available when you return.",
            },
          },
        ],
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json).replace(/</g, "\\u003c") }}
    />
  );
}
