
import { NextResponse } from "next/server";


const allowedOrigins = [
    "https://offlix-manager-mobile-app.vercel.app",
    "http://localhost:8081",
];


export function proxy(request) {
    const { pathname } = request.nextUrl;
    const origin = request.headers.get("origin");

    // Handle CORS for API requests.
    if (pathname.startsWith("/api/")) {
        const isAllowedOrigin =
            origin && allowedOrigins.includes(origin);

        if (request.method === "OPTIONS") {
            const response = new NextResponse(null, {
                status: 204,
            });

            if (isAllowedOrigin) {
                response.headers.set(
                    "Access-Control-Allow-Origin",
                    origin
                );
                response.headers.set(
                    "Access-Control-Allow-Methods",
                    "GET, POST, PUT, PATCH, DELETE, OPTIONS"
                );
                response.headers.set(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization"
                );
                response.headers.set("Vary", "Origin");
            }

            return response;
        }

        const response = NextResponse.next();

        if (isAllowedOrigin) {
            response.headers.set(
                "Access-Control-Allow-Origin",
                origin
            );
            response.headers.set("Vary", "Origin");
        }

        return response;
    }

    // Existing account check.
    const hasAccount = request.cookies.has("offlix_session");

    if (pathname === "/" && hasAccount) {
        return NextResponse.redirect(
            new URL("/dashboard", request.url)
        );
    }

    const isDashboardRoute =
        pathname === "/dashboard" ||
        pathname.startsWith("/dashboard/");

    if (isDashboardRoute && !hasAccount) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/", "/dashboard/:path*", "/api/:path*"],
};
