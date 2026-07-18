type FeedbackCategory = "bug" | "suggestion" | "balance" | "other";
type FeedbackGenre = "pop" | "indie" | "punk" | "metal";

const CATEGORY_LABELS: Readonly<Record<FeedbackCategory, string>> = {
  bug: "问题反馈",
  suggestion: "玩法建议",
  balance: "平衡性反馈",
  other: "其他",
};

const GENRE_LABELS: Readonly<Record<FeedbackGenre, string>> = {
  pop: "流行",
  indie: "独立",
  punk: "朋克",
  metal: "金属",
};

const MESSAGE_MIN_LENGTH = 5;
const MESSAGE_MAX_LENGTH = 1000;
const MAX_BODY_LENGTH = 16_384;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 3;
const RATE_LIMIT_DAILY_MAX_REQUESTS = 5;
const RATE_LIMIT_RETENTION_MS = 172_800_000;
const DEFAULT_GLOBAL_DAILY_LIMIT = 50;
const RESEND_TIMEOUT_MS = 10_000;
const RESEND_ENDPOINT = "https://api.resend.com/emails";
const DEFAULT_FROM_EMAIL = "乐队后台 <onboarding@resend.dev>";
const RESEND_USER_AGENT = "band-backstage-simulator/1.0";
const initializedRateLimitDatabases = new WeakSet<FeedbackD1Database>();

interface FeedbackD1PreparedStatement {
  bind(...values: unknown[]): FeedbackD1PreparedStatement;
  first<T>(): Promise<T | null>;
  run(): Promise<unknown>;
}

export interface FeedbackD1Database {
  prepare(query: string): FeedbackD1PreparedStatement;
}

export interface FeedbackEnv {
  DB?: FeedbackD1Database;
  RESEND_API_KEY?: string;
  FEEDBACK_TO_EMAIL?: string;
  FEEDBACK_FROM_EMAIL?: string;
  FEEDBACK_RATE_LIMIT_SECRET?: string;
  FEEDBACK_DAILY_LIMIT?: string;
}

export interface FeedbackContext {
  bandName: string;
  genre: FeedbackGenre;
  year: number;
  month: number;
}

export interface FeedbackSubmission {
  submissionId: string;
  submittedAt: string;
  category: FeedbackCategory;
  message: string;
  website: string;
  context: FeedbackContext;
}

export interface FeedbackRateLimitDecision {
  status: "allowed" | "limited" | "unavailable";
  retryAfterSeconds?: number;
  scope?: "minute" | "daily" | "global";
}

export type FeedbackEmailSender = (
  submission: FeedbackSubmission,
  env: FeedbackEnv,
) => Promise<boolean>;

export type FeedbackRateLimiter = (
  request: Request,
  env: FeedbackEnv,
  timestamp: number,
) => Promise<FeedbackRateLimitDecision>;

interface FeedbackHandlerOptions {
  now?: () => number;
  sendEmail?: FeedbackEmailSender;
  rateLimit?: FeedbackRateLimiter;
}

interface BodyReadResult {
  ok: boolean;
  text?: string;
  tooLarge?: boolean;
}

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
  headers?: HeadersInit,
): Response {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      ...headers,
    },
  });
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFeedbackCategory(value: unknown): value is FeedbackCategory {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(CATEGORY_LABELS, value)
  );
}

function isFeedbackGenre(value: unknown): value is FeedbackGenre {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(GENRE_LABELS, value)
  );
}

function normalizeLineBreaks(value: string): string {
  return value.replace(/\r\n?/g, "\n").trim();
}

