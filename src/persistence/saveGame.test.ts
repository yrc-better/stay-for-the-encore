import { describe, expect, it } from "vitest";
import {
  createInitialGameState,
  type GameState,
  type MemberSeed,
} from "../domain";
import {
  BACKUP_KEY,
  LEGACY_HEAD_SAVE_KEY,
  LEGACY_V1_SAVE_KEY,
  SAVE_KEY,
  clearSavedGame,
  exportSavedGame,
  hasSavedGame,
  importSavedGame,
  loadGame,
  saveGame,
  type StorageLike,
} from "./saveGame";
import { gameStateSchema } from "./schema";

class MemoryStorage implements StorageLike {
  private data = new Map<string, string>();

  constructor(private readonly failingSetKeys = new Set<string>()) {}

  getItem(key: string) {
    return this.data.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    if (this.failingSetKeys.has(key)) {
      throw new Error(`setItem blocked for ${key}`);
    }
    this.data.set(key, value);
  }

  removeItem(key: string) {
    this.data.delete(key);
  }
}

const roles = ["leadGuitar", "bass", "drums", "keyboard"] as const;
const members: MemberSeed[] = roles.map((role, index) => ({
  id: role,
  name: role,
  age: 22,
  role,
  avatarId: role,
  biography: "",
  quote: "",
  traits: [],
  stats: {
    professional: 50 + index,
    creativity: 45,
    performance: 40,
    popularity: 10,
    belonging: 60,
  },
}));

function createState(
  gameId = "save-test",
  bandName = "迟到的候鸟",
): GameState {
  return createInitialGameState({
    bandName,
    genre: "indie",
    protagonist: { name: "阿昼", avatarId: "player-midnight" },
    selectedMembers: members,
    seed: 7,
    gameId,
    createdAt: "2026-07-16T00:00:00.000Z",
  });
}

function jsonClone(value: unknown): Record<string, unknown> {
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}

function createV1Save(state = createState("legacy-v1")) {
  const legacy = jsonClone(state);
  legacy.version = 1;
  delete legacy.endingSummary;
  delete legacy.activeContract;
  delete legacy.performanceRecords;
  delete legacy.performanceMilestones;
  delete legacy.eventCooldowns;
  delete legacy.completedEventIds;
  delete legacy.scheduledEvents;

  const month = legacy.month as Record<string, unknown>;
  delete month.eventPrepared;
  delete month.opportunitiesPrepared;
  delete month.performanceInvitations;
  delete month.commercialOffers;
  delete month.contractOffers;

  delete legacy.pendingEvent;
  delete legacy.eventCooldownMonths;
  delete legacy.eventHistory;
  return legacy;
}

function createOldHeadSave() {
  return {
    version: 5,
    createdAt: "2025-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
    state: {
      bandName: "旧日回声",
      month: "2028-05",
      phase: "career",
      careerStage: "early",
      route: "writer",
      player: {
        stamina: 80,
        technique: 64,
        creativity: 78,
        stage: 55,
        health: 70,
        stress: 30,
        fame: 24,
        wealth: 900,
      },
      band: {
        cohesion: 62,
        workQuality: 58,
        fans: 160,
        reputation: 34,
        funds: 1_200,
      },
      relationships: {
        vocal: 72,
        bass: 66,
        drums: 61,
      },
      memberStates: {
        vocal: { status: "active", note: "", updatedAt: "2028-05" },
        bass: { status: "strained", note: "", updatedAt: "2028-05" },
        drums: { status: "away", note: "", updatedAt: "2028-05" },
      },
      releases: [
        {
          id: "old-album",
          month: "2028-03",
          type: "album",
          title: "旧城来信",
          recordingIds: [],
          sales: 12_000,
          criticalScore: 82,
          fameImpact: 10,
          awards: [],
        },
      ],
      history: [
        {
          id: "old-show",
          month: "2028-04",
          type: "performance",
          title: "旧版巡演",
          description: "一段旧版现场履历。",
          weight: 10,
          tags: ["tour"],
        },
      ],
    },
  };
}

