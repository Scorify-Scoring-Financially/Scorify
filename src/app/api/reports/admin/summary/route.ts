import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { subMonths, startOfMonth, endOfMonth } from "date-fns";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agus", "Sep", "Okt", "Nov", "Des"];

function toYearRange(year?: number) {
    if (!year) return undefined;
    const start = new Date(year, 0, 1, 0, 0, 0);
    const end = new Date(year + 1, 0, 1, 0, 0, 0);
    return { gte: start, lt: end } as Prisma.DateTimeFilter;
}

function toScoreBand(score: number) {
    if (score >= 0.8) return "high";
    if (score >= 0.6) return "medium";
    return "low";
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl;
        const salesId = searchParams.get("salesId");
        const yearParam = searchParams.get("year");
        const year = yearParam ? parseInt(yearParam) : undefined;

        const createdAtFilter = toYearRange(year);

        // ==============================================
        // 🧩 Ambil data campaign bulan ini dan bulan sebelumnya
        // ==============================================
        const now = new Date();
        const thisMonthRange = { gte: startOfMonth(now), lt: endOfMonth(now) };
        const prevMonthRange = {
            gte: startOfMonth(subMonths(now, 1)),
            lt: endOfMonth(subMonths(now, 1)),
        };

        const [thisMonthCampaigns, prevMonthCampaigns] = await Promise.all([
            db.campaign.findMany({
                where: {
                    ...(salesId ? { userId: salesId } : {}),
                    ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
                    createdAt: thisMonthRange,
                },
                select: {
                    id: true,
                    customerId: true,
                    finalDecision: true,
                    createdAt: true,
                    leadScores: {
                        orderBy: { createdAt: "desc" },
                        take: 1,
                        select: { score: true },
                    },
                },
            }),
            db.campaign.findMany({
                where: {
                    ...(salesId ? { userId: salesId } : {}),
                    ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
                    createdAt: prevMonthRange,
                },
                select: {
                    id: true,
                    customerId: true,
                    finalDecision: true,
                    createdAt: true,
                    leadScores: {
                        orderBy: { createdAt: "desc" },
                        take: 1,
                        select: { score: true },
                    },
                },
            }),
        ]);

        // ==============================================
        // 🧠 Hitung summary bulan ini
        // ==============================================
        const distinctCustomerIds = new Set(thisMonthCampaigns.map(c => c.customerId));
        const totalCustomers = distinctCustomerIds.size;

        const totalCampaigns = thisMonthCampaigns.length;
        const agreedCount = thisMonthCampaigns.filter(c => c.finalDecision === "agreed").length;
        const approvalRate = totalCampaigns > 0 ? agreedCount / totalCampaigns : 0;

        const contactedCustomers = thisMonthCampaigns.filter(
            c => c.finalDecision && c.finalDecision !== "pending"
        ).length;

        // ==============================================
        // 📊 Distribusi Skor
        // ==============================================
        const latestScorePerCustomer = new Map<string, number>();
        thisMonthCampaigns
            .slice()
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .forEach(c => {
                const s = c.leadScores?.[0]?.score;
                if (s !== undefined && s !== null) {
                    if (!latestScorePerCustomer.has(c.customerId)) {
                        latestScorePerCustomer.set(c.customerId, s);
                    }
                }
            });

        let high = 0,
            medium = 0,
            low = 0;
        latestScorePerCustomer.forEach(score => {
            const band = toScoreBand(score);
            if (band === "high") high++;
            else if (band === "medium") medium++;
            else low++;
        });

        const denom = Math.max(1, high + medium + low);
        const scoreDistribution = {
            high: high / denom,
            medium: medium / denom,
            low: low / denom,
        };

        // ==============================================
        // 📈 Hitung growth dibanding bulan sebelumnya
        // ==============================================
        const prevDistinct = new Set(prevMonthCampaigns.map(c => c.customerId));
        const prevCustomers = prevDistinct.size;

        const prevCampaigns = prevMonthCampaigns.length;
        const prevAgreed = prevMonthCampaigns.filter(c => c.finalDecision === "agreed").length;
        const prevApprovalRate = prevCampaigns > 0 ? prevAgreed / prevCampaigns : 0;
        const prevContacted = prevMonthCampaigns.filter(
            c => c.finalDecision && c.finalDecision !== "pending"
        ).length;

        const calcGrowth = (curr: number, prev: number) =>
            prev > 0 ? ((curr - prev) / prev) * 100 : 0;

        const growth = {
            customers: calcGrowth(totalCustomers, prevCustomers),
            approvalRate: calcGrowth(approvalRate, prevApprovalRate),
            contacted: calcGrowth(contactedCustomers, prevContacted),
        };

        // ==============================================
        // ✅ Response ke frontend
        // ==============================================
        return NextResponse.json(
            {
                totalCustomers,
                approvalRate,
                contactedCustomers,
                scoreDistribution,
                months: MONTHS,
                growth, // 👈 tambahan di sini
            },
            { status: 200 }
        );
    } catch (e) {
        console.error("[API_ADMIN_SUMMARY_ERROR]", e);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
