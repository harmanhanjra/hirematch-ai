import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import db, { now } from "./db";
import { getUser, getOrCreateUser } from "./repo";
import type { User } from "./types";

const SESSION_COOKIE = "jm_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const SESSION_TOKEN_BYTES = 32;

function hashSessionToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

function createSessionToken(): string {
  return randomBytes(SESSION_TOKEN_BYTES).toString("base64url");
}

export function createSession(userId: string): string {
  const token = createSessionToken();
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();

  db.prepare(
    "INSERT INTO sessions (id, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)"
  ).run(tokenHash, userId, now(), expiresAt);

  return token;
}

export function deleteSession(token: string): void {
  if (!token) return;
  db.prepare("DELETE FROM sessions WHERE id = ?").run(hashSessionToken(token));
}

function deleteExpiredSessions(): void {
  db.prepare("DELETE FROM sessions WHERE expires_at < ?").run(now());
}

/**
 * Returns the current authenticated user from the session cookie, or null.
 * Session tokens are hashed before lookup so raw bearer tokens are never
 * persisted in SQLite.
 */
export async function getCurrentUser(): Promise<User | null> {
  const store = await cookies();
  const sessionToken = store.get(SESSION_COOKIE)?.value;
  if (!sessionToken) return null;

  const session = db
    .prepare("SELECT * FROM sessions WHERE id = ?")
    .get(hashSessionToken(sessionToken)) as any;
  if (!session) return null;

  if (new Date(session.expires_at).getTime() < Date.now()) {
    deleteSession(sessionToken);
    return null;
  }

  // Opportunistic cleanup keeps the demo database from accumulating stale rows.
  deleteExpiredSessions();

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
