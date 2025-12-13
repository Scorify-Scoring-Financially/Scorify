import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import { db } from "@/lib/db";

// (opsional, tetap disimpan untuk konsistensi tampilan chart)
const MONTHS_ID: string[] = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
    "Jul", "Agus", "Sep", "Okt", "Nov", "Des",
];

interface JwtPayload {
    id: string;
    [key: string]: unknown;
}

export async function GET(request: NextRequest) {
    try {
        // --- Auth: ambil user dari JWT cookie
        const cookieStore = cookies();
        const token = cookieStore.get("token");

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const payload = (await verifyJwt(token.value)) as JwtPayload | null;
        const userId = payload?.id;

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // --- Params
        const { searchParams } = request.nextUrl;
        const year = parseInt(
            searchParams.get("year") || `${new Date().getFullYear()}`,
            10
        );

        const gte = new Date(year, 0, 1);
        const lt = new Date(year + 1, 0, 1);

        // --- Ambil semua campaign milik user pada tahun tsb
        const campaigns = await db.campaign.findMany({
            where: { userId, createdAt: { gte, lt } },
            select: {
                id: true,
                customerId: true,
                finalDecision: true,
                createdAt: true,
            },
        });

        // --- Hitung total nasabah (distinct customer)
        const distinctCustomerIds = new Set<string>();
        campaigns.forEach((c) => distinctCustomerIds.add(c.customerId));
        const totalCustomers = distinctCustomerIds.size;

        // --- Hitung persetujuan
        const agreed = campaigns.filter((c) => c.finalDecision === "agreed").length;
        const declined = campaigns.filter((c) => c.finalDecision === "declined").length;
        const decided = agreed + declined;
        const approvalRate = decided > 0 ? agreed / decided : 0;

        // --- Hitung jumlah nasabah dihubungi (finalDecision bukan pending)
        const contactedCustomers = new Set<string>();
        campaigns.forEach((c) => {
            if (c.finalDecision === "agreed" || c.finalDecision === "declined") {
                contactedCustomers.add(c.customerId);
            }
        });

        // --- Ambil distribusi skor (leadScore terbaru per customer)
        const scored = await db.leadScore.findMany({
            where: {
                campaign: { userId, createdAt: { gte, lt } },
            },
            orderBy: { createdAt: "desc" },
            select: { customerId: true, score: true },
        });

        // --- Ambil skor terbaru per customer
        const latestPerCustomer = new Map<string, number>();
        for (const s of scored) {
            if (!latestPerCustomer.has(s.customerId)) {
                latestPerCustomer.set(s.customerId, s.score ?? 0);
            }
        }

        let high = 0;
        let medium = 0;
        let low = 0;

        for (const score of latestPerCustomer.values()) {
            if (score >= 0.8) high++;
            else if (score >= 0.6) medium++;
            else low++;
        }

        const totalScored = latestPerCustomer.size || 1;
        const scoreDistribution = {
            high: high / totalScored,
            medium: medium / totalScored,
            low: low / totalScored,
        };

        return NextResponse.json(
            {
                totalCustomers,
                approvalRate,
                contactedCustomers: contactedCustomers.size,
                scoreDistribution,
                months: MONTHS_ID,
                year,
            },
            { status: 200 }
        );
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error("[API_REPORT_SUMMARY_ERROR]", {
                name: error.name,
                message: error.message,
            });
        } else {
            console.error("[API_REPORT_SUMMARY_ERROR]", error);
        }

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
