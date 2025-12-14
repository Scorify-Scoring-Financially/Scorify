import { hashPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import z from "zod";

/**
 * =========================================================
 *  USER REGISTRATION & UPDATE API
 * =========================================================
 * Endpoint: /api/auth/register
 *
 * Fungsi:
 *  - POST: Mendaftarkan user baru (default role = "Sales")
 *  - PUT: Memperbarui data user yang sudah ada
 *
 * Validasi input dilakukan dengan Zod, dan password selalu di-hash
 * menggunakan bcrypt sebelum disimpan.
 *
 * Keamanan:
 *  - Password tidak pernah disimpan dalam bentuk plaintext.
 *  - Email otomatis di-lowercase agar tidak duplikat case-sensitive.
 * =========================================================
 */

// =========================================================
// Skema Validasi: REGISTER (POST)
// =========================================================
const registerSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email format"),
  name: z
    .string()
    .min(1, "Name is required"),
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number cannot exceed 15 digits")
    .regex(/^[0-9]+$/, "Phone number must contain only digits"),
  passwordHash: z
    .string()
    .min(6, "Password must be at least 6 characters long"),
  role: z.string().default("Sales"),
});

const updateSchema = registerSchema.extend({
  id: z.string().min(1, "Id is required"),
});

// =========================================================
//  Skema Validasi: REGISTER (POST)
// =========================================================
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { email, passwordHash, phone, name, role } = validation.data;

    const existingUser = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email is already registered" },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(passwordHash);

    const newUser = await db.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash: hashedPassword,
        name,
        phone,
        role: role || "Sales",
      },
      select: { id: true, email: true, name: true, role: true },
    });

    return NextResponse.json(
      { message: "User registered successfully", user: newUser },
      { status: 201 }
    );
  } catch (e) {
    console.error("[API_REGISTER_ERROR]", e);
    return NextResponse.json(
      { error: "An unexpected server error occurred" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const validation = updateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid Input", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { id, email, passwordHash, phone, name, role } = validation.data;

    const existingUser = await db.user.findUnique({ where: { id } });
    if (!existingUser) {
      return NextResponse.json({ error: "User Not Found" }, { status: 404 });
    }

    const hashedPassword = await hashPassword(passwordHash);

    const updatedUser = await db.user.update({
      where: { id },
      data: {
        email: email.toLowerCase(),
        passwordHash: hashedPassword,
        name,
        phone,
        role: role || "Sales",
      },
      select: { id: true, email: true, name: true, role: true },
    });

    return NextResponse.json(
      { message: "User Updated Successfully", user: updatedUser },
      { status: 200 }
    );
  } catch (e) {
    console.error("[API_UPDATE_REGISTER_ERROR]", e);
    return NextResponse.json(
      { error: "An unexpected server error occurred" },
      { status: 500 }
    );
  }
}
