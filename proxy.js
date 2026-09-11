import { NextResponse } from "next/server";

export function proxy(request) {
    const { pathname } = request.nextUrl;

    // Temporary UI-only account check.
    // Replace this with real session validation later.
    const hasAccount = request.cookies.has("offlix_session");

    // Redirect authenticated users from "/" to the dashboard.
    if (pathname === "/" && hasAccount) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Protect dashboard routes.
    const isDashboardRoute =
        pathname === "/dashboard" || pathname.startsWith("/dashboard/");

    if (isDashboardRoute && !hasAccount) {
        const loginUrl = new URL("/login", request.url);

        loginUrl.searchParams.set("redirect", pathname);

        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/", "/dashboard/:path*"],
};