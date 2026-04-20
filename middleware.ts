import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const session = request.cookies.get('session');
    const { pathname } = request.nextUrl;

    // IMPORTANT: Pathname in Next.js always starts with /
    // If your folder is app/authen/login/page.tsx, the pathname is /authen/login
    const isAuthPage = pathname === '/pages/authen/login';

    // 1. If NO session and NOT on login page -> Redirect to /authen/login
    if (!session && !isAuthPage) {
        return NextResponse.redirect(new URL('/pages/authen/login', request.url));
    }

    if (session && isAuthPage) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
}

export const config = {
    // This matcher excludes all assets so they don't trigger redirects
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|layout|themes|demo).*)'],
};