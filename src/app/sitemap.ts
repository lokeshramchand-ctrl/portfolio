import type { MetadataRoute } from "next";
import { blogPosts, siteConfig } from "@/lib/data";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes: MetadataRoute.Sitemap = [
    { url: siteConfig.url, changeFrequency: "monthly", priority: 1 },
    { url: `${siteConfig.url}/blog`, changeFrequency: "weekly", priority: 0.6 },
  ];

  for (const post of blogPosts) {
    routes.push({
      url: `${siteConfig.url}/blog/${post.slug}`,
      changeFrequency: "yearly",
      priority: 0.4,
    });
  }

  return routes;
}
