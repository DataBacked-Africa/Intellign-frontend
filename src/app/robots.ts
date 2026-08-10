import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Workspace/auth/session/admin routes are app surfaces, not content.
      // /join and /share are per-invite, per-recipient pages, not content either.
      // /demo/helium-health is a client-specific sales demo and /demo/results-preview
      // is a dev-only component preview — neither is meant for public discovery.
      { userAgent: "*", allow: "/", disallow: ["/workspace", "/auth", "/sessions", "/dev-login", "/admin", "/join", "/share", "/api", "/demo/helium-health", "/demo/results-preview"] },
    ],
    sitemap: "https://www.intellign.ai/sitemap.xml",
  };
}
