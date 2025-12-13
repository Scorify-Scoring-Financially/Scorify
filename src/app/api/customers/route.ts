import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { formatEnumValue } from "@/lib/format";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";

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
    no_answer: "Tidak Dijawab",
    unknown: "Tidak Diketahui",
    nonexistent: "Tidak Ada",
};

// Fungsi bantu untuk terjemahkan hasil enum ke Bahasa Indonesia
function translateValue(value: string | null | undefined): string {
    if (!value) return "-";
    const lower = value.toLowerCase();
    return translateMap[lower] || value;
}

// ============================================================
// MAIN HANDLER
// ============================================================
export async function GET(request: NextRequest) {
    try {
        // ======================================================
        // 1️⃣ Ambil user login dari cookie JWT
        // ======================================================
        const cookieStore = await cookies();
        const token = cookieStore.get("token");

        if (!token) {
            return NextResponse.json(
                { error: "Unauthorized: No token provided" },
                { status: 401 }
            );
        }

        const payload = await verifyJwt(token.value);
        if (!payload || !("id" in payload) || !("role" in payload)) {
            return NextResponse.json(
                { error: "Unauthorized: Invalid token" },
                { status: 401 }
            );
        }

        const userId = payload.id as string;
        const userRole = payload.role as string;

        // ======================================================
        // 2️⃣ Ambil query params: pagination, filter, sales
        // ======================================================
        const { searchParams } = request.nextUrl;
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const search = searchParams.get("search") || "";
        const filter = searchParams.get("filter") || "Semua";
        const salesId = searchParams.get("sales") || "";
        const skip = (page - 1) * limit;

        // ======================================================
        // 3️⃣ Bangun kondisi WHERE
        // ======================================================
        const where: Prisma.CustomerWhereInput = {};

        // Filter nama
        if (search) {
            where.name = { contains: search, mode: "insensitive" };
        }

        // Filter skor peluang
        if (filter === "Tinggi") {
            where.leadScores = { some: { score: { gte: 0.8 } } };
        } else if (filter === "Sedang") {
            where.leadScores = { some: { score: { gte: 0.6, lt: 0.8 } } };
        } else if (filter === "Rendah") {
            where.leadScores = { some: { score: { lt: 0.6 } } };
        }

        // ======================================================
        // 4️⃣ Filter berdasarkan role
        // ======================================================
        if (userRole === "Sales") {
            // Sales hanya bisa lihat customer miliknya
            where.campaigns = { some: { userId } };
        } else if (userRole === "Admin" && salesId) {
            // Admin bisa filter berdasarkan sales tertentu
            where.campaigns = { some: { userId: salesId } };
        }

        // ======================================================
        // 5️⃣ Jalankan query paralel (data + count)
        // ======================================================
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
                            userId: true,
                            user: { select: { name: true } },
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

        // ======================================================
        // 6️⃣ Format hasil response
        // ======================================================
        const formattedData = customers.map((customer) => ({
            id: customer.id,
            nama: customer.name,
            usia: customer.age,
            pekerjaan: formatEnumValue(customer.job),
            phone: customer.phone ?? "-",
            address: customer.address ?? "-",
            status: translateValue(customer.campaigns[0]?.finalDecision || "pending"),
            skor: customer.leadScores[0]?.score ?? null,
            interaksi: translateValue(
                customer.interactionLogs[0]?.callResult || "unknown"
            ),
            salesId: customer.campaigns[0]?.userId || null,
            salesName: customer.campaigns[0]?.user?.name || "-",
        }));

        // ======================================================
        // 7️⃣ Kirim response sukses
        // ======================================================
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
                    "Cache-Control":
                        "no-store, no-cache, must-revalidate, proxy-revalidate",
                    Pragma: "no-cache",
                    Expires: "0",
                },
            }
        );
    } catch (error) {
        console.error("[API_CUSTOMERS_ERROR]", error);

        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2023"
        ) {
            return NextResponse.json(
                { error: "Invalid Customer ID format" },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: "Terjadi kesalahan pada server" },
            { status: 500 }
        );
    }
}
