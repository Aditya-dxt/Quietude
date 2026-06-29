import { Router, type IRouter, type Request } from "express";
import { db, usersTable, connectionsTable } from "@workspace/db";
import { eq, and, ilike, or } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { UpdateProfileBody, UpdateSettingsBody } from "@workspace/api-zod";
import { getSessionUserId } from "../lib/session";
import archiver from "archiver";

const router: IRouter = Router();

type AuthRequest = Request & { user: typeof usersTable.$inferSelect };

router.get("/users/search", requireAuth, async (req, res): Promise<void> => {
  const query = req.query.q as string;
  if (!query || query.length < 2) {
    res.json([]);
    return;
  }

  const searchTerm = `%${query}%`;
  const users = await db
    .select({
      id: usersTable.id,
      username: usersTable.username,
      displayName: usersTable.displayName,
      bio: usersTable.bio,
      createdAt: usersTable.createdAt,
    })
    .from(usersTable)
    .where(
      or(
        ilike(usersTable.username, searchTerm),
        ilike(usersTable.displayName, searchTerm)
      )
    )
    .limit(20);

  res.json(users.map(u => ({
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    bio: u.bio,
    createdAt: u.createdAt.toISOString()
  })));
});

router.get("/users/:handle", async (req, res): Promise<void> => {
  const handle = Array.isArray(req.params.handle)
    ? req.params.handle[0]
    : req.params.handle;

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, handle));

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  // Check if current viewer follows this user
  const viewerId = await getSessionUserId(req);
  let isFollowing = false;

  if (viewerId && viewerId !== user.id) {
    const [conn] = await db
      .select()
      .from(connectionsTable)
      .where(
        and(
          eq(connectionsTable.followerId, viewerId),
          eq(connectionsTable.followingId, user.id),
        ),
      );
    isFollowing = !!conn;
  }

  res.json({
    id: user.id,
    username: user.username,
    displayName: user.displayName ?? null,
    bio: user.bio ?? null,
    createdAt: user.createdAt.toISOString(),
    isFollowing,
  });
});

router.patch("/users/me/profile", requireAuth, async (req, res): Promise<void> => {
  const user = (req as AuthRequest).user;
  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [updated] = await db
    .update(usersTable)
    .set({
      displayName: parsed.data.displayName ?? null,
      bio: parsed.data.bio ?? null,
    })
    .where(eq(usersTable.id, user.id))
    .returning();

  res.json({
    id: updated.id,
    username: updated.username,
    displayName: updated.displayName ?? null,
    bio: updated.bio ?? null,
    createdAt: updated.createdAt.toISOString(),
  });
});

router.patch("/users/me/settings", requireAuth, async (req, res): Promise<void> => {
  const user = (req as AuthRequest).user;
  const parsed = UpdateSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [updated] = await db
    .update(usersTable)
    .set({
      showReadReceipts: parsed.data.showReadReceipts ?? user.showReadReceipts,
    })
    .where(eq(usersTable.id, user.id))
    .returning();

  res.json({
    id: updated.id,
    username: updated.username,
    displayName: updated.displayName ?? null,
    bio: updated.bio ?? null,
    createdAt: updated.createdAt.toISOString(),
    showReadReceipts: updated.showReadReceipts,
  });
});

router.get("/users/me/export", requireAuth, async (req, res): Promise<void> => {
  const user = (req as AuthRequest).user;
  
  res.attachment('quietude-data.zip');
  const archive = archiver('zip', { zlib: { level: 9 } });
  
  archive.on('error', (err) => {
    res.status(500).send({ error: err.message });
  });

  archive.pipe(res);

  // Profile
  archive.append(JSON.stringify(user, null, 2), { name: 'profile.json' });

  // Add more data as needed (posts, messages, etc)
  // We'll keep it simple for now, but a real export would query all tables.

  await archive.finalize();
});

export default router;
