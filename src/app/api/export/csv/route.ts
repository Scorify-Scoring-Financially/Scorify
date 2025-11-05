import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

/**
 * Helper Sederhana untuk mengubah JSON menjadi string CSV
 * Catatan: Ini helper dasar. Untuk data yang sangat kompleks (misal, ada koma
 * di dalam data), Anda mungkin butuh library 'papaparse'.
 */
function convertToCSV(data: any[]) {
    if (data.length === 0) {
        return 'Nama,Usia,Pekerjaan,Status Pinjaman,Skor,Status Interaksi\n';
    }

    // Ambil header dari data pertama (sesuai UI)
    const headers = [
        'Nama',
        'Usia',
        'Pekerjaan',
        'Status Pinjaman',
        'Skor',
        'Status Interaksi',
    ];

    const headerRow = headers.join(',');

    // Ubah setiap baris data (JSON) menjadi baris CSV
    const dataRows = data.map(row => {
        // Pastikan urutannya sama dengan header
        return [
            `"${row.nama.replace(/"/g, '""')}"`, // Handle tanda kutip di dalam nama
            row.usia,
            `"${row.pekerjaan.replace(/"/g, '""')}"`,
            `"${row.status.replace(/"/g, '""')}"`,
            row.skor,
            `"${row.interaksi.replace(/"/g, '""')}"`,
        ].join(',');
    });

    // Gabungkan header dan data
    return [headerRow, ...dataRows].join('\n');
}

// ==========================================================
// API HANDLER
// ==========================================================

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl;

        // 1. Ambil filter (SAMA PERSIS dengan API /api/customers)
        const search = searchParams.get('search') || '';
        const filter = searchParams.get('filter') || 'Semua';

        // 2. Bangun 'where' clause (SAMA PERSIS)
        const where: Prisma.CustomerWhereInput = {};

        if (search) {
            where.name = {
                contains: search,
                mode: 'insensitive',
            };
        }
        if (filter === 'Tinggi') {
            where.leadScores = { some: { score: { gte: 0.8 } } };
        } else if (filter === 'Sedang') {
            where.leadScores = { some: { score: { gte: 0.5, lt: 0.8 } } };
        } else if (filter === 'Rendah') {
            where.leadScores = { some: { score: { lt: 0.5 } } };
        }

        // 3. Ambil SEMUA data (Tanpa Pagination/Limit)
        const customers = await db.customer.findMany({
            where: where,
            include: {
                leadScores: { orderBy: { createdAt: 'desc' }, take: 1 },
                campaigns: { orderBy: { createdAt: 'desc' }, take: 1 },
            },
            // Urutkan berdasarkan nama
            orderBy: { name: 'asc' }
        });

        // 4. Format data (SAMA PERSIS)
        const formattedData = customers.map((customer) => ({
            id: customer.id,
            nama: customer.name,
            usia: customer.age,
            pekerjaan: customer.job,
            status: customer.loan,
            skor: customer.leadScores[0]?.score || null,
            interaksi: customer.campaigns[0]?.poutcome || 'nonexistent',
        }));

        // 5. Ubah data JSON ke string CSV
        const csvData = convertToCSV(formattedData);

        // 6. Kirim balikan sebagai file CSV
        return new NextResponse(csvData, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                // Header ini akan "memaksa" browser untuk men-download file-nya
                'Content-Disposition': `attachment; filename="scorify_export_${new Date().toISOString().split('T')[0]}.csv"`,
            },
        });

    } catch (error) {
        console.error('[API_EXPORT_CSV_ERROR]', error);
        return NextResponse.json(
            { error: 'An internal server error occurred' },
            { status: 500 }
        );
    }
}
