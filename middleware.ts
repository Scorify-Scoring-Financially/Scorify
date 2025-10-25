// import { NextResponse } from "next/server";
// import type { NextRequest } from "next/server";
// import { verifyJwt } from "./lib/auth";

// const AUTH_PATHS = ['/login'];

// const PROTECTED_PATHS = ['/dashboard'];

// export async function middleware(request: NextRequest) {
//     const { pathname } = request.nextUrl;
//     const token = request.cookies.get('token')?.value;

//     const isAuthPath = AUTH_PATHS.some((path) => pathname.startsWith(path));

//     const isProtectedPath = PROTECTED_PATHS.some((path) => pathname.startsWith(path));

//     let payload = null;
//     if (token) {
//         payload = await verifyJwt(token);
//     }
//     if (!payload) {
//         if (isProtectedPath) {
//             const url = request.nextUrl.clone();
//             url.pathname = '/login';
//             return NextResponse.redirect(url);
//         }
//         return NextResponse.next()
//     }

//     if (payload) {
//         if (isAuthPath) {
//             const url = request.nextUrl.clone();
//             url.pathname = '/dashboard';
//             return NextResponse.redirect(url);
//         }
//         return NextResponse.next();
//     }
//     return NextResponse.next();
// }

// export const config = {
//     matcher: [
//         '/((?!_next/static|_next/image|favicon.ico|api/auth/login|api/auth/register|/).*)'
//     ]
// }