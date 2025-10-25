import { PrismaClient } from "@prisma/client";

// deklarasi global untuk 'cachedPrisma'
declare global {
    var cachedPrisma: PrismaClient | undefined;
}
//  cek develop atau production
const isDevelopment = process.env.NODE_ENV === 'development';

let db: PrismaClient;

if (isDevelopment) {
    if (!global.cachedPrisma) {
        global.cachedPrisma = new PrismaClient();
    }
    db = global.cachedPrisma;
} else {
    db = new PrismaClient();
}

export { db };