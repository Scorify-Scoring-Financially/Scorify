import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * =========================================================
 *  API — GET /api/dashboard/stats
 * =========================================================
 * Fitur:
 *   - Menampilkan ringkasan data statistik dashboard:
 *       1 Jumlah nasabah dengan skor ≥ 0.8 (High Priority)
 *       2 Total seluruh nasabah yang terlihat oleh user login
 *   - Role-based access:
 *       - Admin → semua customer
 *       - Sales → hanya customer miliknya
 * =========================================================
 */

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface JwtPayload {
    id: string;
    role: string;
}

export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("token");

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const payload = (await verifyJwt(token.value)) as JwtPayload | null;
        const userId = payload?.id;
        const role = payload?.role;

        if (!userId || !role) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // --- Query condition (kalau admin: semua data, kalau sales: filter per user)
        const userFilter = role === "Admin" ? {} : { userId };

        // --- Hitung nasabah dengan skor tinggi (≥ 0.8)
        const highPriorityCustomers = await db.customer.findMany({
            where: {
                campaigns: {
                    some: userFilter,
                },
                leadScores: {
                    some: {
                        score: {
                            gte: 0.8,
                        },
                    },
                },
            },
            select: { id: true },
        });

        const highPriorityCount = highPriorityCustomers.length;

        // --- Total customer (semua atau milik sales)
        const totalCustomers = await db.customer.count({
            where: {
                campaigns: {
                    some: userFilter,
                },
            },
        });

        return NextResponse.json(
            {
                highPriorityCount,
                totalCustomers,
                scope: role === "Admin" ? "all-customers" : `sales-${userId}`,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("[API_STATS_ERROR]", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
