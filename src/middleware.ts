import { NextRequest, NextResponse } from "next/server";

// Host-based routing: admin.intellign.ai transparently serves the /admin section.
// The apex/app domain cannot reach /admin directly (defense in depth).
export function middleware(req: NextRequest) {
    const host = (req.headers.get("host") || "").toLowerCase();
    const isAdminHost = host.startsWith("admin.");
    const { pathname } = req.nextUrl;

    // Only the exact "/admin" segment counts — NOT "/admins" (the Admins page).
    const isAdminPrefixed = pathname === "/admin" || pathname.startsWith("/admin/");

    if (isAdminHost) {
        // Canonicalize: the /admin prefix never appears in the URL on the admin
        // subdomain. Any /admin or /admin/* request redirects to its bare path…
        if (isAdminPrefixed) {
            const url = req.nextUrl.clone();
            url.pathname = pathname.replace(/^\/admin/, "") || "/";
            return NextResponse.redirect(url);
        }
        // …and bare paths are served by the /admin/* routes via an internal rewrite.
        const url = req.nextUrl.clone();
        url.pathname = `/admin${pathname === "/" ? "" : pathname}`;
        return NextResponse.rewrite(url);
    }

    // Non-admin production host must not serve /admin pages directly.
    // Localhost/dev is exempt so the section is reachable without the subdomain.
    const isLocal = host.includes("localhost") || host.startsWith("127.0.0.1");
    if (isAdminPrefixed && !isLocal) {
        return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
