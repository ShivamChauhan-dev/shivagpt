import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";

const AUTH_COOKIE = "chatbot_auth";
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;

type AuthTokenPayload = {
  sub: string;
  email: string;
  name: string;
  exp: number;
};

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not set.");
  }
  return secret;
}

function base64UrlEncode(value: string) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.length % 4;
  const padded = pad === 0 ? base64 : `${base64}${"=".repeat(4 - pad)}`;
  return Buffer.from(padded, "base64").toString("utf8");
}

function sign(value: string) {
  return createHmac("sha256", getSecret()).update(value).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);
  if (aBuffer.length !== bBuffer.length) {
    return false;
  }
  return timingSafeEqual(aBuffer, bBuffer);
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) {
    return false;
  }
  const derived = scryptSync(password, salt, 64);
  const hashBuffer = Buffer.from(hash, "hex");
  if (hashBuffer.length !== derived.length) {
    return false;
  }
  return timingSafeEqual(hashBuffer, derived);
}

export function createAuthToken(payload: {
  sub: string;
  email: string;
  name: string;
}) {
  const tokenPayload: AuthTokenPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
  };

  const encoded = base64UrlEncode(JSON.stringify(tokenPayload));
  const signature = sign(encoded);
  return `${encoded}.${signature}`;
}

export function verifyAuthToken(token: string): AuthTokenPayload | null {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) {
    return null;
  }

  const expected = sign(encoded);
  if (!safeEqual(signature, expected)) {
    return null;
  }

  try {
    const decoded = JSON.parse(base64UrlDecode(encoded)) as AuthTokenPayload;
    if (decoded.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

export function getAuthCookieName() {
  return AUTH_COOKIE;
}

export function getAuthCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: TOKEN_TTL_SECONDS,
  };
}
