import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable, postsTable, connectionsTable, messagesTable, sessionsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  RegisterBody,
  LoginBody,
} from "@workspace/api-zod";
import { createSession, setSessionCookie, clearSessionCookie, deleteSession, getSessionUserId } from "../lib/session";

const router: IRouter = Router();

function serializeUser(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName ?? null,
    bio: user.bio ?? null,
    createdAt: user.createdAt.toISOString(),
  };
}

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { username, password, displayName, bio } = parsed.data;

  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, username));

  if (existing) {
    res.status(400).json({ error: "Username already taken" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const [user] = await db
    .insert(usersTable)
    .values({
      username,
      passwordHash,
      displayName: displayName ?? null,
      bio: bio ?? null,
    })
    .returning();

  const sessionId = await createSession(user.id);
  setSessionCookie(res, sessionId);

  res.status(201).json({ user: serializeUser(user) });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { username, password } = parsed.data;

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, username));

  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const sessionId = await createSession(user.id);
  setSessionCookie(res, sessionId);

  res.json({ user: serializeUser(user) });
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  await deleteSession(req);
  clearSessionCookie(res);
  res.json({ ok: true });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const userId = await getSessionUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId));

  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  res.json(serializeUser(user));
});

router.delete("/auth/account", async (req, res): Promise<void> => {
  const userId = await getSessionUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  // Full data wipe
  await db.delete(messagesTable).where(eq(messagesTable.fromUserId, userId));
  await db.delete(messagesTable).where(eq(messagesTable.toUserId, userId));
  await db.delete(connectionsTable).where(eq(connectionsTable.followerId, userId));
  await db.delete(connectionsTable).where(eq(connectionsTable.followingId, userId));
  await db.delete(postsTable).where(eq(postsTable.authorId, userId));
  await db.delete(sessionsTable).where(eq(sessionsTable.userId, userId));
  await db.delete(usersTable).where(eq(usersTable.id, userId));

  clearSessionCookie(res);
  res.json({ ok: true });
});

export default router;
