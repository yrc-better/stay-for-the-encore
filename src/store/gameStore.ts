import { create } from "zustand";
import { createStore, type StoreApi } from "zustand/vanilla";
import { EVENTS } from "../data";
import type {
  EventContent,
  EventEffect as DataEventEffect,
  MemberStatKey as DataMemberStatKey,
} from "../data/types";
import {
  abandonAlbum,
  acceptCommercialOffer,
  advanceMonth,
  buyEquipment,
  createInitialGameState,
  declineCommercialOffer,
  declineContractOffer,
  executeAction,
  finishCareer,
  prepareMonthOpportunities,
  prepareMonthEvent,
  resolveEvent as resolveDomainEvent,
  sellEquipment,
  signContract,
  type ActionCommand,
  type ActionExecution,
  type ActionFeedback,
  type EventChoiceResolution,
  type EventEffect as DomainEventEffect,
  type EventResolutionResult,
  type GameState,
  type MemberStatKey as DomainMemberStatKey,
  type MonthSummary,
  type NewGameInput,
  type CareerMutationResult,
  type EquipmentSlot,
  type EquipmentTier,
} from "../domain";
import {
  clearSavedGame,
  exportSavedGame,
  importSavedGame,
  loadGame,
  saveGame,
  type LoadResult,
  type ExportResult,
  type SaveResult,
  type StorageLike,
} from "../persistence";

export interface EventChoiceSelection {
  eventId: string;
  choiceId: string;
}

const EVENT_STAT_KEY_MAP: Readonly<
  Record<DataMemberStatKey, DomainMemberStatKey>
> = {
  professional: "professional",
  creation: "creativity",
  performance: "performance",
  heat: "popularity",
  belonging: "belonging",
};

function toDomainEventEffect(effect: DataEventEffect): DomainEventEffect {
  if (effect.type === "memberStat") {
    return {
      ...effect,
      stat: EVENT_STAT_KEY_MAP[effect.stat],
    };
  }
  return effect;
}

function buildEventResolution(
  selection: EventChoiceSelection,
): EventChoiceResolution | null {
  const eventCatalog: readonly EventContent[] = EVENTS;
  const event = eventCatalog.find((item) => item.id === selection.eventId);
  const choice = event?.choices.find((item) => item.id === selection.choiceId);
  if (!event || !choice) {
    return null;
  }

  return {
    eventId: event.id,
    eventTitle: event.title,
    choiceId: choice.id,
    choiceLabel: choice.label,
    repeatable: event.once !== true,
    cooldownMonths: event.cooldownMonths ?? 6,
    chainId: event.chainId,
    outcomes: choice.outcomes.map((outcome) => ({
      id: outcome.id,
      weight: outcome.weight,
      title: outcome.title,
      text: outcome.text,
      effects: outcome.effects.map(toDomainEventEffect),
      nextEventId: outcome.nextEventId,
      nextEventDelayMonths: outcome.nextEventDelayMonths,
    })),
  };
}

export interface GameStoreState {
  game: GameState | null;
  hydrated: boolean;
  lastFeedback: ActionFeedback | null;
  lastMonthSummary: MonthSummary | null;
  lastError: string | null;
  startNewGame(input: NewGameInput): GameState;
  performAction(command: ActionCommand): ActionExecution | null;
  prepareEvent(candidateIds: readonly string[]): string | null;
  acknowledgeOpportunities(): GameState | null;
  resolveEvent(selection: EventChoiceSelection): EventResolutionResult | null;
  acceptCommercialOffer(offerId: string): CareerMutationResult | null;
  declineCommercialOffer(offerId: string): CareerMutationResult | null;
  signContract(offerId: string): CareerMutationResult | null;
  declineContractOffer(offerId: string): CareerMutationResult | null;
  buyEquipment(
    slot: EquipmentSlot,
    tier: Exclude<EquipmentTier, "starter">,
  ): CareerMutationResult | null;
  sellEquipment(slot: EquipmentSlot): CareerMutationResult | null;
  abandonAlbum(): CareerMutationResult | null;
  endCareer(): GameState | null;
  endMonth(): MonthSummary | null;
  manualSave(): SaveResult;
  exportSave(): ExportResult;
  importSave(text: string): SaveResult;
  loadSavedGame(): LoadResult;
  clearSavedGame(): SaveResult;
  clearCurrentGame(): void;
}

type StoreSet = StoreApi<GameStoreState>["setState"];
type StoreGet = StoreApi<GameStoreState>["getState"];

