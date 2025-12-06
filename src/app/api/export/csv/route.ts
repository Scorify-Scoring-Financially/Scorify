import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

// ✅ Definisikan tipe data untuk ekspor CSV (lebih aman daripada any[])
interface ExportRow {
    nama: string;
    usia: number;
    pekerjaan: string;
    status: string;
    skor: number | null;
    interaksi: string;
}

// ==========================================================
// 🔧 Fungsi: Konversi data JSON → CSV
// ==========================================================
function convertToCSV(data: ExportRow[]): string {
    if (data.length === 0) {
        return "Nama,Usia,Pekerjaan,Status Pinjaman,Skor,Status Interaksi\n";
    }

    const headers = [
        "Nama",
        "Usia",
        "Pekerjaan",
        "Status Pinjaman",
        "Skor",
        "Status Interaksi",
    ];

    const headerRow = headers.join(",");

    const dataRows = data.map((row) => {
        return [
            `"${row.nama.replace(/"/g, '""')}"`,
            row.usia,
            `"${row.pekerjaan.replace(/"/g, '""')}"`,
            `"${row.status.replace(/"/g, '""')}"`,
            row.skor ?? "",
            `"${row.interaksi.replace(/"/g, '""')}"`,
        ].join(",");
    });

    return [headerRow, ...dataRows].join("\n");
}

// ==========================================================
// API HANDLER
// ==========================================================

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl;

        const search = searchParams.get("search") || "";
        const filter = searchParams.get("filter") || "Semua";

        const where: Prisma.CustomerWhereInput = {};

        if (search) {
            where.name = {
                contains: search,
                mode: "insensitive",
            };
        }

        if (filter === "Tinggi") {
            where.leadScores = { some: { score: { gte: 0.8 } } };
        } else if (filter === "Sedang") {
            where.leadScores = { some: { score: { gte: 0.5, lt: 0.8 } } };
        } else if (filter === "Rendah") {
            where.leadScores = { some: { score: { lt: 0.5 } } };
        }

        const customers = await db.customer.findMany({
            where,
            include: {
                leadScores: { orderBy: { createdAt: "desc" }, take: 1 },
                campaigns: { orderBy: { createdAt: "desc" }, take: 1 },
            },
            orderBy: { name: "asc" },
        });

        const formattedData: ExportRow[] = customers.map((customer) => ({
            nama: customer.name,
            usia: customer.age,
            pekerjaan: customer.job,
            status: customer.loan,
            skor: customer.leadScores[0]?.score ?? null,
            interaksi: customer.campaigns[0]?.poutcome ?? "nonexistent",
        }));

        const csvData = convertToCSV(formattedData);

        return new NextResponse(csvData, {
            status: 200,
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename="scorify_export_${new Date()
                    .toISOString()
                    .split("T")[0]}.csv"`,
            },
        });
    } catch (error) {
        console.error("[API_EXPORT_CSV_ERROR]", error);
        return NextResponse.json(
            { error: "An internal server error occurred" },
            { status: 500 }
        );
    }
}
