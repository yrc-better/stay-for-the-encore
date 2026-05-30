import type { GameEvent } from "../types";

export const EVENTS: GameEvent[] = [
  {
    id: "prologue.rehearsal_argument",
    title: "毕业演出前的排练争执",
    tags: ["prologue", "member", "songwriting"],
    priority: 100,
    once: true,
    trigger: { months: ["2027-05"], flagsNone: ["prologue.rehearsalArgumentDone"] },
    body: "主唱认为新歌副歌应该更直接，你却觉得那会毁掉整首歌的阴影感。鼓手开始烦躁，贝斯手没有表态。",
    choices: [
      {
        id: "insist_arrangement",
        label: "坚持你的编曲",
        effects: [
          { kind: "playerStat", key: "creativity", amount: 4 },
          { kind: "relationship", character: "vocal", amount: -4 },
          { kind: "playerStat", key: "stress", amount: 5 },
          { kind: "flag", key: "songwriting.playerInsisted", value: true },
          { kind: "flag", key: "prologue.rehearsalArgumentDone", value: true }
        ],
        feedback: {
          title: "间奏保住了",
          body: "你把那段刺耳的和弦又弹了一遍。主唱没有再争，但排练室的空气明显冷了下去。"
        }
      },
      {
        id: "compromise",
        label: "妥协并保留间奏",
        effects: [
          { kind: "relationship", character: "vocal", amount: 3 },
          { kind: "bandStat", key: "workQuality", amount: 1 },
          { kind: "flag", key: "prologue.rehearsalArgumentDone", value: true }
        ],
        feedback: { title: "暂时达成一致", body: "你把副歌改得更直接，只留下间奏里最锋利的两小节。" }
      }
    ]
  },
  {
    id: "career.first_livehouse_offer",
    title: "第一次 Livehouse 机会",
    tags: ["career", "livehouse"],
    priority: 70,
    once: true,
    trigger: { flagsAll: ["career.hasLivehouseOffer"], flagsNone: ["career.firstLivehouseDone"] },
    body: "一个小型 Livehouse 给了你们暖场的机会，报酬很低，但台下会有真正听独立摇滚的人。",
    choices: [
      {
        id: "accept_low_pay",
        label: "接受低报酬演出",
        effects: [
          { kind: "playerStat", key: "fame", amount: 6 },
          { kind: "bandStat", key: "fans", amount: 12 },
          { kind: "playerStat", key: "wealth", amount: 200 },
          { kind: "playerStat", key: "health", amount: -3 },
          { kind: "flag", key: "career.firstLivehouseDone", value: true }
        ],
        feedback: {
          title: "第一盏真正的灯",
          body: "台下的人不多，但他们没有聊天。第一首歌结束后，你听见有人喊了乐队名。"
        }
      },
      {
        id: "miss_offer",
        label: "暂缓演出继续打磨",
        effects: [
          { kind: "bandStat", key: "workQuality", amount: 3 },
          { kind: "counter", key: "missedOpportunities", amount: 1 },
          { kind: "flag", key: "career.firstLivehouseDone", value: true }
        ],
        feedback: { title: "机会从门缝里溜走", body: "你说现在还不是时候。没人反驳，但鼓手把鼓棒收得很用力。" }
      }
    ]
  }
];
