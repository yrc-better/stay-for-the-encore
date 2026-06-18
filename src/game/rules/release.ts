import type { Effect, GameState, Recording, Release } from "../types";
import { clamp } from "./clamp";

type ReleaseInput = Omit<Release, "id" | "month">;

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function getUnreleasedRecordings(state: GameState): Recording[] {
  return state.recordings.filter((recording) => !recording.released);
}

export function hasReleasableRecordings(state: GameState): boolean {
  return getUnreleasedRecordings(state).length > 0;
}

function getReleaseType(recordings: Recording[]): Release["type"] {
  if (recordings.length >= 6) return "album";
  if (recordings.length >= 3) return "ep";

  const quality = average(recordings.map((recording) => recording.quality));
  return quality >= 55 ? "single" : "demo";
}

function getReleaseTitle(state: GameState, recordings: Recording[]): string {
  const titles = recordings
    .map((recording) => state.works.find((work) => work.id === recording.workId)?.title)
    .filter((title): title is string => Boolean(title));

  if (titles.length === 0) return "未命名发行";
  if (titles.length === 1) return titles[0];
  return `${titles[0]} 等 ${titles.length} 首`;
}

function getTypeSalesMultiplier(type: Release["type"]): number {
  if (type === "album") return 3.2;
  if (type === "ep") return 1.9;
  if (type === "single") return 1.2;
  return 0.7;
}

function getTypeCriticalBonus(type: Release["type"]): number {
  if (type === "album") return 5;
  if (type === "ep") return 3;
  if (type === "single") return 2;
  return 0;
}

function getTypeFameBonus(type: Release["type"]): number {
  if (type === "album") return 4;
  if (type === "ep") return 2;
  if (type === "single") return 1;
  return 0;
}

function getReleaseAwards(type: Release["type"], criticalScore: number, sales: number): string[] {
  const awards: string[] = [];
  if (criticalScore >= 85) awards.push(type === "album" ? "年度口碑专辑提名" : "地下乐评推荐");
  if (sales >= 5000) awards.push("独立榜单热销");
  return awards;
}

export function createRelease(state: GameState): ReleaseInput {
  const recordings = getUnreleasedRecordings(state).slice(0, 8);
  if (recordings.length === 0) throw new Error("No unreleased recordings");

  const type = getReleaseType(recordings);
  const quality = average(recordings.map((recording) => recording.quality));
  const promotionCount = Math.min(state.monthly.actionCounts.promote ?? 0, 3);
  const sales = Math.round(
    Math.max(
      10,
      (quality * 2.4 +
        state.player.fame * 6 +
        state.band.fans * 0.55 +
        state.band.reputation * 5 +
        promotionCount * 60) *
        getTypeSalesMultiplier(type)
    )
  );
  const criticalScore = Math.round(
    clamp(
      quality * 0.55 +
        state.band.workQuality * 0.25 +
        state.band.reputation * 0.15 +
        state.player.creativity * 0.05 +
        getTypeCriticalBonus(type),
      0,
      100
    )
  );
  const fameImpact = Math.round(
    clamp(criticalScore * 0.08 + Math.log10(sales + 1) * 3 + getTypeFameBonus(type), 1, 20)
  );

  return {
    type,
    title: getReleaseTitle(state, recordings),
    recordingIds: recordings.map((recording) => recording.id),
    sales,
    criticalScore,
    fameImpact,
    awards: getReleaseAwards(type, criticalScore, sales)
  };
}

export function createReleaseEffects(state: GameState): Effect[] {
  const release = createRelease(state);
  const fanGain = Math.round(clamp(release.sales * 0.08 + release.fameImpact * 2, 2, 500));
  const reputationGain = Math.round(clamp((release.criticalScore - 45) / 8, 0, 10));
  const fundsGain = Math.round(release.sales * 0.35);

  return [
    { kind: "addRelease", release },
    { kind: "playerStat", key: "fame", amount: release.fameImpact },
    { kind: "bandStat", key: "fans", amount: fanGain },
    { kind: "bandStat", key: "reputation", amount: reputationGain },
    { kind: "bandStat", key: "funds", amount: fundsGain },
    {
      kind: "addHistory",
      entry: {
        type: "release",
        title: `发行《${release.title}》`,
        description: `这次${release.type}发行卖出 ${release.sales} 份，媒体评分 ${release.criticalScore}。歌第一次真正离开了排练室。`,
        weight: release.type === "album" ? 5 : release.type === "ep" ? 4 : 3,
        tags: ["release", release.type]
      }
    }
  ];
}
