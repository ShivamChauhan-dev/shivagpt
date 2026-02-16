import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { Chat } from "@/models/Chat";

export const runtime = "nodejs";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const user = getSessionUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }
    const { id } = await params;

    const chat = await Chat.findOne({ _id: id, userId: user.id });
    if (!chat) {
      return NextResponse.json(
        { success: false, error: "Chat not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, chat });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch chat";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const user = getSessionUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }
    const { id } = await params;

    const chat = await Chat.findOneAndDelete({ _id: id, userId: user.id });
    if (!chat) {
      return NextResponse.json(
        { success: false, error: "Chat not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete chat";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const user = getSessionUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }
    const { id } = await params;
    const body = await request.json();
    const { title } = body;

    const update: Record<string, string> = {};

    if (typeof title === "string" && title.trim()) {
      update.title = title.trim();
    }
    if (typeof body.model === "string" && body.model.trim()) {
      update.model = body.model.trim();
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json(
        { success: false, error: "Nothing to update" },
        { status: 400 },
      );
    }

    const chat = await Chat.findOneAndUpdate(
      { _id: id, userId: user.id },
      update,
      { new: true },
    );
    if (!chat) {
      return NextResponse.json(
        { success: false, error: "Chat not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, chat });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to rename chat";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
