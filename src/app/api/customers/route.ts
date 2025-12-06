import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { formatEnumValue } from '@/lib/format'; // helper untuk ubah enum ke teks rapi

// 🚫 Matikan cache Next.js di level server
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl;

        // 1️⃣ Ambil Query Params dari URL
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const search = searchParams.get('search') || '';
        const filter = searchParams.get('filter') || 'Semua'; // 'Semua', 'Tinggi', 'Sedang', 'Rendah'

        // 2️⃣ Pagination offset
        const skip = (page - 1) * limit;

        // 3️⃣ Bangun kondisi WHERE
        const where: Prisma.CustomerWhereInput = {};

        // 🔍 Filter berdasarkan nama
        if (search) {
            where.name = {
                contains: search,
                mode: 'insensitive',
            };
        }

        // 🎯 Filter berdasarkan skor
        if (filter === 'Tinggi') {
            where.leadScores = { some: { score: { gte: 0.8 } } };
        } else if (filter === 'Sedang') {
            where.leadScores = { some: { score: { gte: 0.6, lt: 0.8 } } };
        } else if (filter === 'Rendah') {
            where.leadScores = { some: { score: { lt: 0.59 } } };
        }

        // 4️⃣ Jalankan query paralel (data + total)
        const [customers, totalItems] = await db.$transaction([
            db.customer.findMany({
                skip,
                take: limit,
                where,
                include: {
                    leadScores: {
                        orderBy: { createdAt: 'desc' },
                        take: 1,
                    },
                    campaigns: {
                        orderBy: { createdAt: 'desc' },
                        take: 1,
                        select: {
                            poutcome: true,
                            finalDecision: true,
                        },
                    },
                },
                orderBy: { name: 'asc' },
            }),
            db.customer.count({ where }),
        ]);

        // 5️⃣ Hitung total halaman
        const totalPages = Math.ceil(totalItems / limit);

        // 6️⃣ Format data untuk dikirim ke frontend
        const formattedData = customers.map((customer) => ({
            id: customer.id,
            nama: customer.name,
            usia: customer.age,
            pekerjaan: formatEnumValue(customer.job),
            phone: customer.phone ?? '-',          // ✅ penting untuk fitur telepon
            address: customer.address ?? '-',      // opsional, bisa ditampilkan di UI
            status: formatEnumValue(customer.campaigns[0]?.finalDecision || 'pending'),
            skor: customer.leadScores[0]?.score ?? null,
            interaksi: formatEnumValue(customer.campaigns[0]?.poutcome || 'nonexistent'),
        }));

        // 7️⃣ Return response JSON (tanpa cache)
        return NextResponse.json(
            {
                data: formattedData,
                pagination: {
                    totalItems,
                    totalPages,
                    currentPage: page,
                    itemsPerPage: limit,
                },
            },
            {
                status: 200,
                headers: {
                    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
                    "Pragma": "no-cache",
                    "Expires": "0",
                },
            }
        );

    } catch (error) {
        console.error('[API_CUSTOMERS_ERROR]', error);
        return NextResponse.json(
            { error: 'An internal server error occurred' },
            { status: 500 }
        );
    }
}
