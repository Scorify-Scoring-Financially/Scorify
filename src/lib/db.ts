// Ganti nama file ini, misal ke: lib/db.ts

import { PrismaClient } from "@prisma/client";

declare global {
    // Gunakan 'var' untuk deklarasi global, bukan 'let' atau 'const'
    var cachedPrisma: PrismaClient | undefined;
}

// 1. Coba ambil dari cache, atau buat instance baru jika tidak ada
export const db = global.cachedPrisma || new PrismaClient();

// 2. Di development (NON-production), simpan instance ke global cache.
//    Ini mencegah 'hot reload' membuat koneksi baru terus-menerus.
if (process.env.NODE_ENV !== 'production') {
    global.cachedPrisma = db;
}