describe("本地存档 v2", () => {
  it("使用版本化 envelope 保存并完整载入一局游戏", () => {
    const storage = new MemoryStorage();
    const state = createState();

    expect(saveGame(state, storage)).toEqual({ ok: true });

    const raw = storage.getItem(SAVE_KEY);
    expect(raw).not.toBeNull();
    const envelope = JSON.parse(raw as string);
    expect(envelope).toMatchObject({
      saveVersion: 2,
      state,
    });
    expect(Number.isNaN(Date.parse(envelope.savedAt))).toBe(false);
    expect(loadGame(storage)).toEqual({ status: "loaded", state });
  });

  it("载入缺少机会确认字段的既有 v2 存档时补齐默认值", () => {
    const storage = new MemoryStorage();
    const state = jsonClone(createState("existing-v2"));
    const month = state.month as Record<string, unknown>;
    delete month.opportunitiesAcknowledged;
    storage.setItem(
      SAVE_KEY,
      JSON.stringify({
        saveVersion: 2,
        savedAt: "2026-07-16T00:00:00.000Z",
        state,
      }),
    );

    const result = loadGame(storage);
    expect(result.status).toBe("loaded");
    if (result.status !== "loaded") return;
    expect(result.state.month.opportunitiesAcknowledged).toBe(false);
  });

  it("拒绝损坏、未知版本和伪装成 v2 的裸状态", () => {
    const corrupted = new MemoryStorage();
    corrupted.setItem(SAVE_KEY, '{"saveVersion":2,"savedAt":"bad","state":{}}');
    expect(loadGame(corrupted)).toMatchObject({ status: "invalid" });

    const unknown = new MemoryStorage();
    unknown.setItem(SAVE_KEY, '{"saveVersion":99,"state":{}}');
    expect(loadGame(unknown)).toEqual({
      status: "invalid",
      error: "存档版本 99 暂不受支持",
    });

    const bareState = new MemoryStorage();
    bareState.setItem(SAVE_KEY, JSON.stringify(createState()));
    expect(loadGame(bareState)).toEqual({
      status: "invalid",
      error: "本地存档格式无效",
    });
  });

  it("迁移 v1 裸状态，补齐安全默认值并保留原文备份", () => {
    const storage = new MemoryStorage();
    const legacy = createV1Save();
    const raw = JSON.stringify(legacy);
    storage.setItem(LEGACY_V1_SAVE_KEY, raw);

    const result = loadGame(storage);
    expect(result.status).toBe("loaded");
    if (result.status !== "loaded") return;

    expect(result.state.version).toBe(2);
    expect(result.state.endingSummary).toBeNull();
    expect(result.state.month).toMatchObject({
      eventPrepared: false,
      opportunitiesPrepared: false,
      opportunitiesAcknowledged: false,
      performanceInvitations: [],
      commercialOffers: [],
      contractOffers: [],
    });
    expect(result.state.activeContract).toBeNull();
    expect(result.state.performanceRecords).toEqual([]);
    expect(result.state.performanceMilestones).toEqual({
      excellentLevel3: false,
      excellentLevel4: false,
    });
    expect(result.state.eventCooldowns).toEqual({});
    expect(result.state.completedEventIds).toEqual([]);
    expect(result.state.scheduledEvents).toEqual([]);
    expect(storage.getItem(BACKUP_KEY)).toBe(raw);
    expect(storage.getItem(LEGACY_V1_SAVE_KEY)).toBe(raw);
    expect(storage.getItem(SAVE_KEY)).not.toBeNull();
  });

  it("v1 迁移失败时保留原存档且不写入 v2", () => {
    const storage = new MemoryStorage();
    const raw = JSON.stringify({ version: 1, month: {} });
    storage.setItem(LEGACY_V1_SAVE_KEY, raw);

    expect(loadGame(storage)).toMatchObject({ status: "invalid" });
    expect(storage.getItem(BACKUP_KEY)).toBe(raw);
    expect(storage.getItem(LEGACY_V1_SAVE_KEY)).toBe(raw);
    expect(storage.getItem(SAVE_KEY)).toBeNull();
  });

  it("备份失败时停止迁移且不覆盖原存档", () => {
    const storage = new MemoryStorage(new Set([BACKUP_KEY]));
    const raw = JSON.stringify(createV1Save());
    storage.setItem(LEGACY_V1_SAVE_KEY, raw);

    expect(loadGame(storage)).toEqual({
      status: "invalid",
      error: "备份现有存档失败",
    });
    expect(storage.getItem(LEGACY_V1_SAVE_KEY)).toBe(raw);
    expect(storage.getItem(SAVE_KEY)).toBeNull();
  });

  it("检测并迁移旧 HEAD 的 v5 存档", () => {
    const storage = new MemoryStorage();
    const oldSave = createOldHeadSave();
    const raw = JSON.stringify(oldSave);
    storage.setItem(LEGACY_HEAD_SAVE_KEY, raw);

    const result = loadGame(storage);
    expect(result.status).toBe("loaded");
    if (result.status !== "loaded") return;

    expect(result.state).toMatchObject({
      version: 2,
      calendar: {
        completedMonths: 12,
        year: 2,
        month: 1,
      },
      band: {
        name: "旧日回声",
        genre: "indie",
        funds: 12_000,
      },
    });
    expect(result.state.members).toHaveLength(5);
    expect(result.state.members.map((member) => member.role)).toEqual([
      "leader",
      ...roles,
    ]);
    expect(result.state.releasedAlbums).toHaveLength(1);
    expect(result.state.releasedAlbums[0]).toMatchObject({
      id: "old-album",
      title: "旧城来信",
      quality: 4,
    });
    expect(result.state.history.some((entry) => entry.title === "旧版巡演")).toBe(
      true,
    );
    expect(storage.getItem(BACKUP_KEY)).toBe(raw);
    expect(storage.getItem(LEGACY_HEAD_SAVE_KEY)).toBe(raw);
    expect(storage.getItem(SAVE_KEY)).not.toBeNull();
  });

  it("导出为纯文本，并在导入前验证和备份现有存档", () => {
    const source = new MemoryStorage();
    const sourceState = createState("export-source", "出口乐队");
    expect(saveGame(sourceState, source)).toEqual({ ok: true });

    const exported = exportSavedGame(source);
    expect(exported.ok).toBe(true);
    if (!exported.ok) return;
    expect(JSON.parse(exported.text)).toMatchObject({
      saveVersion: 2,
      state: { id: "export-source" },
    });

    const destination = new MemoryStorage();
    const previousState = createState("import-target", "被覆盖的乐队");
    expect(saveGame(previousState, destination)).toEqual({ ok: true });
    const previousRaw = destination.getItem(SAVE_KEY);

    expect(importSavedGame(exported.text, destination)).toEqual({ ok: true });
    expect(destination.getItem(BACKUP_KEY)).toBe(previousRaw);
    expect(loadGame(destination)).toEqual({
      status: "loaded",
      state: sourceState,
    });
  });

  it("无效导入不会覆盖当前存档或替换备份", () => {
    const storage = new MemoryStorage();
    const state = createState("safe-import");
    expect(saveGame(state, storage)).toEqual({ ok: true });
    const before = storage.getItem(SAVE_KEY);

    expect(importSavedGame("{not-json", storage)).toEqual({
      ok: false,
      error: "导入文本无法解析",
    });
    expect(storage.getItem(SAVE_KEY)).toBe(before);
    expect(storage.getItem(BACKUP_KEY)).toBeNull();
  });

  it("schema 拒绝多主角、重复成员 ID 和不完整角色阵容", () => {
    const multiplePlayers = jsonClone(createState());
    const multiplePlayerMembers = multiplePlayers.members as Array<
      Record<string, unknown>
    >;
    multiplePlayerMembers[1].isPlayer = true;
    expect(gameStateSchema.safeParse(multiplePlayers).success).toBe(false);

    const duplicateIds = jsonClone(createState());
    const duplicateIdMembers = duplicateIds.members as Array<
      Record<string, unknown>
    >;
    duplicateIdMembers[1].id = duplicateIdMembers[0].id;
    expect(gameStateSchema.safeParse(duplicateIds).success).toBe(false);

    const missingRole = jsonClone(createState());
    const missingRoleMembers = missingRole.members as Array<
      Record<string, unknown>
    >;
    missingRoleMembers[4].role = "drums";
    expect(gameStateSchema.safeParse(missingRole).success).toBe(false);
  });

  it("识别所有兼容 key，清除主存档但保留恢复备份", () => {
    const storage = new MemoryStorage();
    storage.setItem(LEGACY_HEAD_SAVE_KEY, JSON.stringify(createOldHeadSave()));
    storage.setItem(BACKUP_KEY, "recovery-copy");
    expect(hasSavedGame(storage)).toBe(true);

    expect(clearSavedGame(storage)).toEqual({ ok: true });
    expect(hasSavedGame(storage)).toBe(false);
    expect(storage.getItem(LEGACY_HEAD_SAVE_KEY)).toBeNull();
    expect(storage.getItem(BACKUP_KEY)).toBe("recovery-copy");
  });
});
