import { verifyJwt } from "@/lib/auth";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    try {
        const cookieStore = cookies();
        const token = cookieStore.get('token');

        if (!token) {
            return NextResponse.json(
                { error: "Unauthorized: No token Provided" },
                { status: 401 }
            );
        }

        const payload = await verifyJwt(token.value);

        if (!payload || !payload.id) {
            return NextResponse.json(
                { error: 'Unathorized: Invalid Token' },
                { status: 401 }
            );
        }

        const user = await db.user.findUnique({
            where: { id: payload.id as string },
            select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                role: true,
                createdAt: true,
            }
        });
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ user: user }, { status: 200 });
    } catch (error: any) {
        console.error('[API_ME_ERROR]', error);

        if (error.name === "JWTExpired" || error.name === 'JOSEError') {
            return NextResponse.json(
                { error: 'Unauthorized: Token Expired or Invalid' },
                { status: 401 }
            );
        }
        return NextResponse.json(
            { error: 'An internal server error occurred' },
            { status: 500 }
        );
    }
}