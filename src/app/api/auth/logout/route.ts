import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const response = NextResponse.json(
            { message: 'Logout successfully' },
            { status: 200 }
        );

        response.cookies.set('token', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: -1,
            path: '/'
        });
        return response;
    } catch (error) {
        console.error('[API_LOGOUT_ERROR]', error);
        return NextResponse.json(
            { error: 'An internal server error occurred' },
            { status: 500 }
        );
    }
}