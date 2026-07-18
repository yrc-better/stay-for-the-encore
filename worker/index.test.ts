import { afterEach, describe, expect, it, vi } from "vitest";
import worker from "./index";
import type { FeedbackD1Database } from "./feedback";

function createDatabase(): FeedbackD1Database {
  return {
    prepare(query: string) {
      const firstResult = query.includes("RETURNING")
        ? query.includes("daily_count AS dailyCount")
          ? { windowStartedAt: 1_000, requestCount: 1, dailyCount: 1 }
          : { requestCount: 1 }
        : null;
      const statement = {
        bind: vi.fn(),
        first: vi.fn().mockResolvedValue(firstResult),
        run: vi.fn().mockResolvedValue({ success: true }),
      };
      statement.bind.mockReturnValue(statement);
      return statement;
    },
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("站点 Worker 路由", () => {
  it("反馈路由在服务端完成投递且不会落入静态资源处理", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ id: "email_123" })),
    );
    const assetsFetch = vi.fn();
    const request = new Request("https://game.example/api/feedback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://game.example",
        "CF-Connecting-IP": "203.0.113.10",
      },
      body: JSON.stringify({
        submissionId: "feedback-route-1234",
        submittedAt: "2026-07-19T00:00:00.000Z",
        category: "bug",
        message: "场地解锁按钮偶尔没有响应。",
        website: "",
        context: {
          bandName: "潮汐背面",
          genre: "indie",
          year: 1,
          month: 1,
        },
      }),
    });

    const response = await worker.fetch(request, {
      ASSETS: { fetch: assetsFetch },
      DB: createDatabase(),
      RESEND_API_KEY: "resend-secret",
      FEEDBACK_TO_EMAIL: "owner@example.com",
      FEEDBACK_RATE_LIMIT_SECRET: "test-rate-limit-secret-32-bytes",
    });

    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({ ok: true });
    expect(assetsFetch).not.toHaveBeenCalled();
  });

  it("静态 HTML 仍会注入当前站点和社交图片地址", async () => {
    const assetsFetch = vi.fn().mockResolvedValue(
      new Response(
        "<html><a href=\"__SITE_URL__\"><img src=\"__OG_IMAGE_URL__\"></a></html>",
        { headers: { "Content-Type": "text/html; charset=utf-8" } },
      ),
    );
    const request = new Request("https://game.example/overview");

    const response = await worker.fetch(request, {
      ASSETS: { fetch: assetsFetch },
    });
    const html = await response.text();

    expect(html).toContain('href="https://game.example/"');
    expect(html).toContain('src="https://game.example/og.png"');
  });
});
