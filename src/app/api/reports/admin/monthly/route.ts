import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

const MONTHS_ID = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
    "Jul", "Agus", "Sep", "Okt", "Nov", "Des",
];

// Mapping semua bentuk nama bulan (English / Indonesian)
const MONTH_INDEX: Record<string, number> = {
    jan: 0, january: 0,
    feb: 1, february: 1,
    mar: 2, march: 2,
    apr: 3, april: 3,
    may: 4, mei: 4,
    jun: 5, june: 5,
    jul: 6, july: 6,
    aug: 7, agu: 7, agus: 7, august: 7, agustus: 7,
    sep: 8, sept: 8, september: 8,
    oct: 9, okt: 9, october: 9, oktober: 9,
    nov: 10, november: 10,
    dec: 11, des: 11, december: 11, desember: 11,
};

function getMonthIndex(monthStr?: string | null, createdAt?: Date): number {
    if (monthStr) {
        const key = monthStr.trim().toLowerCase();
        if (MONTH_INDEX[key] !== undefined) return MONTH_INDEX[key];
    }
    // fallback ke createdAt jika month null/tidak valid
    return createdAt ? createdAt.getMonth() : -1;
}

export async function GET(request: NextRequest) {
    try {
        // --- Ambil parameter query ---
        const { searchParams } = request.nextUrl;
        const salesId = searchParams.get("salesId") || "all";
        const yearParam = searchParams.get("year");
        const status = (searchParams.get("status") || "all").toLowerCase(); // all | agreed | declined | pending

        // --- Buat filter Prisma ---
        const where: Prisma.CampaignWhereInput = {};

        if (salesId !== "all") {
            where.userId = salesId;
        }

        if (yearParam) {
            const y = parseInt(yearParam);
            where.createdAt = {
                gte: new Date(y, 0, 1),
                lt: new Date(y + 1, 0, 1),
            };
        }

        // --- Ambil semua data campaign terkait ---
        const campaigns = await db.campaign.findMany({
            where,
            select: {
                month: true,
                finalDecision: true,
                createdAt: true,
            },
        });

        // --- Inisialisasi 12 bulan ---
        const monthly = Array.from({ length: 12 }, (_, i) => ({
            month: MONTHS_ID[i],
            setuju: 0,
            ditolak: 0,
            tertunda: 0,
        }));

        // --- Hitung agregasi per bulan ---
        for (const c of campaigns) {
            const idx = getMonthIndex(c.month, c.createdAt);
            if (idx < 0 || idx > 11) continue;

            const decision = (c.finalDecision || "pending").toLowerCase();

            if (decision === "agreed") monthly[idx].setuju++;
            else if (decision === "declined") monthly[idx].ditolak++;
            else monthly[idx].tertunda++;
        }

        // --- Filter status jika diperlukan ---
        const filtered = monthly.map((b) => {
            if (status === "agreed") return { ...b, ditolak: 0, tertunda: 0 };
            if (status === "declined") return { ...b, setuju: 0, tertunda: 0 };
            if (status === "pending") return { ...b, setuju: 0, ditolak: 0 };
            return b; // all
        });

        // --- Kirim hasil ---
        return NextResponse.json({ data: filtered }, { status: 200 });
    } catch (e) {
        console.error("[API_ADMIN_MONTHLY_ERROR]", e);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
