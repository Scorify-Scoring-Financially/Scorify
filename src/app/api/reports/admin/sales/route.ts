import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * =========================================================
 *  API — GET /api/admin/sales
 * =========================================================
 * Fitur:
 *   - Mengambil daftar seluruh user dengan role = "Sales"
 *   - Hanya field penting (id, name, email)
 *   - Diurutkan secara alfabetis berdasarkan nama
 *
 * Response:
 *   {
 *     "sales": [
 *       { "id": "sales_1", "name": "John Doe", "email": "john@domain.com" },
 *       ...
 *     ]
 *   }
 * =========================================================
 */

export async function GET() {
    try {
        const sales = await db.user.findMany({
            where: { role: "Sales" },
            select: { id: true, name: true, email: true },
            orderBy: { name: "asc" }
        });

        return NextResponse.json({ sales }, { status: 200 });
    } catch (e) {
        console.error("[API_ADMIN_SALES_ERROR]", e);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
