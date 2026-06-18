import type { GameState, HistoryEntry } from "../types";
import { clamp } from "./clamp";

function id(prefix: string, count: number): string {
  return `${prefix}.${count + 1}`;
}

function averageRelationship(state: GameState): number {
  const values = Object.values(state.relationships);
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function graduationScore(state: GameState): number {
  return Math.round(
    state.band.workQuality * 0.32 +
      state.band.cohesion * 0.24 +
      state.player.stage * 0.18 +
      averageRelationship(state) * 0.16 +
      (100 - state.player.stress) * 0.1
  );
}

function graduationHistory(score: number): Omit<HistoryEntry, "id" | "month"> {
  if (score >= 65) {
    return {
      type: "performance",
      title: "毕业演出：礼堂被点燃",
      description:
        "谢幕时，礼堂的灯没有立刻暗下去。你们把那些原本只是来凑热闹的人也拉进了歌里，掌声像一条真正通往校门外的路。",
      weight: 5,
      tags: ["campus", "graduation", "breakthrough"]
    };
  }

  if (score >= 42) {
    return {
      type: "performance",
      title: "毕业演出：留下回声",
      description:
        "谢幕时掌声不算整齐，却没有立刻散掉。演出有失误，也有几个真正亮起来的瞬间；毕业后再继续这件事，听起来不算荒唐。",
      weight: 3,
      tags: ["campus", "graduation", "steady"]
    };
  }

  return {
    type: "performance",
    title: "毕业演出：勉强收场",
    description:
      "谢幕像一件完成得太快的手续。你们演完了，但每个人都知道有些地方没有接住；散场后，礼堂门口的风很空，没人急着谈以后。",
    weight: 1,
    tags: ["campus", "graduation", "rough"]
  };
}

export function resolveGraduationShow(state: GameState): GameState {
  const score = graduationScore(state);
  const isStrong = score >= 65;
  const isRough = score < 42;
  const outcome = isStrong ? "breakthrough" : isRough ? "rough" : "steady";
  const history = graduationHistory(score);

  return {
    ...state,
    phase: "career",
    careerStage: "early",
    player: {
      ...state.player,
      fame: clamp(state.player.fame + (isStrong ? 8 : isRough ? 1 : 4), 0, 100),
      wealth: state.player.wealth + (isStrong ? 180 : isRough ? 0 : 80),
      stress: clamp(state.player.stress + (isRough ? 4 : -3), 0, 100)
    },
    band: {
      ...state.band,
      fans: clamp(state.band.fans + (isStrong ? 18 : isRough ? 2 : 8), 0, 100000),
      funds: state.band.funds + (isStrong ? 360 : isRough ? 0 : 160),
      reputation: clamp(state.band.reputation + (isStrong ? 8 : isRough ? 1 : 4), 0, 100)
    },
    counters: {
      ...state.counters,
      missedOpportunities: state.counters.missedOpportunities + (isRough ? 1 : 0)
    },
    flags: {
      ...state.flags,
      "campus.graduationShowDone": true,
      "campus.graduationOutcome": outcome,
      ...(isStrong ? { "career.hasLivehouseOffer": true } : {})
    },
    history: [
      ...state.history,
      {
        ...history,
        id: id("history", state.history.length),
        month: state.month,
        tags: [...history.tags]
      }
    ]
  };
}
