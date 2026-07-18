import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const feedbackRateLimits = sqliteTable(
  "feedback_rate_limits",
  {
    keyHash: text("key_hash").primaryKey(),
    windowStartedAt: integer("window_started_at").notNull(),
    requestCount: integer("request_count").notNull().default(1),
    dailyCount: integer("daily_count").notNull().default(1),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    index("feedback_rate_limits_updated_at_idx").on(table.updatedAt),
  ],
);

export const feedbackDailyBudgets = sqliteTable(
  "feedback_daily_budgets",
  {
    dayBucket: text("day_bucket").primaryKey(),
    requestCount: integer("request_count").notNull().default(1),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    index("feedback_daily_budgets_updated_at_idx").on(table.updatedAt),
  ],
);
