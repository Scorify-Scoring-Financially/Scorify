import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// 🚫 Non-cache
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * API untuk statistik dashboard admin
 * - totalCustomers: jumlah seluruh nasabah
 * - totalSales: jumlah seluruh sales (user.role = 'SALES')
 * - totalHighScore: nasabah yang memiliki skor terbaru >= 0.8
 */
export async function GET() {
    try {
        // 1️⃣ Ambil total nasabah
        const totalCustomers = await db.customer.count();

        // 2️⃣ Ambil total sales (role = 'SALES')
        const totalSales = await db.user.count({
            where: { role: "Sales" },
        });

        // 3️⃣ Ambil nasabah dengan skor tinggi (>= 0.8)
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

        // ✅ Kembalikan response JSON
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
