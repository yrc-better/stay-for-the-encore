import { FEEDBACK_API_URL } from "../../config/runtime";

export const GAME_FEEDBACK_CATEGORIES = [
  { id: "bug", label: "问题反馈" },
  { id: "suggestion", label: "玩法建议" },
  { id: "balance", label: "平衡性反馈" },
  { id: "other", label: "其他" },
] as const;

export type GameFeedbackCategory =
  (typeof GAME_FEEDBACK_CATEGORIES)[number]["id"];

export interface GameFeedbackContext {
  bandName: string;
  genre: "pop" | "indie" | "punk" | "metal";
  year: number;
  month: number;
}

export interface GameFeedbackSubmission {
  submissionId: string;
  submittedAt: string;
  category: GameFeedbackCategory;
  message: string;
  website: string;
  context: GameFeedbackContext;
}

interface FeedbackApiResponse {
  ok?: boolean;
  message?: string;
}

function isFeedbackApiResponse(value: unknown): value is FeedbackApiResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    (!("ok" in value) || typeof value.ok === "boolean") &&
    (!("message" in value) || typeof value.message === "string")
  );
}

export const GAME_FEEDBACK_MESSAGE_MIN_LENGTH = 5;
export const GAME_FEEDBACK_MESSAGE_MAX_LENGTH = 1000;
const GAME_FEEDBACK_REQUEST_TIMEOUT_MS = 12_000;

export function createFeedbackSubmissionId(): string {
  if (
    typeof globalThis.crypto !== "undefined" &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function submitGameFeedback(
  submission: GameFeedbackSubmission,
): Promise<void> {
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    GAME_FEEDBACK_REQUEST_TIMEOUT_MS,
  );
  let response: Response;
  let payload: FeedbackApiResponse = {};

  try {
    response = await fetch(FEEDBACK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(submission),
      signal: controller.signal,
    });

    if (response.headers.get("content-type")?.includes("application/json")) {
      const parsedPayload: unknown = await response.json();
      payload = isFeedbackApiResponse(parsedPayload) ? parsedPayload : {};
    }
  } catch {
    throw new Error(
      controller.signal.aborted
        ? "反馈提交超时，请检查网络后重试。"
        : "反馈暂时未能送达，请稍后再试。",
    );
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok || payload.ok !== true) {
    throw new Error(payload.message ?? "反馈暂时未能送达，请稍后再试。");
  }
}
