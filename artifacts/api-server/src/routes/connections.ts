import { Router, type IRouter, type Request } from "express";
import { db, usersTable, connectionsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

type AuthRequest = Request & { user: typeof usersTable.$inferSelect };

function serializeUserProfile(
  user: typeof usersTable.$inferSelect,
  isFollowing: boolean,
) {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName ?? null,
    bio: user.bio ?? null,
    createdAt: user.createdAt.toISOString(),
    isFollowing,
  };
}

router.post("/connections/follow/:handle", requireAuth, async (req, res): Promise<void> => {
  const currentUser = (req as AuthRequest).user;
  const handle = Array.isArray(req.params.handle)
    ? req.params.handle[0]
    : req.params.handle;

  const [target] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, handle));

  if (!target) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  if (target.id === currentUser.id) {
    res.status(400).json({ error: "Cannot follow yourself" });
    return;
  }

  // Upsert — ignore if already following
  await db
    .insert(connectionsTable)
    .values({ followerId: currentUser.id, followingId: target.id })
    .onConflictDoNothing();

  res.json({ ok: true });
});

router.delete("/connections/follow/:handle", requireAuth, async (req, res): Promise<void> => {
  const currentUser = (req as AuthRequest).user;
  const handle = Array.isArray(req.params.handle)
    ? req.params.handle[0]
    : req.params.handle;

  const [target] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, handle));

  if (!target) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  await db
    .delete(connectionsTable)
    .where(
      and(
        eq(connectionsTable.followerId, currentUser.id),
        eq(connectionsTable.followingId, target.id),
      ),
    );

  res.json({ ok: true });
});

router.get("/connections/following", requireAuth, async (req, res): Promise<void> => {
  const currentUser = (req as AuthRequest).user;

  const rows = await db
    .select({ user: usersTable })
    .from(connectionsTable)
    .innerJoin(usersTable, eq(connectionsTable.followingId, usersTable.id))
    .where(eq(connectionsTable.followerId, currentUser.id));

  res.json(rows.map((r) => serializeUserProfile(r.user, true)));
});

router.get("/connections/followers", requireAuth, async (req, res): Promise<void> => {
  const currentUser = (req as AuthRequest).user;

  const rows = await db
    .select({ user: usersTable })
    .from(connectionsTable)
    .innerJoin(usersTable, eq(connectionsTable.followerId, usersTable.id))
    .where(eq(connectionsTable.followingId, currentUser.id));

  // Check if I follow them back
  const followingBack = await db
    .select({ followingId: connectionsTable.followingId })
    .from(connectionsTable)
    .where(eq(connectionsTable.followerId, currentUser.id));

  const followingSet = new Set(followingBack.map((f) => f.followingId));

  res.json(rows.map((r) => serializeUserProfile(r.user, followingSet.has(r.user.id))));
});

export default router;
