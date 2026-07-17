import type { PlayerAvatarContent } from "./types";

export const PLAYER_AVATARS = [
  {
    id: "player-neon",
    label: "霓虹短发",
    description: "利落短发与旧皮夹克，眼神里带着刚下定决心的兴奋。",
    portrait: {
      alt: "霓虹灯下身穿旧皮夹克的短发青年日系动画头像",
      futureAssetPath: "/assets/portraits/player/player-neon.webp",
      available: false,
      placeholder: {
        background: "linear-gradient(145deg, #52254a 0%, #191522 72%)",
        foreground: "#ffd6ec",
        monogram: "N",
      },
      artDirection:
        "日系动画半身头像，短黑发带洋红挑染，旧皮夹克，吉他背带从肩侧经过，后台霓虹逆光，中性气质",
    },
  },
  {
    id: "player-seafoam",
    label: "青灰长发",
    description: "安静而专注，像是会把没说完的话都写进下一段旋律。",
    portrait: {
      alt: "青灰色长发、抱着吉他的日系动画头像",
      futureAssetPath: "/assets/portraits/player/player-seafoam.webp",
      available: false,
      placeholder: {
        background: "linear-gradient(145deg, #245f60 0%, #121c24 74%)",
        foreground: "#c9fff8",
        monogram: "S",
      },
      artDirection:
        "日系动画半身头像，青灰色及肩长发，宽松深色衬衫，手扶电吉他琴颈，排练室冷光，沉静中性气质",
    },
  },
  {
    id: "player-amber",
    label: "琥珀卷发",
    description: "笑起来很有感染力，站上舞台后比台下更加耀眼。",
    portrait: {
      alt: "暖色灯光下琥珀卷发的日系动画头像",
      futureAssetPath: "/assets/portraits/player/player-amber.webp",
      available: false,
      placeholder: {
        background: "linear-gradient(145deg, #7a4222 0%, #201718 72%)",
        foreground: "#ffe1ba",
        monogram: "A",
      },
      artDirection:
        "日系动画半身头像，蓬松琥珀色卷发，复古印花T恤，笑容明亮，暖色舞台灯，中性气质",
    },
  },
  {
    id: "player-silver",
    label: "冷银碎发",
    description: "看起来不太好接近，但讨论起音色就会立刻认真起来。",
    portrait: {
      alt: "冷银碎发、戴耳钉的日系动画头像",
      futureAssetPath: "/assets/portraits/player/player-silver.webp",
      available: false,
      placeholder: {
        background: "linear-gradient(145deg, #56606f 0%, #171a20 76%)",
        foreground: "#f0f4ff",
        monogram: "V",
      },
      artDirection:
        "日系动画半身头像，冷银色碎发，黑色耳钉与高领上衣，神情锐利，金属航空箱背景，中性气质",
    },
  },
  {
    id: "player-redcap",
    label: "红帽黑发",
    description: "随身带着拨片和记歌词的便签，行动总比计划快半步。",
    portrait: {
      alt: "反戴红色鸭舌帽的黑发日系动画头像",
      futureAssetPath: "/assets/portraits/player/player-redcap.webp",
      available: false,
      placeholder: {
        background: "linear-gradient(145deg, #8a2f2b 0%, #201516 74%)",
        foreground: "#ffd5cb",
        monogram: "R",
      },
      artDirection:
        "日系动画半身头像，黑色乱发，反戴旧红色鸭舌帽，工装马甲，指间夹拨片，活泼中性气质",
    },
  },
  {
    id: "player-midnight",
    label: "午夜蓝发",
    description: "习惯先听完每个人的意见，再用一个和弦把大家拉回同一首歌。",
    portrait: {
      alt: "午夜蓝发、戴细框眼镜的日系动画头像",
      futureAssetPath: "/assets/portraits/player/player-midnight.webp",
      available: false,
      placeholder: {
        background: "linear-gradient(145deg, #273e70 0%, #121724 76%)",
        foreground: "#d9e5ff",
        monogram: "M",
      },
      artDirection:
        "日系动画半身头像，午夜蓝短发，细框眼镜，简洁黑衬衫，手拿写满和弦的笔记本，沉稳中性气质",
    },
  },
] as const satisfies readonly PlayerAvatarContent[];
