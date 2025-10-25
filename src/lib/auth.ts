import bcrypt from "bcryptjs";
import { jwtVerify, SignJWT } from "jose";

// ambil jwt secret dari env
const JWT_SECRET_RAW = process.env.JWT_SECRET;
if (!JWT_SECRET_RAW) {
    throw new Error("JWT_SECRET tidak ditemukan di .env");
}

// mengubah string rahasia kamu menjadi format "byte"
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_RAW);

// function hashpassword
export async function hashPassword(password: string) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
}

// function cek password
export async function comparePassword(plaintext: string, hash: string) {
    return await bcrypt.compare(plaintext, hash);
}

// function buat JWT
export async function signJwt(payload: { id: string; email: string; role: string }) {
    const token = await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('1d')
        .sign(JWT_SECRET);
    return token;
}

// function ubah wjt
export async function verifyJwt(token: string): Promise<any | null> {
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return payload;
    } catch (e) {
        return null;
    }
}