import { NextResponse } from "next/server";

/**
 * =========================================================
 * 🔐 LOGOUT API — /api/auth/logout
 * =========================================================
 * Fungsi:
 *   Menghapus cookie JWT (`token`) dari browser untuk
 *   mengakhiri sesi autentikasi pengguna.
 *
 * Alur utama:
 *   1. Buat response JSON “Logout successfully”.
 *   2. Hapus cookie `token` dengan mengatur `expires` ke masa lalu.
 *   3. Pastikan cookie aman (HttpOnly, SameSite Strict, dll).
 *
 * Response Contoh:
 *   {
 *     "message": "Logout successfully"
 *   }
 * =========================================================
 */
export async function POST() {
    try {
        // Buat response sukses
        const response = NextResponse.json(
            { message: "Logout successfully" },
            { status: 200 }
        );

        // Hapus cookie token (JWT)
        response.cookies.set("token", "", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            expires: new Date(0),
            path: "/",
        });

        return response;
    } catch (error) {
        console.error("[API_LOGOUT_ERROR]", error);
        return NextResponse.json(
            { error: "An internal server error occurred" },
            { status: 500 }
        );
    }
}
