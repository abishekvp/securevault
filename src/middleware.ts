import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server";

export default withAuth(
    async function middleware(req) {
        const path = req.nextUrl.pathname;

        // 0. PREVENT INTERNAL RECURSION
        if (req.headers.get('x-internal-check')) return;

        const token = req.nextauth.token;
        const isAuth = !!token;
        const isVerified = token?.isEmailVerified;
        const hasSecurityQuestions = token?.hasSecurityQuestions;
        const isAdmin = token?.isAdmin;
        // path is already declared at the top

        // 1. GLOBAL MAINTENANCE CHECK
        // Exclude specific paths to avoid loops or lockout from login
        const isPublicPath = path === "/api/system/status" || path.startsWith("/api/auth") || path === "/login" || path === "/signup" || path === "/api/admin/product";

        if (!isAdmin && !isPublicPath) {
            try {
                // We use a relative URL for the fetch
                const baseUrl = req.nextUrl.origin;
                const statusRes = await fetch(`${baseUrl}/api/system/status`, {
                    headers: { 'x-internal-check': 'true' }
                });
                if (statusRes.ok) {
                    const { maintenanceMode } = await statusRes.json();
                    if (maintenanceMode) {
                        // If it's an API call, return 503
                        if (path.startsWith("/api/")) {
                            return new NextResponse(JSON.stringify({ error: "System under maintenance" }), {
                                status: 503,
                                headers: { 'Content-Type': 'application/json' }
                            });
                        }
                        // If it's a UI call and we are not already on vault (which has its own handler), 
                        // we can let it through to vault or redirect to a specific page.
                        // For now, let's just block the UI.
                        if (!path.startsWith("/vault")) {
                            return NextResponse.redirect(new URL("/vault", req.url));
                        }
                    }
                }
            } catch (e) {
                console.error("Middleware Maintenance Check Failed", e);
            }
        }

        if (path.startsWith("/vault")) {
            if (!isVerified) {
                return NextResponse.redirect(new URL("/verify-email", req.url));
            }
            if (!hasSecurityQuestions) {
                return NextResponse.redirect(new URL("/setup-security", req.url));
            }
        }

        if (path.startsWith("/admin")) {
            if (!isAdmin) {
                return NextResponse.redirect(new URL("/vault", req.url));
            }
        }
    },
    {
        callbacks: {
            authorized: ({ token, req }) => {
                const path = req.nextUrl.pathname;
                const isPublicPath =
                    path === "/api/system/status" ||
                    path.startsWith("/api/auth") ||
                    path === "/login" ||
                    path === "/signup" ||
                    path === "/" ||
                    path.includes(".") || // assets
                    path.startsWith("/_next");

                return !!token || isPublicPath;
            },
        },
    }
)

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        "/((?!_next/static|_next/image|favicon.ico).*)",
    ]
}
