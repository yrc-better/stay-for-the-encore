import {
  ABILITY_PROGRESS_PER_POINT,
  MONTHLY_ABILITY_PROGRESS_CAP,
  isAbilityKey
} from "../config/abilityGrowth";
import { STAMINA } from "../config/balance";
import type { AbilityKey, BandStatKey, Effect, GameState, PlayerStatKey, Recording, Release } from "../types";
import { clamp } from "./clamp";
import { resolveGraduationShow } from "./graduation";

function id(prefix: string, count: number): string {
  return `${prefix}.${count + 1}`;
}

function clampPlayerStat(state: GameState, key: PlayerStatKey, value: number): number {
  if (key === "stamina") {
    const effectiveCap = STAMINA.baseCap - state.monthly.staminaCapPenalty;
    return clamp(value, STAMINA.min, effectiveCap);
  }
  if (key === "wealth") return Math.max(0, value);
  return clamp(value, 0, 100);
}

function clampBandStat(key: BandStatKey, value: number): number {
  if (key === "cohesion" || key === "workQuality" || key === "reputation") {
    return clamp(value, 0, 100);
  }
  return clamp(value, 0, 100000);
}

function getRecordingTypeForRelease(type: Release["type"]): Recording["type"] {
  if (type === "single") return "single";
  if (type === "ep" || type === "album") return "album_track";
  return "demo";
}

function applyAbilityProgress(state: GameState, key: AbilityKey, amount: number): GameState {
  const monthlyGain = state.monthly.abilityProgressGains[key];
  const gain = clamp(amount, 0, MONTHLY_ABILITY_PROGRESS_CAP - monthlyGain);
  if (gain <= 0) return state;

  const totalProgress = state.abilityProgress[key] + gain;
  const statGain = Math.floor(totalProgress / ABILITY_PROGRESS_PER_POINT);
  const nextProgress = totalProgress % ABILITY_PROGRESS_PER_POINT;
  const nextValue = clampPlayerStat(state, key, state.player[key] + statGain);

  return {
    ...state,
    player: { ...state.player, [key]: nextValue },
    abilityProgress: { ...state.abilityProgress, [key]: nextProgress },
    monthly: {
      ...state.monthly,
      abilityProgressGains: {
        ...state.monthly.abilityProgressGains,
        [key]: monthlyGain + gain
      }
    }
  };
}

type AdvanceWorkEffect = Extract<Effect, { kind: "advanceWork" }>;
type WorkState = GameState["works"][number];

function selectAdvanceWorkTarget(state: GameState, effect: AdvanceWorkEffect): WorkState | undefined {
  if (effect.workId) return state.works.find((work) => work.id === effect.workId);
  if (effect.amount > 0) return state.works.find((work) => work.stage === "draft" && work.completion < 100);
  if ((effect.rehearsalAmount ?? 0) > 0) return state.works.find((work) => work.stage === "song") ?? state.works[0];
  return undefined;
}

