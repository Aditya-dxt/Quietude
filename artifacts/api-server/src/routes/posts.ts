import { Router, type IRouter, type Request } from "express";
import { db, postsTable, usersTable, connectionsTable } from "@workspace/db";
import { eq, and, desc, inArray, isNull, or, gt, lt } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { CreatePostBody, GetPostParams, DeletePostParams } from "@workspace/api-zod";
import { getSessionUserId } from "../lib/session";

const router: IRouter = Router();

type AuthRequest = Request & { user: typeof usersTable.$inferSelect };

const DEFAULT_LIMIT = 20;
const EXPIRY_DAYS = 30;

function serializePost(
  post: typeof postsTable.$inferSelect,
  author: typeof usersTable.$inferSelect,
) {
  return {
    id: post.id,
    content: post.content,
    authorUsername: author.username,
    authorDisplayName: author.displayName ?? null,
    createdAt: post.createdAt.toISOString(),
    expiresAt: post.expiresAt ? post.expiresAt.toISOString() : null,
    isPermanent: post.isPermanent,
  };
}

// Filter out expired posts helper
function notExpired() {
  return or(isNull(postsTable.expiresAt), gt(postsTable.expiresAt, new Date()));
}

router.post("/posts", requireAuth, async (req, res): Promise<void> => {
  const user = (req as AuthRequest).user;
  const parsed = CreatePostBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { content, isPermanent } = parsed.data;
  const expiresAt =
    isPermanent
      ? null
      : new Date(Date.now() + EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  const [post] = await db
    .insert(postsTable)
    .values({
      authorId: user.id,
      content,
      isPermanent: isPermanent ?? false,
      expiresAt,
    })
    .returning();

  res.status(201).json(serializePost(post, user));
});

router.get("/posts/feed", async (req, res): Promise<void> => {
  const userId = await getSessionUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const limit = Math.min(Number(req.query.limit) || DEFAULT_LIMIT, 50);
  const cursor = req.query.cursor as string | undefined;

  // Get IDs of users I follow
  const following = await db
    .select({ followingId: connectionsTable.followingId })
    .from(connectionsTable)
    .where(eq(connectionsTable.followerId, userId));

  const followingIds = following.map((f) => f.followingId);

  if (followingIds.length === 0) {
    res.json({ posts: [], nextCursor: null });
    return;
  }

  const conditions = [inArray(postsTable.authorId, followingIds), notExpired()];
  if (cursor && cursor !== "null") {
    const cursorDate = new Date(cursor);
    conditions.push(lt(postsTable.createdAt, cursorDate));
  }

  const rows = await db
    .select()
    .from(postsTable)
    .innerJoin(usersTable, eq(postsTable.authorId, usersTable.id))
    .where(and(...conditions))
    .orderBy(desc(postsTable.createdAt))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? items[items.length - 1].posts.createdAt.toISOString() : null;

  res.json({
    posts: items.map((r) => serializePost(r.posts, r.users)),
    nextCursor,
  });
});

router.get("/posts/explore", async (req, res): Promise<void> => {
  const limit = Math.min(Number(req.query.limit) || DEFAULT_LIMIT, 50);
  const cursor = req.query.cursor as string | undefined;

  const conditions = [notExpired()];
  if (cursor && cursor !== "null") {
    const cursorDate = new Date(cursor);
    conditions.push(lt(postsTable.createdAt, cursorDate));
  }

  const rows = await db
    .select()
    .from(postsTable)
    .innerJoin(usersTable, eq(postsTable.authorId, usersTable.id))
    .where(and(...conditions))
    .orderBy(desc(postsTable.createdAt))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? items[items.length - 1].posts.createdAt.toISOString() : null;

  res.json({
    posts: items.map((r) => serializePost(r.posts, r.users)),
    nextCursor,
  });
});

router.get("/posts/user/:handle", async (req, res): Promise<void> => {
  const handle = Array.isArray(req.params.handle)
    ? req.params.handle[0]
    : req.params.handle;

  const [author] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, handle));

  if (!author) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const limit = DEFAULT_LIMIT;
  const cursor = req.query.cursor as string | undefined;

  const conditions = [eq(postsTable.authorId, author.id), notExpired()];
  if (cursor && cursor !== "null") {
    conditions.push(lt(postsTable.createdAt, new Date(cursor)));
  }

  const rows = await db
    .select()
    .from(postsTable)
    .where(and(...conditions))
    .orderBy(desc(postsTable.createdAt))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? items[items.length - 1].createdAt.toISOString() : null;

  res.json({
    posts: items.map((p) => serializePost(p, author)),
    nextCursor,
  });
});

router.get("/posts/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetPostParams.safeParse({ id: rawId });
  if (!params.success) {
    res.status(400).json({ error: "Invalid post id" });
    return;
  }

  const [row] = await db
    .select()
    .from(postsTable)
    .innerJoin(usersTable, eq(postsTable.authorId, usersTable.id))
    .where(and(eq(postsTable.id, params.data.id), notExpired()));

  if (!row) {
    res.status(404).json({ error: "Post not found" });
    return;
  }

  res.json(serializePost(row.posts, row.users));
});

router.delete("/posts/:id", requireAuth, async (req, res): Promise<void> => {
  const user = (req as AuthRequest).user;
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeletePostParams.safeParse({ id: rawId });
  if (!params.success) {
    res.status(400).json({ error: "Invalid post id" });
    return;
  }

  const [post] = await db
    .select()
    .from(postsTable)
    .where(eq(postsTable.id, params.data.id));

  if (!post) {
    res.status(404).json({ error: "Post not found" });
    return;
  }

  if (post.authorId !== user.id) {
    res.status(403).json({ error: "Not your post" });
    return;
  }

  await db.delete(postsTable).where(eq(postsTable.id, params.data.id));
  res.json({ ok: true });
});

export default router;
