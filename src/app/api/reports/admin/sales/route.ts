import { NextResponse } from "next/server";
import { db } from "@/lib/db";

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
