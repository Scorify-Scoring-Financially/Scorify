import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

type Context = {
    params: { id: string };
};

export async function POST(request: NextRequest, context: Context) {
    try {
        const { id } = context.params;
        const body = await request.json();
        const { note } = body;

        if (!id || !note) {
            return NextResponse.json({ error: 'Customer ID and note are required' }, { status: 400 });
        }

        // Tambahkan catatan baru di InteractionLog
        const newNote = await db.interactionLog.create({
            data: {
                type: 'CATATAN_INTERNAL',
                note,
                customerId: id,
                callResult: 'unknown',
                userId: null, // nanti bisa diisi dengan ID sales yang login
            },
        });

        return NextResponse.json(
            { message: 'Catatan berhasil ditambahkan', note: newNote },
            { status: 201 }
        );

    } catch (error) {
        console.error('[API_ADD_NOTE_ERROR]', error);
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2023') {
            return NextResponse.json({ error: 'Invalid Customer ID format' }, { status: 400 });
        }
        return NextResponse.json(
            { error: 'Terjadi kesalahan pada server' },
            { status: 500 }
        );
    }
}
