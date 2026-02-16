import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import {
  createAuthToken,
  getAuthCookieName,
  getAuthCookieOptions,
  hashPassword,
} from "@/lib/auth";
import { User } from "@/models/User";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json().catch(() => ({}));

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!name || !email || password.length < 6) {
      return NextResponse.json(
        {
          success: false,
          error: "Name, email and password (minimum 6 characters) are required",
        },
        { status: 400 },
      );
    }

    const existing = await User.findOne({ email }).select("_id");
    if (existing) {
      return NextResponse.json(
        { success: false, error: "Email already exists" },
        { status: 409 },
      );
    }

    const user = await User.create({
      name,
      email,
      passwordHash: hashPassword(password),
    });

    const token = createAuthToken({
      sub: user._id.toString(),
      email: user.email,
      name: user.name,
    });

    const response = NextResponse.json({
      success: true,
      user: { id: user._id, name: user.name, email: user.email },
    });
    response.cookies.set(getAuthCookieName(), token, getAuthCookieOptions());
    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to sign up";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
