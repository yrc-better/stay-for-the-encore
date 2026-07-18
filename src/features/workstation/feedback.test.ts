import { afterEach, describe, expect, it, vi } from "vitest";
import {
  submitGameFeedback,
  type GameFeedbackSubmission,
} from "./feedback";

const submission: GameFeedbackSubmission = {
  submissionId: "feedback-client-1234",
  submittedAt: "2026-07-19T00:00:00.000Z",
  category: "suggestion",
  message: "希望增加更多演出随机事件。",
  website: "",
  context: {
    bandName: "潮汐背面",
    genre: "indie",
    year: 1,
    month: 1,
  },
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("反馈客户端", () => {
  it("只有明确收到 JSON ok true 才视为送达", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("<!doctype html><title>fallback</title>", {
          status: 200,
          headers: { "Content-Type": "text/html" },
        }),
      ),
    );

    await expect(submitGameFeedback(submission)).rejects.toThrow(
      "反馈暂时未能送达，请稍后再试。",
    );
  });

  it("保留服务端返回的可操作错误信息", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json(
          { ok: false, message: "提交得有点快，请一分钟后再试。" },
          { status: 429 },
        ),
      ),
    );

    await expect(submitGameFeedback(submission)).rejects.toThrow(
      "提交得有点快，请一分钟后再试。",
    );
  });

  it("忽略结构异常的 JSON 响应并返回统一错误", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("null", {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    await expect(submitGameFeedback(submission)).rejects.toThrow(
      "反馈暂时未能送达，请稍后再试。",
    );
  });

  it("响应体长时间未完成时会中止并恢复为可重试错误", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(
        async (_input: RequestInfo | URL, init?: RequestInit) => {
          const signal = init?.signal as AbortSignal;
          return {
            ok: true,
            headers: new Headers({ "Content-Type": "application/json" }),
            json: () =>
              new Promise((_resolve, reject) => {
                signal.addEventListener("abort", () => {
                  reject(new DOMException("Aborted", "AbortError"));
                });
              }),
          } as Response;
        },
      ),
    );

    const pendingSubmission = submitGameFeedback(submission);
    const rejection = expect(pendingSubmission).rejects.toThrow(
      "反馈提交超时，请检查网络后重试。",
    );
    await vi.advanceTimersByTimeAsync(12_000);
    await rejection;
  });
});
