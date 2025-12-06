import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

// 🚫 Matikan cache Next.js di level server
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * ✅ GET: Ambil semua sales (hanya role = Sales)
 */
export async function GET() {
    try {
        const sales = await db.user.findMany({
            where: { role: "Sales" },
            select: { id: true, name: true, email: true },
            orderBy: { id: "asc" },
        });

        return NextResponse.json({ sales }, { status: 200 });
    } catch (error) {
        console.error("[GET_SALES_ERROR]", error);
        return NextResponse.json(
            { error: "Gagal mengambil data sales" },
            { status: 500 }
        );
    }
}

/**
 * ✅ POST: Tambah sales baru (ID otomatis increment)
 */
export async function POST(req: Request) {
    try {
        const body = (await req.json()) as {
            name?: string;
            email?: string;
            password?: string;
        };

        const { name, email, password } = body;

        if (!name || !email || !password) {
            return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
        }

        // Pastikan email unik
        const existing = await db.user.findUnique({ where: { email } });
        if (existing) {
            return NextResponse.json({ error: "Email sudah digunakan" }, { status: 400 });
        }

        // Ambil ID terakhir dari DB (yang role-nya Sales)
        const last = await db.user.findFirst({
            where: { role: "Sales" },
            orderBy: { id: "desc" },
            select: { id: true },
        });

        // Generate ID baru (S001, S002, dst)
        let newId = "S001";
        if (last?.id?.startsWith("S")) {
            const num = parseInt(last.id.slice(1), 10);
            if (!Number.isNaN(num)) {
                newId = `S${(num + 1).toString().padStart(3, "0")}`;
            }
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
    } catch (error) {
        console.error("[POST_SALES_ERROR]", error);
        return NextResponse.json(
            { error: "Gagal menambah sales" },
            { status: 500 }
        );
    }
}

/**
 * ✅ PUT: Update data sales (boleh ubah nama/email/password)
 */
export async function PUT(req: Request) {
    try {
        const body = (await req.json()) as {
            id?: string;
            name?: string;
            email?: string;
            password?: string;
        };

        const { id, name, email, password } = body;

        if (!id) {
            return NextResponse.json({ error: "ID wajib diisi" }, { status: 400 });
        }

        const data: Record<string, string> = {};
        if (name) data.name = name;
        if (email) data.email = email;
        if (password && password.trim() !== "") {
            data.passwordHash = await bcrypt.hash(password, 10);
        }

        await db.user.update({
            where: { id },
            data,
        });

        return NextResponse.json(
            { message: "Sales berhasil diperbarui" },
            { status: 200 }
        );
    } catch (error) {
        console.error("[PUT_SALES_ERROR]", error);
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
            return NextResponse.json({ error: "ID tidak ditemukan" }, { status: 400 });
        }

        // Pastikan ID ada sebelum dihapus
        const existing = await db.user.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json({ error: "Sales tidak ditemukan" }, { status: 404 });
        }

        await db.user.delete({ where: { id } });

        return NextResponse.json(
            { message: `Sales ${id} berhasil dihapus` },
            { status: 200 }
        );
    } catch (error) {
        console.error("[DELETE_SALES_ERROR]", error);
        return NextResponse.json(
            { error: "Gagal menghapus sales" },
            { status: 500 }
        );
    }
}
