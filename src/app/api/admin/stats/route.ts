import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// =========================================================
// ⚙️ Konfigurasi Respons Dinamis (Non-Cacheable API)
// =========================================================
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * =========================================================
 * 📊 ADMIN DASHBOARD STATISTICS API
 * =========================================================
 * Endpoint: /api/dashboard/admin/stats
 *
 * Deskripsi:
 * Memberikan ringkasan statistik global untuk dashboard admin:
 *  - totalCustomers   → jumlah seluruh nasabah (tabel `customer`)
 *  - totalSales       → jumlah seluruh sales (user.role = "Sales")
 *  - totalHighScore   → jumlah nasabah dengan skor peluang ≥ 0.8
 *
 * Logika utama:
 *  1. Hitung total nasabah dari tabel `customer`.
 *  2. Hitung total sales dari tabel `user` berdasarkan role.
 *  3. Hitung nasabah dengan skor peluang tinggi (>= 0.8)
 *     dengan memeriksa relasi `leadScores`.
 *
 * Response Format:
 * {
 *   "totalCustomers": number,
 *   "totalSales": number,
 *   "totalHighScore": number
 * }
 * =========================================================
 */
export async function GET() {
    try {
        //  Ambil total nasabah
        const totalCustomers = await db.customer.count();

        //  Ambil total sales (role = 'SALES')
        const totalSales = await db.user.count({
            where: { role: "Sales" },
        });

        //  Ambil nasabah dengan skor tinggi (>= 0.8)
        // Ambil skor terbaru per nasabah → cari yang terakhir di leadScores
        const highScoreCustomers = await db.customer.findMany({
            where: {
                leadScores: {
                    some: { score: { gte: 0.8 } },
                },
            },
            select: { id: true },
        });

        const totalHighScore = highScoreCustomers.length;

        // Kembalikan response JSON
        return NextResponse.json(
            {
                totalCustomers,
                totalSales,
                totalHighScore,
            },
            {
                status: 200,
                headers: {
                    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
                    "Pragma": "no-cache",
                    "Expires": "0",
                },
            }
        );
    } catch (error) {
        console.error("[API_ADMIN_STATS_ERROR]", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
