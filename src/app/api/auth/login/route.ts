import { comparePassword, signJwt } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import z from "zod";

const loginSchema = z.object({
    email: z.string("Email is Required").email("Invalid email format"),
    password: z.string("Password is required")
})

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const validation = loginSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Invalid input', details: validation.error.issues },
                { status: 400 }
            );
        }
        const { email, password } = validation.data;

        const user = await db.user.findUnique({
            where: { email: email.toLocaleLowerCase() }
        });

        if (!user) {
            return NextResponse.json(
                { error: "Invalid email or password" },
                { status: 401 }
            );
        }

        const isPasswordValid = await comparePassword(password, user.passwordHash);
        if (!isPasswordValid) {
            return NextResponse.json(
                { error: "Invalid email or password" },
                { status: 401 }
            );
        }

        const tokenPayload = {
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name
        };
        const token = await signJwt(tokenPayload);

        const userResponse = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
        };

        const response = NextResponse.json(
            { message: 'Login successfully', user: userResponse },
            { status: 200 }
        );

        response.cookies.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24,
            path: '/'
        });

        return response;
    } catch (e) {
        console.error('[API_LOGIN_ERROR]', e);
        return NextResponse.json(
                { error: 'An internal server error occurred' },
                { status: 500 }
            );
    }
}