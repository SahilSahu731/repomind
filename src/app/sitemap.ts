import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/privacy", "/terms", "/data-controls", "/support"].map(
    (path, index) => ({
      url: `${siteConfig.url}${path}`,
      lastModified: new Date(),
      changeFrequency: index === 0 ? "weekly" : "monthly",
      priority: index === 0 ? 1 : 0.5,
    })
  );
}
