import { siteConfig } from "@/config/site";

export function StructuredData() {
  const json = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "RepoMind",
    description: siteConfig.description,
    url: siteConfig.url,
    category: "DeveloperApplication",
  };

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }} />
  );
}