function parseSubmission(value: unknown): FeedbackSubmission | null {
  if (!isObject(value) || !isObject(value.context)) {
    return null;
  }

  const submissionId =
    typeof value.submissionId === "string" ? value.submissionId.trim() : "";
  const submittedAt =
    typeof value.submittedAt === "string" ? value.submittedAt.trim() : "";
  const message =
    typeof value.message === "string" ? normalizeLineBreaks(value.message) : "";
  const website =
    typeof value.website === "string" ? value.website.trim() : "";
  const bandName =
    typeof value.context.bandName === "string"
      ? normalizeLineBreaks(value.context.bandName)
      : "";
  const submittedTimestamp = Date.parse(submittedAt);
  const { genre, year, month } = value.context;

  if (
    !/^[a-zA-Z0-9-]{8,80}$/.test(submissionId) ||
    !Number.isFinite(submittedTimestamp) ||
    submittedAt.length > 40 ||
    !isFeedbackCategory(value.category) ||
    message.length < MESSAGE_MIN_LENGTH ||
    message.length > MESSAGE_MAX_LENGTH ||
    website.length > 200 ||
    bandName.length < 1 ||
    bandName.length > 50 ||
    bandName.includes("\n") ||
    !isFeedbackGenre(genre) ||
    typeof year !== "number" ||
    !Number.isInteger(year) ||
    year < 1 ||
    year > 20 ||
    typeof month !== "number" ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  ) {
    return null;
  }

  return {
    submissionId,
    submittedAt: new Date(submittedTimestamp).toISOString(),
    category: value.category,
    message,
    website,
    context: {
      bandName,
      genre,
      year,
      month,
    },
  };
}

function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("Origin");
  return !origin || origin === new URL(request.url).origin;
}

function escapeHeaderText(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

function buildEmailText(submission: FeedbackSubmission): string {
  return [
    "收到一条新的《返场之前》游戏反馈。",
    "",
    `反馈类型：${CATEGORY_LABELS[submission.category]}`,
    `乐队名称：${submission.context.bandName}`,
    `音乐类型：${GENRE_LABELS[submission.context.genre]}`,
    `游戏进度：第 ${submission.context.year} 年第 ${submission.context.month} 月`,
    `提交时间：${submission.submittedAt}`,
    "",
    "反馈内容：",
    submission.message,
  ].join("\n");
}

async function readRequestBody(
  request: Request,
  maxBytes: number,
): Promise<BodyReadResult> {
  if (!request.body) {
    return { ok: true, text: "" };
  }

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let byteLength = 0;
  let text = "";

  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) {
        text += decoder.decode();
        return { ok: true, text };
      }

      byteLength += chunk.value.byteLength;
      if (byteLength > maxBytes) {
        await reader.cancel();
        return { ok: false, tooLarge: true };
      }

      text += decoder.decode(chunk.value, { stream: true });
    }
  } catch {
    return { ok: false };
  } finally {
    reader.releaseLock();
  }
}

async function hmacText(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(value),
  );

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function getRateLimitKey(
  request: Request,
  secret: string,
  dayBucket: string,
): Promise<string | null> {
  const authenticatedEmail = request.headers
    .get("oai-authenticated-user-email")
    ?.trim()
    .toLowerCase();
  const ipAddress = request.headers.get("CF-Connecting-IP")?.trim();

  if (authenticatedEmail) {
    return hmacText(`user:${authenticatedEmail}:${dayBucket}`, secret);
  }

  if (ipAddress) {
    return hmacText(`ip:${ipAddress}:${dayBucket}`, secret);
  }

  return null;
}

function getUtcDayBucket(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10);
}

function getSecondsUntilNextUtcDay(timestamp: number): number {
  const current = new Date(timestamp);
  const nextDay = Date.UTC(
    current.getUTCFullYear(),
    current.getUTCMonth(),
    current.getUTCDate() + 1,
  );
  return Math.max(1, Math.ceil((nextDay - timestamp) / 1000));
}

function getGlobalDailyLimit(env: FeedbackEnv): number {
  const configured = Number(env.FEEDBACK_DAILY_LIMIT);
  return Number.isInteger(configured) && configured >= 1 && configured <= 500
    ? configured
    : DEFAULT_GLOBAL_DAILY_LIMIT;
}

