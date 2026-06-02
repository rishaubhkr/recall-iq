import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/sign-in", "/sign-up", "/upgrade"],
        disallow: ["/admin/", "/dashboard/", "/study/", "/analytics/", "/api/"],
      },
    ],
    sitemap: "https://recalliq.app/sitemap.xml",
  };
}
