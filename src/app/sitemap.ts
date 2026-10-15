import type { MetadataRoute } from "next";

const BASE = "https://www.intellign.ai";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    { url: `${BASE}`,         lastModified, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${BASE}/about`,   lastModified, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/demo`,    lastModified, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/docs`,    lastModified, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${BASE}/status`,  lastModified, changeFrequency: "daily",   priority: 0.3 },
    { url: `${BASE}/terms`,   lastModified, changeFrequency: "yearly",  priority: 0.2 },
    { url: `${BASE}/privacy`, lastModified, changeFrequency: "yearly",  priority: 0.2 },
  ];
}
