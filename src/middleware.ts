import { NextResponse, type NextRequest } from "next/server";
import { verifyJwt } from "@/lib/auth";
import type { JwtPayload } from "@/lib/auth"; // misal ada di auth.ts


/**
 * Daftar halaman:
 * - AUTH_PATHS: halaman login/register (tidak boleh diakses saat sudah login)
 * - PROTECTED_PATHS: halaman yang wajib login
 * - PUBLIC_PATHS: halaman bebas (tanpa login)
 */
const AUTH_PATHS = ["/login"];
const PROTECTED_PATHS = ["/dashboard", "/admin"];
const PUBLIC_PATHS = ["/"];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const token = request.cookies.get("token")?.value;

    const isAuthPath = AUTH_PATHS.some((p) => pathname.startsWith(p));
    const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
    const isPublic = PUBLIC_PATHS.some((p) => pathname === p);

    let payload: JwtPayload | null = null;

    if (token) {
        try {
            payload = await verifyJwt(token);
        } catch {
            payload = null;
        }
    }

    if (!payload && isProtected) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        return NextResponse.redirect(url);
    }

    if (payload && isAuthPath) {
        const url = request.nextUrl.clone();
        if (payload.role === "Admin") {
            url.pathname = "/admin/dashboard";
        } else {
            url.pathname = "/dashboard";
        }
        return NextResponse.redirect(url);
    }

    if (payload && pathname.startsWith("/admin") && payload.role !== "Admin") {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
    }

    if (isPublic) {
        return NextResponse.next();
    }


    return NextResponse.next();
}


export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|api/auth/login|api/auth/register).*)",
    ],
};