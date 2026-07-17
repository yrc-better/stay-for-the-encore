import type { VenueContent } from "./types";

export const LEVEL_ONE_VENUES = [
  {
    id: "coastline-bar",
    level: 1,
    name: "海岸线酒吧",
    kind: "驻唱酒吧",
    district: "旧城南街",
    description:
      "舞台只比地面高两级台阶，吧台客人未必专程来看乐队，但近到能听清每一次换气。",
    difficulty: 30,
    invitationFeeRange: [1000, 1800],
    basePopularityGain: 1,
    selfHosted: {
      available: true,
      upfrontCost: 2000,
      stableRevenue: 3000,
    },
    posterAccent: "#D8754B",
  },
  {
    id: "north-city-hall",
    level: 1,
    name: "北城大学礼堂",
    kind: "校园舞台",
    district: "大学城",
    description:
      "熟悉的折叠椅、胶带和学生会灯架。观众年轻又直接，一首歌没抓住他们，下一秒就会低头看手机。",
    difficulty: 30,
    invitationFeeRange: [1200, 2200],
    basePopularityGain: 1,
    selfHosted: {
      available: true,
      upfrontCost: 2000,
      stableRevenue: 3000,
    },
    posterAccent: "#4AAE9B",
  },
  {
    id: "distortion-warehouse",
    level: 1,
    name: "失真仓库",
    kind: "小型拼盘",
    district: "东郊创意园",
    description:
      "由旧厂房改成的狭长空间，墙上贴满过期海报。台下人数不多，但大多真的在听。",
    difficulty: 30,
    invitationFeeRange: [1800, 3000],
    basePopularityGain: 1,
    selfHosted: {
      available: true,
      upfrontCost: 2000,
      stableRevenue: 3000,
    },
    posterAccent: "#8A77C8",
  },
] as const satisfies readonly VenueContent[];
