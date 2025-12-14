import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { verifyJwt } from '@/lib/auth';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { randomUUID } from 'crypto'; // opsional jika kamu ingin ID manual

// Enums lokal (bagus — agar schema API tidak bergantung pada Prisma langsung)
const ContactTypeEnum = z.enum(['cellular', 'telephone', 'unknown']);
const POutcomeEnum = z.enum(['success', 'failure', 'nonexistent', 'unknown']);

const logCampaignSchema = z.object({
    customerId: z.string().cuid('ID Customer tidak valid'),
    contact: ContactTypeEnum,
    poutcome: POutcomeEnum,
});

export async function POST(request: NextRequest) {
    try {
        // 1️⃣ Autentikasi user via JWT di cookie
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;
        const payload = token ? await verifyJwt(token) : null;

        if (!payload?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = payload.id as string;

        // 2️⃣ Validasi body dengan Zod
        const body = await request.json();
        const validation = logCampaignSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Input tidak valid', details: validation.error.issues },
                { status: 400 }
            );
        }

        const { customerId, contact, poutcome } = validation.data;

        // 3️⃣ Ambil campaign terakhir untuk customer ini
        const lastCampaign = await db.campaign.findFirst({
            where: { customerId },
            orderBy: { createdAt: 'desc' },
        });

        // 4️⃣ Hitung detail tambahan
        const now = new Date();
        const dayOfWeek = now.toLocaleString('en-US', { weekday: 'long' });
        const month = now.toLocaleString('en-US', { month: 'short' }).toLowerCase();

        let pdays = 999;
        let previous = 0;

        if (lastCampaign) {
            previous = lastCampaign.campaign;

            // ✅ FIX build error: createdAt bisa dianggap null oleh TypeScript
            const diffTime = Math.abs(
                now.getTime() - (lastCampaign.createdAt?.getTime() ?? now.getTime())
            );

            pdays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }

        // 5️⃣ Simpan campaign baru
        const newCampaignLog = await db.campaign.create({
            data: {
                // Tidak perlu id karena @default(cuid()) sudah ada
                customerId,
                userId,
                contact,
                day_of_week: dayOfWeek,
                month,
                campaign: 1, // kalau kamu mau increment sesuai previous, bisa ubah ke: previous + 1
                previous,
                pdays,
                poutcome,
            },
        });

        // 6️⃣ Kirim response sukses
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
