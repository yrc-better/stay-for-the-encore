import type { GameState, Recording } from "../types";
import { clamp } from "./clamp";

export function equipmentRecordingBonus(state: GameState): number {
  const items = [state.equipment.guitar, ...state.equipment.pedals, state.equipment.amp];
  return clamp(items.reduce((sum, item) => sum + (item.modifiers?.recordingQuality ?? 0), 0), -10, 15);
}

export function memberRecordingModifier(state: GameState): number {
  return Object.values(state.memberStates).reduce((sum, member) => {
    if (member.status === "away") return sum - 6;
    if (member.status === "strained") return sum - 2;
    return sum;
  }, 0);
}

export function createRecording(state: GameState, workId: string): Omit<Recording, "id" | "createdAt"> {
  const work = state.works.find((candidate) => candidate.id === workId);
  if (!work) throw new Error(`Work not found: ${workId}`);
  if (work.stage !== "song") throw new Error(`Work is not complete: ${workId}`);
  if (work.rehearsal < 30) throw new Error(`Work rehearsal is too low: ${workId}`);

  const quality = Math.round(
    clamp(
      work.quality * 0.45 +
        work.rehearsal * 0.25 +
        state.player.technique * 0.15 +
        state.band.cohesion * 0.1 +
        equipmentRecordingBonus(state) +
        memberRecordingModifier(state),
      0,
      100
    )
  );

  return {
    workId,
    type: "demo",
    quality,
    rawness: clamp(100 - quality, 0, 100),
    released: false
  };
}
