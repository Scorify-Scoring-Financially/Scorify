import bcrypt from "bcryptjs";
import { jwtVerify, SignJWT, JWTPayload } from "jose";

// =============================================================
// Konstanta & konfigurasi
// =============================================================
const JWT_SECRET_RAW = process.env.JWT_SECRET;
if (!JWT_SECRET_RAW) {
    throw new Error("JWT_SECRET tidak ditemukan di .env");
}

const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_RAW);

export async function hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
}

export async function comparePassword(
    plaintext: string,
    hash: string
): Promise<boolean> {
    return bcrypt.compare(plaintext, hash);
}

// =============================================================
// Fungsi: JWT - Generate Token
// =============================================================
export async function signJwt(payload: { id: string; email: string; role: string }): Promise<string> {
    const token = await new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("1d")
        .sign(JWT_SECRET);
    return token;
}

// =============================================================
// Fungsi: JWT - Verifikasi Token
// =============================================================
export async function verifyJwt(token: string): Promise<JWTPayload | null> {
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return payload;
    } catch {
        return null;
    }
}

export type { JWTPayload as JwtPayload };