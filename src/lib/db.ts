// Ganti nama file ini, misal ke: lib/db.ts

import { PrismaClient } from "@prisma/client";

declare global {
    var cachedPrisma: PrismaClient | undefined;
}

export const db = global.cachedPrisma || new PrismaClient();


if (process.env.NODE_ENV !== 'production') {
    global.cachedPrisma = db;
}