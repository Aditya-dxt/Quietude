import { pgTable, integer, timestamp, primaryKey } from "drizzle-orm/pg-core";

export const connectionsTable = pgTable(
  "connections",
  {
    followerId: integer("follower_id").notNull(),
    followingId: integer("following_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.followerId, t.followingId] })],
);

export type Connection = typeof connectionsTable.$inferSelect;