async function ensureRateLimitSchema(
  database: FeedbackD1Database,
): Promise<void> {
  if (initializedRateLimitDatabases.has(database)) {
    return;
  }

  await database
    .prepare(
      `CREATE TABLE IF NOT EXISTS feedback_rate_limits (
        key_hash TEXT PRIMARY KEY NOT NULL,
        window_started_at INTEGER NOT NULL,
        request_count INTEGER DEFAULT 1 NOT NULL,
        daily_count INTEGER DEFAULT 1 NOT NULL,
        updated_at INTEGER NOT NULL
      )`,
    )
    .run();
  await database
    .prepare(
      `CREATE INDEX IF NOT EXISTS feedback_rate_limits_updated_at_idx
      ON feedback_rate_limits (updated_at)`,
    )
    .run();
  await database
    .prepare(
      `CREATE TABLE IF NOT EXISTS feedback_daily_budgets (
        day_bucket TEXT PRIMARY KEY NOT NULL,
        request_count INTEGER DEFAULT 1 NOT NULL,
        updated_at INTEGER NOT NULL
      )`,
    )
    .run();
  await database
    .prepare(
      `CREATE INDEX IF NOT EXISTS feedback_daily_budgets_updated_at_idx
      ON feedback_daily_budgets (updated_at)`,
    )
    .run();
  initializedRateLimitDatabases.add(database);
}

