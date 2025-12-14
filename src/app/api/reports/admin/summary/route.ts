import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";

/**
 * =========================================================
 *  API — GET /api/reports/sales/summary
 * =========================================================
 * Fitur:
 *   - Statistik laporan bulanan (total customer, approval rate, dsb.)
 *   - Bandingkan data bulan ini vs bulan lalu
 *   - Distribusi skor peluang (high/medium/low)
 *   - Filter by:
 *       • salesId (atau "all")
 *       • year
 *       • statusPenawaran (agreed / declined / pending / all)
 * =========================================================
 */

const MONTHS: string[] = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
    "Jul", "Agus", "Sep", "Okt", "Nov", "Des",
];

function toScoreBand(score: number): "high" | "medium" | "low" {
    if (score >= 0.8) return "high";
    if (score >= 0.6) return "medium";
    return "low";
}

function toYearRange(year?: number): Prisma.DateTimeFilter | undefined {
    if (!year) return undefined;
    return {
        gte: new Date(year, 0, 1, 0, 0, 0),
        lt: new Date(year + 1, 0, 1, 0, 0, 0),
    };
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl;
        const salesId = searchParams.get("salesId") || "all";
        const yearParam = searchParams.get("year");
        const statusParam = (searchParams.get("status") || "all").toLowerCase();

        const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();
        const yearRange = toYearRange(year);

        const where: Prisma.CampaignWhereInput = {
            ...(yearRange ? { createdAt: yearRange } : {}),
        };

        if (salesId !== "all") {
            where.userId = salesId;
        }

        if (statusParam !== "all") {
            where.finalDecision = statusParam as "agreed" | "declined" | "pending";
        }

        const now = new Date();
        const thisMonthRange = { gte: startOfMonth(now), lt: endOfMonth(now) };
        const prevMonthRange = {
            gte: startOfMonth(subMonths(now, 1)),
            lt: endOfMonth(subMonths(now, 1)),
        };

        const [thisMonthCampaigns, prevMonthCampaigns] = await Promise.all([
            db.campaign.findMany({
                where: { ...where, createdAt: thisMonthRange },
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
                where: { ...where, createdAt: prevMonthRange },
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

        const distinctCustomerIds = new Set(thisMonthCampaigns.map((c) => c.customerId));
        const totalCustomers = distinctCustomerIds.size;

        const totalCampaigns = thisMonthCampaigns.length;
        const agreedCount = thisMonthCampaigns.filter((c) => c.finalDecision === "agreed").length;
        const approvalRate = totalCampaigns > 0 ? agreedCount / totalCampaigns : 0;

        const contactedCustomers = thisMonthCampaigns.filter(
            (c) => c.finalDecision && c.finalDecision !== "pending"
        ).length;

        const latestScorePerCustomer = new Map<string, number>();
        thisMonthCampaigns
            .slice()
            .sort((a, b) => {
                const aTime = a.createdAt ? a.createdAt.getTime() : 0;
                const bTime = b.createdAt ? b.createdAt.getTime() : 0;
                return bTime - aTime;
            })
            .forEach((c) => {
                const s = c.leadScores?.[0]?.score;
                if (s !== undefined && s !== null && !latestScorePerCustomer.has(c.customerId)) {
                    latestScorePerCustomer.set(c.customerId, s);
                }
            });

        let high = 0;
        let medium = 0;
        let low = 0;
        latestScorePerCustomer.forEach((score) => {
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

        const prevDistinct = new Set(prevMonthCampaigns.map((c) => c.customerId));
        const prevCustomers = prevDistinct.size;

        const prevCampaigns = prevMonthCampaigns.length;
        const prevAgreed = prevMonthCampaigns.filter((c) => c.finalDecision === "agreed").length;
        const prevApprovalRate = prevCampaigns > 0 ? prevAgreed / prevCampaigns : 0;
        const prevContacted = prevMonthCampaigns.filter(
            (c) => c.finalDecision && c.finalDecision !== "pending"
        ).length;

        const calcGrowth = (curr: number, prev: number) =>
            prev > 0 ? ((curr - prev) / prev) * 100 : 0;

        const growth = {
            customers: calcGrowth(totalCustomers, prevCustomers),
            approvalRate: calcGrowth(approvalRate, prevApprovalRate),
            contacted: calcGrowth(contactedCustomers, prevContacted),
        };

        return NextResponse.json(
            {
                totalCustomers: totalCustomers ?? 0,
                approvalRate: approvalRate ?? 0,
                contactedCustomers: contactedCustomers ?? 0,
                scoreDistribution: scoreDistribution ?? { high: 0, medium: 0, low: 0 },
                months: MONTHS,
                growth: growth ?? { customers: 0, approvalRate: 0, contacted: 0 },
            },
            { status: 200 }
        );
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error("[API_ADMIN_SUMMARY_ERROR]", {
                name: error.name,
                message: error.message,
            });
        } else {
            console.error("[API_ADMIN_SUMMARY_ERROR]", error);
        }

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
