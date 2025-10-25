import { hashPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import z from "zod";

// validation schema
const registerSchema = z.object({
  email: z
    .string("Email is required")
    .email("Invalid email format"),
  name: z
    .string("Name is required")
    .min(1, "Name cannot be empty"),
  phone: z
    .string("Phone number is required")
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number cannot exceed 15 digits")
    .regex(/^[0-9]+$/, "Phone number must contain only digits"),
  passwordHash: z
    .string("Password is required")
    .min(6, "Password must be at least 6 characters long"),
  role: z.nativeEnum(UserRole).default(UserRole.Sales),
});

const updateSchema = registerSchema.extend({
  id: z.string("Id is Required")
});


export async function POST(request: Request) {
  try {
    // get request body
    const body = await request.json();

    // validate input
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { email, passwordHash, phone, name, role } = validation.data;

    // check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email is already registered" },
        { status: 409 }
      );
    }

    // hash password
    const hashedPassword = await hashPassword(passwordHash);

    // create user
    const newUser = await db.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash: hashedPassword,
        name,
        phone,
        role,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
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
      return NextResponse.json({ error: "Invalid Input", details: validation.error.issues }, { status: 400 });
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
        email: email.toLocaleLowerCase(),
        passwordHash: hashedPassword,
        name,
        phone,
        role
      },
      select: { id: true, email: true, name: true, role: true }
    });

    return NextResponse.json(
      { message: "User Updated Successfully", user: updatedUser },
      { status: 200 }
    );

  } catch (e) {
     console.error("[API_UPDATE_REGISTER_ERROR]", e);
    return NextResponse.json({ error: "An unexpected server error occurred" }, { status: 500 });
  }
}