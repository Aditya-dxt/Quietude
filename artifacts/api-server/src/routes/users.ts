import { Router, type IRouter, type Request } from "express";
import { db, usersTable, connectionsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { UpdateProfileBody } from "@workspace/api-zod";
import { getSessionUserId } from "../lib/session";

const router: IRouter = Router();

type AuthRequest = Request & { user: typeof usersTable.$inferSelect };

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

export default router;
