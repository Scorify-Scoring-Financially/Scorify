import { comparePassword, signJwt } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import z from "zod";

/**
 * =========================================================
 *  🧩 LOGIN API — /api/auth/login
 * =========================================================
 *  Fungsi: Melakukan autentikasi pengguna berdasarkan email dan password.
 *
 *  Alur utama:
 *   1. Validasi input dengan Zod.
 *   2. Cek apakah email terdaftar di database.
 *   3. Bandingkan password input dengan hash di DB (bcrypt).
 *   4. Jika cocok → generate JWT token dan set di cookie (HttpOnly).
 *   5. Kembalikan informasi user tanpa password.
 *
 *  Keamanan:
 *   - Password tidak pernah dikembalikan ke klien.
 *   - Cookie menggunakan flag HttpOnly, SameSite Strict, dan Secure di production.
 *   - Token kedaluwarsa otomatis setelah 24 jam (1 hari).
 * =========================================================
 */

// =========================================================
// 🔹 Skema Validasi Login dengan Zod
// ---------------------------------------------------------
// Memastikan data email dan password dikirim dengan benar.
// =========================================================

const loginSchema = z.object({
    email: z.string("Email wajib diisi").email("Format email tidak valid"),
    password: z.string("Password wajib diisi")
})

// =========================================================
// 🔹 Handler: POST /api/auth/login
// =========================================================
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const validation = loginSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: "Input tidak valid", details: validation.error.issues },
                { status: 400 }
            );
        }

        const { email, password } = validation.data;

        const user = await db.user.findUnique({
            where: { email: email.toLowerCase() }
        });

        if (!user) {
            return NextResponse.json(
                { error: "Email atau password salah" },
                { status: 401 }
            );
        }

        const isPasswordValid = await comparePassword(password, user.passwordHash);
        if (!isPasswordValid) {
            return NextResponse.json(
                { error: "Email atau password salah" },
                { status: 401 }
            );
        }

        const tokenPayload = {
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name
        };
        const token = await signJwt(tokenPayload);

        const userResponse = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
        };

        const response = NextResponse.json(
            { message: "Login berhasil", user: userResponse },
            { status: 200 }
        );

        response.cookies.set("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 60 * 60 * 24,
            path: "/"
        });

        return response;

    } catch (e) {
        console.error("[API_LOGIN_ERROR]", e);
        return NextResponse.json(
            { error: "Terjadi kesalahan pada server" },
            { status: 500 }
        );
    }
}
