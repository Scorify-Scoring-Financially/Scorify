import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { Prisma, FinalDecision } from "@prisma/client"; // ← tambahkan ini
import { startOfYear, subYears } from "date-fns";

/**
 * =========================================================
 *  API — GET /api/reports/admin/summary
 * =========================================================
 * Fitur:
 *   - Statistik laporan tahunan (total customer, approval rate, dll.)
 *   - Semua metrik mengikuti filter: salesId, year, status.
 *   - Data mencakup growth perbandingan tahun ini vs tahun lalu.
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
        gte: startOfYear(new Date(year, 0, 1)),
        lt: startOfYear(new Date(year + 1, 0, 1)),
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
        const prevYearRange = {
            gte: startOfYear(subYears(new Date(year, 0, 1), 1)),
            lt: startOfYear(new Date(year, 0, 1)),
        };

        // ✅ mapping dari string ke enum FinalDecision
        const statusFilter: FinalDecision | undefined =
            statusParam === "agreed"
                ? FinalDecision.agreed
                : statusParam === "declined"
                    ? FinalDecision.declined
                    : statusParam === "pending"
                        ? FinalDecision.pending
                        : undefined;

        // === Filter dinamis utama untuk campaign ===
        const campaignFilter: Prisma.CampaignWhereInput = {
            ...(yearRange ? { createdAt: yearRange } : {}),
            ...(salesId !== "all" ? { userId: salesId } : {}),
            ...(statusFilter ? { finalDecision: statusFilter } : {}),
        };

        const prevCampaignFilter: Prisma.CampaignWhereInput = {
            ...(prevYearRange ? { createdAt: prevYearRange } : {}),
            ...(salesId !== "all" ? { userId: salesId } : {}),
            ...(statusFilter ? { finalDecision: statusFilter } : {}),
        };

        // === Ambil data paralel ===
        const [thisYearCampaigns, prevYearCampaigns, scoresThisYear] = await Promise.all([
            db.campaign.findMany({
                where: campaignFilter,
                select: { id: true, customerId: true, finalDecision: true },
            }),
            db.campaign.findMany({
                where: prevCampaignFilter,
                select: { id: true, customerId: true, finalDecision: true },
            }),
            db.leadscore.findMany({
                where: {
                    createdat: yearRange,
                    Campaign: {
                        ...(salesId !== "all" ? { userId: salesId } : {}),
                    },
                },
                orderBy: { createdat: "desc" },
                select: { customerid: true, score: true },
            }),
        ]);

        // === Total Nasabah (dinamis mengikuti filter) ===
        const distinctCustomers = new Set(thisYearCampaigns.map((c) => c.customerId));
        const totalCustomers = distinctCustomers.size;

        // === Tingkat Persetujuan Deposito ===
        const agreed = thisYearCampaigns.filter((c) => c.finalDecision === "agreed").length;
        const declined = thisYearCampaigns.filter((c) => c.finalDecision === "declined").length;
        const decided = agreed + declined;
        const approvalRate = decided > 0 ? agreed / decided : 0;

        // === Jumlah Nasabah Dihubungi ===
        const contacted = new Set(
            thisYearCampaigns
                .filter((c) => c.finalDecision !== "pending")
                .map((c) => c.customerId)
        ).size;

        // === Distribusi Skor ===
        const latestScorePerCustomer = new Map<string, number>();
        for (const s of scoresThisYear) {
            if (!latestScorePerCustomer.has(s.customerid)) {
                latestScorePerCustomer.set(s.customerid, s.score ?? 0);
            }
        }

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

        // === Growth (tahun lalu) ===
        const prevDistinctCustomers = new Set(prevYearCampaigns.map((c) => c.customerId)).size;
        const prevAgreed = prevYearCampaigns.filter((c) => c.finalDecision === "agreed").length;
        const prevDeclined = prevYearCampaigns.filter((c) => c.finalDecision === "declined").length;
        const prevDecided = prevAgreed + prevDeclined;
        const prevApprovalRate = prevDecided > 0 ? prevAgreed / prevDecided : 0;
        const prevContacted = new Set(
            prevYearCampaigns
                .filter((c) => c.finalDecision !== "pending")
                .map((c) => c.customerId)
        ).size;

        const calcGrowth = (curr: number, prev: number) =>
            prev > 0 ? ((curr - prev) / prev) * 100 : 0;

        const growth = {
            customers: calcGrowth(totalCustomers, prevDistinctCustomers),
            approvalRate: calcGrowth(approvalRate, prevApprovalRate),
            contacted: calcGrowth(contacted, prevContacted),
        };

        // === Return Response ===
        return NextResponse.json(
            {
                totalCustomers,
                approvalRate,
                contactedCustomers: contacted,
                scoreDistribution,
                months: MONTHS,
                growth,
            },
            { status: 200 }
        );
    } catch (error: unknown) {
        console.error("[API_ADMIN_SUMMARY_ERROR]", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
