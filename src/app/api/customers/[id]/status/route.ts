import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

// ✅ Format resmi untuk Next.js 15 (params adalah Promise)
export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params; // ⬅️ HARUS pakai await
        const body = await request.json();
        const { statusPenawaran } = body;

        // 🧩 Validasi input
        if (!id || !statusPenawaran) {
            return NextResponse.json(
                { error: "Customer ID dan status penawaran wajib diisi" },
                { status: 400 }
            );
        }

        // 🧠 Ambil campaign terakhir dari customer ini
        const latestCampaign = await db.campaign.findFirst({
            where: { customerId: id },
            orderBy: { createdAt: "desc" },
        });

        if (!latestCampaign) {
            return NextResponse.json(
                { error: "Campaign untuk nasabah ini tidak ditemukan" },
                { status: 404 }
            );
        }

        // ✅ Update status penawaran di campaign
        const updated = await db.campaign.update({
            where: { id: latestCampaign.id },
            data: { finalDecision: statusPenawaran },
        });

        return NextResponse.json(
            { message: "Status penawaran berhasil diperbarui", data: updated },
            { status: 200 }
        );
    } catch (error) {
        console.error("[API_UPDATE_STATUS_PENAWARAN_ERROR]", error);

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
