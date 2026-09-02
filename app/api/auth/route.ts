import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { createSession, deleteSession, sessionCookieName } from "@/lib/auth";
import { getOrCreateUser } from "@/lib/repo";

const schema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
});

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
};

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
  const sessionToken = createSession(user.id);

  const res = NextResponse.json({ user }, { status: 200 });
  res.cookies.set(sessionCookieName, sessionToken, cookieOptions);
  return res;
}

export async function DELETE() {
  const store = await cookies();
  const sessionToken = store.get(sessionCookieName)?.value;
  if (sessionToken) deleteSession(sessionToken);

  const res = NextResponse.json({ ok: true });
  res.cookies.set(sessionCookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return res;
}
