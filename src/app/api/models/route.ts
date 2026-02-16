import { NextResponse } from "next/server";

export const runtime = "nodejs";

function getDefaultModel() {
  const configured = process.env.GEMINI_MODEL_NAME;
  if (!configured) {
    return "gemini-2.5-flash";
  }
  return configured.split("#")[0].trim() || "gemini-2.5-flash";
}

const AVAILABLE_MODELS = [
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    description: "Fast and versatile",
  },
  {
    id: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    description: "Most capable model",
  },
  {
    id: "gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    description: "Previous gen fast model",
  },
  {
    id: "gemini-2.0-flash-lite",
    name: "Gemini 2.0 Flash Lite",
    description: "Lightweight and fast",
  },
  {
    id: "gemini-1.5-pro",
    name: "Gemini 1.5 Pro",
    description: "Large context window",
  },
  {
    id: "gemini-1.5-flash",
    name: "Gemini 1.5 Flash",
    description: "Balanced speed and quality",
  },
];

export async function GET() {
  const defaultModel = getDefaultModel();

  return NextResponse.json({
    success: true,
    models: AVAILABLE_MODELS,
    defaultModel,
  });
}
