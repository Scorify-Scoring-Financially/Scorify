import { NextResponse } from "next/server";

export async function GET() {
    return Response.json({message: "Hello Wrld"}, {status: 500})
}