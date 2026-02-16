import { NextRequest, NextResponse } from "next/server";
import { verifyAuthToken, getAuthCookieName } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(getAuthCookieName())?.value;
  if (!token) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const payload = verifyAuthToken(token);
  if (!payload) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  return NextResponse.json({
    success: true,
    user: {
      id: payload.sub,
      name: payload.name,
      email: payload.email,
    },
  });
}
