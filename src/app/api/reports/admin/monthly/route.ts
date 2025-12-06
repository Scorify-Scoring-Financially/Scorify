import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client"; // ✅ tambahkan Prisma untuk typing

const MONTHS = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
    "Jul", "Agus", "Sep", "Okt", "Nov", "Des"
];

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl;
        const salesId = searchParams.get("salesId");
        const yearParam = searchParams.get("year");

        const where: Prisma.CampaignWhereInput = {};

        if (salesId && salesId !== "all") {
            where.userId = salesId;
        }

        if (yearParam) {
            const y = parseInt(yearParam);
            where.createdAt = {
                gte: new Date(y, 0, 1),
                lt: new Date(y + 1, 0, 1),
            };
        }

        const campaigns = await db.campaign.findMany({
            where,
            select: {
                id: true,
                month: true,
                finalDecision: true,
            },
        });

        const monthly = MONTHS.map((m) => ({
            month: m,
            setuju: 0,
            ditolak: 0,
            tertunda: 0,
        }));

        for (const c of campaigns) {
            const monthName = (c.month || "").slice(0, 3).toLowerCase();
            const idx = [
                "jan", "feb", "mar", "apr", "mei", "jun",
                "jul", "agu", "sep", "okt", "nov", "des"
            ].findIndex((m) => m === monthName);

            if (idx < 0) continue;

            const decision = c.finalDecision || "pending";
            if (decision === "agreed") monthly[idx].setuju++;
            else if (decision === "declined") monthly[idx].ditolak++;
            else monthly[idx].tertunda++;
        }

        return NextResponse.json({ data: monthly }, { status: 200 });
    } catch (e) {
        console.error("[API_ADMIN_MONTHLY_ERROR]", e);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