export async function checkPersistentRateLimit(
  request: Request,
  env: FeedbackEnv,
  timestamp: number,
): Promise<FeedbackRateLimitDecision> {
  if (!env.DB) {
    return { status: "unavailable" };
  }

  const rateLimitSecret = env.FEEDBACK_RATE_LIMIT_SECRET?.trim();
  if (!rateLimitSecret || rateLimitSecret.length < 16) {
    return { status: "unavailable" };
  }

  const dayBucket = getUtcDayBucket(timestamp);
  const keyHash = await getRateLimitKey(
    request,
    rateLimitSecret,
    dayBucket,
  );
  if (!keyHash) {
    return { status: "unavailable" };
  }

  await ensureRateLimitSchema(env.DB);

  const existingIdentity = await env.DB.prepare(
    `SELECT
      window_started_at AS windowStartedAt,
      request_count AS requestCount,
      daily_count AS dailyCount
    FROM feedback_rate_limits
    WHERE key_hash = ?1`,
  )
    .bind(keyHash)
    .first<{
      windowStartedAt: number;
      requestCount: number;
      dailyCount: number;
    }>();

  if (
    existingIdentity &&
    timestamp - existingIdentity.windowStartedAt < RATE_LIMIT_WINDOW_MS &&
    existingIdentity.requestCount >= RATE_LIMIT_MAX_REQUESTS
  ) {
    return {
      status: "limited",
      scope: "minute",
      retryAfterSeconds: Math.max(
        1,
        Math.ceil(
          (existingIdentity.windowStartedAt +
            RATE_LIMIT_WINDOW_MS -
            timestamp) /
            1000,
        ),
      ),
    };
  }

  if (
    existingIdentity &&
    existingIdentity.dailyCount >= RATE_LIMIT_DAILY_MAX_REQUESTS
  ) {
    return {
      status: "limited",
      scope: "daily",
      retryAfterSeconds: getSecondsUntilNextUtcDay(timestamp),
    };
  }

  const globalDailyLimit = getGlobalDailyLimit(env);
  const existingGlobal = await env.DB.prepare(
    `SELECT request_count AS requestCount
    FROM feedback_daily_budgets
    WHERE day_bucket = ?1`,
  )
    .bind(dayBucket)
    .first<{ requestCount: number }>();

  if (existingGlobal && existingGlobal.requestCount >= globalDailyLimit) {
    return {
      status: "limited",
      scope: "global",
      retryAfterSeconds: getSecondsUntilNextUtcDay(timestamp),
    };
  }

  const identityResult = await env.DB.prepare(
    `INSERT INTO feedback_rate_limits (
      key_hash,
      window_started_at,
      request_count,
      daily_count,
      updated_at
    )
    VALUES (?1, ?2, 1, 1, ?2)
    ON CONFLICT(key_hash) DO UPDATE SET
      request_count = CASE
        WHEN (?2 - feedback_rate_limits.window_started_at) >= ?3 THEN 1
        ELSE feedback_rate_limits.request_count + 1
      END,
      window_started_at = CASE
        WHEN (?2 - feedback_rate_limits.window_started_at) >= ?3 THEN ?2
        ELSE feedback_rate_limits.window_started_at
      END,
      daily_count = feedback_rate_limits.daily_count + 1,
      updated_at = ?2
    RETURNING
      window_started_at AS windowStartedAt,
      request_count AS requestCount,
      daily_count AS dailyCount`,
  )
    .bind(keyHash, timestamp, RATE_LIMIT_WINDOW_MS)
    .first<{
      windowStartedAt: number;
      requestCount: number;
      dailyCount: number;
    }>();

  if (!identityResult) {
    return { status: "unavailable" };
  }

  if (identityResult.requestCount > RATE_LIMIT_MAX_REQUESTS) {
    return {
      status: "limited",
      scope: "minute",
      retryAfterSeconds: Math.max(
        1,
        Math.ceil(
          (identityResult.windowStartedAt +
            RATE_LIMIT_WINDOW_MS -
            timestamp) /
            1000,
        ),
      ),
    };
  }

  if (identityResult.dailyCount > RATE_LIMIT_DAILY_MAX_REQUESTS) {
    return {
      status: "limited",
      scope: "daily",
      retryAfterSeconds: getSecondsUntilNextUtcDay(timestamp),
    };
  }

  const globalResult = await env.DB.prepare(
    `INSERT INTO feedback_daily_budgets (
      day_bucket,
      request_count,
      updated_at
    )
    VALUES (?1, 1, ?2)
    ON CONFLICT(day_bucket) DO UPDATE SET
      request_count = feedback_daily_budgets.request_count + 1,
      updated_at = ?2
    RETURNING request_count AS requestCount`,
  )
    .bind(dayBucket, timestamp)
    .first<{ requestCount: number }>();

  if (!globalResult) {
    return { status: "unavailable" };
  }

  if (globalResult.requestCount > globalDailyLimit) {
    return {
      status: "limited",
      scope: "global",
      retryAfterSeconds: getSecondsUntilNextUtcDay(timestamp),
    };
  }

  if (identityResult.dailyCount === 1) {
    try {
      await env.DB.prepare(
        "DELETE FROM feedback_rate_limits WHERE updated_at < ?1",
      )
        .bind(timestamp - RATE_LIMIT_RETENTION_MS)
        .run();
      await env.DB.prepare(
        "DELETE FROM feedback_daily_budgets WHERE updated_at < ?1",
      )
        .bind(timestamp - RATE_LIMIT_RETENTION_MS)
        .run();
    } catch {
      // Retention cleanup is best effort and must not block valid feedback.
    }
  }

  return { status: "allowed" };
}

export async function sendFeedbackEmail(
  submission: FeedbackSubmission,
  env: FeedbackEnv,
): Promise<boolean> {
  const apiKey = env.RESEND_API_KEY?.trim();
  const recipient = env.FEEDBACK_TO_EMAIL?.trim();
  const sender = env.FEEDBACK_FROM_EMAIL?.trim() || DEFAULT_FROM_EMAIL;

  if (!apiKey || !recipient) {
    return false;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), RESEND_TIMEOUT_MS);

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `game-feedback/${submission.submissionId}`,
        "User-Agent": RESEND_USER_AGENT,
      },
      body: JSON.stringify({
        from: sender,
        to: [recipient],
        subject: `[乐队后台反馈] ${escapeHeaderText(
          CATEGORY_LABELS[submission.category],
        )}`,
        text: buildEmailText(submission),
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      console.warn("Feedback email delivery failed.", {
        provider: "resend",
        status: response.status,
        submissionId: submission.submissionId,
      });
    }

    return response.ok;
  } finally {
    clearTimeout(timeoutId);
  }
}

