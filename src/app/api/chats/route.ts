import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { Chat } from "@/models/Chat";

export const runtime = "nodejs";

function getDefaultModel() {
  const configured = process.env.GEMINI_MODEL_NAME;
  if (!configured) {
    return "gemini-2.5-flash";
  }

  return configured.split("#")[0].trim() || "gemini-2.5-flash";
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const user = getSessionUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const chats = await Chat.find({ userId: user.id })
      .sort({ updatedAt: -1 })
      .select("_id title updatedAt createdAt");

    return NextResponse.json({ success: true, chats });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch chats";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const user = getSessionUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const title =
      typeof body.title === "string" && body.title.trim().length > 0
        ? body.title.trim()
        : "New Chat";

    const model =
      typeof body.model === "string" && body.model.trim().length > 0
        ? body.model.trim()
        : getDefaultModel();

    const chat = await Chat.create({
      userId: user.id,
      title,
      model,
      messages: [],
    });

    return NextResponse.json({ success: true, chat });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create chat";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    const user = getSessionUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    await Chat.deleteMany({ userId: user.id });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete chats";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
