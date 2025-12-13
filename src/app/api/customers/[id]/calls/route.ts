import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyJwt } from "@/lib/auth";
import { cookies } from "next/headers";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";


export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const body = await request.json();
        const { note, callResult, statusPenawaran } = body;

        // Ambil token dari cookie
        const cookieStore = await cookies();
        const token = cookieStore.get("token");

        if (!token) {
            return NextResponse.json(
                { error: "Unauthorized: No token provided" },
                { status: 401 }
            );
        }

        // Verifikasi token JWT
        const payload = await verifyJwt(token.value);
        if (!payload || !("id" in payload)) {
            return NextResponse.json(
                { error: "Unauthorized: Invalid token" },
                { status: 401 }
            );
        }

        const userId = payload.id as string;

        //  Validasi input
        if (!id || !note) {
            return NextResponse.json(
                { error: "Data tidak lengkap" },
                { status: 400 }
            );
        }

        //  Simpan log panggilan ke InteractionLog
        const log = await db.interactionLog.create({
            data: {
                type: "PANGGILAN_TELEPON",
                note: note.trim(),
                callResult,
                customerId: id,
                userId, // ⬅️ ID user dari JWT
            },
        });

        // Jika ada statusPenawaran, update campaign terakhir milik customer
        if (statusPenawaran) {
            const latestCampaign = await db.campaign.findFirst({
                where: { customerId: id },
                orderBy: { createdAt: "desc" },
            });

            if (latestCampaign) {
                await db.campaign.update({
                    where: { id: latestCampaign.id },
                    data: {
                        finalDecision: statusPenawaran,
                        userId, // ⬅ simpan siapa sales yang terakhir update campaign
                    },
                });
            }
        }

        return NextResponse.json(
            {
                message: "Panggilan dan status penawaran tersimpan",
                data: log,
            },
            { status: 201 }
        );
    } catch (error: unknown) {
        console.error("[API_CUSTOMER_CALL_ERROR]", {
            name: error.name,
            message: error.message,
            code: error.code,
        });

        if (
            error instanceof PrismaClientKnownRequestError &&
            error.code === "P2023"
        ) {
            return NextResponse.json(
                { error: "Invalid Customer ID format" },
                { status: 400 }
            );
        }

        return NextResponse.json(
            {
                error: "Terjadi kesalahan pada server",
                debug: {
                    name: error?.name,
                    message: error?.message,
                    code: error?.code,
                    stack: error?.stack,
                },
            },
            { status: 500 }
        );
    }
}
