import { ACTIONS } from "./actions";
import { CANDIDATES } from "./candidates";
import {
  CAREER_VENUE_LEVELS,
  EQUIPMENT_CATALOG,
  RECORD_CONTRACTS,
} from "./career";
import { EVENTS } from "./events";
import { GENRES } from "./genres";

export interface ContentValidationIssue {
  catalog: string;
  id: string;
  message: string;
}

function duplicateIds(
  catalog: string,
  ids: readonly string[],
): ContentValidationIssue[] {
  const seen = new Set<string>();
  const issues: ContentValidationIssue[] = [];
  for (const id of ids) {
    if (seen.has(id)) {
      issues.push({ catalog, id, message: "ID 重复" });
    }
    seen.add(id);
  }
  return issues;
}

export function validateContentCatalog(): ContentValidationIssue[] {
  const issues: ContentValidationIssue[] = [
    ...duplicateIds(
      "events",
      EVENTS.map((event) => event.id),
    ),
    ...duplicateIds(
      "candidates",
      CANDIDATES.map((candidate) => candidate.id),
    ),
    ...duplicateIds(
      "actions",
      ACTIONS.map((action) => action.id),
    ),
    ...duplicateIds(
      "genres",
      GENRES.map((genre) => genre.id),
    ),
    ...duplicateIds(
      "venues",
      CAREER_VENUE_LEVELS.map((venue) => venue.id),
    ),
    ...duplicateIds(
      "equipment",
      EQUIPMENT_CATALOG.map((item) => item.id),
    ),
    ...duplicateIds(
      "contracts",
      RECORD_CONTRACTS.map((contract) => contract.id),
    ),
  ];
  const eventIds = new Set(EVENTS.map((event) => event.id));

  for (const candidate of CANDIDATES) {
    for (const [stat, value] of Object.entries(candidate.stats)) {
      if (!Number.isFinite(value) || value < 0 || value > 100) {
        issues.push({
          catalog: "candidates",
          id: candidate.id,
          message: `${stat} 超出 0-100`,
        });
      }
    }
  }

  for (const event of EVENTS) {
    if (event.choices.length < 2 || event.choices.length > 3) {
      issues.push({
        catalog: "events",
        id: event.id,
        message: "事件必须包含 2-3 个选择",
      });
    }
    const choiceIds = new Set<string>();
    for (const choice of event.choices) {
      if (choiceIds.has(choice.id)) {
        issues.push({
          catalog: "events",
          id: event.id,
          message: `选择 ID 重复：${choice.id}`,
        });
      }
      choiceIds.add(choice.id);
      if (choice.outcomes.length === 0) {
        issues.push({
          catalog: "events",
          id: event.id,
          message: `选择 ${choice.id} 没有结果`,
        });
      }
      for (const outcome of choice.outcomes) {
        if (!Number.isFinite(outcome.weight) || outcome.weight <= 0) {
          issues.push({
            catalog: "events",
            id: event.id,
            message: `结果 ${outcome.id} 权重无效`,
          });
        }
        const nextEventId =
          "nextEventId" in outcome && typeof outcome.nextEventId === "string"
            ? outcome.nextEventId
            : null;
        if (nextEventId && !eventIds.has(nextEventId)) {
          issues.push({
            catalog: "events",
            id: event.id,
            message: `后续事件不存在：${nextEventId}`,
          });
        }
      }
    }
  }

  const roles = new Map<string, number>();
  for (const candidate of CANDIDATES) {
    roles.set(candidate.role, (roles.get(candidate.role) ?? 0) + 1);
  }
  for (const role of ["leadGuitar", "bass", "drums", "keyboard"]) {
    if (roles.get(role) !== 3) {
      issues.push({
        catalog: "candidates",
        id: role,
        message: "每个位置必须恰好有三名候选人",
      });
    }
  }

  return issues;
}

export function assertValidContentCatalog(): void {
  const issues = validateContentCatalog();
  if (issues.length === 0) return;

  const detail = issues
    .map((issue) => `[${issue.catalog}/${issue.id}] ${issue.message}`)
    .join("\n");
  throw new Error(`内容目录校验失败：\n${detail}`);
}
