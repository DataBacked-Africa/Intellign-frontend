import { NextRequest, NextResponse } from "next/server";

// Host-based routing: admin.intellign.ai transparently serves the /admin section.
// The apex/app domain cannot reach /admin directly (defense in depth).
export function middleware(req: NextRequest) {
    const host = (req.headers.get("host") || "").toLowerCase();
    const isAdminHost = host.startsWith("admin.");
    const { pathname } = req.nextUrl;

    if (isAdminHost) {
        if (!pathname.startsWith("/admin")) {
            const url = req.nextUrl.clone();
            url.pathname = `/admin${pathname === "/" ? "" : pathname}`;
            return NextResponse.rewrite(url);
        }
        return NextResponse.next();
    }

    // Non-admin production host must not serve /admin pages directly.
    // Localhost/dev is exempt so the section is reachable without the subdomain.
    const isLocal = host.includes("localhost") || host.startsWith("127.0.0.1");
    if (pathname.startsWith("/admin") && !isLocal) {
        return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
