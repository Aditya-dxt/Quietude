import { db, postsTable } from "@workspace/db";
import { and, eq, lt, isNotNull } from "drizzle-orm";
import { logger } from "./logger";

const INTERVAL_MS = 60 * 60 * 1000; // every hour

export async function deleteExpiredPosts(): Promise<void> {
  const deleted = await db
    .delete(postsTable)
    .where(
      and(
        eq(postsTable.isPermanent, false),
        isNotNull(postsTable.expiresAt),
        lt(postsTable.expiresAt, new Date()),
      ),
    )
    .returning({ id: postsTable.id });

  if (deleted.length > 0) {
    logger.info({ count: deleted.length }, "Deleted expired posts");
  }
}

export function startCleanupJob(): void {
  // Run once at startup to catch anything that expired while the server was down
  deleteExpiredPosts().catch((err) =>
    logger.error({ err }, "Initial expired post cleanup failed"),
  );

  setInterval(() => {
    deleteExpiredPosts().catch((err) =>
      logger.error({ err }, "Scheduled expired post cleanup failed"),
    );
  }, INTERVAL_MS);

  logger.info({ intervalMs: INTERVAL_MS }, "Post cleanup job scheduled");
}
