import bcrypt from "bcryptjs";
import { jwtVerify, SignJWT, JWTPayload } from "jose";

// Ambil JWT secret dari environment
const JWT_SECRET_RAW = process.env.JWT_SECRET;
if (!JWT_SECRET_RAW) {
    throw new Error("JWT_SECRET tidak ditemukan di .env");
}

// Ubah string rahasia menjadi bytes (buffer)
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_RAW);

// 🔐 Hash password
export async function hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
}

// 🔍 Cek password
export async function comparePassword(
    plaintext: string,
    hash: string
): Promise<boolean> {
    return bcrypt.compare(plaintext, hash);
}

// 🧾 Buat JWT
export async function signJwt(payload: { id: string; email: string; role: string }): Promise<string> {
    const token = await new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("1d")
        .sign(JWT_SECRET);
    return token;
}

// ✅ Verifikasi JWT (tanpa any, aman untuk TypeScript)
export async function verifyJwt(token: string): Promise<JWTPayload | null> {
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return payload;
    } catch {
        return null; // jika invalid / expired
    }
}

export type { JWTPayload as JwtPayload };