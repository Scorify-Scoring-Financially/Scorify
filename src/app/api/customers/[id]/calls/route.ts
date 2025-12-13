import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyJwt } from "@/lib/auth";
import { cookies } from "next/headers";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { CallResult } from "@prisma/client"; // ✅ tambahan import enum

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const body = await request.json();
        const { note, callResult, statusPenawaran } = body as {
            note?: string;
            callResult?: string;
            statusPenawaran?: string;
        };

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
        if (!payload || typeof payload !== "object" || !("id" in payload)) {
            return NextResponse.json(
                { error: "Unauthorized: Invalid token" },
                { status: 401 }
            );
        }

        const userId = payload.id as string;

        // Validasi input
        if (!id || !note) {
            return NextResponse.json(
                { error: "Data tidak lengkap" },
                { status: 400 }
            );
        }

        // ✅ Normalisasi nilai callResult agar sesuai enum CallResult
        let safeCallResult: CallResult | null | undefined = undefined;
        if (callResult) {
            const normalized = callResult.trim().toLowerCase();
            if (normalized === "success") safeCallResult = "success";
            else if (normalized === "failure") safeCallResult = "failure";
            else if (normalized === "no_answer" || normalized === "no answer") safeCallResult = "no_answer";
            else safeCallResult = "unknown";
        }

        // Simpan log panggilan ke InteractionLog
        const log = await db.interactionLog.create({
            data: {
                type: "PANGGILAN_TELEPON",
                note: note.trim(),
                callResult: safeCallResult, // ✅ gunakan nilai aman
                customerId: id,
                userId,
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
                        userId,
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
        if (error instanceof PrismaClientKnownRequestError) {
            if (error.code === "P2023") {
                return NextResponse.json(
                    { error: "Invalid Customer ID format" },
                    { status: 400 }
                );
            }
        }

        if (error instanceof Error) {
            console.error("[API_CUSTOMER_CALL_ERROR]", {
                name: error.name,
                message: error.message,
            });
        } else {
            console.error("[API_CUSTOMER_CALL_ERROR]", error);
        }

        return NextResponse.json(
            {
                error: "Terjadi kesalahan pada server",
            },
            { status: 500 }
        );
    }
}
