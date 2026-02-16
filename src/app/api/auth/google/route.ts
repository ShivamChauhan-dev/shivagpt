import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import {
  createAuthToken,
  getAuthCookieName,
  getAuthCookieOptions,
} from "@/lib/auth";
import { User } from "@/models/User";

export const runtime = "nodejs";

type GoogleTokenInfo = {
  aud?: string;
  email?: string;
  email_verified?: "true" | "false";
  name?: string;
};

function getGoogleClientId() {
  const clientId =
    process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error("GOOGLE_CLIENT_ID is not set.");
  }
  return clientId;
}

async function verifyGoogleCredential(credential: string) {
  const url = new URL("https://oauth2.googleapis.com/tokeninfo");
  url.searchParams.set("id_token", credential);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error("Invalid Google credential");
  }

  const data = (await response.json()) as GoogleTokenInfo;
  const expectedAudience = getGoogleClientId();

  if (data.aud !== expectedAudience) {
    throw new Error("Google token audience mismatch");
  }

  if (!data.email || data.email_verified !== "true") {
    throw new Error("Google account email is not verified");
  }

  return {
    email: data.email.toLowerCase(),
    name: (data.name || data.email.split("@")[0] || "Google User").trim(),
  };
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json().catch(() => ({}));
    const credential =
      typeof body.credential === "string" ? body.credential.trim() : "";

    if (!credential) {
      return NextResponse.json(
        { success: false, error: "Google credential is required" },
        { status: 400 },
      );
    }

    const googleUser = await verifyGoogleCredential(credential);

    let user = await User.findOne({ email: googleUser.email });
    if (!user) {
      user = await User.create({
        name: googleUser.name,
        email: googleUser.email,
        passwordHash: "google-oauth",
      });
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
    const message =
      error instanceof Error ? error.message : "Google auth failed";
    return NextResponse.json(
      { success: false, error: message },
      { status: 401 },
    );
  }
}
