import { Router, type IRouter, type Request } from "express";
import { db, usersTable, messagesTable, connectionsTable } from "@workspace/db";
import { eq, and, or, desc, max, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { SendMessageBody } from "@workspace/api-zod";

const router: IRouter = Router();

type AuthRequest = Request & { user: typeof usersTable.$inferSelect };

router.get("/messages/conversations", requireAuth, async (req, res): Promise<void> => {
  const me = (req as AuthRequest).user;

  // Get distinct conversations with last message
  const rows = await db
    .select()
    .from(messagesTable)
    .where(
      or(
        eq(messagesTable.fromUserId, me.id),
        eq(messagesTable.toUserId, me.id),
      ),
    )
    .orderBy(desc(messagesTable.createdAt));

  // Build unique conversation map (keyed by the other user's ID)
  const convMap = new Map<
    number,
    { lastMessage: string; updatedAt: Date; otherUserId: number }
  >();

  for (const msg of rows) {
    const otherId = msg.fromUserId === me.id ? msg.toUserId : msg.fromUserId;
    if (!convMap.has(otherId)) {
      convMap.set(otherId, {
        lastMessage: msg.content,
        updatedAt: msg.createdAt,
        otherUserId: otherId,
      });
    }
  }

  if (convMap.size === 0) {
    res.json([]);
    return;
  }

  const otherUserIds = [...convMap.keys()];
  const otherUsers = await db
    .select()
    .from(usersTable)
    .where(
      sql`${usersTable.id} = ANY(${sql.raw(`ARRAY[${otherUserIds.join(",")}]`)}::int[])`,
    );

  // Check which ones I follow
  const following = await db
    .select({ followingId: connectionsTable.followingId })
    .from(connectionsTable)
    .where(eq(connectionsTable.followerId, me.id));
  const followingSet = new Set(following.map((f) => f.followingId));

  const result = otherUsers.map((user) => {
    const conv = convMap.get(user.id)!;
    return {
      withUser: {
        id: user.id,
        username: user.username,
        displayName: user.displayName ?? null,
        bio: user.bio ?? null,
        createdAt: user.createdAt.toISOString(),
        isFollowing: followingSet.has(user.id),
      },
      lastMessage: conv.lastMessage,
      updatedAt: conv.updatedAt.toISOString(),
      unreadCount: 0, // simplified — no read tracking
    };
  });

  result.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

  res.json(result);
});

router.get("/messages/:handle", requireAuth, async (req, res): Promise<void> => {
  const me = (req as AuthRequest).user;
  const handle = Array.isArray(req.params.handle)
    ? req.params.handle[0]
    : req.params.handle;

  const [other] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, handle));

  if (!other) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const msgs = await db
    .select()
    .from(messagesTable)
    .where(
      or(
        and(eq(messagesTable.fromUserId, me.id), eq(messagesTable.toUserId, other.id)),
        and(eq(messagesTable.fromUserId, other.id), eq(messagesTable.toUserId, me.id)),
      ),
    )
    .orderBy(desc(messagesTable.createdAt))
    .limit(50);

  res.json(
    msgs.reverse().map((m) => ({
      id: m.id,
      content: m.content,
      fromUsername: m.fromUserId === me.id ? me.username : other.username,
      toUsername: m.toUserId === me.id ? me.username : other.username,
      createdAt: m.createdAt.toISOString(),
      isOwn: m.fromUserId === me.id,
    })),
  );
});

router.post("/messages/:handle", requireAuth, async (req, res): Promise<void> => {
  const me = (req as AuthRequest).user;
  const handle = Array.isArray(req.params.handle)
    ? req.params.handle[0]
    : req.params.handle;

  const [other] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, handle));

  if (!other) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const parsed = SendMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [msg] = await db
    .insert(messagesTable)
    .values({
      fromUserId: me.id,
      toUserId: other.id,
      content: parsed.data.content,
    })
    .returning();

  res.status(201).json({
    id: msg.id,
    content: msg.content,
    fromUsername: me.username,
    toUsername: other.username,
    createdAt: msg.createdAt.toISOString(),
    isOwn: true,
  });
});

export default router;
