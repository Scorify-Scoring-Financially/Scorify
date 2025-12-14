import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { verifyJwt } from '@/lib/auth';
import { cookies } from 'next/headers';
import { z } from 'zod';

/**
 * =========================================================
 * CAMPAIGN LOG API — /api/campaigns
 * =========================================================
 * Fungsi:
 *   Mencatat log panggilan atau interaksi campaign baru
 *   antara Sales dan Customer, disertai konteks waktu,
 *   status kontak, dan hasil panggilan sebelumnya.
 *
 * Akses:
 *   - Hanya pengguna yang sudah login (JWT di cookie).
 *   - Role: Sales (atau Admin bila diizinkan).
 *
 * Alur Utama:
 *   1. Verifikasi JWT dari cookie.
 *   2. Validasi input request body menggunakan Zod.
 *   3. Ambil campaign terakhir customer untuk hitung `previous` & `pdays`.
 *   4. Simpan campaign baru ke database.
 *   5. Kembalikan log campaign yang baru dibuat.
 * =========================================================
 */

const ContactTypeEnum = z.enum(['cellular', 'telephone', 'unknown']);
const POutcomeEnum = z.enum(['success', 'failure', 'nonexistent', 'unknown']);

const logCampaignSchema = z.object({
    customerId: z.string().cuid('ID Customer tidak valid'),
    contact: ContactTypeEnum,
    poutcome: POutcomeEnum,
});

export async function POST(request: NextRequest) {
    try {
        //  Autentikasi user via JWT di cookie
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;
        const payload = token ? await verifyJwt(token) : null;

        if (!payload?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = payload.id as string;

        //  Validasi body dengan Zod
        const body = await request.json();
        const validation = logCampaignSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Input tidak valid', details: validation.error.issues },
                { status: 400 }
            );
        }

        const { customerId, contact, poutcome } = validation.data;

        // 3Ambil campaign terakhir untuk customer ini
        const lastCampaign = await db.campaign.findFirst({
            where: { customerId },
            orderBy: { createdAt: 'desc' },
        });

        // Hitung detail tambahan
        const now = new Date();
        const dayOfWeek = now.toLocaleString('en-US', { weekday: 'long' });
        const month = now.toLocaleString('en-US', { month: 'short' }).toLowerCase();

        let pdays = 999;
        let previous = 0;

        if (lastCampaign) {
            previous = lastCampaign.campaign;

            const diffTime = Math.abs(
                now.getTime() - (lastCampaign.createdAt?.getTime() ?? now.getTime())
            );

            pdays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }

        //  Simpan campaign baru
        const newCampaignLog = await db.campaign.create({
            data: {
                customerId,
                userId,
                contact,
                day_of_week: dayOfWeek,
                month,
                campaign: 1,
                previous,
                pdays,
                poutcome,
            },
        });

        return NextResponse.json(
            { message: 'Panggilan berhasil dicatat', log: newCampaignLog },
            { status: 201 }
        );
    } catch (error) {
        console.error('[API_CAMPAIGNS_POST_ERROR]', error);
        return NextResponse.json(
            { error: 'An internal server error occurred' },
            { status: 500 }
        );
    }
}
