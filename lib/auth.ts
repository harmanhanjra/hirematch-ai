import { cookies } from "next/headers";
import db, { now, uuid } from "./db";
import { getUser, getOrCreateUser } from "./repo";
import type { User } from "./types";

const SESSION_COOKIE = "jm_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function createSession(userId: string): string {
  const id = uuid();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  db.prepare(
    "INSERT INTO sessions (id, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)"
  ).run(id, userId, now(), expiresAt);
  return id;
}

export function deleteSession(id: string): void {
  db.prepare("DELETE FROM sessions WHERE id = ?").run(id);
}

/**
 * Returns the current authenticated user from the session cookie, or null.
 * Called in server components / route handlers.
 */
export async function getCurrentUser(): Promise<User | null> {
  const store = await cookies();
  const sessionId = store.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;

  const session = db
    .prepare("SELECT * FROM sessions WHERE id = ?")
    .get(sessionId) as any;
  if (!session) return null;

  if (new Date(session.expires_at).getTime() < Date.now()) {
    deleteSession(sessionId);
    return null;
  }

  return getUser(session.user_id) ?? null;
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

export async function ensureDemoUser(): Promise<User> {
  const current = await getCurrentUser();
  if (current) return current;
  return getOrCreateUser("demo@jobmatch.app", "Demo User");
}

export const sessionCookieName = SESSION_COOKIE;
