import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { formatEnumValue } from "@/lib/format";

// Non-cache
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Kamus manual untuk terjemahan enum → Bahasa Indonesia
const translateMap: Record<string, string> = {
    pending: "Tertunda",
    agreed: "Disetujui",
    declined: "Ditolak",
    success: "Berhasil",
    failure: "Gagal",
    "no_answer": "Tidak Dijawab",
    unknown: "Tidak Diketahui",
    nonexistent: "Tidak Ada",
};

// Fungsi bantu untuk terjemahkan hasil enum ke Bahasa Indonesia
function translateValue(value: string | null | undefined): string {
    if (!value) return "-";
    const lower = value.toLowerCase();
    return translateMap[lower] || value;
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl;

        // Pagination & filter params
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const search = searchParams.get("search") || "";
        const filter = searchParams.get("filter") || "Semua";

        const skip = (page - 1) * limit;
        const where: Prisma.CustomerWhereInput = {};

        // Filter nama
        if (search) {
            where.name = { contains: search, mode: "insensitive" };
        }

        // Filter skor
        if (filter === "Tinggi") {
            where.leadScores = { some: { score: { gte: 0.8 } } };
        } else if (filter === "Sedang") {
            where.leadScores = { some: { score: { gte: 0.6, lt: 0.8 } } };
        } else if (filter === "Rendah") {
            where.leadScores = { some: { score: { lt: 0.6 } } };
        }

        // Jalankan query paralel
        const [customers, totalItems] = await db.$transaction([
            db.customer.findMany({
                skip,
                take: limit,
                where,
                include: {
                    leadScores: {
                        orderBy: { createdAt: "desc" },
                        take: 1,
                    },
                    campaigns: {
                        orderBy: { createdAt: "desc" },
                        take: 1,
                        select: {
                            finalDecision: true,
                        },
                    },
                    interactionLogs: {
                        orderBy: { createdAt: "desc" },
                        take: 1,
                        select: {
                            callResult: true,
                        },
                    },
                },
                orderBy: { name: "asc" },
            }),
            db.customer.count({ where }),
        ]);

        const totalPages = Math.ceil(totalItems / limit);

        // Format data akhir
        const formattedData = customers.map((customer) => ({
            id: customer.id,
            nama: customer.name,
            usia: customer.age,
            pekerjaan: formatEnumValue(customer.job),
            phone: customer.phone ?? "-",
            address: customer.address ?? "-",
            status: translateValue(customer.campaigns[0]?.finalDecision || "pending"),
            skor: customer.leadScores[0]?.score ?? null,
            interaksi: translateValue(customer.interactionLogs[0]?.callResult || "unknown"),
        }));

        return NextResponse.json(
            {
                data: formattedData,
                pagination: {
                    totalItems,
                    totalPages,
                    currentPage: page,
                    itemsPerPage: limit,
                },
            },
            {
                status: 200,
                headers: {
                    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
                    "Pragma": "no-cache",
                    "Expires": "0",
                },
            }
        );
    } catch (error) {
        console.error("[API_CUSTOMERS_ERROR]", error);
        return NextResponse.json(
            { error: "Terjadi kesalahan pada server" },
            { status: 500 }
        );
    }
}
