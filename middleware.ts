import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token;
        const { pathname } = req.nextUrl;
        const isAuthPage = pathname === '/pages/authen/login';

        if (token && isAuthPage) {
            return NextResponse.redirect(new URL('/', req.url));
        }

        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ token, req }) => {
                const { pathname } = req.nextUrl;
                
                if (pathname === '/pages/authen/login') {
                    return true;
                }

                return !!token;
            },
        },
        pages: {
            signIn: '/pages/authen/login',
        },
    }
);

export const config = {
    // Keep your same matcher to exclude static assets and internal Next.js files
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|layout|themes|demo).*)'],
};