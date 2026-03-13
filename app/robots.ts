import type { MetadataRoute } from "next";

/**
 * Excludes crawlers from high-compute Edge paths (API/Admin) to optimize Worker execution budgets 
 * and prevent indexing of internal dashboard surfaces.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/"],
      },
    ],
    sitemap: "https://eco-commerce-orchestrator.pages.dev/sitemap.xml",
  };
}
