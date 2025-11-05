import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { verifyJwt } from '@/lib/auth';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { ContactType, POutcome } from '@prisma/client';

// Skema validasi untuk log panggilan baru
const logCampaignSchema = z.object({
    customerId: z.string().cuid("ID Customer tidak valid"),
    contact: z.nativeEnum(ContactType),
    poutcome: z.nativeEnum(POutcome),
});

export async function POST(request: NextRequest) {
    try {
        // 1. Dapatkan ID Sales (User) dari token
        const token = cookies().get('token')?.value;
        const payload = token ? await verifyJwt(token) : null;

        if (!payload || !payload.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        // Ini adalah ID Sales yang sedang login
        const userId = payload.id as string;

        // 2. Validasi body
        const body = await request.json();
        const validation = logCampaignSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Input tidak valid', details: validation.error.issues },
                { status: 400 }
            );
        }
        const { customerId, contact, poutcome } = validation.data;

        // 3. Dapatkan data 'campaign' sebelumnya (jika ada) untuk customer ini
        const lastCampaign = await db.campaign.findFirst({
            where: { customerId: customerId },
            orderBy: { createdAt: 'desc' },
        });

        // 4. Siapkan data hari, bulan, dan hitungan kampanye
        const now = new Date();
        // 'en-US' untuk format standar (bisa diganti 'id-ID' jika mau Bahasa Indonesia)
        const dayOfWeek = now.toLocaleString('en-US', { weekday: 'long' }); // "Monday"
        const month = now.toLocaleString('en-US', { month: 'short' }).toLowerCase(); // "nov"

        let pdays = 999; // 999 = belum pernah dihubungi
        let previous = 0;

        if (lastCampaign) {
            // 'previous' adalah jumlah total kontak dari 'log' sebelumnya
            previous = lastCampaign.campaign;
            // Hitung selisih hari sejak kontak terakhir
            const diffTime = Math.abs(now.getTime() - lastCampaign.createdAt.getTime());
            pdays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }

        // 5. Buat data Campaign (log panggilan) baru
        const newCampaignLog = await db.campaign.create({
            data: {
                customerId: customerId,
                userId: userId, // <-- Simpan siapa sales-nya
                contact: contact,
                day_of_week: dayOfWeek,
                month: month,
                campaign: 1, // Ini adalah kontak ke-1 untuk 'log' ini
                previous: previous,
                pdays: pdays,
                poutcome: poutcome,
            },
        });

        // 6. Kirim balikan sukses
        return NextResponse.json(
            { message: 'Panggilan berhasil dicatat', log: newCampaignLog },
            { status: 201 } // 201 Created
        );

    } catch (error) {
        console.error('[API_CAMPAIGNS_POST_ERROR]', error);
        return NextResponse.json(
            { error: 'An internal server error occurred' },
            { status: 500 }
        );
    }
}

