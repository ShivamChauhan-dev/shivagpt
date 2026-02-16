import { GoogleGenerativeAI } from "@google/generative-ai";

const DEFAULT_MODEL = "gemini-2.5-flash";
const MODEL_FALLBACKS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
];

const RETRYABLE_ERROR_MARKERS = [
  "fetch failed",
  "network",
  "etimedout",
  "econnreset",
  "econnrefused",
  "socket hang up",
  "429",
  "500",
  "502",
  "503",
  "504",
];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();
  return RETRYABLE_ERROR_MARKERS.some((marker) => lower.includes(marker));
}

function toError(error: unknown, fallbackMessage: string) {
  return error instanceof Error ? error : new Error(fallbackMessage);
}

function buildModelCandidates(model: string) {
  return [model, getConfiguredModel(), ...MODEL_FALLBACKS].filter(
    (value, index, array) => value && array.indexOf(value) === index,
  );
}

function getConfiguredModel() {
  const configured = process.env.GEMINI_MODEL_NAME;
  if (!configured) {
    return DEFAULT_MODEL;
  }

  return configured.split("#")[0].trim() || DEFAULT_MODEL;
}

function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set.");
  }
  return new GoogleGenerativeAI(apiKey);
}

export async function generateReply(
  messages: Array<{ role: "user" | "model"; content: string }>,
  model = getConfiguredModel(),
) {
  const genAI = getGenAI();
  const modelCandidates = buildModelCandidates(model);

  const history = messages.slice(0, -1).map((message) => ({
    role: message.role,
    parts: [{ text: message.content }],
  }));

  const lastMessage = messages[messages.length - 1];

  let lastError: unknown;
  for (const candidateModel of modelCandidates) {
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        const selectedModel = genAI.getGenerativeModel({
          model: candidateModel,
        });
        const chat = selectedModel.startChat({
          history: history.length > 0 ? history : undefined,
        });

        const result = await chat.sendMessage(lastMessage.content);
        const response = await result.response;
        return response.text();
      } catch (error) {
        lastError = error;
        const shouldRetry = isRetryableError(error) && attempt < 3;
        if (!shouldRetry) {
          break;
        }
        await sleep(300 * attempt);
      }
    }
  }

  throw toError(
    lastError,
    "Failed to generate response. Gemini service is currently unavailable.",
  );
}

export async function generateReplyWithImages(
  textContent: string,
  images: Array<{ data: string; mimeType: string }>,
  model = getConfiguredModel(),
) {
  const genAI = getGenAI();
  const modelCandidates = buildModelCandidates(model);

  const parts: Array<
    { text: string } | { inlineData: { data: string; mimeType: string } }
  > = [];

  if (textContent) {
    parts.push({ text: textContent });
  }

  for (const image of images) {
    parts.push({
      inlineData: { data: image.data, mimeType: image.mimeType },
    });
  }

  if (parts.length === 0) {
    parts.push({ text: "Describe this." });
  }

  let lastError: unknown;
  for (const candidateModel of modelCandidates) {
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        const selectedModel = genAI.getGenerativeModel({
          model: candidateModel,
        });
        const result = await selectedModel.generateContent(parts);
        const response = await result.response;
        return response.text();
      } catch (error) {
        lastError = error;
        const shouldRetry = isRetryableError(error) && attempt < 3;
        if (!shouldRetry) {
          break;
        }
        await sleep(300 * attempt);
      }
    }
  }

  throw toError(
    lastError,
    "Failed to generate response with images. Gemini service is currently unavailable.",
  );
}
