import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { connectDB } from "@/lib/db";
import { generateReply, generateReplyWithImages } from "@/lib/gemini";
import { searchLatestNews } from "@/lib/newsSearch";
import { getSessionUser } from "@/lib/session";
import { searchWeb } from "@/lib/webSearch";
import { Chat } from "@/models/Chat";

export const runtime = "nodejs";

type Params = {
  params: Promise<{ id: string }>;
};

type Attachment = {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
};

type FeatureOptions = {
  webSearch: boolean;
  dateGrounding: boolean;
  codeMode: boolean;
};

function normalizeAttachments(value: unknown): Attachment[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (item): item is Attachment =>
        !!item &&
        typeof item === "object" &&
        typeof (item as Attachment).filename === "string" &&
        typeof (item as Attachment).originalName === "string" &&
        typeof (item as Attachment).mimeType === "string" &&
        typeof (item as Attachment).size === "number" &&
        typeof (item as Attachment).url === "string",
    )
    .map((attachment) => ({
      filename: attachment.filename,
      originalName: attachment.originalName,
      mimeType: attachment.mimeType,
      size: attachment.size,
      url: attachment.url,
    }));
}

function normalizeFeatures(value: unknown): FeatureOptions {
  const fallback: FeatureOptions = {
    webSearch: true,
    dateGrounding: true,
    codeMode: false,
  };

  if (!value || typeof value !== "object") {
    return fallback;
  }

  const features = value as Partial<FeatureOptions>;
  return {
    webSearch:
      typeof features.webSearch === "boolean"
        ? features.webSearch
        : fallback.webSearch,
    dateGrounding:
      typeof features.dateGrounding === "boolean"
        ? features.dateGrounding
        : fallback.dateGrounding,
    codeMode:
      typeof features.codeMode === "boolean"
        ? features.codeMode
        : fallback.codeMode,
  };
}

function isDateTimeQuery(text: string) {
  const t = text.toLowerCase();
  return (
    /\b(today|date|time|current date|current time|what date|what time)\b/.test(
      t,
    ) || /\b(aaj|taarikh|tarikh|samay|time kya|date kya)\b/.test(t)
  );
}

function shouldUseWebSearch(text: string) {
  const t = text.toLowerCase();
  return /\b(latest|news|current|today|price|update|search|recent|who is)\b/.test(
    t,
  );
}

function isNewsQuery(text: string) {
  const t = text.toLowerCase();
  return /\b(news|headlines|breaking|today news|latest news)\b/.test(t);
}

function getCurrentDateTimeAnswer() {
  const now = new Date();
  const dateText = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(now);
  const timeText = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(now);

  return `Aaj ki date ${dateText} hai. Current time ${timeText} (IST) hai.`;
}

async function buildAugmentedPrompt(content: string, features: FeatureOptions) {
  const blocks: string[] = [];

  if (features.dateGrounding) {
    const nowIso = new Date().toISOString();
    blocks.push(
      `Current date/time: ${nowIso}. This is authoritative. Never claim a different date or year.`,
    );
  }

  if (features.codeMode) {
    blocks.push(
      "Code mode is ON. Give practical, correct code-focused answers. Use short explanation + clean code blocks. Mention assumptions when needed.",
    );
  }

  if (!features.webSearch || !shouldUseWebSearch(content)) {
    blocks.push(`User question:\n${content}`);
    return blocks.join("\n\n");
  }

  const results = await searchWeb(content, 4);
  if (results.length === 0) {
    blocks.push(`User question:\n${content}`);
    return blocks.join("\n\n");
  }

  const searchBlock = results
    .map(
      (item, index) =>
        `${index + 1}. ${item.title}\nSnippet: ${item.snippet}\nURL: ${item.url}`,
    )
    .join("\n\n");

  blocks.push(
    `Web search context (use when relevant, do not fabricate beyond these):\n${searchBlock}`,
  );
  blocks.push(`User question:\n${content}`);
  return blocks.join("\n\n");
}

function formatTodayNewsResponse(
  items: Awaited<ReturnType<typeof searchLatestNews>>,
) {
  const now = new Date();
  const today = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(now);

  const lines = items.map((item, index) => {
    const published = item.publishedAt
      ? new Date(item.publishedAt).toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      : "Unknown time";

    const source = item.source ? ` (${item.source})` : "";
    return `${index + 1}. ${item.title}${source}\n   Published: ${published}\n   Link: ${item.link}`;
  });

  return `Today's date is ${today} (IST).\n\nLatest headlines:\n${lines.join("\n\n")}`;
}

