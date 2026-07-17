import { calculateBandAttributes } from "./formulas";
import type { BandAttributes, GameState, Member } from "./types";

export function selectPlayer(state: GameState): Member {
  const player = state.members.find((member) => member.isPlayer);
  if (!player) {
    throw new Error("游戏状态中缺少主角");
  }

  return player;
}

export function selectTeammates(state: GameState): Member[] {
  return state.members.filter((member) => !member.isPlayer);
}

export function selectBandAttributes(state: GameState): BandAttributes {
  return calculateBandAttributes(state.members, state.band);
}

export function selectAbsoluteMonth(state: GameState): number {
  return state.calendar.completedMonths + 1;
}

export function canUseAction(state: GameState, actionId: string): boolean {
  return !state.month.usedActions.includes(actionId as never);
}
