import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

// =========================================================
//   Konfigurasi Non-Cache untuk API Route
// =========================================================
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * =========================================================
 *   SALES MANAGEMENT API
 * =========================================================
 *  Endpoint ini mengatur seluruh operasi CRUD terkait akun "Sales"
 *  dalam sistem Scorify. Masing-masing method mewakili operasi:
 *
 *  - GET     → Ambil daftar semua sales.
 *  - POST    → Tambah sales baru (auto-generate ID).
 *  - PUT     → Perbarui data sales (parsial).
 *  - DELETE  → Hapus sales berdasarkan ID.
 *
 *  Semua data disimpan pada tabel `user` dengan kolom `role = "Sales"`.
 * =========================================================
 */


/* =========================================================
    GET /api/sales
   ---------------------------------------------------------
   Mengambil semua pengguna dengan peran "Sales".
   Output disusun berdasarkan urutan ID secara ascending.
   ========================================================= */
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

/* =========================================================
    POST /api/sales
   ---------------------------------------------------------
   Menambahkan sales baru ke database.

   Request Body:
   {
       "name": "Nama Sales",
       "email": "email@contoh.com",
       "password": "plaintext123"
   }

   Logika Utama:
   - Validasi data wajib.
   - Cek duplikasi email.
   - Generate ID otomatis → "sales_1", "sales_2", dst.
   - Simpan user dengan password ter-hash dan role "Sales".
   ========================================================= */
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

/* =========================================================
    PUT /api/sales
   ---------------------------------------------------------
   Memperbarui data sales yang sudah ada.
   Hanya field yang dikirim dalam body yang akan diubah.

   Request Body:
   {
       "id": "sales_1",
       "name": "Nama Baru",
       "email": "email@baru.com",
       "password": "passwordBaru123"
   }

   Logika:
   - Validasi `id` wajib.
   - Cek apakah sales dengan ID tersebut ada.
   - Update hanya field yang diberikan (parsial).
   ========================================================= */
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

/* =========================================================
    DELETE /api/sales?id=sales_1
   ---------------------------------------------------------
   Menghapus data sales berdasarkan ID.

   Query Parameter:
   - id (string) → contoh: sales_1

   Logika:
   - Validasi parameter `id`.
   - Cek apakah sales ditemukan.
   - Hapus dari database.
   ========================================================= */
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
