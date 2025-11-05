import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

// Tipe untuk 'context' yang berisi parameter [id] dari URL
type Context = {
    params: {
        id: string; // 'id' harus sama dengan nama folder '[id]'
    };
};

export async function GET(request: NextRequest, context: Context) {
    try {
        const { id } = context.params;

        if (!id) {
            return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
        }

        // 1. Ambil data utama nasabah (Customer)
        // Kita gunakan 'include' untuk mengambil SEMUA data relasinya sekaligus
        const customer = await db.customer.findUnique({
            where: { id: id },
            include: {
                // 2. Ambil SEMUA riwayat interaksi (Campaign)
                // Ini untuk mengisi card "Riwayat & Catatan Interaksi"
                campaigns: {
                    orderBy: { createdAt: 'desc' }, // Urutkan: yang terbaru di atas
                    include: {
                        // Ambil nama Sales (User) yang mencatat log
                        user: {
                            select: { name: true },
                        },
                    },
                },
                // 3. Ambil HANYA skor terbaru (LeadScore)
                // Ini untuk mengisi card "Skor Peluang"
                leadScores: {
                    orderBy: { createdAt: 'desc' },
                    take: 1, // Ambil 1 saja (yang paling baru)
                },
            },
        });

        // 4. Handle jika nasabah tidak ditemukan
        if (!customer) {
            return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
        }

        // 5. (Opsional) Format data agar lebih rapi untuk frontend
        // Kita pisahkan data utuh dari data yang sudah diformat

        // Ambil skor terbaru (atau null jika belum ada)
        const latestScore = customer.leadScores[0]?.score || null;

        // Ambil status kontak terbaru (atau null jika belum ada)
        const latestInteraction = customer.campaigns[0]?.poutcome || 'nonexistent';

        // Format riwayat
        const formattedHistory = customer.campaigns.map(log => ({
            id: log.id,
            // (UI-mu membedakan "Panggilan Telepon" vs "Catatan Internal")
            // Kita bisa asumsikan 'cellular'/'telephone' = Panggilan, 'nonexistent' = Catatan
            type: (log.contact === 'cellular' || log.contact === 'telephone') ? 'Panggilan Telepon' : 'Catatan Internal',
            date: log.createdAt, // Frontend bisa format ini
            note: `Sales: ${log.user?.name || 'System'}. Hasil: ${log.poutcome}`, // Contoh catatan
        }));


        // 6. Kirim balikan JSON
        return NextResponse.json({
            // Data mentah (jika frontend butuh)
            // rawData: customer, 

            // Data yang sudah diformat untuk UI
            details: {
                id: customer.id,
                name: customer.name,
                statusPinjaman: customer.loan, // UI akan map 'yes' -> 'Disetujui'

                // Card "Informasi Nasabah"
                age: customer.age,
                job: customer.job,
                phone: customer.phone,
                address: customer.address,

                // Card "Skor Peluang"
                skorPeluang: latestScore, // Misal: 0.95

                // Card "Status Kontak"
                statusKontak: latestInteraction, // Misal: "success"
            },
            // Card "Riwayat & Catatan Interaksi"
            history: formattedHistory
        }, { status: 200 });

    } catch (error) {
        console.error('[API_CUSTOMER_DETAIL_ERROR]', error);
        // Handle jika ID tidak valid (bukan cuid)
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2023') {
            return NextResponse.json({ error: 'Invalid Customer ID format' }, { status: 400 });
        }
        return NextResponse.json(
            { error: 'An internal server error occurred' },
            { status: 500 }
        );
    }
}

