import { NextRequest } from "next/server";
import { getAuthCookieName, verifyAuthToken } from "@/lib/auth";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
};

export function getSessionUser(request: NextRequest): SessionUser | null {
  const token = request.cookies.get(getAuthCookieName())?.value;
  if (!token) {
    return null;
  }

  const payload = verifyAuthToken(token);
  if (!payload) {
    return null;
  }

  return {
    id: payload.sub,
    name: payload.name,
    email: payload.email,
  };
}
