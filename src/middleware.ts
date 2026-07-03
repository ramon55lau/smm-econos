import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        // console.log("Middleware token:", req.nextauth.token);
        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token,
        },
    }
);

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api/auth (NextAuth endpoints)
         * - api/webhooks (Public webhooks)
         * - login (Login page)
         * - register (Register page)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files (images, etc.)
         */
        "/((?!api/auth|api/webhooks|login|register|forgot-password|reset-password|_next/static|_next/image|favicon\\.ico|favicon\\.png|images|privacy-policy|terms|data-deletion).*)"
    ],
};
