import type { CharacterId, MemberState, MemberStatus, MonthId } from "../types";

export const MEMBER_IDS = ["vocal", "bass", "drums"] as const satisfies readonly CharacterId[];

export const MEMBER_STATUSES = ["active", "strained", "away"] as const satisfies readonly MemberStatus[];

export const MEMBER_PROFILES: Record<
  CharacterId,
  {
    name: string;
    role: string;
    intro: string;
    initialNote: string;
  }
> = {
  vocal: {
    name: "林夏",
    role: "主唱",
    intro: "负责把旋律拉到台前，最在意一首歌是否真的有人愿意听见。",
    initialNote: "林夏把旋律拉到台前，也在等乐队证明彼此值得信任。"
  },
  bass: {
    name: "周航",
    role: "贝斯",
    intro: "像队内的秤，习惯先稳住账、节奏和所有人的重量。",
    initialNote: "周航像队内的秤，习惯先稳住所有人的重量。"
  },
  drums: {
    name: "唐野",
    role: "鼓手",
    intro: "总是最先听出大家有没有散掉，也最怕自己慢了那一拍。",
    initialNote: "唐野总是最先听出大家有没有散掉。"
  }
};

export const MEMBER_STATUS_LABELS: Record<MemberStatus, string> = {
  active: "正常",
  strained: "紧绷",
  away: "暂别"
};

export function createInitialMemberStates(month: MonthId): Record<CharacterId, MemberState> {
  return {
    vocal: { status: "active", note: MEMBER_PROFILES.vocal.initialNote, updatedAt: month },
    bass: { status: "active", note: MEMBER_PROFILES.bass.initialNote, updatedAt: month },
    drums: { status: "active", note: MEMBER_PROFILES.drums.initialNote, updatedAt: month }
  };
}
