import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Workspace/auth/session routes are app surfaces, not content.
      { userAgent: "*", allow: "/", disallow: ["/workspace", "/auth", "/sessions", "/dev-login"] },
    ],
    sitemap: "https://intellign.databackedafrica.com/sitemap.xml",
  };
}
