import { NextResponse } from "next/server";
import { z } from "zod";
import { createSession, sessionCookieName } from "@/lib/auth";
import { getOrCreateUser } from "@/lib/repo";

const schema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
});

export async function POST(request: Request) {
  const raw = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const user = getOrCreateUser(parsed.data.email, parsed.data.name ?? null);
  const sessionId = createSession(user.id);

  const res = NextResponse.json({ user }, { status: 200 });
  res.cookies.set(sessionCookieName, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
