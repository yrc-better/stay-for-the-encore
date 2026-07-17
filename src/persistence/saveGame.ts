import type { GameState } from "../domain/types";
import { migrateLegacyHeadSave, migrateV1State } from "./migrations";
import {
  gameStateSchema,
  saveEnvelopeSchema,
  type SaveEnvelope,
} from "./schema";

export const SAVE_VERSION = 2;
export const SAVE_KEY = "band-backstage-simulator.save.v2";
export const LEGACY_V1_SAVE_KEY = "band-backstage-simulator.save.v1";
export const LEGACY_HEAD_SAVE_KEY = "band-simulator-save";
export const BACKUP_KEY = "band-backstage-simulator.save.backup";

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export type SaveResult =
  | { ok: true }
  | {
      ok: false;
      error: string;
    };

export type LoadResult =
  | { status: "empty" }
  | { status: "loaded"; state: GameState }
  | { status: "invalid"; error: string };

export type ExportResult =
  | { ok: true; text: string }
  | {
      ok: false;
      error: string;
    };

type ParsedPayload =
  | {
      ok: true;
      envelope: SaveEnvelope;
    }
  | {
      ok: false;
      error: string;
    };

type ExistingSave =
  | {
      ok: true;
      key: string | null;
      raw: string | null;
    }
  | {
      ok: false;
      error: string;
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function browserStorage(): StorageLike | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function currentTimestamp(): string {
  return new Date().toISOString();
}

function createEnvelope(
  state: unknown,
  savedAt = currentTimestamp(),
): ParsedPayload {
  const stateValidation = gameStateSchema.safeParse(state);
  if (!stateValidation.success) {
    return { ok: false, error: "游戏状态未通过存档校验" };
  }

  const envelopeValidation = saveEnvelopeSchema.safeParse({
    saveVersion: SAVE_VERSION,
    savedAt,
    state: stateValidation.data,
  });
  if (!envelopeValidation.success) {
    return { ok: false, error: "存档元数据未通过校验" };
  }

  return {
    ok: true,
    envelope: envelopeValidation.data,
  };
}

function parseJson(raw: string):
  | { ok: true; value: unknown }
  | { ok: false; error: string } {
  try {
    return { ok: true, value: JSON.parse(raw) as unknown };
  } catch {
    return { ok: false, error: "本地存档无法解析" };
  }
}

function parseCurrentEnvelope(value: unknown): ParsedPayload {
  if (
    isRecord(value) &&
    "saveVersion" in value &&
    value.saveVersion !== SAVE_VERSION
  ) {
    return {
      ok: false,
      error: `存档版本 ${String(value.saveVersion)} 暂不受支持`,
    };
  }

  const validation = saveEnvelopeSchema.safeParse(value);
  if (!validation.success) {
    return { ok: false, error: "本地存档格式无效" };
  }

  return {
    ok: true,
    envelope: validation.data,
  };
}

function parseImportedPayload(value: unknown): ParsedPayload {
  if (isRecord(value) && "saveVersion" in value) {
    return parseCurrentEnvelope(value);
  }

  if (
    isRecord(value) &&
    value.version === 1 &&
    !("state" in value)
  ) {
    const candidate = migrateV1State(value);
    if (!candidate) {
      return { ok: false, error: "v1 存档迁移失败" };
    }
    return createEnvelope(candidate.state, candidate.savedAt ?? currentTimestamp());
  }

  if (isRecord(value) && "state" in value && "version" in value) {
    const candidate = migrateLegacyHeadSave(value);
    if (!candidate) {
      if (
        typeof value.version === "number" &&
        ![1, 2, 3, 4, 5].includes(value.version)
      ) {
        return {
          ok: false,
          error: `旧版存档版本 ${String(value.version)} 暂不受支持`,
        };
      }
      return { ok: false, error: "旧版存档迁移失败" };
    }
    return createEnvelope(candidate.state, candidate.savedAt ?? currentTimestamp());
  }

  return { ok: false, error: "导入文本不是受支持的存档格式" };
}

function firstExistingSave(storage: StorageLike): ExistingSave {
  for (const key of [SAVE_KEY, LEGACY_V1_SAVE_KEY, LEGACY_HEAD_SAVE_KEY]) {
    try {
      const raw = storage.getItem(key);
      if (raw !== null) {
        return { ok: true, key, raw };
      }
    } catch {
      return { ok: false, error: "读取本地存档失败" };
    }
  }

  return { ok: true, key: null, raw: null };
}

function backUpRaw(storage: StorageLike, raw: string): SaveResult {
  try {
    storage.setItem(BACKUP_KEY, raw);
    return { ok: true };
  } catch {
    return { ok: false, error: "备份现有存档失败" };
  }
}

function writeEnvelope(
  storage: StorageLike,
  envelope: SaveEnvelope,
  errorMessage: string,
): SaveResult {
  try {
    storage.setItem(SAVE_KEY, JSON.stringify(envelope));
    return { ok: true };
  } catch {
    return { ok: false, error: errorMessage };
  }
}

function migrateStoredSave(
  storage: StorageLike,
  sourceKey: string,
  raw: string,
): LoadResult {
  const backup = backUpRaw(storage, raw);
  if (!backup.ok) {
    return { status: "invalid", error: backup.error };
  }

  const parsed = parseJson(raw);
  if (!parsed.ok) {
    return { status: "invalid", error: parsed.error };
  }

  const candidate =
    sourceKey === LEGACY_V1_SAVE_KEY
      ? migrateV1State(parsed.value)
      : migrateLegacyHeadSave(parsed.value);
  if (!candidate) {
    const value = parsed.value;
    if (
      isRecord(value) &&
      typeof value.version === "number" &&
      ((sourceKey === LEGACY_V1_SAVE_KEY && value.version !== 1) ||
        (sourceKey === LEGACY_HEAD_SAVE_KEY &&
          ![1, 2, 3, 4, 5].includes(value.version)))
    ) {
      return {
        status: "invalid",
        error: `存档版本 ${String(value.version)} 暂不受支持`,
      };
    }
    return {
      status: "invalid",
      error:
        sourceKey === LEGACY_V1_SAVE_KEY
          ? "v1 存档格式无效，无法迁移"
          : "旧版存档格式无效，无法迁移",
    };
  }

  const envelope = createEnvelope(
    candidate.state,
    candidate.savedAt ?? currentTimestamp(),
  );
  if (!envelope.ok) {
    return { status: "invalid", error: envelope.error };
  }

  const write = writeEnvelope(
    storage,
    envelope.envelope,
    "写入迁移后的存档失败",
  );
  if (!write.ok) {
    return { status: "invalid", error: write.error };
  }

  return {
    status: "loaded",
    state: envelope.envelope.state as GameState,
  };
}

export function saveGame(
  state: GameState,
  storage: StorageLike | null = browserStorage(),
): SaveResult {
  if (!storage) {
    return { ok: false, error: "当前环境不支持本地存档" };
  }

  const envelope = createEnvelope(state);
  if (!envelope.ok) {
    return { ok: false, error: envelope.error };
  }

  return writeEnvelope(storage, envelope.envelope, "写入本地存档失败");
}

export function loadGame(
  storage: StorageLike | null = browserStorage(),
): LoadResult {
  if (!storage) {
    return { status: "empty" };
  }

  const existing = firstExistingSave(storage);
  if (!existing.ok) {
    return { status: "invalid", error: existing.error };
  }
  if (existing.raw === null || existing.key === null) {
    return { status: "empty" };
  }

  if (existing.key !== SAVE_KEY) {
    return migrateStoredSave(storage, existing.key, existing.raw);
  }

  const parsed = parseJson(existing.raw);
  if (!parsed.ok) {
    return { status: "invalid", error: parsed.error };
  }
  const envelope = parseCurrentEnvelope(parsed.value);
  if (!envelope.ok) {
    return { status: "invalid", error: envelope.error };
  }

  return {
    status: "loaded",
    state: envelope.envelope.state as GameState,
  };
}

export function exportSavedGame(
  storage: StorageLike | null = browserStorage(),
): ExportResult {
  if (!storage) {
    return { ok: false, error: "当前环境不支持本地存档" };
  }

  const loaded = loadGame(storage);
  if (loaded.status === "empty") {
    return { ok: false, error: "当前没有可导出的存档" };
  }
  if (loaded.status === "invalid") {
    return { ok: false, error: loaded.error };
  }

  let raw: string | null;
  try {
    raw = storage.getItem(SAVE_KEY);
  } catch {
    return { ok: false, error: "读取本地存档失败" };
  }
  if (raw === null) {
    return { ok: false, error: "当前没有可导出的存档" };
  }

  const parsed = parseJson(raw);
  if (!parsed.ok) {
    return { ok: false, error: parsed.error };
  }
  const envelope = parseCurrentEnvelope(parsed.value);
  if (!envelope.ok) {
    return { ok: false, error: envelope.error };
  }

  return {
    ok: true,
    text: JSON.stringify(envelope.envelope, null, 2),
  };
}

export function importSavedGame(
  text: string,
  storage: StorageLike | null = browserStorage(),
): SaveResult {
  if (!storage) {
    return { ok: false, error: "当前环境不支持本地存档" };
  }
  if (text.trim().length === 0) {
    return { ok: false, error: "导入文本不能为空" };
  }

  const parsed = parseJson(text);
  if (!parsed.ok) {
    return { ok: false, error: "导入文本无法解析" };
  }
  const incoming = parseImportedPayload(parsed.value);
  if (!incoming.ok) {
    return { ok: false, error: incoming.error };
  }

  const existing = firstExistingSave(storage);
  if (!existing.ok) {
    return { ok: false, error: existing.error };
  }
  if (existing.raw !== null) {
    const backup = backUpRaw(storage, existing.raw);
    if (!backup.ok) {
      return backup;
    }
  }

  return writeEnvelope(storage, incoming.envelope, "写入导入存档失败");
}

export function hasSavedGame(
  storage: StorageLike | null = browserStorage(),
): boolean {
  if (!storage) {
    return false;
  }

  const existing = firstExistingSave(storage);
  return existing.ok && existing.raw !== null;
}

export function clearSavedGame(
  storage: StorageLike | null = browserStorage(),
): SaveResult {
  if (!storage) {
    return { ok: false, error: "当前环境不支持本地存档" };
  }

  try {
    storage.removeItem(SAVE_KEY);
    storage.removeItem(LEGACY_V1_SAVE_KEY);
    storage.removeItem(LEGACY_HEAD_SAVE_KEY);
    return { ok: true };
  } catch {
    return { ok: false, error: "删除本地存档失败" };
  }
}