function createStoreState(
  set: StoreSet,
  get: StoreGet,
  storage?: StorageLike | null,
): GameStoreState {
  return {
    game: null,
    hydrated: false,
    lastFeedback: null,
    lastMonthSummary: null,
    lastError: null,

    startNewGame(input) {
      const game = createInitialGameState(input);
      set({
        game,
        hydrated: true,
        lastFeedback: null,
        lastMonthSummary: null,
        lastError: null,
      });
      return game;
    },

    performAction(command) {
      const game = get().game;
      if (!game) {
        set({ lastError: "请先创建或载入游戏" });
        return null;
      }

      const result = executeAction(game, command);
      if (!result.ok) {
        set({ lastError: result.error.message });
        return result;
      }

      set({
        game: result.state,
        lastFeedback: result.feedback,
        lastError: null,
      });
      return result;
    },

    prepareEvent(candidateIds) {
      const game = get().game;
      if (!game) {
        set({ lastError: "请先创建或载入游戏" });
        return null;
      }

      const withOpportunities = prepareMonthOpportunities(game);
      const nextGame = prepareMonthEvent(withOpportunities, candidateIds);
      set({
        game: nextGame,
        lastError: null,
      });
      return nextGame.pendingEvent;
    },

    acknowledgeOpportunities() {
      const game = get().game;
      if (!game || game.month.opportunitiesAcknowledged) {
        return game;
      }

      const nextGame: GameState = {
        ...game,
        month: {
          ...game.month,
          opportunitiesAcknowledged: true,
        },
      };
      set({
        game: nextGame,
        lastError: null,
      });
      return nextGame;
    },

    resolveEvent(selection) {
      const game = get().game;
      if (!game) {
        set({ lastError: "请先创建或载入游戏" });
        return null;
      }

      const resolution = buildEventResolution(selection);
      if (!resolution) {
        set({ lastError: "找不到对应的事件选择" });
        return null;
      }

      const result = resolveDomainEvent(game, resolution);
      if (!result.ok) {
        set({ lastError: result.error.message });
        return result;
      }

      set({
        game: result.state,
        lastError: null,
      });
      return result;
    },

    acceptCommercialOffer(offerId) {
      const game = get().game;
      if (!game) return null;
      const result = acceptCommercialOffer(game, offerId);
      set({
        game: result.state,
        lastError: result.ok ? null : result.error,
      });
      return result;
    },

    declineCommercialOffer(offerId) {
      const game = get().game;
      if (!game) return null;
      const result = declineCommercialOffer(game, offerId);
      set({
        game: result.state,
        lastError: result.ok ? null : result.error,
      });
      return result;
    },

    signContract(offerId) {
      const game = get().game;
      if (!game) return null;
      const result = signContract(game, offerId);
      set({
        game: result.state,
        lastError: result.ok ? null : result.error,
      });
      return result;
    },

    declineContractOffer(offerId) {
      const game = get().game;
      if (!game) return null;
      const result = declineContractOffer(game, offerId);
      set({
        game: result.state,
        lastError: result.ok ? null : result.error,
      });
      return result;
    },

    buyEquipment(slot, tier) {
      const game = get().game;
      if (!game) return null;
      const result = buyEquipment(game, slot, tier);
      set({
        game: result.state,
        lastError: result.ok ? null : result.error,
      });
      return result;
    },

    sellEquipment(slot) {
      const game = get().game;
      if (!game) return null;
      const result = sellEquipment(game, slot);
      set({
        game: result.state,
        lastError: result.ok ? null : result.error,
      });
      return result;
    },

    abandonAlbum() {
      const game = get().game;
      if (!game) return null;
      const result = abandonAlbum(game);
      set({
        game: result.state,
        lastError: result.ok ? null : result.error,
      });
      return result;
    },

    endCareer() {
      const game = get().game;
      if (!game) return null;
      const nextGame = finishCareer(game, "playerEnded");
      set({ game: nextGame, lastError: null });
      return nextGame;
    },

    endMonth() {
      const game = get().game;
      if (!game) {
        set({ lastError: "请先创建或载入游戏" });
        return null;
      }

      const result = advanceMonth(game);
      let lastError: string | null = null;
      if (result.summary.autoSaveDue) {
        const saveResult = saveGame(result.state, storage);
        if (!saveResult.ok) {
          lastError = saveResult.error;
        }
      }

      set({
        game: result.state,
        lastMonthSummary: result.summary,
        lastFeedback: null,
        lastError,
      });
      return result.summary;
    },

    manualSave() {
      const game = get().game;
      if (!game) {
        const result: SaveResult = { ok: false, error: "当前没有可保存的游戏" };
        set({ lastError: result.error });
        return result;
      }

      const result = saveGame(game, storage);
      set({ lastError: result.ok ? null : result.error });
      return result;
    },

    exportSave() {
      const game = get().game;
      if (game) {
        const saved = saveGame(game, storage);
        if (!saved.ok) {
          set({ lastError: saved.error });
          return saved;
        }
      }
      const result = exportSavedGame(storage);
      set({ lastError: result.ok ? null : result.error });
      return result;
    },

    importSave(text) {
      const imported = importSavedGame(text, storage);
      if (!imported.ok) {
        set({ lastError: imported.error, hydrated: true });
        return imported;
      }
      const loaded = loadGame(storage);
      if (loaded.status !== "loaded") {
        const result: SaveResult = {
          ok: false,
          error:
            loaded.status === "invalid"
              ? loaded.error
              : "导入后没有找到可载入的存档",
        };
        set({ lastError: result.error, hydrated: true });
        return result;
      }
      set({
        game: loaded.state,
        hydrated: true,
        lastFeedback: null,
        lastMonthSummary: null,
        lastError: null,
      });
      return { ok: true };
    },

    loadSavedGame() {
      const result = loadGame(storage);
      if (result.status === "loaded") {
        set({
          game: result.state,
          hydrated: true,
          lastFeedback: null,
          lastMonthSummary: null,
          lastError: null,
        });
      } else {
        set({
          hydrated: true,
          lastError: result.status === "invalid" ? result.error : null,
        });
      }
      return result;
    },

    clearSavedGame() {
      const result = clearSavedGame(storage);
      set({ lastError: result.ok ? null : result.error });
      return result;
    },

    clearCurrentGame() {
      set({
        game: null,
        lastFeedback: null,
        lastMonthSummary: null,
        lastError: null,
      });
    },
  };
}

export function createGameStore(storage?: StorageLike | null): StoreApi<GameStoreState> {
  return createStore<GameStoreState>((set, get) =>
    createStoreState(set, get, storage),
  );
}

export const useGameStore = create<GameStoreState>((set, get) =>
  createStoreState(set, get),
);
