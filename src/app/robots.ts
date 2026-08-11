import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/login", "/signup"],
      disallow: ["/api/", "/user/"],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
