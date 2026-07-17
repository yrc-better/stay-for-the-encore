import { cloneGameState } from "./clone";
import { selectBandAttributes } from "./selectors";
import type {
  EndingReason,
  EndingSummary,
  GameState,
  Member,
  PerformanceRating,
} from "./types";

const PERFORMANCE_SCORE: Readonly<Record<PerformanceRating, number>> = {
  accident: 0,
  barelyCompleted: 1,
  steady: 2,
  crowdIgnited: 3,
  legendary: 4,
};

function endingTitle(state: GameState): string {
  const attributes = selectBandAttributes(state);
  const bestAlbum = state.releasedAlbums.reduce(
    (best, album) => Math.max(best, album.quality),
    0,
  );
  const legendaryShows = state.performanceRecords.filter(
    (show) => show.rating === "legendary",
  ).length;

  if (
    attributes.popularity >= 85 &&
    state.releasedAlbums.length >= 4 &&
    state.activeContract?.kind === "majorLabel"
  ) {
    return "商业巨星";
  }
  if (legendaryShows >= 3 || state.performanceMilestones.excellentLevel4) {
    return "现场之王";
  }
  if (attributes.musicianship >= 90) {
    return "技术标杆";
  }
  if (attributes.creativity >= 90 || bestAlbum >= 4.5) {
    return "创作名团";
  }
  if (
    (state.band.genre === "indie" || state.band.genre === "punk") &&
    bestAlbum >= 4 &&
    attributes.popularity >= 45
  ) {
    return "地下传奇";
  }
  if (
    state.calendar.completedMonths >= 180 &&
    attributes.teamSpirit >= 60 &&
    state.releasedAlbums.length >= 3
  ) {
    return "长青乐队";
  }
  if (bestAlbum >= 4 && attributes.popularity < 30) {
    return "失落天才";
  }
  if (attributes.popularity >= 45 && state.releasedAlbums.length <= 1) {
    return "昙花一现";
  }
  return "自己的声音";
}

function endingTags(state: GameState): string[] {
  const attributes = selectBandAttributes(state);
  const tags: string[] = [];

  if (attributes.teamSpirit >= 75) tags.push("五个人走到了最后");
  if (attributes.funds >= 100_000) tags.push("经营有方");
  if (state.releasedAlbums.some((album) => album.quality >= 4.5)) {
    tags.push("留下杰作");
  }
  if (state.performanceRecords.some((show) => show.rating === "legendary")) {
    tags.push("拥有传奇现场");
  }
  if (state.activeContract === null) tags.push("坚持独立");
  if (tags.length === 0) tags.push("认真活过每一个月");

  return tags.slice(0, 2);
}

function memberHeadline(member: Member): string {
  if (member.stats.belonging >= 80) {
    return member.isPlayer ? "仍愿意为下一首歌拿起吉他" : "把乐队当成了第二个家";
  }
  if (member.stats.belonging >= 50) {
    return "带着共同的记忆继续自己的音乐生活";
  }
  if (member.stats.belonging >= 20) {
    return "终于学会把分歧留在音乐里";
  }
  return "在漫长的拉扯后选择了新的方向";
}

export function buildEndingSummary(
  state: GameState,
  reason: EndingReason,
): EndingSummary {
  const representativeAlbum = [...state.releasedAlbums].sort(
    (left, right) =>
      right.quality - left.quality ||
      right.listeners - left.listeners ||
      left.releasedInMonth - right.releasedInMonth,
  )[0];
  const keyPerformance = [...state.performanceRecords].sort(
    (left, right) =>
      right.venueLevel * 10 +
        PERFORMANCE_SCORE[right.rating] -
        (left.venueLevel * 10 + PERFORMANCE_SCORE[left.rating]) ||
      left.month - right.month,
  )[0];
  const years = Math.max(1, Math.ceil(state.calendar.completedMonths / 12));
  const title = endingTitle(state);
  const albumText = representativeAlbum
    ? `代表作《${representativeAlbum.title}》最终成为人们回想这支乐队时最先提起的名字。`
    : "他们没有来得及留下正式专辑，但排练室里的声音仍留在每个人记忆里。";
  const showText = keyPerformance
    ? `${keyPerformance.title}是生涯最被反复讲起的一晚。`
    : "这段生涯没有宏大的舞台，却有许多真实的排练和选择。";

  return {
    title,
    reason,
    tags: endingTags(state),
    representativeAlbumId: representativeAlbum?.id ?? null,
    keyPerformanceId: keyPerformance?.id ?? null,
    memberSummaries: state.members.map((member) => ({
      memberId: member.id,
      name: member.name,
      role: member.role,
      headline: memberHeadline(member),
      belonging: member.stats.belonging,
    })),
    biography: `${state.band.name}共同走过了${years}年。${albumText}${showText}`,
  };
}

export function finishCareer(
  state: GameState,
  reason: EndingReason,
): GameState {
  const nextState = cloneGameState(state);
  nextState.status = "ended";
  nextState.endingReason = reason;
  nextState.endingSummary = buildEndingSummary(nextState, reason);
  nextState.history.push({
    id: `ending-${nextState.calendar.completedMonths}-${reason}`,
    month: nextState.calendar.completedMonths,
    type: "milestone",
    title: nextState.endingSummary.title,
    description: nextState.endingSummary.biography,
  });
  return nextState;
}
