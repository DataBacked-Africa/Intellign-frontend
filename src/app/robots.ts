import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Workspace/auth/session/admin routes are app surfaces, not content.
      // /join and /share are per-invite, per-recipient pages, not content either.
      { userAgent: "*", allow: "/", disallow: ["/workspace", "/auth", "/sessions", "/dev-login", "/admin", "/join", "/share", "/api"] },
    ],
    sitemap: "https://intellign.ai/sitemap.xml",
  };
}
