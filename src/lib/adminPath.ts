// Host-aware admin paths.
//
// On the admin subdomain (admin.intellign.ai) the middleware rewrites "/*" → "/admin/*",
// so links use the BARE path ("/", "/login", "/users") and the URL bar stays clean.
// On any other host (localhost dev, previews) the section lives under "/admin/*",
// so we prefix it.
//
// `p` is the logical admin path WITHOUT the "/admin" prefix, e.g. "/" or "/login".
export function isAdminHost(): boolean {
    if (typeof window === "undefined") return false;
    return window.location.host.toLowerCase().startsWith("admin.");
}

export function adminPath(p: string): string {
    const clean = p === "/" ? "" : p;
    if (isAdminHost()) return clean === "" ? "/" : clean;
    return `/admin${clean}`;
}

// Strip a leading "/admin" so active-state checks work regardless of host/rewrite.
export function bareAdminPath(pathname: string): string {
    const stripped = pathname.replace(/^\/admin/, "");
    return stripped === "" ? "/" : stripped;
}
