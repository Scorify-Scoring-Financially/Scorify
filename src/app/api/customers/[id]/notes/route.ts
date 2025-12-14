import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyJwt } from "@/lib/auth";
import { cookies } from "next/headers";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

/**
 * =========================================================
 *  API — /api/customers/[id]/notes
 * =========================================================
 * Fungsi:
 *   Menambahkan catatan internal (non-panggilan) ke riwayat
 *   interaksi customer oleh user (Sales/Admin).
 *
 * Akses:
 *   - Hanya user dengan token JWT valid.
 *
 * Alur:
 *   1 Verifikasi JWT dari cookie.
 *   2 Validasi input request body.
 *   3 Pastikan customer benar-benar ada di database.
 *   4 Tambahkan catatan ke tabel `interactionLog`.
 * =========================================================
 */

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const body = await request.json();
        const { note } = body as { note?: string };

        // Ambil token user dari cookies
        const cookieStore = await cookies();
        const token = cookieStore.get("token");

        if (!token) {
            return NextResponse.json(
                { error: "Unauthorized: No token provided" },
                { status: 401 }
            );
        }

        // Verifikasi JWT dan ambil ID user
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
                { error: "Customer ID dan catatan wajib diisi" },
                { status: 400 }
            );
        }

        // Tambahkan catatan baru di InteractionLog
        const newNote = await db.interactionLog.create({
            data: {
                type: "CATATAN_INTERNAL",
                note: note.trim(),
                customerId: id,
                callResult: "unknown",
                userId, // ID user dari JWT (sales/admin yang login)
            },
        });

        return NextResponse.json(
            { message: "Catatan berhasil ditambahkan", note: newNote },
            { status: 201 }
        );
    } catch (error: unknown) {
        if (error instanceof PrismaClientKnownRequestError && error.code === "P2023") {
            return NextResponse.json(
                { error: "Invalid Customer ID format" },
                { status: 400 }
            );
        }

        if (error instanceof Error) {
            console.error("[API_ADD_NOTE_ERROR]", {
                name: error.name,
                message: error.message,
            });
        } else {
            console.error("[API_ADD_NOTE_ERROR]", error);
        }

        return NextResponse.json(
            { error: "Terjadi kesalahan pada server" },
            { status: 500 }
        );
    }
}
