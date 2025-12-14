import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyJwt } from "@/lib/auth";
import { cookies } from "next/headers";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { CallResult } from "@prisma/client";

/**
 * =========================================================
 *  API — /api/customers/[id]/calls
 * =========================================================
 * Fungsi:
 *   Mencatat hasil panggilan (telepon) oleh Sales kepada Customer
 *   serta memperbarui status penawaran terakhir (finalDecision)
 *   pada campaign yang terkait.
 *
 * Akses:
 *   - Hanya user yang memiliki JWT valid (Sales/Admin).
 *
 * Alur utama:
 *   1. Autentikasi JWT dari cookie "token"
 *   2. Validasi input (note, callResult, statusPenawaran)
 *   3. Simpan log interaksi ke tabel `interactionLog`
 *   4. Update status penawaran terakhir di tabel `campaign`
 * =========================================================
 */

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
                callResult: safeCallResult,
                customerId: id,
                userId,
            },
        });

        if (statusPenawaran) {
            const latestCampaign = await db.campaign.findFirst({
                where: { customerId: id },
                orderBy: { createdAt: "desc" },
            });

            if (latestCampaign) {
                // ✅ Normalisasi nilai statusPenawaran agar sesuai enum FinalDecision
                let safeFinalDecision: "agreed" | "declined" | "pending" | null | undefined = undefined;
                const normalizedStatus = statusPenawaran.trim().toLowerCase();
                if (normalizedStatus === "agreed") safeFinalDecision = "agreed";
                else if (normalizedStatus === "declined") safeFinalDecision = "declined";
                else if (normalizedStatus === "pending") safeFinalDecision = "pending";

                await db.campaign.update({
                    where: { id: latestCampaign.id },
                    data: {
                        finalDecision: safeFinalDecision,
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
        console.error("[CALLS_API_ERROR]", error);
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
