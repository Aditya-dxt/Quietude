import { Router, type IRouter, type Request } from "express";
import { db, postsTable, usersTable, repliesTable } from "@workspace/db";
import { eq, asc, and, isNull, or, gt } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { CreateReplyBody, CreateReplyParams, ListRepliesParams } from "@workspace/api-zod";

const router: IRouter = Router();

type AuthRequest = Request & { user: typeof usersTable.$inferSelect };

function notExpired() {
  return or(isNull(postsTable.expiresAt), gt(postsTable.expiresAt, new Date()));
}

router.get("/posts/:id/replies", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = ListRepliesParams.safeParse({ id: rawId });
  if (!params.success) {
    res.status(400).json({ error: "Invalid post id" });
    return;
  }

  const [post] = await db
    .select()
    .from(postsTable)
    .where(and(eq(postsTable.id, params.data.id), notExpired()));

  if (!post) {
    res.status(404).json({ error: "Post not found" });
    return;
  }

  const rows = await db
    .select()
    .from(repliesTable)
    .innerJoin(usersTable, eq(repliesTable.authorId, usersTable.id))
    .where(eq(repliesTable.postId, params.data.id))
    .orderBy(asc(repliesTable.createdAt));

  res.json(
    rows.map((r) => ({
      id: r.replies.id,
      postId: r.replies.postId,
      content: r.replies.content,
      authorUsername: r.users.username,
      authorDisplayName: r.users.displayName ?? null,
      createdAt: r.replies.createdAt.toISOString(),
    })),
  );
});

router.post("/posts/:id/replies", requireAuth, async (req, res): Promise<void> => {
  const me = (req as AuthRequest).user;
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = CreateReplyParams.safeParse({ id: rawId });
  if (!params.success) {
    res.status(400).json({ error: "Invalid post id" });
    return;
  }

  const [post] = await db
    .select()
    .from(postsTable)
    .where(and(eq(postsTable.id, params.data.id), notExpired()));

  if (!post) {
    res.status(404).json({ error: "Post not found" });
    return;
  }

  const parsed = CreateReplyBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [reply] = await db
    .insert(repliesTable)
    .values({
      postId: params.data.id,
      authorId: me.id,
      content: parsed.data.content,
    })
    .returning();

  res.status(201).json({
    id: reply.id,
    postId: reply.postId,
    content: reply.content,
    authorUsername: me.username,
    authorDisplayName: me.displayName ?? null,
    createdAt: reply.createdAt.toISOString(),
  });
});

export default router;
