import { randomBytes } from "crypto";
import { db, sessionsTable } from "@workspace/db";
import { eq, lt } from "drizzle-orm";
import type { Request, Response } from "express";

const SESSION_COOKIE = "qsid";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function generateSessionId(): string {
  return randomBytes(32).toString("hex");
}

export async function createSession(userId: number): Promise<string> {
  const id = generateSessionId();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.insert(sessionsTable).values({ id, userId, expiresAt });
  return id;
}

export async function getSessionUserId(req: Request): Promise<number | null> {
  const sessionId = req.cookies?.[SESSION_COOKIE] as string | undefined;
  if (!sessionId) return null;

  const [session] = await db
    .select()
    .from(sessionsTable)
    .where(eq(sessionsTable.id, sessionId));

  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await db.delete(sessionsTable).where(eq(sessionsTable.id, sessionId));
    return null;
  }
  return session.userId;
}

export function setSessionCookie(res: Response, sessionId: string): void {
  res.cookie(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_TTL_MS,
    path: "/",
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(SESSION_COOKIE, { path: "/" });
}

export async function deleteSession(req: Request): Promise<void> {
  const sessionId = req.cookies?.[SESSION_COOKIE] as string | undefined;
  if (!sessionId) return;
  await db.delete(sessionsTable).where(eq(sessionsTable.id, sessionId));
}

export async function pruneExpiredSessions(): Promise<void> {
  await db.delete(sessionsTable).where(lt(sessionsTable.expiresAt, new Date()));
}
