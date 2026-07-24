import type { MetadataRoute } from "next";

const BASE = "https://intellign.ai";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${BASE}/`,       changeFrequency: "weekly",  priority: 1.0 },
    { url: `${BASE}/demo`,   changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/docs`,   changeFrequency: "weekly",  priority: 0.8 },
    { url: `${BASE}/status`, changeFrequency: "daily",   priority: 0.3 },
  ];
}