export function createFeedbackHandler(
  options: FeedbackHandlerOptions = {},
): (request: Request, env: FeedbackEnv) => Promise<Response> {
  const now = options.now ?? Date.now;
  const sendEmail = options.sendEmail ?? sendFeedbackEmail;
  const rateLimit = options.rateLimit ?? checkPersistentRateLimit;

  return async function handleFeedbackRequest(
    request: Request,
    env: FeedbackEnv,
  ): Promise<Response> {
    if (request.method !== "POST") {
      return jsonResponse(
        { ok: false, message: "此接口只接受反馈提交。" },
        405,
        { Allow: "POST" },
      );
    }

    if (!isSameOrigin(request)) {
      return jsonResponse({ ok: false, message: "反馈来源无效。" }, 403);
    }

    const contentType = request.headers.get("Content-Type") ?? "";
    if (!contentType.toLowerCase().includes("application/json")) {
      return jsonResponse(
        { ok: false, message: "反馈格式无效，请刷新后重试。" },
        415,
      );
    }

    const contentLength = Number(request.headers.get("Content-Length") ?? "0");
    if (Number.isFinite(contentLength) && contentLength > MAX_BODY_LENGTH) {
      return jsonResponse(
        { ok: false, message: "反馈内容过长，请精简后重试。" },
        413,
      );
    }

    const bodyResult = await readRequestBody(request, MAX_BODY_LENGTH);
    if (!bodyResult.ok) {
      return jsonResponse(
        {
          ok: false,
          message: bodyResult.tooLarge
            ? "反馈内容过长，请精简后重试。"
            : "反馈内容无法读取，请重试。",
        },
        bodyResult.tooLarge ? 413 : 400,
      );
    }

    let parsedBody: unknown;
    try {
      parsedBody = JSON.parse(bodyResult.text ?? "");
    } catch {
      return jsonResponse(
        { ok: false, message: "反馈格式无效，请刷新后重试。" },
        400,
      );
    }

    const submission = parseSubmission(parsedBody);
    if (!submission) {
      return jsonResponse(
        { ok: false, message: "请填写至少 5 个字且不超过 1000 字的反馈。" },
        400,
      );
    }

    if (submission.website) {
      return jsonResponse({ ok: true }, 202);
    }

    let rateLimitDecision: FeedbackRateLimitDecision;
    try {
      rateLimitDecision = await rateLimit(request, env, now());
    } catch {
      rateLimitDecision = { status: "unavailable" };
    }

    if (rateLimitDecision.status === "unavailable") {
      return jsonResponse(
        { ok: false, message: "反馈功能正在准备中，请稍后再试。" },
        503,
      );
    }

    if (rateLimitDecision.status === "limited") {
      const retryAfter = String(rateLimitDecision.retryAfterSeconds ?? 60);
      const message =
        rateLimitDecision.scope === "global"
          ? "今天收到的反馈较多，请明天再试。"
          : rateLimitDecision.scope === "daily"
            ? "今天已经提交过多反馈，请明天再试。"
            : "提交得有点快，请一分钟后再试。";
      return jsonResponse(
        { ok: false, message },
        429,
        { "Retry-After": retryAfter },
      );
    }

    try {
      const delivered = await sendEmail(submission, env);
      if (!delivered) {
        return jsonResponse(
          { ok: false, message: "反馈暂时未能送达，请稍后再试。" },
          503,
        );
      }
    } catch {
      return jsonResponse(
        { ok: false, message: "反馈暂时未能送达，请稍后再试。" },
        502,
      );
    }

    return jsonResponse({ ok: true }, 202);
  };
}
