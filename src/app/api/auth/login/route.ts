import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import {
  createAuthToken,
  getAuthCookieName,
  getAuthCookieOptions,
  verifyPassword,
} from "@/lib/auth";
import { User } from "@/models/User";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json().catch(() => ({}));

    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 },
      );
    }

    const user = await User.findOne({ email });
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 },
      );
    }

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
    const message = error instanceof Error ? error.message : "Failed to login";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
