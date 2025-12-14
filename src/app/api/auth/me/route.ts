import { verifyJwt } from "@/lib/auth";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * =========================================================
 * 🔐 AUTH API — /api/auth/me
 * =========================================================
 * Fungsi:
 *   Memverifikasi identitas pengguna berdasarkan JWT
 *   yang tersimpan di cookie (HttpOnly `token`).
 *
 * Alur utama:
 *   1. Ambil token JWT dari cookie `token`.
 *   2. Verifikasi validitas token (cek signature & masa berlaku).
 *   3. Ambil data user dari database berdasarkan `payload.id`.
 *   4. Kembalikan informasi user tanpa data sensitif.
 *
 * Keamanan:
 *   - JWT diverifikasi dengan secret server-side.
 *   - Token disimpan di cookie HttpOnly (tidak bisa diakses dari JS).
 *   - Menangani error token kadaluarsa & tidak valid.
 *
 * Response Contoh:
 * {
 *   "user": {
 *     "id": "sales_12",
 *     "email": "user@example.com",
 *     "name": "John Doe",
 *     "phone": "08123456789",
 *     "role": "Sales",
 *     "createdAt": "2025-12-14T10:20:30.000Z"
 *   }
 * }
 * =========================================================
 */

export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("token");

        if (!token) {
            return NextResponse.json(
                { error: "Unauthorized: No token Provided" },
                { status: 401 }
            );
        }

        const payload = await verifyJwt(token.value);

        if (!payload || !("id" in payload)) {
            return NextResponse.json(
                { error: "Unauthorized: Invalid Token" },
                { status: 401 }
            );
        }

        const user = await db.user.findUnique({
            where: { id: payload.id as string },
            select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                role: true,
                createdAt: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({ user }, { status: 200 });
    } catch (error) {
        const err = error as { name?: string; message?: string };
        console.error("[API_ME_ERROR]", err);

        if (err.name === "JWTExpired" || err.name === "JOSEError") {
            return NextResponse.json(
                { error: "Unauthorized: Token Expired or Invalid" },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { error: "An internal server error occurred" },
            { status: 500 }
        );
    }
}
