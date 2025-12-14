import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

/**
 * =========================================================
 *  API — /api/customers/[id]
 * =========================================================
 * Fungsi:
 *   Mengambil detail lengkap nasabah beserta:
 *   - Riwayat interaksi (telepon + catatan internal)
 *   - Skor peluang terbaru
 *   - Status kontak & status penawaran terakhir
 *
 * Akses:
 *   - Dapat dipanggil oleh Admin atau Sales dengan akses data customer.
 *
 * Output:
 *   {
 *     details: {...},
 *     history: [...]
 *   }
 * =========================================================
 */

export async function GET(
    request: NextRequest,
    context: { params: { id: string } }
) {

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
    try {
        const { id } = await context.params;

        if (!id) {
            return NextResponse.json(
                { error: "Customer ID is required" },
                { status: 400 }
            );
        }

        // 🔍 Ambil data customer + relasi lengkap
        const customer = await db.customer.findUnique({
            where: { id },
            include: {
                interactionLogs: {
                    orderBy: { createdAt: "desc" },
                    include: {
                        user: { select: { name: true } },
                    },
                },
                leadScores: {
                    orderBy: { createdAt: "desc" },
                    take: 1,
                },
                campaigns: {
                    orderBy: { createdAt: "desc" },
                    take: 1,
                    select: { finalDecision: true },
                },
            },
        });

        if (!customer) {
            return NextResponse.json(
                { error: "Customer not found" },
                { status: 404 }
            );
        }

        //  Format riwayat interaksi
        const formattedHistory = customer.interactionLogs.map((log) => ({
            id: log.id,
            type:
                log.type === "PANGGILAN_TELEPON"
                    ? "Panggilan Telepon"
                    : "Catatan Internal",
            date: log.createdAt,
            note: log.note,
            result:
                log.type === "CATATAN_INTERNAL"
                    ? ""
                    : `Sales: ${log.user?.name || "System"}. Hasil: ${translateValue(log.callResult) || translateValue("unknown")
                    }`,
        }));

        //  Data tambahan
        const latestScore = customer.leadScores[0]?.score || null;
        const latestInteraction =
            customer.interactionLogs[0]?.callResult || "unknown";
        const statusPenawaran = customer.campaigns[0]?.finalDecision || "pending";

        //  Kirim data JSON
        return NextResponse.json(
            {
                details: {
                    id: customer.id,
                    name: customer.name,
                    age: customer.age,
                    job: customer.job,
                    phone: customer.phone,
                    address: customer.address,
                    skorPeluang: latestScore,
                    statusKontak: latestInteraction,
                    statusPenawaran,
                },
                history: formattedHistory,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("[API_CUSTOMER_DETAIL_ERROR]", error);

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
            { error: "An internal server error occurred" },
            { status: 500 }
        );
    }
}
