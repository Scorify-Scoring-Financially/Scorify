import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

// Non-cache
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * ✅ GET: Ambil semua sales (role = "Sales")
 */
export async function GET() {
    try {
        const sales = await db.user.findMany({
            where: { role: "Sales" },
            select: { id: true, name: true, email: true },
            orderBy: { id: "asc" },
        });

        return NextResponse.json({ sales }, { status: 200 });
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error("[GET_SALES_ERROR]", {
                name: error.name,
                message: error.message,
            });
        } else {
            console.error("[GET_SALES_ERROR]", error);
        }

        return NextResponse.json(
            { error: "Gagal mengambil data sales" },
            { status: 500 }
        );
    }
}

/**
 * ✅ POST: Tambah sales baru (ID otomatis "sales_1", "sales_2", dst)
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { id: incomingId, name, email, password } = body as {
            id?: string;
            name?: string;
            email?: string;
            password?: string;
        };

        if (!name || !email || !password) {
            return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
        }

        // Cek duplikasi email
        const existingEmail = await db.user.findUnique({ where: { email } });
        if (existingEmail) {
            return NextResponse.json(
                { error: "Email sudah digunakan" },
                { status: 400 }
            );
        }

        // Ambil ID terakhir dari Sales
        const lastSales = await db.user.findFirst({
            where: { role: "Sales" },
            orderBy: { id: "desc" },
            select: { id: true },
        });

        let newId = "sales_1";
        if (incomingId && incomingId.startsWith("sales_")) {
            newId = incomingId;
        } else if (lastSales?.id?.startsWith("sales_")) {
            const num = parseInt(lastSales.id.replace("sales_", ""), 10);
            const next = Number.isNaN(num) ? 1 : num + 1;
            newId = `sales_${next}`;
        }

        // Hash password
        const hashed = await bcrypt.hash(password, 10);

        // Simpan ke DB
        await db.user.create({
            data: {
                id: newId,
                name,
                email,
                passwordHash: hashed,
                role: "Sales",
            },
        });

        return NextResponse.json(
            { message: "Sales berhasil ditambahkan", id: newId },
            { status: 201 }
        );
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error("[POST_SALES_ERROR]", {
                name: error.name,
                message: error.message,
            });
        } else {
            console.error("[POST_SALES_ERROR]", error);
        }

        return NextResponse.json(
            { error: "Gagal menambah sales" },
            { status: 500 }
        );
    }
}

/**
 * ✅ PUT: Update data sales (nama/email/password opsional)
 */
export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const { id, name, email, password } = body as {
            id?: string;
            name?: string;
            email?: string;
            password?: string;
        };

        if (!id) {
            return NextResponse.json({ error: "ID wajib diisi" }, { status: 400 });
        }

        const existing = await db.user.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json(
                { error: "Sales tidak ditemukan" },
                { status: 404 }
            );
        }

        const updateData: Record<string, string> = {};
        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (password && password.trim() !== "") {
            updateData.passwordHash = await bcrypt.hash(password, 10);
        }

        await db.user.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json(
            { message: `Sales ${id} berhasil diperbarui` },
            { status: 200 }
        );
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error("[PUT_SALES_ERROR]", {
                name: error.name,
                message: error.message,
            });
        } else {
            console.error("[PUT_SALES_ERROR]", error);
        }

        return NextResponse.json(
            { error: "Gagal memperbarui sales" },
            { status: 500 }
        );
    }
}

/**
 * ✅ DELETE: Hapus sales berdasarkan ID
 */
export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "ID wajib diisi" }, { status: 400 });
        }

        const existing = await db.user.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json(
                { error: `Sales ${id} tidak ditemukan` },
                { status: 404 }
            );
        }

        await db.user.delete({ where: { id } });

        return NextResponse.json(
            { message: `Sales ${id} berhasil dihapus` },
            { status: 200 }
        );
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error("[DELETE_SALES_ERROR]", {
                name: error.name,
                message: error.message,
            });
        } else {
            console.error("[DELETE_SALES_ERROR]", error);
        }

        return NextResponse.json(
            { error: "Gagal menghapus sales" },
            { status: 500 }
        );
    }
}
