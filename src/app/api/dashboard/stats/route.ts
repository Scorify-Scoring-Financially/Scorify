import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
    try {
        const highPriorityCount = await db.leadScore.count({
            where: {
                score: {
                    gte: 0.8,
                },
            },
        });

        // (Opsional) Kamu bisa tambahkan data statistik lain di sini
        const totalCustomers = await db.customer.count();

        // Kirim balikan JSON
        return NextResponse.json(
            {
                highPriorityCount: highPriorityCount,
                totalCustomers: totalCustomers,
                // ... data statistik lain bisa ditambahkan di sini
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('[API_STATS_ERROR]', error);
        return NextResponse.json(
            { error: 'An internal server error occurred' },
            { status: 500 }
        );
    }
}
