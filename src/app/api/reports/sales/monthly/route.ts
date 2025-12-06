import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import { db } from "@/lib/db";

// 12 nama bulan (Jan–Des)
const MONTHS_ID = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
    "Jul", "Agus", "Sep", "Okt", "Nov", "Des",
];

// ✅ Definisikan tipe payload dari JWT
interface JwtPayload {
    id: string;
    [key: string]: unknown;
}

export async function GET(request: NextRequest) {
    try {
        // --- Auth
        const cookieStore = await cookies();
        const token = cookieStore.get("token");

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const payload = (await verifyJwt(token.value)) as JwtPayload | null;
        const userId = payload?.id;

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // --- Params
        const { searchParams } = request.nextUrl;
        const year = parseInt(
            searchParams.get("year") || `${new Date().getFullYear()}`,
            10
        );
        const status = (searchParams.get("status") || "all").toLowerCase(); // all | agreed | declined | pending

        const gte = new Date(year, 0, 1);
        const lt = new Date(year + 1, 0, 1);

        // --- Query kampanye milik sales
        const campaigns = await db.campaign.findMany({
            where: {
                userId,
                createdAt: { gte, lt },
            },
            select: { createdAt: true, finalDecision: true },
        });

        // --- Inisialisasi 12 bulan
        const buckets = Array.from({ length: 12 }, (_, i) => ({
            month: MONTHS_ID[i],
            setuju: 0,
            ditolak: 0,
            tertunda: 0,
        }));

        // --- Hitung jumlah per bulan
        for (const c of campaigns) {
            const m = c.createdAt.getMonth(); // 0..11
            const decision = c.finalDecision; // agreed | declined | pending | null

            if (decision === "agreed") buckets[m].setuju += 1;
            else if (decision === "declined") buckets[m].ditolak += 1;
            else buckets[m].tertunda += 1; // treat null as pending
        }

        // --- Filter sesuai status permintaan (tanpa ubah desain)
        const filtered = buckets.map((b) => {
            if (status === "agreed") return { ...b, ditolak: 0, tertunda: 0 };
            if (status === "declined") return { ...b, setuju: 0, tertunda: 0 };
            if (status === "pending") return { ...b, setuju: 0, ditolak: 0 };
            return b; // all
        });

        return NextResponse.json(filtered, { status: 200 });
    } catch (err) {
        console.error("[API_REPORT_MONTHLY_ERROR]", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