export function applyEffects(state: GameState, effects: Effect[]): GameState {
  return effects.reduce<GameState>((current, effect) => {
    if (effect.kind === "playerStat") {
      if (effect.amount > 0 && isAbilityKey(effect.key)) {
        return applyAbilityProgress(current, effect.key, effect.amount);
      }

      const nextValue = clampPlayerStat(current, effect.key, current.player[effect.key] + effect.amount);
      const overdraft = effect.key === "stamina" && nextValue < 0 && current.player.stamina >= 0 ? 1 : 0;
      return {
        ...current,
        player: { ...current.player, [effect.key]: nextValue },
        counters: { ...current.counters, overdraftActions: current.counters.overdraftActions + overdraft }
      };
    }
    if (effect.kind === "bandStat") {
      return {
        ...current,
        band: { ...current.band, [effect.key]: clampBandStat(effect.key, current.band[effect.key] + effect.amount) }
      };
    }
    if (effect.kind === "relationship") {
      return {
        ...current,
        relationships: {
          ...current.relationships,
          [effect.character]: clamp(current.relationships[effect.character] + effect.amount, 0, 100)
        }
      };
    }
    if (effect.kind === "memberStatus") {
      return {
        ...current,
        memberStates: {
          ...current.memberStates,
          [effect.character]: {
            status: effect.status,
            note: effect.note,
            updatedAt: current.month
          }
        }
      };
    }
    if (effect.kind === "flag") {
      return { ...current, flags: { ...current.flags, [effect.key]: effect.value } };
    }
    if (effect.kind === "counter") {
      return { ...current, counters: { ...current.counters, [effect.key]: current.counters[effect.key] + effect.amount } };
    }
    if (effect.kind === "addRiff") {
      return {
        ...current,
        riffs: [
          ...current.riffs,
          {
            ...effect.riff,
            id: id("riff", current.riffs.length),
            createdAt: current.month,
            styleTags: [...effect.riff.styleTags]
          }
        ]
      };
    }
    if (effect.kind === "addHistory") {
      return {
        ...current,
        history: [
          ...current.history,
          { ...effect.entry, id: id("history", current.history.length), month: current.month, tags: [...effect.entry.tags] }
        ]
      };
    }
    if (effect.kind === "addRecording") {
      return {
        ...current,
        recordings: [
          ...current.recordings,
          { ...effect.recording, id: id("recording", current.recordings.length), createdAt: current.month }
        ]
      };
    }
    if (effect.kind === "addRelease") {
      const releasedRecordingIds = new Set(effect.release.recordingIds);
      return {
        ...current,
        recordings: current.recordings.map((recording) =>
          releasedRecordingIds.has(recording.id)
            ? { ...recording, type: getRecordingTypeForRelease(effect.release.type), released: true }
            : recording
        ),
        releases: [
          ...current.releases,
          {
            ...effect.release,
            id: id("release", current.releases.length),
            month: current.month,
            recordingIds: [...effect.release.recordingIds],
            awards: [...effect.release.awards]
          }
        ]
      };
    }
    if (effect.kind === "advanceWork") {
      const existing = selectAdvanceWorkTarget(current, effect);
      if (!existing) {
        if (effect.workId || effect.amount <= 0) return current;
        const sourceRiff = current.riffs.find((riff) => riff.id === effect.sourceRiffId) ?? current.riffs[0];
        const baseQuality = sourceRiff ? sourceRiff.quality : 20;
        const completion = clamp(effect.amount, 0, 100);
        const created: WorkState = {
          id: id("work", current.works.length),
          title: sourceRiff?.titleSeed ?? "未命名的歌",
          stage: completion >= 100 ? "song" : "draft",
          sourceRiffIds: sourceRiff ? [sourceRiff.id] : [],
          completion,
          quality: clamp(
            baseQuality + current.player.creativity * 0.25 + current.band.cohesion * 0.1 + (effect.qualityAmount ?? 0),
            0,
            100
          ),
          rehearsal: clamp(effect.rehearsalAmount ?? 0, 0, 100),
          styleTags: [...(effect.styleTags ?? sourceRiff?.styleTags ?? [])],
          authorship: effect.authorship ?? "shared",
          tension: clamp(effect.tensionAmount ?? 0, 0, 100)
        };
        return { ...current, works: [...current.works, created] };
      }

      const works = current.works.map((work) => {
        if (work.id !== existing.id) return work;
        const completion = clamp(work.completion + effect.amount, 0, 100);
        return {
          ...work,
          completion,
          stage: completion >= 100 ? ("song" as const) : work.stage,
          quality: clamp(work.quality + (effect.qualityAmount ?? (effect.amount > 0 ? 8 : 0)), 0, 100),
          rehearsal: clamp(work.rehearsal + (effect.rehearsalAmount ?? 0), 0, 100),
          authorship: effect.authorship ?? work.authorship,
          tension: clamp(work.tension + (effect.tensionAmount ?? 0), 0, 100),
          styleTags: Array.from(new Set([...work.styleTags, ...(effect.styleTags ?? [])]))
        };
      });
      return { ...current, works };
    }
    if (effect.kind === "queueEvent") {
      return {
        ...current,
        queuedEvents: [...current.queuedEvents, effect.eventId]
      };
    }
    if (effect.kind === "resolveGraduationShow") {
      return resolveGraduationShow(current);
    }
    return current;
  }, state);
}
