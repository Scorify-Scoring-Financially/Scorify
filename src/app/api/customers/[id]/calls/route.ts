import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

// ✅ Next.js 15 route handler type
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const body = await request.json();
        const { note, callResult, statusPenawaran } = body;

        // 🧩 Validasi input
        if (!id || !note) {
            return NextResponse.json(
                { error: "Data tidak lengkap" },
                { status: 400 }
            );
        }

        // 🧠 Simpan log panggilan ke InteractionLog
        const log = await db.interactionLog.create({
            data: {
                type: "PANGGILAN_TELEPON",
                note: note.trim(),
                callResult,
                customerId: id,
                userId: null, // nanti bisa diisi ID sales yg login
            },
        });

        // ✅ Jika ada statusPenawaran, update campaign terakhir
        if (statusPenawaran) {
            const latestCampaign = await db.campaign.findFirst({
                where: { customerId: id },
                orderBy: { createdAt: "desc" },
            });

            if (latestCampaign) {
                await db.campaign.update({
                    where: { id: latestCampaign.id },
                    data: { finalDecision: statusPenawaran },
                });
            }
        }

        return NextResponse.json(
            { message: "Panggilan dan status penawaran tersimpan", data: log },
            { status: 201 }
        );
    } catch (error) {
        console.error("[API_CUSTOMER_CALL_ERROR]", error);

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
