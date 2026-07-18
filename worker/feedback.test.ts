import { afterEach, describe, expect, it, vi } from "vitest";
import {
  checkPersistentRateLimit,
  createFeedbackHandler,
  sendFeedbackEmail,
  type FeedbackD1Database,
  type FeedbackRateLimiter,
  type FeedbackSubmission,
} from "./feedback";

const validSubmission: FeedbackSubmission = {
  submissionId: "feedback-test-1234",
  submittedAt: "2026-07-19T00:00:00.000Z",
  category: "balance",
  message: "演出收益偏低，希望场地解锁节奏更顺畅。",
  website: "",
  context: {
    bandName: "潮汐背面",
    genre: "indie",
    year: 2,
    month: 4,
  },
};

const allowRateLimit: FeedbackRateLimiter = async () => ({
  status: "allowed",
});

function createRequest(
  body: unknown = validSubmission,
  headers: Record<string, string> = {},
): Request {
  return new Request("https://game.example/api/feedback", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "https://game.example",
      "CF-Connecting-IP": "203.0.113.10",
      "User-Agent": "feedback-test",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

function createStatement(
  firstResult: unknown = null,
): {
  bind: ReturnType<typeof vi.fn>;
  first: ReturnType<typeof vi.fn>;
  run: ReturnType<typeof vi.fn>;
} {
  const statement = {
    bind: vi.fn(),
    first: vi.fn().mockResolvedValue(firstResult),
    run: vi.fn().mockResolvedValue({ success: true }),
  };
  statement.bind.mockReturnValue(statement);
  return statement;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("游戏反馈接口", () => {
  it("校验通过后调用邮件发送器且不在响应中返回邮件配置", async () => {
    const sendEmail = vi.fn().mockResolvedValue(true);
    const handleFeedback = createFeedbackHandler({
      rateLimit: allowRateLimit,
      sendEmail,
    });

    const response = await handleFeedback(createRequest(), {
      RESEND_API_KEY: "secret-key",
      FEEDBACK_TO_EMAIL: "owner@example.com",
    });

    expect(response.status).toBe(202);
    const responseText = await response.text();
    expect(JSON.parse(responseText)).toEqual({ ok: true });
    expect(sendEmail).toHaveBeenCalledWith(
      validSubmission,
      expect.objectContaining({
        RESEND_API_KEY: "secret-key",
        FEEDBACK_TO_EMAIL: "owner@example.com",
      }),
    );
    expect(responseText).not.toContain("owner@example.com");
  });

  it("拒绝过短内容和跨站提交", async () => {
    const sendEmail = vi.fn().mockResolvedValue(true);
    const handleFeedback = createFeedbackHandler({
      rateLimit: allowRateLimit,
      sendEmail,
    });
    const shortMessage = {
      ...validSubmission,
      message: "太短",
    };

    const invalidResponse = await handleFeedback(createRequest(shortMessage), {});
    expect(invalidResponse.status).toBe(400);

    const crossOriginResponse = await handleFeedback(
      createRequest(validSubmission, { Origin: "https://attacker.example" }),
      {},
    );
    expect(crossOriginResponse.status).toBe(403);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("蜜罐字段命中时伪装成功但不发送邮件", async () => {
    const sendEmail = vi.fn().mockResolvedValue(true);
    const rateLimit = vi.fn(allowRateLimit);
    const handleFeedback = createFeedbackHandler({
      rateLimit,
      sendEmail,
    });

    const response = await handleFeedback(
      createRequest({ ...validSubmission, website: "https://spam.example" }),
      {},
    );

    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({ ok: true });
    expect(rateLimit).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("只对有效反馈执行持久化限流并返回重试时间", async () => {
    const sendEmail = vi.fn().mockResolvedValue(true);
    const rateLimit = vi.fn().mockResolvedValue({
      status: "limited",
      retryAfterSeconds: 37,
    });
    const handleFeedback = createFeedbackHandler({ rateLimit, sendEmail });

    const response = await handleFeedback(createRequest(), {});

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("37");
    expect(rateLimit).toHaveBeenCalledTimes(1);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("使用 D1 对 Cloudflare 来源标识做持久化计数", async () => {
    const schemaStatement = createStatement();
    const existingIdentityStatement = createStatement({
      windowStartedAt: 1_000,
      requestCount: 3,
      dailyCount: 3,
    });
    const prepare = vi.fn((query: string) => {
        if (
          query.includes("SELECT") &&
          query.includes("FROM feedback_rate_limits")
        ) {
          return existingIdentityStatement;
        }
        return schemaStatement;
      });
    const database = { prepare } as FeedbackD1Database;

    const decision = await checkPersistentRateLimit(
      createRequest(),
      {
        DB: database,
        FEEDBACK_RATE_LIMIT_SECRET: "test-rate-limit-secret-32-bytes",
      },
      1_000,
    );

    expect(decision).toEqual({
      status: "limited",
      scope: "minute",
      retryAfterSeconds: 60,
    });
    expect(existingIdentityStatement.bind).toHaveBeenCalledWith(
      expect.stringMatching(/^[a-f0-9]{64}$/),
    );
  });

  it("全站每日邮件预算耗尽后不再执行写入", async () => {
    const schemaStatement = createStatement();
    const identitySelect = createStatement(null);
    const globalSelect = createStatement({ requestCount: 2 });
    const prepare = vi.fn((query: string) => {
      if (
        query.includes("SELECT") &&
        query.includes("FROM feedback_rate_limits")
      ) {
        return identitySelect;
      }
      if (
        query.includes("SELECT") &&
        query.includes("FROM feedback_daily_budgets")
      ) {
        return globalSelect;
      }
      return schemaStatement;
    });
    const database = {
      prepare,
    } as FeedbackD1Database;

    const decision = await checkPersistentRateLimit(
      createRequest(),
      {
        DB: database,
        FEEDBACK_RATE_LIMIT_SECRET: "test-rate-limit-secret-32-bytes",
        FEEDBACK_DAILY_LIMIT: "2",
      },
      Date.UTC(2026, 6, 19, 12),
    );

    expect(decision).toMatchObject({
      status: "limited",
      scope: "global",
    });
    expect(
      prepare.mock.calls.some(([query]) =>
        String(query).includes("INSERT INTO"),
      ),
    ).toBe(false);
  });

  it("无 Content-Length 时也会流式中止过大的请求体", async () => {
    const oversizedChunk = new Uint8Array(20_000);
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(oversizedChunk);
        controller.close();
      },
    });
    const request = new Request("https://game.example/api/feedback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://game.example",
        "CF-Connecting-IP": "203.0.113.10",
      },
      body: stream,
      duplex: "half",
    } as RequestInit & { duplex: "half" });
    const sendEmail = vi.fn().mockResolvedValue(true);
    const handleFeedback = createFeedbackHandler({
      rateLimit: allowRateLimit,
      sendEmail,
    });

    const response = await handleFeedback(request, {});

    expect(response.status).toBe(413);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("使用服务端环境变量调用 Resend 并保持重试载荷幂等", async () => {
    const fetchMock = vi.fn().mockImplementation(async () => {
      return new Response(JSON.stringify({ id: "email_123" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });
    vi.stubGlobal("fetch", fetchMock);
    const env = {
      RESEND_API_KEY: "resend-secret",
      FEEDBACK_TO_EMAIL: "owner@example.com",
      FEEDBACK_FROM_EMAIL: "Game <feedback@example.com>",
    };

    expect(await sendFeedbackEmail(validSubmission, env)).toBe(true);
    expect(await sendFeedbackEmail(validSubmission, env)).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const firstRequest = fetchMock.mock.calls[0][1] as RequestInit;
    const secondRequest = fetchMock.mock.calls[1][1] as RequestInit;
    expect(firstRequest.headers).toEqual(
      expect.objectContaining({
        Authorization: "Bearer resend-secret",
        "Idempotency-Key": "game-feedback/feedback-test-1234",
        "User-Agent": "band-backstage-simulator/1.0",
      }),
    );
    expect(secondRequest.headers).toEqual(firstRequest.headers);
    expect(secondRequest.body).toBe(firstRequest.body);

    const body = JSON.parse(String(firstRequest.body)) as Record<
      string,
      unknown
    >;
    expect(body.to).toEqual(["owner@example.com"]);
    expect(body.text).toContain("演出收益偏低");
    expect(body.text).toContain("2026-07-19T00:00:00.000Z");
    expect(body.text).not.toContain("resend-secret");
  });

  it("邮件服务未配置或发送失败时返回可重试错误", async () => {
    const handleFeedback = createFeedbackHandler({
      rateLimit: allowRateLimit,
      sendEmail: vi.fn().mockResolvedValue(false),
    });

    const response = await handleFeedback(createRequest(), {});

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      ok: false,
      message: "反馈暂时未能送达，请稍后再试。",
    });
  });
});
