import type { GenreId, GenreNameSuggestions } from "./types";

export const NAME_SUGGESTIONS = {
  pop: {
    bandNames: [
      "霓虹来信",
      "Summer Echo",
      "失重心跳",
      "Blue Parade",
      "午夜便利店",
      "星期五逃亡",
    ],
    albumNames: [
      "城市烟花",
      "Afterglow",
      "恋爱气象站",
      "凌晨两点的彩虹",
      "发光体",
      "夏日未读",
    ],
  },
  indie: {
    bandNames: [
      "潮汐背面",
      "空房间电台",
      "迟到的候鸟",
      "North Window",
      "无声公路",
      "坏天气俱乐部",
    ],
    albumNames: [
      "窗外没有海",
      "低空飞行",
      "潮湿的星期一",
      "无人接听",
      "纸月亮",
      "我们在噪音里散步",
    ],
  },
  punk: {
    bandNames: [
      "拒绝排队",
      "No Curfew",
      "坏学生守则",
      "三分钟警报",
      "噪点过载",
      "明天再说",
    ],
    albumNames: [
      "一切正常才怪",
      "三分钟革命",
      "把规则调成静音",
      "今天不打卡",
      "烂尾青春",
      "No Apologies",
    ],
  },
  metal: {
    bandNames: [
      "黑曜纪元",
      "Iron Vein",
      "沉默重力",
      "Ash Cathedral",
      "赤夜回响",
      "霜刃",
    ],
    albumNames: [
      "熔点以下",
      "Steel Testament",
      "群山失语",
      "黑日仪式",
      "灰烬王座",
      "重力墓碑",
    ],
  },
} as const satisfies Record<GenreId, GenreNameSuggestions>;
