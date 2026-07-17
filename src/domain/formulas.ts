import { MAX_ATTRIBUTE, MIN_ATTRIBUTE } from "./constants";
import type {
  BandAttributes,
  BandState,
  Member,
  MemberStats,
  MemberStatus,
} from "./types";

export function clamp(value: number, min = MIN_ATTRIBUTE, max = MAX_ATTRIBUTE): number {
  return Math.min(max, Math.max(min, value));
}

export function roundToOneDecimal(value: number): number {
  return Math.round((value + Number.EPSILON) * 10) / 10;
}

export function clampMemberStats(stats: MemberStats): MemberStats {
  return {
    professional: clamp(stats.professional),
    creativity: clamp(stats.creativity),
    performance: clamp(stats.performance),
    popularity: clamp(stats.popularity),
    belonging: clamp(stats.belonging),
  };
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function calculateBandAttributes(
  members: readonly Member[],
  band: Pick<
    BandState,
    "basePopularity" | "funds" | "conflictPenalty" | "temporaryTeamBonus"
  >,
): BandAttributes {
  if (members.length === 0) {
    return {
      creativity: 0,
      musicianship: 0,
      stagecraft: 0,
      popularity: clamp(band.basePopularity),
      teamSpirit: clamp(band.temporaryTeamBonus - band.conflictPenalty),
      funds: band.funds,
    };
  }

  const professionalValues = members.map((member) => member.stats.professional);
  const creationValues = members
    .map((member) => member.stats.creativity)
    .sort((left, right) => right - left);
  const performanceValues = members.map((member) => member.stats.performance);
  const popularityValues = members.map((member) => member.stats.popularity);
  const belongingValues = members.map((member) => member.stats.belonging);
  const player = members.find((member) => member.isPlayer) ?? members[0];

  const musicianship =
    average(professionalValues) * 0.7 + Math.min(...professionalValues) * 0.3;
  const creativity =
    (creationValues[0] ?? 0) * 0.6 +
    (creationValues[1] ?? creationValues[0] ?? 0) * 0.3 +
    average(creationValues) * 0.1;
  const teamSpirit = clamp(
    average(belongingValues) - band.conflictPenalty + band.temporaryTeamBonus,
  );
  const stagecraft =
    player.stats.performance * 0.4 +
    average(performanceValues) * 0.4 +
    teamSpirit * 0.2;
  const popularity = band.basePopularity * 0.75 + average(popularityValues) * 0.25;

  return {
    creativity: roundToOneDecimal(clamp(creativity)),
    musicianship: roundToOneDecimal(clamp(musicianship)),
    stagecraft: roundToOneDecimal(clamp(stagecraft)),
    popularity: roundToOneDecimal(clamp(popularity)),
    teamSpirit: roundToOneDecimal(teamSpirit),
    funds: band.funds,
  };
}

export function shiftStatus(status: MemberStatus, recoveryLevels: number): MemberStatus {
  const order: MemberStatus[] = ["excellent", "good", "normal", "tired", "awful"];
  const currentIndex = order.indexOf(status);
  const nextIndex = clamp(currentIndex - recoveryLevels, 0, order.length - 1);
  return order[nextIndex];
}

export function statusNumericModifier(status: MemberStatus): number {
  switch (status) {
    case "excellent":
      return 4;
    case "good":
      return 2;
    case "normal":
      return 0;
    case "tired":
      return -3;
    case "awful":
      return -6;
  }
}

export function averageStatusModifier(members: readonly Member[]): number {
  return average(members.map((member) => statusNumericModifier(member.status)));
}

export function qualityFromCreativity(creativity: number): number {
  if (creativity < 15) return 0.5;
  if (creativity < 30) return 1;
  if (creativity < 45) return 1.5;
  if (creativity < 60) return 2;
  if (creativity < 70) return 2.5;
  if (creativity < 80) return 3;
  if (creativity < 90) return 3.5;
  return 4;
}

export function clampAlbumQuality(quality: number): number {
  return Math.round(clamp(quality, 0.5, 5) * 2) / 2;
}
