import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import { db } from "@/lib/db";


const MONTHS_ID: string[] = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
    "Jul", "Agus", "Sep", "Okt", "Nov", "Des",
];


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


function monthIndexFromString(m?: string | null): number | null {
    if (!m) return null;
    const key = m.trim().toLowerCase();
    return key in MONTH_INDEX ? MONTH_INDEX[key] : null;
}


interface JwtPayload {
    id: string;
    role?: string;
    [key: string]: unknown;
}

interface MonthlyBucket {
    month: string;
    setuju: number;
    ditolak: number;
    tertunda: number;
}

// GET /api/reports/sales/monthly?year=2025&status=all|agreed|declined|pending[&sales=<userId>]
export async function GET(request: NextRequest) {
    try {
        // --- Auth
        const cookieStore = await cookies();
        const token = cookieStore.get("token");
        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const payload = (await verifyJwt(token.value)) as JwtPayload | null;
        if (!payload?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = payload.id;
        const role = (payload.role ?? "").toString();

        // --- Params
        const { searchParams } = request.nextUrl;
        const year = parseInt(
            searchParams.get("year") || `${new Date().getFullYear()}`,
            10
        );
        const status = (searchParams.get("status") || "all").toLowerCase(); // all | agreed | declined | pending
        const salesParam = searchParams.get("sales") || ""; // khusus admin: filter ke sales tertentu

        const gte = new Date(year, 0, 1);
        const lt = new Date(year + 1, 0, 1);

        // --- Build where untuk hak akses
        const whereBase: Record<string, unknown> = {
            createdAt: { gte, lt },
        };

        if (role === "Sales") {
            whereBase.userId = userId;
        } else if (role === "Admin" && salesParam) {
            whereBase.userId = salesParam;
        }

        // --- Query campaign dengan field yang diperlukan
        const campaigns = await db.campaign.findMany({
            where: whereBase,
            select: {
                createdAt: true,
                finalDecision: true,
                month: true,
            },
        });

        // --- Inisialisasi 12 bucket bulan
        const buckets: MonthlyBucket[] = Array.from({ length: 12 }, (_, i) => ({
            month: MONTHS_ID[i],
            setuju: 0,
            ditolak: 0,
            tertunda: 0,
        }));

        // --- Hitung jumlah per bulan
        for (const c of campaigns) {
            let monthIdx = monthIndexFromString(c.month);
            if (monthIdx === null) {
                // fallback ke createdAt
                monthIdx = c.createdAt.getMonth();
            }

            // Normalisasi status
            const decision = (c.finalDecision ?? "pending").toString().toLowerCase();
            if (decision === "agreed") buckets[monthIdx].setuju += 1;
            else if (decision === "declined") buckets[monthIdx].ditolak += 1;
            else buckets[monthIdx].tertunda += 1; // treat unknown/null as pending
        }

        // --- Filter tampilan sesuai query `status`
        const filtered: MonthlyBucket[] = buckets.map((b) => {
            if (status === "agreed") return { ...b, ditolak: 0, tertunda: 0 };
            if (status === "declined") return { ...b, setuju: 0, tertunda: 0 };
            if (status === "pending") return { ...b, setuju: 0, ditolak: 0 };
            return b; // all
        });

        return NextResponse.json(filtered, { status: 200 });
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error("[API_REPORT_MONTHLY_ERROR]", {
                name: error.name,
                message: error.message,
            });
        } else {
            console.error("[API_REPORT_MONTHLY_ERROR]", error);
        }

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}