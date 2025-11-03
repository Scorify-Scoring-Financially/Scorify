import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl;

        // 1. Ambil Query Params dari URL
        // Frontend akan memanggil: /api/customers?page=1&limit=10&search=Ahmad&filter=Tinggi

        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10'); // <-- DEFAULT 10

        const search = searchParams.get('search') || '';
        const filter = searchParams.get('filter') || 'Semua'; // 'Semua', 'Tinggi', 'Sedang', 'Rendah'

        // 2. Kalkulasi untuk pagination
        const skip = (page - 1) * limit;

        // 3. Bangun 'where' clause (Filter) secara dinamis
        const where: Prisma.CustomerWhereInput = {};

        // Filter berdasarkan Search (Nama)
        if (search) {
            where.name = {
                contains: search,
                mode: 'insensitive', // Tidak peduli huruf besar/kecil
            };
        }

        // Filter berdasarkan Skor (Tinggi/Sedang/Rendah)
        // Ini adalah filter relasi yang kompleks
        if (filter === 'Tinggi') {
            where.leadScores = {
                some: { score: { gte: 0.8 } }, // Skor >= 80%
            };
        } else if (filter === 'Sedang') {
            where.leadScores = {
                some: { score: { gte: 0.5, lt: 0.8 } }, // Skor 50% - 79%
            };
        } else if (filter === 'Rendah') {
            where.leadScores = {
                some: { score: { lt: 0.5 } }, // Skor < 50%
            };
        }
        // Jika 'Semua', kita tidak tambahkan filter skor

        // 4. Ambil data (sesuai halaman/limit) dan Total Data (untuk pagination)
        // Kita jalankan 2 query secara paralel agar cepat
        const [customers, totalItems] = await db.$transaction([
            // Query 1: Ambil datanya
            db.customer.findMany({
                skip: skip,
                take: limit,
                where: where,
                include: {
                    // Ambil skor terbaru
                    leadScores: {
                        orderBy: { createdAt: 'desc' },
                        take: 1,
                    },
                    // Ambil interaksi (kampanye) terbaru
                    campaigns: {
                        orderBy: { createdAt: 'desc' },
                        take: 1,
                    },
                },
                orderBy: {
                    // TODO: Nanti bisa ditambahkan sort by dinamis
                    // Untuk saat ini, urutkan berdasarkan skor tertinggi
                    leadScores: {
                        _count: 'desc', // Ini trik, tapi lebih baik sort by score
                    }
                    // Ganti dengan sort by name jika di atas error
                    // orderBy: { name: 'asc' }
                }
            }),
            // Query 2: Hitung total item yang cocok dengan filter (tanpa limit/skip)
            db.customer.count({
                where: where,
            }),
        ]);

        // 5. Kalkulasi total halaman
        const totalPages = Math.ceil(totalItems / limit);

        // 6. Format data balikan agar rapi
        const formattedData = customers.map((customer) => ({
            id: customer.id,
            nama: customer.name,
            usia: customer.age,
            pekerjaan: customer.job,
            status: customer.loan, // 'yes', 'no', 'unknown'
            skor: customer.leadScores[0]?.score || null,
            interaksi: customer.campaigns[0]?.poutcome || 'nonexistent',
        }));

        // 7. Kirim balikan JSON
        return NextResponse.json({
            data: formattedData,
            pagination: {
                totalItems,
                totalPages,
                currentPage: page,
                itemsPerPage: limit,
            },
        }, { status: 200 });

    } catch (error) {
        console.error('[API_CUSTOMERS_ERROR]', error);
        return NextResponse.json(
            { error: 'An internal server error occurred' },
            { status: 500 }
        );
    }
}