export async function POST(request: NextRequest, { params }: Params) {
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
    const content = typeof body.content === "string" ? body.content.trim() : "";
    const attachments = normalizeAttachments(body.attachments);
    const features = normalizeFeatures(body.features);

    if (!content && attachments.length === 0) {
      return NextResponse.json(
        { success: false, error: "Message content or attachment is required" },
        { status: 400 },
      );
    }

    const chat = await Chat.findOne({ _id: id, userId: user.id });
    if (!chat) {
      return NextResponse.json(
        { success: false, error: "Chat not found" },
        { status: 404 },
      );
    }

    chat.messages.push({
      role: "user",
      content,
      attachments,
      createdAt: new Date(),
    });

    // Check if current message has image attachments for vision
    const imageAttachments = attachments.filter((a) =>
      a.mimeType.startsWith("image/"),
    );

    let aiText: string;
    const augmentedPrompt = await buildAugmentedPrompt(content, features);

    if (
      features.dateGrounding &&
      attachments.length === 0 &&
      isDateTimeQuery(content)
    ) {
      aiText = getCurrentDateTimeAnswer();
    } else if (
      features.webSearch &&
      attachments.length === 0 &&
      isNewsQuery(content)
    ) {
      const newsItems = await searchLatestNews(content, 6);
      if (newsItems.length > 0) {
        aiText = formatTodayNewsResponse(newsItems);
      } else {
        aiText = await generateReply(
          chat.messages.map((message, index, array) => {
            const baseContent =
              message.attachments && message.attachments.length > 0
                ? `${message.content}\n\nAttachments: ${message.attachments.map((attachment) => attachment.originalName).join(", ")}`.trim()
                : message.content;
            const isLast = index === array.length - 1;
            return {
              role: message.role,
              content: isLast ? augmentedPrompt : baseContent,
            };
          }),
          chat.model,
        );
      }
    } else if (imageAttachments.length > 0) {
      // Read image files from disk and send to Gemini vision
      const images: Array<{ data: string; mimeType: string }> = [];
      for (const img of imageAttachments) {
        try {
          const filePath = path.join(
            process.cwd(),
            "public",
            img.url.startsWith("/") ? img.url.slice(1) : img.url,
          );
          const buffer = await fs.readFile(filePath);
          images.push({
            data: buffer.toString("base64"),
            mimeType: img.mimeType,
          });
        } catch {
          // skip unreadable files
        }
      }

      if (images.length > 0) {
        aiText = await generateReplyWithImages(
          augmentedPrompt || "Describe this image in detail.",
          images,
          chat.model,
        );
      } else {
        aiText = await generateReply(
          chat.messages.map((message, index, array) => {
            const isLast = index === array.length - 1;
            return {
              role: message.role,
              content: isLast ? augmentedPrompt : message.content,
            };
          }),
          chat.model,
        );
      }
    } else {
      aiText = await generateReply(
        chat.messages.map((message, index, array) => {
          const baseContent =
            message.attachments && message.attachments.length > 0
              ? `${message.content}\n\nAttachments: ${message.attachments.map((attachment) => attachment.originalName).join(", ")}`.trim()
              : message.content;
          const isLast = index === array.length - 1;
          return {
            role: message.role,
            content: isLast ? augmentedPrompt : baseContent,
          };
        }),
        chat.model,
      );
    }

    chat.messages.push({
      role: "model",
      content: aiText,
      createdAt: new Date(),
    });

    if (chat.title === "New Chat") {
      chat.title = content.slice(0, 50);
    }

    await chat.save();

    return NextResponse.json({
      success: true,
      message: { role: "model", content: aiText },
      chat,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to send message";
    const lowerMessage = message.toLowerCase();
    const isUpstreamUnavailable =
      lowerMessage.includes("fetch failed") ||
      lowerMessage.includes("network") ||
      lowerMessage.includes("timed out") ||
      lowerMessage.includes("503") ||
      lowerMessage.includes("socket hang up");

    return NextResponse.json(
      {
        success: false,
        error: isUpstreamUnavailable
          ? "AI service temporarily unavailable. Please try again in a few seconds."
          : message,
      },
      { status: isUpstreamUnavailable ? 503 : 500 },
    );
  }
}
