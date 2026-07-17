import type {
  EventContent,
  EventEffect,
  EventOutcome,
  EventPool,
  GenreId,
} from "./types";

const BASE_EVENTS = [
  {
    id: "late-night-demo",
    pool: "member",
    title: "凌晨两点的新段落",
    text: "一名队友在群里发来一段刚录好的旋律。它还很粗糙，但所有人都没有立刻退出聊天。",
    minMonth: 3,
    choices: [
      {
        id: "listen-together",
        label: "约到排练室听完整版本",
        hint: "花时间认真回应队友的想法。",
        outcomes: [
          {
            id: "found-hook",
            weight: 2,
            tone: "positive",
            title: "抓住了一段好旋律",
            text: "原本零散的想法被拼成了能继续发展的段落。",
            effects: [
              {
                type: "memberStat",
                target: "all",
                stat: "belonging",
                amount: 1,
              },
            ],
          },
          {
            id: "still-rough",
            weight: 1,
            tone: "neutral",
            title: "还需要再放一放",
            text: "这次没有写成歌，但大家记住了那段旋律。",
            effects: [],
          },
        ],
      },
      {
        id: "reply-tomorrow",
        label: "明天再认真回复",
        hint: "今晚先保留精力。",
        outcomes: [
          {
            id: "message-sinks",
            weight: 1,
            tone: "negative",
            title: "消息沉了下去",
            text: "第二天群里聊起了别的事情，那段旋律也没有人再提。",
            effects: [
              {
                type: "memberStat",
                target: "randomBandmate",
                stat: "belonging",
                amount: -1,
              },
            ],
          },
          {
            id: "nothing-happens",
            weight: 2,
            tone: "neutral",
            title: "普通的一晚",
            text: "没有额外影响。大家都需要自己的休息时间。",
            effects: [],
          },
        ],
      },
    ],
  },
  {
    id: "broken-cable",
    pool: "equipment",
    title: "接触不良的线材",
    text: "排练时音箱突然安静下来。检查一圈后，问题只是那根用了很久的连接线。",
    minMonth: 3,
    choices: [
      {
        id: "replace",
        label: "换一套可靠的线材",
        hint: "花一点钱解决问题。",
        outcomes: [
          {
            id: "clean-signal",
            weight: 1,
            tone: "positive",
            title: "声音重新稳定下来",
            text: "新的线材没有惊喜，但也不再让人担心。",
            effects: [{ type: "funds", amount: -500 }],
          },
        ],
      },
      {
        id: "repair",
        label: "先自己修好继续用",
        hint: "可能省钱，也可能继续折腾。",
        outcomes: [
          {
            id: "repair-success",
            weight: 2,
            tone: "positive",
            title: "临时修好了",
            text: "胶带和焊点意外地撑住了整个排练。",
            effects: [],
          },
          {
            id: "repair-drains",
            weight: 1,
            tone: "negative",
            title: "半天耗在线材上",
            text: "最终还是修好了，只是你已经没有心情再弹一遍。",
            effects: [
              {
                type: "status",
                target: "leader",
                direction: "worsen",
                steps: 1,
              },
            ],
          },
          {
            id: "ordinary-spare-cable",
            weight: 1,
            tone: "neutral",
            title: "找到了一根备用线",
            text: "修理没有派上用场，设备箱底的一根旧备用线先解决了问题。",
            effects: [],
          },
        ],
      },
    ],
  },
  {
    id: "short-video-comment",
    pool: "publicOpinion",
    title: "突然变多的评论",
    text: "一段排练片段被陌生账号转发。播放量不算夸张，但评论区第一次出现了完全不认识的人。",
    minMonth: 3,
    choices: [
      {
        id: "reply",
        label: "认真回复评论",
        hint: "把这次偶然曝光接住。",
        outcomes: [
          {
            id: "new-listeners",
            weight: 2,
            tone: "positive",
            title: "有人记住了乐队名",
            text: "几名观众顺着主页听完了其他片段。",
            effects: [
              {
                type: "basePopularity",
                amount: 1,
                countsAsPublicActivity: true,
              },
            ],
          },
          {
            id: "quiet-replies",
            weight: 1,
            tone: "neutral",
            title: "热度很快过去",
            text: "你回复了每条留言，但这次传播没有继续扩大。",
            effects: [],
          },
        ],
      },
      {
        id: "leave-it",
        label: "让它自然发展",
        hint: "不消耗额外精力。",
        outcomes: [
          {
            id: "no-follow-up",
            weight: 1,
            tone: "neutral",
            title: "一阵短暂的涟漪",
            text: "几天后，推荐页又被新的内容覆盖。",
            effects: [],
          },
          {
            id: "missed-comment-window",
            weight: 1,
            tone: "negative",
            title: "误解留在了评论区",
            text: "一条明显的错误信息没有得到回应，后来的人把它当成了乐队自己的说法。",
            effects: [
              {
                type: "memberStat",
                target: "leader",
                stat: "heat",
                amount: -1,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "rainy-rehearsal",
    pool: "life",
    title: "暴雨中的排练日",
    text: "整座城市都在下暴雨。群里有人问，今天还去不去排练室。",
    minMonth: 3,
    choices: [
      {
        id: "go",
        label: "照常集合",
        hint: "维持约定，但大家可能更疲惫。",
        outcomes: [
          {
            id: "five-arrive",
            weight: 1,
            tone: "positive",
            title: "五个人都到了",
            text: "湿透的鞋摆在门口，这次排练却比平时更专注。",
            effects: [
              {
                type: "memberStat",
                target: "all",
                stat: "belonging",
                amount: 1,
              },
            ],
          },
          {
            id: "drained",
            weight: 1,
            tone: "negative",
            title: "路途消耗了精力",
            text: "所有人都到了，但这不是一次轻松的集合。",
            effects: [
              {
                type: "status",
                target: "all",
                direction: "worsen",
                steps: 1,
              },
            ],
          },
        ],
      },
      {
        id: "cancel",
        label: "取消这次集合",
        hint: "安全第一，可能没有任何影响。",
        outcomes: [
          {
            id: "safe-night",
            weight: 1,
            tone: "neutral",
            title: "各自在家听雨",
            text: "没有数值变化。不是每个空下来的晚上都必须发生故事。",
            effects: [],
          },
        ],
      },
    ],
  },
  {
    id: "album-opinion-gap",
    pool: "album",
    title: "关于专辑方向的分歧",
    text: "反复听完当前版本后，两名成员对下一步的方向给出了完全不同的意见。",
    minMonth: 3,
    requiresActiveAlbum: true,
    choices: [
      {
        id: "full-discussion",
        label: "把今晚留给讨论",
        hint: "尝试让每个人把意见说完。",
        outcomes: [
          {
            id: "shared-language",
            weight: 2,
            tone: "positive",
            title: "找到共同语言",
            text: "方案没有完全偏向任何一方，但所有人都愿意继续做下去。",
            effects: [
              {
                type: "memberStat",
                target: "all",
                stat: "belonging",
                amount: 1,
              },
              {
                type: "storyTag",
                operation: "add",
                tag: "共同创作",
                target: "all",
              },
            ],
          },
          {
            id: "long-discussion",
            weight: 1,
            tone: "neutral",
            title: "只说清了一部分",
            text: "至少争论没有继续积压。专辑方向仍要边做边找。",
            effects: [],
          },
        ],
      },
      {
        id: "leader-decides",
        label: "由队长直接决定",
        hint: "快速推进，也可能留下情绪。",
        outcomes: [
          {
            id: "decision-accepted",
            weight: 1,
            tone: "neutral",
            title: "方案被暂时接受",
            text: "大家继续工作，没有人再公开反对。",
            effects: [],
          },
          {
            id: "member-disappointed",
            weight: 1,
            tone: "negative",
            title: "有人不再说话",
            text: "决定执行了，但那名成员在之后的讨论里明显沉默下来。",
            effects: [
              {
                type: "memberStat",
                target: "randomBandmate",
                stat: "belonging",
                amount: -2,
              },
              {
                type: "storyTag",
                operation: "add",
                tag: "创作分歧",
                target: "randomBandmate",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "empty-stage-photo",
    pool: "performance",
    title: "空舞台的照片",
    text: "曾经合作过的场地方发来一张刚搭好的空舞台照片，问你们最近有没有准备新的现场。",
    minMonth: 3,
    choices: [
      {
        id: "say-yes",
        label: "回复正在准备",
        hint: "保持联系，未来可能出现邀请。",
        outcomes: [
          {
            id: "remembered",
            weight: 1,
            tone: "positive",
            title: "名字留在了排期表旁边",
            text: "对方没有立即承诺日期，但表示有合适的拼盘会先问你们。",
            effects: [
              {
                type: "storyTag",
                operation: "add",
                tag: "场地联系人",
                target: "leader",
              },
            ],
          },
        ],
      },
      {
        id: "honest",
        label: "说最近还在调整",
        hint: "不夸大进度。",
        outcomes: [
          {
            id: "no-pressure",
            weight: 1,
            tone: "neutral",
            title: "一次普通的问候",
            text: "对方回了句“准备好再来”，事情就停在这里。",
            effects: [],
          },
          {
            id: "venue-contact-cools",
            weight: 1,
            tone: "negative",
            title: "这次回复显得太疏远",
            text: "对方没有继续追问，之后的排期消息也不再主动发来。",
            effects: [
              {
                type: "storyTag",
                operation: "add",
                tag: "场地联系降温",
                target: "leader",
              },
            ],
          },
        ],
      },
    ],
  },
] as const satisfies readonly EventContent[];

type SeedOutcome = readonly [
  title: string,
  text: string,
  effects?: readonly EventEffect[],
];

interface ConstructiveChoiceSeed {
  label: string;
  hint: string;
  positive: SeedOutcome;
  neutral: SeedOutcome;
}

interface RiskyChoiceSeed {
  label: string;
  hint: string;
  negative: SeedOutcome;
  neutral: SeedOutcome;
}

interface EventSeed {
  id: string;
  pool: EventPool;
  title: string;
  text: string;
  genres?: readonly GenreId[];
  minMonth?: number;
  requiresMemberIds?: readonly string[];
  requiresActiveAlbum?: boolean;
  once?: boolean;
  cooldownMonths?: number;
  choices: readonly [ConstructiveChoiceSeed, RiskyChoiceSeed];
}

function createOutcome(
  id: string,
  tone: EventOutcome["tone"],
  weight: number,
  seed: SeedOutcome,
): EventOutcome {
  return {
    id,
    weight,
    tone,
    title: seed[0],
    text: seed[1],
    effects: seed[2] ?? [],
  };
}

function createCatalogEvent(seed: EventSeed): EventContent {
  const [constructive, risky] = seed.choices;

  return {
    id: seed.id,
    pool: seed.pool,
    title: seed.title,
    text: seed.text,
    ...(seed.genres ? { genres: seed.genres } : {}),
    ...(seed.minMonth ? { minMonth: seed.minMonth } : {}),
    ...(seed.requiresMemberIds
      ? { requiresMemberIds: seed.requiresMemberIds }
      : {}),
    ...(seed.requiresActiveAlbum
      ? { requiresActiveAlbum: seed.requiresActiveAlbum }
      : {}),
    ...(seed.once !== undefined ? { once: seed.once } : {}),
    ...(seed.cooldownMonths !== undefined
      ? { cooldownMonths: seed.cooldownMonths }
      : {}),
    choices: [
      {
        id: `${seed.id}-constructive`,
        label: constructive.label,
        hint: constructive.hint,
        outcomes: [
          createOutcome(
            `${seed.id}-constructive-positive`,
            "positive",
            2,
            constructive.positive,
          ),
          createOutcome(
            `${seed.id}-constructive-neutral`,
            "neutral",
            1,
            constructive.neutral,
          ),
        ],
      },
      {
        id: `${seed.id}-risky`,
        label: risky.label,
        hint: risky.hint,
        outcomes: [
          createOutcome(
            `${seed.id}-risky-negative`,
            "negative",
            1,
            risky.negative,
          ),
          createOutcome(
            `${seed.id}-risky-neutral`,
            "neutral",
            2,
            risky.neutral,
          ),
        ],
      },
    ],
  };
}

const EVENT_SEEDS = [
  {
    id: "extra-take-at-midnight",
    pool: "member",
    title: "最后一遍之后",
    text: "主音吉他手听完录音后指出一个很小的拍点问题。那份近乎完美主义的认真，也让已经收拾好东西的人停下了脚步。",
    minMonth: 4,
    choices: [
      {
        label: "陪他把细节磨完",
        hint: "认真回应这份可靠和坚持。",
        positive: [
          "最后一遍真的更好",
          "新的录音没有明显炫技，却让每个重音都落在了该在的位置。",
          [
            {
              type: "memberStat",
              target: "leadGuitar",
              stat: "professional",
              amount: 1,
            },
            {
              type: "memberStat",
              target: "leadGuitar",
              stat: "belonging",
              amount: 1,
            },
          ],
        ],
        neutral: [
          "差别只有你们听得出来",
          "前后两个版本都被保留下来，至少没有人觉得时间被浪费。",
        ],
      },
      {
        label: "说明天再处理",
        hint: "先结束今晚的工作。",
        negative: [
          "认真被当成了挑剔",
          "那名成员没有争辩，只是独自把设备收得比平时更慢。",
          [
            {
              type: "memberStat",
              target: "leadGuitar",
              stat: "belonging",
              amount: -1,
            },
          ],
        ],
        neutral: [
          "问题留到了明天",
          "第二天大家重新听了一遍，决定暂时保留现有版本。",
        ],
      },
    ],
  },
  {
    id: "front-row-dare",
    pool: "member",
    title: "写在排练单上的冒险",
    text: "鼓手提议在下一次现场加入一段没有固定小节数的互动。直率又大胆的想法，让排练室突然像亮起了舞台灯。",
    minMonth: 5,
    choices: [
      {
        label: "先设计几个安全信号",
        hint: "保留冲劲，也给全员留出配合空间。",
        positive: [
          "冒险有了共同暗号",
          "几次练习后，大家已经能从一次抬手判断下一拍该往哪里走。",
          [
            {
              type: "memberStat",
              target: "drums",
              stat: "performance",
              amount: 1,
            },
            {
              type: "storyTag",
              operation: "add",
              tag: "现场暗号",
              target: "all",
            },
          ],
        ],
        neutral: [
          "先记在演出计划里",
          "这段设计还不够成熟，但它成为了一项值得继续尝试的方案。",
        ],
      },
      {
        label: "到现场再凭感觉",
        hint: "完全相信临场冲动。",
        negative: [
          "排练先乱成了一团",
          "每个人都在等待不同的信号，最后只能从头数拍。",
          [
            {
              type: "status",
              target: "all",
              direction: "worsen",
              steps: 1,
            },
          ],
        ],
        neutral: [
          "冲动暂时没有落地",
          "讨论很热闹，真正排起来时却又回到了原来的版本。",
        ],
      },
    ],
  },
  {
    id: "bass-keeps-the-room",
    pool: "member",
    title: "始终没有停下的低音",
    text: "一次争论让排练几乎中断，贝斯手却一直用最简单的低音维持着速度。那份随和和沉稳，给所有人留了重新加入的台阶。",
    minMonth: 4,
    choices: [
      {
        label: "从低音重新开始",
        hint: "承认有人一直在守住乐队。",
        positive: [
          "五个人重新接上了同一拍",
          "没人再追究刚才是谁先说重了话，音乐替大家完成了和解。",
          [
            {
              type: "memberStat",
              target: "bass",
              stat: "belonging",
              amount: 2,
            },
            {
              type: "storyTag",
              operation: "add",
              tag: "守住节拍",
              target: "bass",
            },
          ],
        ],
        neutral: [
          "排练得以继续",
          "争论没有真正解决，但至少这次集合没有提前散场。",
        ],
      },
      {
        label: "先暂停排练",
        hint: "让所有人各自冷静。",
        negative: [
          "维持节拍的人最先失望",
          "贝斯声停下后，排练室一下子变得比争论时更安静。",
          [
            {
              type: "memberStat",
              target: "bass",
              stat: "belonging",
              amount: -1,
            },
          ],
        ],
        neutral: [
          "今晚到此为止",
          "大家按时离开，没有继续争吵，也没有把话说开。",
        ],
      },
    ],
  },
  {
    id: "synth-color-dispute",
    pool: "member",
    title: "两种完全不同的音色",
    text: "键盘手为同一段歌准备了两个版本，一个细致克制，一个充满个人主张。两种颜色都成立，谁也不愿先删掉。",
    minMonth: 5,
    choices: [
      {
        label: "把两个版本都完整演一遍",
        hint: "用实际声音代替抽象争论。",
        positive: [
          "第三种颜色出现了",
          "两套音色被重新拆开组合，反而形成了谁都没预想到的层次。",
          [
            {
              type: "memberStat",
              target: "keyboard",
              stat: "creation",
              amount: 1,
            },
            {
              type: "memberStat",
              target: "keyboard",
              stat: "belonging",
              amount: 1,
            },
          ],
        ],
        neutral: [
          "各有适合的位置",
          "大家决定暂时保留两个版本，等更完整的编曲再选择。",
        ],
      },
      {
        label: "直接选更安全的版本",
        hint: "快速结束讨论。",
        negative: [
          "另一个版本被无声关闭",
          "键盘手保存了工程，却没有再分享后续修改。",
          [
            {
              type: "memberStat",
              target: "keyboard",
              stat: "belonging",
              amount: -2,
            },
            {
              type: "storyTag",
              operation: "add",
              tag: "表达受阻",
              target: "keyboard",
            },
          ],
        ],
        neutral: [
          "先采用稳妥方案",
          "被选中的音色完成了任务，另一个版本留在了工程文件里。",
        ],
      },
    ],
  },
  {
    id: "melodic-bass-rewrite",
    pool: "album",
    title: "低音线不想只做背景",
    text: "贝斯手发来一版重写的低音线。它像第二条旋律一样穿过整首歌，创作欲和对听众节奏的敏感都很明显。",
    minMonth: 4,
    requiresActiveAlbum: true,
    choices: [
      {
        label: "让全员围绕它重排",
        hint: "给新的创作线索一次完整机会。",
        positive: [
          "歌曲换了一种走路方式",
          "原本平直的段落有了新的牵引力，其他乐器也找到了更多空间。",
          [
            {
              type: "memberStat",
              target: "bass",
              stat: "creation",
              amount: 1,
            },
            {
              type: "storyTag",
              operation: "add",
              tag: "旋律低音",
              target: "bass",
            },
          ],
        ],
        neutral: [
          "保留在备选工程里",
          "新版还没有取代原稿，但所有人都同意下一次继续比较。",
        ],
      },
      {
        label: "维持原来的低音",
        hint: "不改动已经成形的安排。",
        negative: [
          "主动分享变得谨慎",
          "贝斯手删掉了群里的试听链接，之后也很少再提前发想法。",
          [
            {
              type: "memberStat",
              target: "bass",
              stat: "belonging",
              amount: -1,
            },
          ],
        ],
        neutral: [
          "原版继续推进",
          "这次调整没有采用，专辑方向也没有因此改变。",
        ],
      },
    ],
  },
  {
    id: "click-track-debate",
    pool: "album",
    title: "节拍器该不该留下",
    text: "录音前，鼓手提出先把容易漂移的段落逐小节标记。自律的方案很可靠，却也有人担心音乐因此失去呼吸。",
    minMonth: 5,
    requiresActiveAlbum: true,
    choices: [
      {
        label: "精确段落，放开过门",
        hint: "在纪律和现场感之间找平衡。",
        positive: [
          "精确没有压住情绪",
          "主段落变得稳固，过门仍保留了每次演奏不同的推动感。",
          [
            {
              type: "memberStat",
              target: "drums",
              stat: "professional",
              amount: 1,
            },
            {
              type: "memberStat",
              target: "all",
              stat: "belonging",
              amount: 1,
            },
          ],
        ],
        neutral: [
          "做了两套录音计划",
          "是否使用节拍器被留到正式录音当天再决定。",
        ],
      },
      {
        label: "完全跟着感觉录",
        hint: "把一致性交给临场状态。",
        negative: [
          "返工从第二遍开始",
          "几个本来能避免的速度变化，让所有人又录了一轮。",
          [
            {
              type: "status",
              target: "all",
              direction: "worsen",
              steps: 1,
            },
          ],
        ],
        neutral: [
          "第一遍已经够用",
          "录音没有特别整齐，但也没有出现必须修正的问题。",
        ],
      },
    ],
  },
  {
    id: "synth-layer-ledger",
    pool: "album",
    title: "写满音色参数的清单",
    text: "键盘手把每首歌的音色、进入位置和备份方案整理成一张清单。职业化的细致让混乱的工程第一次显得可以管理。",
    minMonth: 6,
    requiresActiveAlbum: true,
    choices: [
      {
        label: "按清单做一次全盘检查",
        hint: "把细节工作正式纳入制作流程。",
        positive: [
          "遗漏在录音前被发现",
          "几处音量和音色冲突提前得到处理，之后的排练顺畅了许多。",
          [
            {
              type: "memberStat",
              target: "keyboard",
              stat: "professional",
              amount: 1,
            },
            {
              type: "storyTag",
              operation: "add",
              tag: "制作清单",
              target: "all",
            },
          ],
        ],
        neutral: [
          "清单成为共同参考",
          "没有发现严重问题，但所有人终于使用同一种命名方式保存文件。",
        ],
      },
      {
        label: "先录起来再说",
        hint: "避免把时间耗在表格上。",
        negative: [
          "旧版本覆盖了新音色",
          "一个没有标记的文件让半天调整全部重来。",
          [
            {
              type: "status",
              target: "keyboard",
              direction: "worsen",
              steps: 1,
            },
          ],
        ],
        neutral: [
          "混乱暂时没有出事",
          "大家各自记住了自己的设置，至少今天还能继续。",
        ],
      },
    ],
  },
  {
    id: "old-chorus-rewrite",
    pool: "album",
    title: "旧副歌里的毕业夏天",
    text: "有人翻出乐队刚成立时写下的副歌。念旧的人舍不得改，善于倾听的人则问，这些年之后大家还想不想唱同一句话。",
    minMonth: 12,
    requiresActiveAlbum: true,
    choices: [
      {
        label: "每个人写下现在的答案",
        hint: "让共同记忆继续生长。",
        positive: [
          "旧旋律装进了新的生活",
          "副歌仍然能被认出，但五个人都在里面留下了现在的自己。",
          [
            {
              type: "memberStat",
              target: "all",
              stat: "creation",
              amount: 1,
            },
            {
              type: "memberStat",
              target: "all",
              stat: "belonging",
              amount: 1,
            },
          ],
        ],
        neutral: [
          "旧稿被完整存档",
          "这次没有改出满意版本，大家决定先尊重当时的样子。",
        ],
      },
      {
        label: "原封不动放进专辑",
        hint: "把怀旧当成最终答案。",
        negative: [
          "回忆没能替代现在",
          "有人唱着熟悉的词，却觉得自己只是被要求回到过去。",
          [
            {
              type: "memberStat",
              target: "randomBandmate",
              stat: "belonging",
              amount: -2,
            },
          ],
        ],
        neutral: [
          "旧副歌依然成立",
          "它没有带来新的方向，但也没有人要求把它删除。",
        ],
      },
    ],
  },
  {
    id: "compressed-soundcheck",
    pool: "performance",
    title: "只剩十分钟的调音",
    text: "前一支乐队延误了换场，你们只剩十分钟。有人沉稳地列出最必要的检查，也有人想把整套流程硬塞进去。",
    minMonth: 6,
    choices: [
      {
        label: "只检查核心信号",
        hint: "相信职业化的优先级判断。",
        positive: [
          "十分钟足够解决关键问题",
          "所有人都听清了最重要的声部，剩下的细节留给现场适应。",
          [
            {
              type: "memberStat",
              target: "all",
              stat: "professional",
              amount: 1,
            },
            {
              type: "storyTag",
              operation: "add",
              tag: "快速换场",
              target: "all",
            },
          ],
        ],
        neutral: [
          "勉强完成基础检查",
          "没有多余时间试错，但舞台至少能正常发声。",
        ],
      },
      {
        label: "照原流程全部走完",
        hint: "试着在有限时间里不做取舍。",
        negative: [
          "开场在催促中开始",
          "最后几项检查被强行打断，所有人都带着紧张走上舞台。",
          [
            {
              type: "status",
              target: "all",
              direction: "worsen",
              steps: 1,
            },
          ],
        ],
        neutral: [
          "主办方又挤出几分钟",
          "流程完成了大半，代价只是所有人来不及在后台安静一下。",
        ],
      },
    ],
  },
  {
    id: "encore-without-rehearsal",
    pool: "performance",
    title: "没有排练过的返场",
    text: "演出方案会上，鼓手提出准备一首只在观众真正要求时才演的返场。这个大胆想法很有舞台感，也可能让结尾失控。",
    minMonth: 8,
    choices: [
      {
        label: "排一个简短返场版本",
        hint: "为冲动准备可靠的落点。",
        positive: [
          "返场成了隐藏惊喜",
          "短版本保留了爆发力，也让每个人都知道该在什么时候结束。",
          [
            {
              type: "memberStat",
              target: "drums",
              stat: "performance",
              amount: 1,
            },
            {
              type: "memberStat",
              target: "all",
              stat: "belonging",
              amount: 1,
            },
          ],
        ],
        neutral: [
          "返场列入备用歌单",
          "大家没有在近期使用它，但计划已经足够清楚。",
        ],
      },
      {
        label: "真到那时再即兴",
        hint: "把结尾完全交给现场。",
        negative: [
          "最后一个重拍没有对齐",
          "想象中的爆发变成了互相等待，排练室里先出现了一次尴尬收尾。",
          [
            {
              type: "memberStat",
              target: "all",
              stat: "performance",
              amount: -1,
            },
          ],
        ],
        neutral: [
          "没人要求返场",
          "冒险方案暂时没有用上，也就没有机会暴露问题。",
        ],
      },
    ],
  },
  {
    id: "failed-click-rehearsal",
    pool: "performance",
    title: "耳返里的节拍突然消失",
    text: "整场连排进行到最复杂的一首歌时，耳返节拍突然中断。好奇的人想查清原因，可靠的人已经开始用动作重新给拍。",
    minMonth: 7,
    choices: [
      {
        label: "练习无节拍器应急版本",
        hint: "把设备故障变成团队训练。",
        positive: [
          "呼吸代替了电子节拍",
          "几轮练习后，五个人已经能靠动作和声音重新汇合。",
          [
            {
              type: "memberStat",
              target: "all",
              stat: "professional",
              amount: 1,
            },
            {
              type: "storyTag",
              operation: "add",
              tag: "无节拍应急",
              target: "all",
            },
          ],
        ],
        neutral: [
          "备用节拍器接管了排练",
          "故障很快解决，应急方案只练了开头几小节。",
        ],
      },
      {
        label: "修好设备后从头来",
        hint: "依赖原有技术方案。",
        negative: [
          "等待消耗了整晚状态",
          "故障排除时，大家已经很难找回刚才的集中度。",
          [
            {
              type: "status",
              target: "all",
              direction: "worsen",
              steps: 1,
            },
          ],
        ],
        neutral: [
          "只是接口松动",
          "重新插好线后排练继续，没有人再提应急方案。",
        ],
      },
    ],
  },
  {
    id: "silent-front-row",
    pool: "performance",
    title: "安静得过分的第一排",
    text: "现场复盘时，大家都注意到第一排有几个人始终没有表情。有人敏感地反复猜测原因，也有人主张直接看完整反馈。",
    minMonth: 8,
    choices: [
      {
        label: "查看整场录像再判断",
        hint: "用更多信息理解观众反应。",
        positive: [
          "安静不等于没有投入",
          "录像里那几个人从头到尾都在认真听，散场后还拍下了歌单。",
          [
            {
              type: "memberStat",
              target: "all",
              stat: "belonging",
              amount: 1,
            },
            {
              type: "basePopularity",
              amount: 1,
              countsAsPublicActivity: true,
            },
          ],
        ],
        neutral: [
          "观众反应本来就不相同",
          "录像没有给出明确答案，大家决定不再只盯着第一排。",
        ],
      },
      {
        label: "立刻删掉最慢的歌",
        hint: "根据一个局部印象快速改歌单。",
        negative: [
          "复盘变成了自我否定",
          "一个没有证实的猜测让排练计划整体重做，士气也跟着下降。",
          [
            {
              type: "memberStat",
              target: "randomBandmate",
              stat: "belonging",
              amount: -1,
            },
            {
              type: "status",
              target: "leader",
              direction: "worsen",
              steps: 1,
            },
          ],
        ],
        neutral: [
          "歌单只做了小幅调整",
          "被担心的歌曲仍然保留，只是暂时换了演出顺序。",
        ],
      },
    ],
  },
  {
    id: "pedalboard-labels",
    pool: "equipment",
    title: "贴满编号的效果器板",
    text: "排练结束后，有人建议把效果器、电源和备用线全部编号。细致的职业习惯看起来有些繁琐，却能减少台上出错。",
    minMonth: 5,
    choices: [
      {
        label: "一起整理并拍下接线图",
        hint: "用少量耗材换取可靠流程。",
        positive: [
          "故障点一眼就能找到",
          "新的编号和照片让每个人都能在几分钟内恢复接线。",
          [
            { type: "funds", amount: -300 },
            {
              type: "storyTag",
              operation: "add",
              tag: "设备编号",
              target: "leader",
            },
          ],
        ],
        neutral: [
          "设备看起来整齐了一些",
          "今晚没有发现问题，但接线图被保存在了所有人的手机里。",
        ],
      },
      {
        label: "保持熟悉的摆法",
        hint: "不为整理投入额外时间。",
        negative: [
          "一根线接回了错误接口",
          "下一次排练开场前，大家花了很久才找到没有声音的原因。",
          [
            {
              type: "status",
              target: "leader",
              direction: "worsen",
              steps: 1,
            },
          ],
        ],
        neutral: [
          "熟悉的摆法仍然有效",
          "设备没有再出问题，整理计划也就暂时搁置。",
        ],
      },
    ],
  },
  {
    id: "borrowed-vintage-amp",
    pool: "equipment",
    title: "借来的老音箱",
    text: "朋友愿意借出一台很有年代感的音箱。它的声音充满个性，也有人好奇那种不稳定是否反而能带来灵感。",
    minMonth: 8,
    choices: [
      {
        label: "先在排练室完整试用",
        hint: "在可控环境里探索陌生设备。",
        positive: [
          "旧机器给出新的质感",
          "一段原本普通的旋律，因为音箱的颗粒感有了新的方向。",
          [
            {
              type: "memberStat",
              target: "leader",
              stat: "creation",
              amount: 1,
            },
            {
              type: "storyTag",
              operation: "add",
              tag: "老音箱灵感",
              target: "leader",
            },
          ],
        ],
        neutral: [
          "声音特别但不适合当前曲目",
          "大家认真试过一轮，最后还是接回熟悉的设备。",
        ],
      },
      {
        label: "直接带去下一次现场",
        hint: "用正式场合检验未知状态。",
        negative: [
          "音量在关键处突然衰减",
          "老机器的脾气没有给任何预告，排练计划也被迫中断。",
          [
            {
              type: "status",
              target: "leader",
              direction: "worsen",
              steps: 1,
            },
          ],
        ],
        neutral: [
          "它撑过了整套流程",
          "声音没有出错，也没有比现有设备更让人难忘。",
        ],
      },
    ],
  },
  {
    id: "backup-synth-patches",
    pool: "equipment",
    title: "消失过一次的音色",
    text: "键盘重启后，一组重要音色没有自动出现。细致的人主张立刻做多份备份，有主见的人则想趁机重做整个音色库。",
    minMonth: 6,
    choices: [
      {
        label: "先恢复并建立备份",
        hint: "确保现有声音随时可以重建。",
        positive: [
          "所有音色有了第二份生命",
          "参数和文件被分别保存，即使更换设备也能快速恢复。",
          [
            {
              type: "memberStat",
              target: "keyboard",
              stat: "professional",
              amount: 1,
            },
            {
              type: "storyTag",
              operation: "add",
              tag: "音色备份",
              target: "keyboard",
            },
          ],
        ],
        neutral: [
          "丢失的只是一个旧版本",
          "主要音色都还在，备份工作留到了下次整理。",
        ],
      },
      {
        label: "直接从零重做",
        hint: "把意外当成彻底更新的机会。",
        negative: [
          "新旧音色都没赶上排练",
          "参数越调越远，原本能用的版本也没有及时恢复。",
          [
            {
              type: "status",
              target: "keyboard",
              direction: "worsen",
              steps: 1,
            },
          ],
        ],
        neutral: [
          "重做版本勉强可用",
          "它与原来的声音不同，但暂时没有影响整首歌。",
        ],
      },
    ],
  },
  {
    id: "bass-strap-failure",
    pool: "equipment",
    title: "松动的背带扣",
    text: "贝斯背带在排练中突然滑开。人没有受伤，但那一下让所有人意识到小配件也可能决定一场演出。",
    minMonth: 5,
    choices: [
      {
        label: "更换锁扣并检查全员设备",
        hint: "支付小额费用排除同类风险。",
        positive: [
          "隐患在上台前被清掉",
          "所有背带和支架都重新固定，贝斯手也恢复了大幅移动的信心。",
          [
            { type: "funds", amount: -600 },
            {
              type: "memberStat",
              target: "bass",
              stat: "performance",
              amount: 1,
            },
          ],
        ],
        neutral: [
          "只需要拧紧一个螺丝",
          "检查没有发现其他问题，这次意外很快过去。",
        ],
      },
      {
        label: "用胶带临时固定",
        hint: "先不增加额外开销。",
        negative: [
          "注意力一直留在肩上",
          "背带没有再次脱落，贝斯手却整晚都不敢完全投入演奏。",
          [
            {
              type: "memberStat",
              target: "bass",
              stat: "performance",
              amount: -1,
            },
          ],
        ],
        neutral: [
          "临时方案撑住了",
          "胶带没有松开，正式更换仍然被写在待办事项里。",
        ],
      },
    ],
  },
  {
    id: "wrong-genre-label",
    pool: "publicOpinion",
    title: "被贴错的风格标签",
    text: "一个本地音乐账号介绍你们时用了完全不准确的风格标签。队里有主见的人想立刻纠正，也有人担心公开争论会盖过音乐。",
    minMonth: 6,
    choices: [
      {
        label: "友好补充自己的风格说明",
        hint: "说明立场，但不把对方变成敌人。",
        positive: [
          "纠正变成了一次好介绍",
          "账号更新了文字，还把你们的自我描述完整放进了评论区。",
          [
            {
              type: "basePopularity",
              amount: 1,
              countsAsPublicActivity: true,
            },
            {
              type: "storyTag",
              operation: "add",
              tag: "清晰自述",
              target: "leader",
            },
          ],
        ],
        neutral: [
          "标签得到更正",
          "对方很快修改了内容，这次误会没有继续扩散。",
        ],
      },
      {
        label: "发布一条强硬反驳",
        hint: "用最直接的方式夺回定义权。",
        negative: [
          "争论比歌曲传播得更远",
          "围观者记住了那场口角，却很少有人点进主页听完整作品。",
          [
            {
              type: "basePopularity",
              amount: -1,
              countsAsPublicActivity: true,
            },
            {
              type: "storyTag",
              operation: "add",
              tag: "标签争议",
              target: "leader",
            },
          ],
        ],
        neutral: [
          "双方各自保留说法",
          "讨论很快被新的消息覆盖，风格标签仍然没有统一。",
        ],
      },
    ],
  },
  {
    id: "fan-cover-video",
    pool: "publicOpinion",
    title: "陌生人的翻奏视频",
    text: "有人上传了你们作品的翻奏。视频技巧并不完美，却能看出对方认真听过每个段落，熟悉网络传播的人已经开始想怎样回应。",
    minMonth: 10,
    choices: [
      {
        label: "转发并写一段感谢",
        hint: "让听众知道他们的投入被看见。",
        positive: [
          "一次翻奏带来了更多翻奏",
          "评论区开始交换谱子和音色，作品第一次像离开了乐队自己生长。",
          [
            {
              type: "basePopularity",
              amount: 2,
              countsAsPublicActivity: true,
            },
            {
              type: "memberStat",
              target: "all",
              stat: "heat",
              amount: 1,
            },
          ],
        ],
        neutral: [
          "对方认真回复了感谢",
          "传播没有继续扩大，但那名听众表示会来下一次现场。",
        ],
      },
      {
        label: "指出演奏里的错误",
        hint: "把准确性放在鼓励之前。",
        negative: [
          "热情被一条回复浇灭",
          "视频很快被设为仅自己可见，评论区也停止了讨论。",
          [
            {
              type: "memberStat",
              target: "leader",
              stat: "heat",
              amount: -1,
            },
          ],
        ],
        neutral: [
          "对方接受了修改建议",
          "视频重新上传，但只在很小的圈子里继续流传。",
        ],
      },
    ],
  },
  {
    id: "one-star-review",
    pool: "publicOpinion",
    title: "只有一颗星的长评",
    text: "一个新出现的长评几乎否定了整张作品。敏感的人记住了每句批评，沉稳的人则先查看对方是否真的听完。",
    minMonth: 12,
    choices: [
      {
        label: "只整理可验证的意见",
        hint: "把情绪和具体问题分开。",
        positive: [
          "刺耳文字里仍有可用线索",
          "大家找出两处真实的编排问题，也放下了那些只针对口味的否定。",
          [
            {
              type: "memberStat",
              target: "all",
              stat: "professional",
              amount: 1,
            },
            {
              type: "status",
              target: "all",
              direction: "improve",
              steps: 1,
            },
          ],
        ],
        neutral: [
          "这只是一名听众的意见",
          "长评被读完并归档，排练计划没有因此改变。",
        ],
      },
      {
        label: "逐条公开反驳",
        hint: "让所有人看到乐队的立场。",
        negative: [
          "一颗星变成了几天争吵",
          "新的围观不断加入，成员却越来越难把注意力放回音乐。",
          [
            {
              type: "status",
              target: "all",
              direction: "worsen",
              steps: 1,
            },
            {
              type: "basePopularity",
              amount: -1,
              countsAsPublicActivity: true,
            },
          ],
        ],
        neutral: [
          "争论没有真正的胜者",
          "双方都发完了想说的话，几天后页面恢复安静。",
        ],
      },
    ],
  },
  {
    id: "club-room-reunion",
    pool: "life",
    title: "旧社团活动室的钥匙",
    text: "大学社团准备整理旧活动室，问你们要不要回去看看。念旧的人想立刻答应，也有人觉得现在的乐队不该只活在毕业以前。",
    minMonth: 12,
    choices: [
      {
        label: "带上现在的成员一起回去",
        hint: "把过去介绍给今天的乐队。",
        positive: [
          "旧房间认识了新的五个人",
          "墙上的演出单已经褪色，但这次合照属于现在的阵容。",
          [
            {
              type: "memberStat",
              target: "all",
              stat: "belonging",
              amount: 2,
            },
            {
              type: "storyTag",
              operation: "add",
              tag: "社团旧钥匙",
              target: "all",
            },
          ],
        ],
        neutral: [
          "只取回了几件旧物",
          "大家在校园里走了一圈，回忆没有变成负担。",
        ],
      },
      {
        label: "让主角独自回去",
        hint: "把这次告别留给个人。",
        negative: [
          "群聊里的照片显得很遥远",
          "其他成员没有责怪，只是有人第一次意识到自己不在乐队最早的故事里。",
          [
            {
              type: "memberStat",
              target: "randomBandmate",
              stat: "belonging",
              amount: -1,
            },
          ],
        ],
        neutral: [
          "一次安静的个人告别",
          "主角锁好活动室，把旧钥匙交回了值班老师。",
        ],
      },
    ],
  },
  {
    id: "moving-day",
    pool: "life",
    title: "堆满纸箱的周末",
    text: "一名队友临时搬家，原本约好的整理因为货车改期而只剩今天。善解人意的人已经在群里询问谁能搭把手。",
    minMonth: 7,
    choices: [
      {
        label: "全员提前结束工作去帮忙",
        hint: "把队友的生活也当成团队的一部分。",
        positive: [
          "纸箱在笑声里搬完了",
          "新住处还很空，但冰箱上已经贴着下一次排练时间。",
          [
            {
              type: "memberStat",
              target: "all",
              stat: "belonging",
              amount: 1,
            },
            {
              type: "status",
              target: "randomBandmate",
              direction: "improve",
              steps: 1,
            },
          ],
        ],
        neutral: [
          "几个人轮流去帮了忙",
          "搬家按时完成，原定工作只做了简单调整。",
        ],
      },
      {
        label: "让对方自己处理",
        hint: "生活安排不应影响乐队计划。",
        negative: [
          "求助消息没有得到回应",
          "那名成员第二天照常出现，却明显比平时更疲惫。",
          [
            {
              type: "status",
              target: "randomBandmate",
              direction: "worsen",
              steps: 1,
            },
            {
              type: "memberStat",
              target: "randomBandmate",
              stat: "belonging",
              amount: -1,
            },
          ],
        ],
        neutral: [
          "搬家公司解决了一切",
          "对方没有再求助，排练也按原计划进行。",
        ],
      },
    ],
  },
  {
    id: "overtime-week",
    pool: "life",
    title: "连续加班的一周",
    text: "一名队友的日常工作突然进入忙季。排练时间一改再改，平时随和的人也开始为每次迟到道歉。",
    minMonth: 9,
    choices: [
      {
        label: "改成短时高效排练",
        hint: "在现实压力中保留稳定联系。",
        positive: [
          "四十分钟也能完成目标",
          "清晰的排练单让每个人都更珍惜有限的共同时间。",
          [
            {
              type: "memberStat",
              target: "all",
              stat: "professional",
              amount: 1,
            },
            {
              type: "memberStat",
              target: "randomBandmate",
              stat: "belonging",
              amount: 1,
            },
          ],
        ],
        neutral: [
          "本周只碰了一次面",
          "进度不多，但群聊和文件仍然保持更新。",
        ],
      },
      {
        label: "要求维持原排练量",
        hint: "不让个人工作改变团队标准。",
        negative: [
          "迟到变成了持续内疚",
          "那名成员勉强赶到每次排练，状态却一天比一天差。",
          [
            {
              type: "status",
              target: "randomBandmate",
              direction: "worsen",
              steps: 2,
            },
          ],
        ],
        neutral: [
          "忙季比预想更早结束",
          "原计划没有被打乱，这次压力也很快过去。",
        ],
      },
    ],
  },
  {
    id: "compilation-invitation",
    pool: "industry",
    title: "本地合辑的邀请",
    text: "一家小厂牌邀请你们提供一首作品参加本地合辑。发行范围有限，但会和几支素未谋面的乐队出现在同一张名单上。",
    minMonth: 10,
    choices: [
      {
        label: "确认条款后参加",
        hint: "用一首作品建立行业联系。",
        positive: [
          "合辑带来了新的同行",
          "发行规模不大，却有人从名单里找到你们并发来合作问候。",
          [
            {
              type: "basePopularity",
              amount: 2,
              countsAsPublicActivity: true,
            },
            {
              type: "storyTag",
              operation: "add",
              tag: "本地合辑",
              target: "leader",
            },
          ],
        ],
        neutral: [
          "作品按计划收录",
          "合辑如期上线，没有明显传播，也没有产生额外麻烦。",
        ],
      },
      {
        label: "不看细则直接答应",
        hint: "先抓住机会再处理手续。",
        negative: [
          "隐藏费用出现在最后一页",
          "母带和宣传费用都由乐队承担，预算因此多出一笔支出。",
          [
            { type: "funds", amount: -2_000 },
            {
              type: "storyTag",
              operation: "add",
              tag: "模糊授权",
              target: "leader",
            },
          ],
        ],
        neutral: [
          "条款比担心的简单",
          "授权范围没有问题，合作平淡地完成了。",
        ],
      },
    ],
  },
  {
    id: "promoter-payment-delay",
    pool: "industry",
    title: "迟迟没有到账的演出款",
    text: "一笔演出款超过约定日期仍未到账。主办方一直表示财务正在处理，职业派成员建议把所有沟通记录整理出来。",
    minMonth: 8,
    choices: [
      {
        label: "正式发出付款提醒",
        hint: "清楚列出合同和截止日期。",
        positive: [
          "款项和道歉一起到账",
          "清晰的记录让对方无法继续拖延，还补上了一小笔误期费用。",
          [
            { type: "funds", amount: 3_000 },
            {
              type: "storyTag",
              operation: "add",
              tag: "结算留痕",
              target: "leader",
            },
          ],
        ],
        neutral: [
          "对方给出明确日期",
          "款项仍要再等几天，但至少不再只有含糊回复。",
        ],
      },
      {
        label: "在公开平台点名",
        hint: "用舆论压力加快结算。",
        negative: [
          "款项问题变成行业口角",
          "钱仍未到账，几个潜在合作方却先对公开争执保持距离。",
          [
            {
              type: "basePopularity",
              amount: -1,
              countsAsPublicActivity: true,
            },
            {
              type: "storyTag",
              operation: "add",
              tag: "结算争议",
              target: "leader",
            },
          ],
        ],
        neutral: [
          "公开消息很快被删除",
          "主办方私下承诺处理，事情暂时回到沟通渠道。",
        ],
      },
    ],
  },
  {
    id: "producer-listening-session",
    pool: "industry",
    title: "制作人的试听时段",
    text: "一名制作人愿意留出半小时听你们的素材。时间只够谈两首歌，创作脑想展示最特别的段落，沉稳的人建议先说明目标。",
    minMonth: 12,
    choices: [
      {
        label: "准备两首歌和三个具体问题",
        hint: "让有限交流产生可执行反馈。",
        positive: [
          "半小时留下了清晰方向",
          "制作人没有替你们做决定，却指出了几处一直无法描述的问题。",
          [
            {
              type: "memberStat",
              target: "all",
              stat: "creation",
              amount: 1,
            },
            {
              type: "storyTag",
              operation: "add",
              tag: "制作人建议",
              target: "all",
            },
          ],
        ],
        neutral: [
          "一次专业但克制的交流",
          "对方认为方向没有问题，只建议继续积累完整作品。",
        ],
      },
      {
        label: "带上所有未完成素材",
        hint: "尽量展示乐队的全部可能。",
        negative: [
          "试听在文件切换中结束",
          "太多片段挤在半小时里，没有一首真正被完整听完。",
          [
            {
              type: "status",
              target: "leader",
              direction: "worsen",
              steps: 1,
            },
          ],
        ],
        neutral: [
          "对方只挑了一首听完",
          "其余素材没有展开，但那首歌得到了一句简短评价。",
        ],
      },
    ],
  },
  {
    id: "playlist-editor-meeting",
    pool: "industry",
    title: "平台编辑的十五分钟",
    text: "平台编辑愿意听一次自我介绍。网感敏锐的人想准备短视频式开场，可靠的人提醒大家不要把音乐压缩成一句口号。",
    minMonth: 14,
    choices: [
      {
        label: "用一个故事介绍一首歌",
        hint: "兼顾传播效率和作品本身。",
        positive: [
          "编辑记住了故事和歌名",
          "作品进入了一个小型推荐位，也带来一批真正听完的陌生人。",
          [
            {
              type: "basePopularity",
              amount: 3,
              countsAsPublicActivity: true,
            },
            {
              type: "memberStat",
              target: "all",
              stat: "heat",
              amount: 1,
            },
          ],
        ],
        neutral: [
          "资料进入了候选库",
          "编辑没有承诺推荐，只表示会在合适主题出现时再联系。",
        ],
      },
      {
        label: "连续展示所有传播数据",
        hint: "用数字证明乐队值得被推荐。",
        negative: [
          "音乐被淹没在截图里",
          "编辑记住了几个波动曲线，却说不出你们刚才播放的歌名。",
          [
            {
              type: "memberStat",
              target: "leader",
              stat: "heat",
              amount: -1,
            },
          ],
        ],
        neutral: [
          "数据没有特别突出",
          "会议按时结束，平台没有给出进一步安排。",
        ],
      },
    ],
  },
  {
    id: "pop-chorus-challenge",
    pool: "genre",
    title: "十五秒副歌挑战",
    text: "一个流行音乐账号发起副歌挑战，邀请乐队用十五秒介绍最容易被记住的旋律。它可能带来新听众，也可能只留下一个短暂片段。",
    genres: ["pop"],
    minMonth: 6,
    choices: [
      {
        label: "重新编排一个完整短版本",
        hint: "让短内容仍然保留歌曲起承转合。",
        positive: [
          "十五秒让人想听完三分钟",
          "短版本没有只截取最高音，而是给完整作品留下了清晰入口。",
          [
            {
              type: "basePopularity",
              amount: 2,
              countsAsPublicActivity: true,
            },
            {
              type: "memberStat",
              target: "all",
              stat: "heat",
              amount: 1,
            },
          ],
        ],
        neutral: [
          "挑战按时发布",
          "视频获得了一些互动，但大多数人没有继续点进主页。",
        ],
      },
      {
        label: "只截取最响的一句",
        hint: "优先追求第一秒的注意力。",
        negative: [
          "片段传播，歌名却没人记住",
          "评论都在模仿那一秒，完整作品的播放没有明显变化。",
          [
            {
              type: "memberStat",
              target: "all",
              stat: "creation",
              amount: -1,
            },
          ],
        ],
        neutral: [
          "热度停在挑战页面",
          "短片完成了活动要求，没有带来额外影响。",
        ],
      },
    ],
  },
  {
    id: "pop-dance-remix",
    pool: "genre",
    title: "舞蹈版混音提案",
    text: "一名编舞者希望把你们的副歌做成舞蹈版混音。流行音乐的开放性让合作很自然，但节奏改动也可能盖过原本情绪。",
    genres: ["pop"],
    minMonth: 10,
    choices: [
      {
        label: "和编舞者一起调整结构",
        hint: "让动作和歌曲表达互相解释。",
        positive: [
          "旋律获得了新的身体语言",
          "混音保留了原曲情绪，动作则让更多人记住了节拍。",
          [
            {
              type: "basePopularity",
              amount: 3,
              countsAsPublicActivity: true,
            },
            { type: "funds", amount: 1_000 },
          ],
        ],
        neutral: [
          "合作完成了试验版本",
          "双方都觉得有趣，但暂时没有安排正式发布。",
        ],
      },
      {
        label: "交给对方全权改编",
        hint: "用最低沟通成本快速上线。",
        negative: [
          "最熟悉的情绪被剪掉了",
          "混音有很强节奏，却让成员觉得乐队只是提供了一段素材。",
          [
            {
              type: "memberStat",
              target: "all",
              stat: "belonging",
              amount: -1,
            },
          ],
        ],
        neutral: [
          "成品和原曲各自独立",
          "混音吸引了一小批听众，也没有改变大家对原版的判断。",
        ],
      },
    ],
  },
  {
    id: "indie-zine-interview",
    pool: "genre",
    title: "复印纸做成的小志",
    text: "一本独立音乐小志邀请你们回答十个很长的问题。发行量不大，但编辑真的听过早期录音和最近的现场。",
    genres: ["indie"],
    minMonth: 6,
    choices: [
      {
        label: "五个人共同写完回答",
        hint: "用细节记录乐队正在经历的阶段。",
        positive: [
          "一篇采访留下了真实坐标",
          "文章没有制造传奇，却让一批认真阅读的人记住了你们。",
          [
            {
              type: "basePopularity",
              amount: 2,
              countsAsPublicActivity: true,
            },
            {
              type: "memberStat",
              target: "all",
              stat: "belonging",
              amount: 1,
            },
          ],
        ],
        neutral: [
          "小志寄来了五本样刊",
          "采访只在很小的圈子流通，但每名成员都留了一本。",
        ],
      },
      {
        label: "用统一宣传稿回复",
        hint: "节省时间并保持标准表述。",
        negative: [
          "编辑删掉了大半篇幅",
          "过于整齐的答案与其他宣传资料没有区别，小志读者也很快翻页。",
          [
            {
              type: "memberStat",
              target: "all",
              stat: "heat",
              amount: -1,
            },
          ],
        ],
        neutral: [
          "采访成为一页简讯",
          "基本信息准确刊出，没有产生更多讨论。",
        ],
      },
    ],
  },
  {
    id: "indie-room-take",
    pool: "genre",
    title: "保留房间声音的一遍",
    text: "录音里混进了椅子轻响和窗外车辆声。有主见的人认为这正是当时的房间，也有人希望把所有杂音修干净。",
    genres: ["indie"],
    minMonth: 8,
    requiresActiveAlbum: true,
    choices: [
      {
        label: "比较干净版和房间版",
        hint: "让不完美成为有意识的选择。",
        positive: [
          "杂音成了真实空间的一部分",
          "最后保留的声音很轻，却让整段录音有了无法复制的距离感。",
          [
            {
              type: "memberStat",
              target: "all",
              stat: "creation",
              amount: 1,
            },
            {
              type: "storyTag",
              operation: "add",
              tag: "房间录音",
              target: "all",
            },
          ],
        ],
        neutral: [
          "干净版更适合这首歌",
          "大家认真比较后选择修掉杂音，决定本身仍然足够明确。",
        ],
      },
      {
        label: "不试听就坚持原始版本",
        hint: "把未经修饰直接等同于真实。",
        negative: [
          "偶然噪声盖住了关键一句",
          "后来再听时，成员才发现最重要的歌词被车辆声遮住。",
          [
            {
              type: "memberStat",
              target: "all",
              stat: "professional",
              amount: -1,
            },
          ],
        ],
        neutral: [
          "听众未必会注意那声轻响",
          "原始版本被保留，它没有改善也没有破坏整体效果。",
        ],
      },
    ],
  },
  {
    id: "punk-benefit-show",
    pool: "genre",
    title: "没有大舞台的义演",
    text: "一场面向年轻乐迷的公益演出邀请你们参加，报酬很少，场地也简陋。朋克乐队之间已经开始自发借设备和分发海报。",
    genres: ["punk"],
    minMonth: 6,
    choices: [
      {
        label: "参加并帮忙组织换场",
        hint: "把直接行动放在收益之前。",
        positive: [
          "简陋场地挤满了人",
          "没有隔离栏和复杂灯光，观众却从第一首歌唱到最后。",
          [
            { type: "funds", amount: -500 },
            {
              type: "basePopularity",
              amount: 3,
              countsAsPublicActivity: true,
            },
            {
              type: "memberStat",
              target: "all",
              stat: "belonging",
              amount: 1,
            },
          ],
        ],
        neutral: [
          "义演顺利结束",
          "现场规模不大，筹得的钱足够完成原定目标。",
        ],
      },
      {
        label: "临时要求增加出场费",
        hint: "先确保乐队不会白白投入。",
        negative: [
          "名字从海报上消失了",
          "组织者无法增加预算，其他乐队也对最后时刻的条件感到不满。",
          [
            {
              type: "basePopularity",
              amount: -1,
              countsAsPublicActivity: true,
            },
          ],
        ],
        neutral: [
          "双方取消了合作",
          "没有公开冲突，演出由另一支乐队补上。",
        ],
      },
    ],
  },
  {
    id: "punk-stage-barrier",
    pool: "genre",
    title: "舞台前该不该有护栏",
    text: "场地方希望在舞台前增加护栏，理由是控制风险。队里有人觉得距离会破坏朋克现场，也有人提醒真正的安全需要提前设计。",
    genres: ["punk"],
    minMonth: 9,
    choices: [
      {
        label: "和场地方设计安全互动区",
        hint: "保留接近感，同时明确边界。",
        positive: [
          "距离没有挡住现场",
          "观众知道哪里可以移动，成员也能放心把注意力交给演出。",
          [
            {
              type: "memberStat",
              target: "all",
              stat: "performance",
              amount: 1,
            },
            {
              type: "storyTag",
              operation: "add",
              tag: "安全现场",
              target: "all",
            },
          ],
        ],
        neutral: [
          "护栏位置得到调整",
          "现场与过去不同，但没有明显影响观众反应。",
        ],
      },
      {
        label: "坚持完全撤掉护栏",
        hint: "把所有距离都视为妥协。",
        negative: [
          "彩排先出现了碰撞",
          "一次失去控制的前冲让排练中断，场地方也重新评估合作。",
          [
            {
              type: "status",
              target: "all",
              direction: "worsen",
              steps: 1,
            },
            {
              type: "storyTag",
              operation: "add",
              tag: "现场安全争议",
              target: "leader",
            },
          ],
        ],
        neutral: [
          "观众人数不需要护栏",
          "当晚规模比预期更小，争论没有真正接受现场检验。",
        ],
      },
    ],
  },
  {
    id: "metal-double-kick-clinic",
    pool: "genre",
    title: "双踩速度诊所",
    text: "一名巡演鼓手愿意分享高强度段落的练习方法。金属需要的力量很诱人，但对方反复强调速度必须建立在放松和控制上。",
    genres: ["metal"],
    minMonth: 6,
    choices: [
      {
        label: "从慢速动作逐级练起",
        hint: "用控制换取可持续的力量。",
        positive: [
          "速度从稳定里长出来",
          "鼓手没有立刻追求极限，却第一次能在整首歌里保持同样力度。",
          [
            {
              type: "memberStat",
              target: "drums",
              stat: "professional",
              amount: 2,
            },
            {
              type: "storyTag",
              operation: "add",
              tag: "力量控制",
              target: "drums",
            },
          ],
        ],
        neutral: [
          "练习计划被完整记下",
          "短时间内没有明显变化，但动作已经比之前更放松。",
        ],
      },
      {
        label: "直接挑战最快速度",
        hint: "用一次极限尝试证明能力。",
        negative: [
          "力量先变成了僵硬",
          "几轮强行提速后，鼓手只能停下来休息手脚。",
          [
            {
              type: "status",
              target: "drums",
              direction: "worsen",
              steps: 2,
            },
          ],
        ],
        neutral: [
          "极限速度只维持了几秒",
          "这次尝试没有受伤，也没有形成能用于歌曲的稳定节奏。",
        ],
      },
    ],
  },
  {
    id: "metal-night-festival",
    pool: "genre",
    title: "通宵金属专场的名单",
    text: "一场地下金属专场邀请你们在深夜出场。观众会很集中，换场和音量管理却比普通拼盘更严格。",
    genres: ["metal"],
    minMonth: 10,
    choices: [
      {
        label: "提前准备紧凑换场方案",
        hint: "让厚重声音建立在可靠执行上。",
        positive: [
          "第一声响起时全场已经准备好",
          "快速换场没有削弱音量，反而让观众把注意力完整留给了你们。",
          [
            {
              type: "basePopularity",
              amount: 3,
              countsAsPublicActivity: true,
            },
            {
              type: "memberStat",
              target: "all",
              stat: "performance",
              amount: 1,
            },
          ],
        ],
        neutral: [
          "专场按时间表推进",
          "演出没有明显意外，也没有超出原本预期。",
        ],
      },
      {
        label: "临场再调整设备",
        hint: "相信熟悉的音色能快速搭好。",
        negative: [
          "换场时间被旋钮吃掉",
          "主办方不得不缩短最后一首歌，成员也带着仓促结束演出。",
          [
            {
              type: "status",
              target: "all",
              direction: "worsen",
              steps: 1,
            },
            {
              type: "basePopularity",
              amount: -1,
              countsAsPublicActivity: true,
            },
          ],
        ],
        neutral: [
          "设备意外很配合",
          "调试没有超时，但以后是否还能这样顺利没人敢保证。",
        ],
      },
    ],
  },
  {
    id: "candidate-gu-yanchuan-annotated-score",
    pool: "member",
    title: "顾言川留下的修改痕迹",
    text: "顾言川带来大学毕业演出时那本写满修改的谱子。他仍能指出每一处双吉他配合为什么被重写，可靠和完美主义都没有随毕业消失。",
    minMonth: 6,
    requiresMemberIds: ["gu-yanchuan"],
    once: true,
    cooldownMonths: 24,
    choices: [
      {
        label: "和他把旧编排重新演一遍",
        hint: "认真回应这段共同经历，也检验如今的技术。",
        positive: [
          "旧谱成为新的起点",
          "当年的修改已经不再适合现在的五个人，但顾言川很快写出了更成熟的双吉他分工。",
          [
            {
              type: "memberStat",
              target: "leadGuitar",
              stat: "professional",
              amount: 1,
            },
            {
              type: "memberStat",
              target: "leadGuitar",
              stat: "belonging",
              amount: 1,
            },
            {
              type: "storyTag",
              operation: "add",
              tag: "旧谱重写",
              target: "leadGuitar",
            },
          ],
        ],
        neutral: [
          "旧版本完整地演完了",
          "没有出现新的安排，但两个人都记起了最初怎样学会互相让出声部。",
        ],
      },
      {
        label: "告诉他不必再纠结旧细节",
        hint: "把注意力留给现在的排练。",
        negative: [
          "认真被轻描淡写地放下",
          "顾言川合上谱子，没有反驳，也没有再提议检查新的双吉他段落。",
          [
            {
              type: "memberStat",
              target: "leadGuitar",
              stat: "belonging",
              amount: -2,
            },
          ],
        ],
        neutral: [
          "谱子回到设备箱里",
          "他接受了继续向前的说法，排练按原计划开始。",
        ],
      },
    ],
  },
  {
    id: "candidate-lin-jianxia-first-bend",
    pool: "performance",
    title: "林见夏想要的第一个推弦",
    text: "林见夏提出把开场改成一段没有铺垫的主音推弦，就像你们第一次在校园拼盘后台见面时那样。她直率地说，舞台应该在第一秒抓住人。",
    minMonth: 5,
    requiresMemberIds: ["lin-jianxia"],
    once: true,
    cooldownMonths: 18,
    choices: [
      {
        label: "围绕第一个推弦重排开场",
        hint: "给舞台冲劲一套能被全员接住的设计。",
        positive: [
          "开场只用一秒就站稳了",
          "林见夏的推弦落下时，其他四个人在同一拍进入，张扬没有变成混乱。",
          [
            {
              type: "memberStat",
              target: "leadGuitar",
              stat: "performance",
              amount: 2,
            },
            {
              type: "storyTag",
              operation: "add",
              tag: "一秒开场",
              target: "leadGuitar",
            },
          ],
        ],
        neutral: [
          "新开场暂时留在备用方案",
          "它很有力量，但还需要等待一场适合直接爆发的演出。",
        ],
      },
      {
        label: "让她到现场再自由发挥",
        hint: "完全相信舞台疯子的临场判断。",
        negative: [
          "其他人错过了进入信号",
          "林见夏已经冲到下一段，全队却还在等待原来的开场拍点。",
          [
            {
              type: "status",
              target: "all",
              direction: "worsen",
              steps: 1,
            },
            {
              type: "memberStat",
              target: "leadGuitar",
              stat: "belonging",
              amount: -1,
            },
          ],
        ],
        neutral: [
          "即兴被留到下一次",
          "这次排练仍采用旧开场，她也没有继续坚持。",
        ],
      },
    ],
  },
  {
    id: "candidate-zhou-jibai-two-guitar-letter",
    pool: "album",
    title: "周既白写给另一把吉他的回信",
    text: "周既白把主角随手录下的旋律拆成两条互相追逐的吉他线，像你们还只在小红书讨论效果器时那样。他说一把负责说话，另一把负责没有说出口的部分。",
    minMonth: 7,
    requiresMemberIds: ["zhou-jibai"],
    once: true,
    cooldownMonths: 24,
    choices: [
      {
        label: "留出整晚完善双吉他织体",
        hint: "保护这份细腻的创作冲动。",
        positive: [
          "两条旋律真的开始对话",
          "周既白没有让主音盖过歌曲，而是在每个空白处写下克制的回应。",
          [
            {
              type: "memberStat",
              target: "leadGuitar",
              stat: "creation",
              amount: 2,
            },
            {
              type: "memberStat",
              target: "leadGuitar",
              stat: "belonging",
              amount: 1,
            },
          ],
        ],
        neutral: [
          "复杂版本被完整保存",
          "目前的歌曲还容不下所有声部，但工程文件会留给下一次创作。",
        ],
      },
      {
        label: "要求主音只保留最明显的一句",
        hint: "用更直接的安排快速完成段落。",
        negative: [
          "没说出口的部分也被删掉了",
          "周既白照做了，却把之后写下的几个细节留在了自己的工程里。",
          [
            {
              type: "memberStat",
              target: "leadGuitar",
              stat: "belonging",
              amount: -2,
            },
            {
              type: "storyTag",
              operation: "add",
              tag: "细节未被听见",
              target: "leadGuitar",
            },
          ],
        ],
        neutral: [
          "歌曲选择了更简单的表达",
          "删减后的版本能继续推进，只是没有原稿那么特别。",
        ],
      },
    ],
  },
  {
    id: "candidate-xu-zhiyao-warehouse-key",
    pool: "life",
    title: "许知遥保留的仓库钥匙牌",
    text: "许知遥翻出大学社团仓库的旧钥匙牌。毕业答辩最忙的那周，是她守着仓库又临时抱起贝斯补齐演出，念旧的她一直没有舍得扔掉它。",
    minMonth: 8,
    requiresMemberIds: ["xu-zhiyao"],
    once: true,
    cooldownMonths: 30,
    choices: [
      {
        label: "把钥匙牌挂到现在的设备箱上",
        hint: "让过去守住的东西继续陪着乐队。",
        positive: [
          "旧钥匙牌有了新的位置",
          "许知遥没有多说，只是笑着把每个人的备用线也重新整理了一遍。",
          [
            {
              type: "memberStat",
              target: "bass",
              stat: "belonging",
              amount: 2,
            },
            {
              type: "memberStat",
              target: "all",
              stat: "belonging",
              amount: 1,
            },
            {
              type: "storyTag",
              operation: "add",
              tag: "旧仓库钥匙牌",
              target: "bass",
            },
          ],
        ],
        neutral: [
          "钥匙牌被收进纪念盒",
          "它没有继续挂在外面，但许知遥知道乐队还记得那段经历。",
        ],
      },
      {
        label: "建议清掉这些没有用的旧物",
        hint: "让设备箱只保留当前需要的东西。",
        negative: [
          "一段被守住的过去显得多余",
          "许知遥把钥匙牌放回口袋，之后也不再提大学社团的故事。",
          [
            {
              type: "memberStat",
              target: "bass",
              stat: "belonging",
              amount: -2,
            },
          ],
        ],
        neutral: [
          "旧物回到了抽屉",
          "她同意设备箱应该轻一点，只留下钥匙牌作为个人纪念。",
        ],
      },
    ],
  },
  {
    id: "candidate-tang-wenzhou-four-beats",
    pool: "performance",
    title: "唐闻舟坚持的四个拍点",
    text: "唐闻舟在 Livehouse 空台上标出音箱摆位，又让大家只听四个最简单的贝斯拍点。他说真正稳的节奏平时不显眼，少了以后所有人都会发现。",
    minMonth: 6,
    requiresMemberIds: ["tang-wenzhou"],
    once: true,
    cooldownMonths: 24,
    choices: [
      {
        label: "按他的方案重新检查舞台声场",
        hint: "相信职业派成员的现场经验。",
        positive: [
          "四个拍点让全场重新对齐",
          "音箱位置调整后，每个人都更容易听清低音和底鼓，复杂段落也稳定下来。",
          [
            {
              type: "memberStat",
              target: "bass",
              stat: "professional",
              amount: 2,
            },
            {
              type: "storyTag",
              operation: "add",
              tag: "四拍声场",
              target: "bass",
            },
          ],
        ],
        neutral: [
          "原来的摆位已经足够",
          "检查没有发现明显问题，但全员学会了怎样快速确认舞台低频。",
        ],
      },
      {
        label: "跳过检查直接完整连排",
        hint: "把有限场地时间留给歌单。",
        negative: [
          "低频在角落里打成一团",
          "连排开始后大家才发现听不清节拍，唐闻舟只能不断停下来调整。",
          [
            {
              type: "status",
              target: "bass",
              direction: "worsen",
              steps: 1,
            },
            {
              type: "memberStat",
              target: "all",
              stat: "professional",
              amount: -1,
            },
          ],
        ],
        neutral: [
          "场地设备意外地没有问题",
          "连排顺利完成，摆位建议被留到更复杂的舞台再使用。",
        ],
      },
    ],
  },
  {
    id: "candidate-shen-anning-fifteen-seconds",
    pool: "publicOpinion",
    title: "沈安宁把十五秒做成完整故事",
    text: "沈安宁剪出一段十五秒贝斯改编，却没有急着发布。她想让短片成为一首完整作品的入口，而不是只留下一个会被划走的片段。",
    minMonth: 6,
    requiresMemberIds: ["shen-anning"],
    once: true,
    cooldownMonths: 18,
    choices: [
      {
        label: "和她补完短片背后的完整版本",
        hint: "同时尊重创作脑和敏锐的网络直觉。",
        positive: [
          "十五秒真的通向了完整作品",
          "短片吸引来的听众顺着链接听到结尾，也开始讨论那条像第二旋律的贝斯线。",
          [
            {
              type: "memberStat",
              target: "bass",
              stat: "creation",
              amount: 1,
            },
            {
              type: "memberStat",
              target: "bass",
              stat: "heat",
              amount: 2,
            },
            {
              type: "basePopularity",
              amount: 1,
              countsAsPublicActivity: true,
            },
          ],
        ],
        neutral: [
          "完整版本仍在等待合适时机",
          "短片没有立即发布，但它成为下一次宣传可以继续使用的素材。",
        ],
      },
      {
        label: "只发布最抓人的低音一句",
        hint: "先追求最快的传播反馈。",
        negative: [
          "播放数字没有留下听众",
          "片段短暂获得推荐，评论却只问音色参数，没有人记住乐队和完整歌曲。",
          [
            {
              type: "memberStat",
              target: "bass",
              stat: "belonging",
              amount: -1,
            },
            {
              type: "memberStat",
              target: "bass",
              stat: "heat",
              amount: -1,
            },
          ],
        ],
        neutral: [
          "短片完成了一次普通更新",
          "数据没有明显变化，沈安宁继续保留完整版本的工程。",
        ],
      },
    ],
  },
  {
    id: "candidate-wei-xingzhi-tempo-log",
    pool: "member",
    title: "魏行之的速度记录表",
    text: "魏行之把最近几个月每首歌的排练速度整理成表格，还标出所有容易越打越快的段落。那份自律像大学时替社团校准节拍器一样可靠。",
    minMonth: 5,
    requiresMemberIds: ["wei-xingzhi"],
    once: true,
    cooldownMonths: 24,
    choices: [
      {
        label: "按记录做一次分段速度训练",
        hint: "让稳定成为全员都能理解的共同目标。",
        positive: [
          "速度不再靠一个人拉住",
          "魏行之逐段解释问题后，每名成员都知道自己在哪些位置容易抢拍。",
          [
            {
              type: "memberStat",
              target: "drums",
              stat: "professional",
              amount: 1,
            },
            {
              type: "memberStat",
              target: "all",
              stat: "professional",
              amount: 1,
            },
            {
              type: "storyTag",
              operation: "add",
              tag: "速度记录",
              target: "drums",
            },
          ],
        ],
        neutral: [
          "记录确认了现有速度",
          "多数歌曲没有明显漂移，表格被保留作以后比较。",
        ],
      },
      {
        label: "告诉他现场快一点也没关系",
        hint: "把速度变化视为自然情绪。",
        negative: [
          "可靠被当成了过度认真",
          "魏行之没有再分享记录，排练中的速度问题却继续由他独自修正。",
          [
            {
              type: "memberStat",
              target: "drums",
              stat: "belonging",
              amount: -2,
            },
          ],
        ],
        neutral: [
          "表格暂时没有投入使用",
          "下一次排练速度保持稳定，这件事也就没有继续讨论。",
        ],
      },
    ],
  },
  {
    id: "candidate-su-tang-one-listen-rescue",
    pool: "performance",
    title: "苏棠只听一遍的救场方案",
    text: "临时拼盘邀请只给了一次短彩排。苏棠想起当初从观众席下来救场的晚上，说自己听一遍就能把结尾撑住，但这次她也愿意给全队留下明确暗号。",
    minMonth: 7,
    requiresMemberIds: ["su-tang"],
    once: true,
    cooldownMonths: 18,
    choices: [
      {
        label: "让她设计最少但明确的舞台信号",
        hint: "保留大胆反应，也让其他成员能跟上。",
        positive: [
          "一次抬手就让全队同时落下",
          "苏棠没有削弱冲劲，只把当年救场时依靠的判断变成了全员可见的信号。",
          [
            {
              type: "memberStat",
              target: "drums",
              stat: "performance",
              amount: 2,
            },
            {
              type: "memberStat",
              target: "drums",
              stat: "belonging",
              amount: 1,
            },
          ],
        ],
        neutral: [
          "短彩排只确认了结尾",
          "其他段落仍按原计划进行，至少最危险的收尾已经有了方案。",
        ],
      },
      {
        label: "让她完全按照现场感觉带队",
        hint: "把全套安排交给瞬间反应。",
        negative: [
          "不是每个人都能只听一遍",
          "苏棠已经冲进下一段，键盘和贝斯却还在寻找原本的换段位置。",
          [
            {
              type: "status",
              target: "all",
              direction: "worsen",
              steps: 1,
            },
            {
              type: "memberStat",
              target: "drums",
              stat: "belonging",
              amount: -1,
            },
          ],
        ],
        neutral: [
          "临时邀请没有最终成行",
          "大胆方案没有接受现场检验，但大家记住了那几个手势。",
        ],
      },
    ],
  },
  {
    id: "candidate-han-zimo-three-endings",
    pool: "publicOpinion",
    title: "韩子墨做出的三个结尾",
    text: "韩子墨像当初回复第一版 Demo 那样，一晚做出三个不同情绪的鼓点结尾，还顺手录了拆解视频。他的好奇心总想知道听众会怎样理解每一种答案。",
    minMonth: 6,
    requiresMemberIds: ["han-zimo"],
    once: true,
    cooldownMonths: 20,
    choices: [
      {
        label: "让全员盲听后选出最适合歌曲的版本",
        hint: "先用音乐判断，再考虑怎样分享过程。",
        positive: [
          "三个答案让歌曲目标更清楚",
          "比较之后，韩子墨又写出第四个版本，把前面三种情绪的优点留了下来。",
          [
            {
              type: "memberStat",
              target: "drums",
              stat: "creation",
              amount: 2,
            },
            {
              type: "memberStat",
              target: "drums",
              stat: "heat",
              amount: 1,
            },
          ],
        ],
        neutral: [
          "三个版本各有支持者",
          "选择被留到下一次完整连排，拆解视频也暂时没有发布。",
        ],
      },
      {
        label: "直接让网络投票决定正式结尾",
        hint: "用最快方式测试听众反应。",
        negative: [
          "投票记住了编号，没有记住歌曲",
          "评论区只在争论一号和三号，成员则开始怀疑创作判断是否已经交给了数据。",
          [
            {
              type: "memberStat",
              target: "drums",
              stat: "belonging",
              amount: -1,
            },
            {
              type: "status",
              target: "drums",
              direction: "worsen",
              steps: 1,
            },
          ],
        ],
        neutral: [
          "投票结果没有明显差距",
          "网络没有替乐队做出选择，三个结尾仍然都在工程里。",
        ],
      },
    ],
  },
  {
    id: "candidate-chen-xingyao-breathing-chords",
    pool: "album",
    title: "陈星遥问这首歌想说什么",
    text: "陈星遥把那台曾从学校音乐厅搬到吉他社的旧合成器接好，没有急着填满空白，只弹了一组和弦，问主角这首歌今天到底想说什么。",
    minMonth: 8,
    requiresMemberIds: ["chen-xingyao"],
    once: true,
    cooldownMonths: 24,
    choices: [
      {
        label: "让每个人先说出自己的理解",
        hint: "给善于倾听的人足够空间整理共同情绪。",
        positive: [
          "空白让真正的旋律出现",
          "陈星遥没有增加更多音符，只用一组和弦把五个人的回答连接起来。",
          [
            {
              type: "memberStat",
              target: "keyboard",
              stat: "creation",
              amount: 1,
            },
            {
              type: "memberStat",
              target: "all",
              stat: "belonging",
              amount: 1,
            },
            {
              type: "storyTag",
              operation: "add",
              tag: "旋律留白",
              target: "keyboard",
            },
          ],
        ],
        neutral: [
          "答案还没有变成音乐",
          "大家至少把想法说了出来，陈星遥保留那组和弦等待下一次排练。",
        ],
      },
      {
        label: "要求她先把所有空白铺满",
        hint: "用完整音色快速确认编曲密度。",
        negative: [
          "和弦盖住了原本的问题",
          "工程听起来更满，成员却依然不知道这首歌真正想表达什么。",
          [
            {
              type: "memberStat",
              target: "keyboard",
              stat: "belonging",
              amount: -2,
            },
            {
              type: "memberStat",
              target: "all",
              stat: "creation",
              amount: -1,
            },
          ],
        ],
        neutral: [
          "完整铺底成为一个参考版",
          "大家听完后仍决定保留原来的空白，只是多了一种比较。",
        ],
      },
    ],
  },
  {
    id: "candidate-song-qinghe-backup-routing",
    pool: "equipment",
    title: "宋清和的第二套接线方案",
    text: "宋清和检查完键盘和线材箱，递来一张备用接线图。就像你们初次见面时现场键盘失灵那晚，他已经为每个可能出错的接口准备了替代方案。",
    minMonth: 5,
    requiresMemberIds: ["song-qinghe"],
    once: true,
    cooldownMonths: 30,
    choices: [
      {
        label: "按接线图做一次故障演练",
        hint: "把职业化的细致变成全队都能执行的流程。",
        positive: [
          "设备失灵不再等于演出中断",
          "宋清和随机拔掉一根信号线，其他成员也能在几分钟内切换到备用方案。",
          [
            { type: "funds", amount: -300 },
            {
              type: "memberStat",
              target: "keyboard",
              stat: "professional",
              amount: 2,
            },
            {
              type: "storyTag",
              operation: "add",
              tag: "备用接线图",
              target: "keyboard",
            },
          ],
        ],
        neutral: [
          "现有设备全部工作正常",
          "演练没有发现新问题，接线图被复制后放进两个不同的设备箱。",
        ],
      },
      {
        label: "告诉他现场不会那么容易出错",
        hint: "把排练时间留给音乐本身。",
        negative: [
          "准备方案成了一个人的负担",
          "宋清和收起清单，之后仍独自检查所有线材，只是没有再要求别人记住接口。",
          [
            {
              type: "memberStat",
              target: "keyboard",
              stat: "belonging",
              amount: -2,
            },
          ],
        ],
        neutral: [
          "备用图暂时没有用上",
          "设备连续几次都很稳定，这份方案安静留在了文件夹里。",
        ],
      },
    ],
  },
  {
    id: "candidate-lu-sixian-night-road-intro",
    pool: "album",
    title: "陆思弦延伸出的夜路前奏",
    text: "陆思弦把练习室录音重新编成一段像夜路一样延伸的前奏，正如你们在小红书第一次交换音色时那样。她有自己的方向，也愿意让键盘只改变整间房的颜色。",
    minMonth: 7,
    requiresMemberIds: ["lu-sixian"],
    once: true,
    cooldownMonths: 24,
    choices: [
      {
        label: "让前奏完整保留她的音色设计",
        hint: "尊重创作脑清晰而独立的判断。",
        positive: [
          "房间真的换了一种颜色",
          "键盘没有抢走旋律，却让第一句歌词出现前的等待变得不可替代。",
          [
            {
              type: "memberStat",
              target: "keyboard",
              stat: "creation",
              amount: 2,
            },
            {
              type: "memberStat",
              target: "keyboard",
              stat: "belonging",
              amount: 1,
            },
            {
              type: "storyTag",
              operation: "add",
              tag: "夜路前奏",
              target: "keyboard",
            },
          ],
        ],
        neutral: [
          "长前奏被保存在专辑版本里",
          "现场版本暂时缩短，但陆思弦的完整设计没有被删除。",
        ],
      },
      {
        label: "要求她改成更常见的键盘铺底",
        hint: "让编曲更快进入熟悉结构。",
        negative: [
          "房间恢复了普通颜色",
          "陆思弦交出一个没有问题的版本，也不再解释原本为什么需要那段夜路。",
          [
            {
              type: "memberStat",
              target: "keyboard",
              stat: "belonging",
              amount: -2,
            },
            {
              type: "storyTag",
              operation: "add",
              tag: "独立表达受阻",
              target: "keyboard",
            },
          ],
        ],
        neutral: [
          "简化版本更适合当前结构",
          "她接受了这次取舍，并把完整前奏留给未来其他作品。",
        ],
      },
    ],
  },
] as const satisfies readonly EventSeed[];

const EVENT_CHAINS = [
  {
    id: "creative-split-session",
    pool: "album",
    title: "两套互不相让的副歌",
    text: "当前作品的副歌出现了两套方向。一个版本保留最初的克制，另一个版本把情绪推到更高，讨论几次后仍没有人愿意先删掉自己的方案。",
    minMonth: 8,
    requiresActiveAlbum: true,
    once: true,
    chainId: "creative-disagreement-repair",
    choices: [
      {
        id: "creative-split-session-open-table",
        label: "把两套方案拆开讨论",
        hint: "先确认各自想保留的核心，再决定怎样重组。",
        outcomes: [
          {
            id: "creative-split-session-shared-core",
            weight: 2,
            tone: "positive",
            title: "争论里出现了共同核心",
            text: "大家发现真正舍不得的并不是同一段旋律，而是同一种情绪。两套方案都被留下部分空间。",
            effects: [
              {
                type: "memberStat",
                target: "all",
                stat: "belonging",
                amount: 1,
              },
              {
                type: "storyTag",
                operation: "add",
                tag: "创作分歧待复盘",
                target: "all",
              },
            ],
            nextEventId: "creative-split-follow-up",
            nextEventDelayMonths: 1,
          },
          {
            id: "creative-split-session-partial-notes",
            weight: 1,
            tone: "neutral",
            title: "讨论留下了一页笔记",
            text: "今晚没有定稿，但每个人的坚持都被写成了可以继续验证的问题。",
            effects: [
              {
                type: "storyTag",
                operation: "add",
                tag: "创作分歧待复盘",
                target: "all",
              },
            ],
            nextEventId: "creative-split-follow-up",
            nextEventDelayMonths: 1,
          },
        ],
      },
      {
        id: "creative-split-session-separate-demos",
        label: "让双方各自完成一个版本",
        hint: "先停止争论，用完整成品说话。",
        outcomes: [
          {
            id: "creative-split-session-private-race",
            weight: 1,
            tone: "negative",
            title: "创作变成了私下竞赛",
            text: "两个版本都在推进，但群聊里开始有人刻意回避分享过程。",
            effects: [
              {
                type: "memberStat",
                target: "randomBandmate",
                stat: "belonging",
                amount: -1,
              },
              {
                type: "storyTag",
                operation: "add",
                tag: "创作分歧待复盘",
                target: "all",
              },
            ],
            nextEventId: "creative-split-follow-up",
            nextEventDelayMonths: 2,
          },
          {
            id: "creative-split-session-two-complete-versions",
            weight: 2,
            tone: "neutral",
            title: "两套版本都完成了",
            text: "差异终于可以被完整听见，下一步仍需要一次共同决定。",
            effects: [
              {
                type: "storyTag",
                operation: "add",
                tag: "创作分歧待复盘",
                target: "all",
              },
            ],
            nextEventId: "creative-split-follow-up",
            nextEventDelayMonths: 2,
          },
        ],
      },
    ],
  },
  {
    id: "creative-split-follow-up",
    pool: "album",
    title: "把分歧放回扬声器里",
    text: "一段时间过去，关于副歌方向的讨论留下了不同程度的余波。无论之前是否接近答案，大家都同意再听一次完整版本后做决定。",
    minMonth: 9,
    requiresActiveAlbum: true,
    requiresTags: ["创作分歧待复盘"],
    once: true,
    chainId: "creative-disagreement-repair",
    choices: [
      {
        id: "creative-split-follow-up-blind-listen",
        label: "隐藏版本来源后一起试听",
        hint: "只讨论作品本身带来的感受。",
        outcomes: [
          {
            id: "creative-split-follow-up-new-arrangement",
            weight: 2,
            tone: "positive",
            title: "第三个版本出现了",
            text: "所有人都选中了不同片段，新的编排不属于任何一个人，却保留了每个人最在意的部分。",
            effects: [
              {
                type: "memberStat",
                target: "all",
                stat: "belonging",
                amount: 2,
              },
              {
                type: "storyTag",
                operation: "remove",
                tag: "创作分歧待复盘",
                target: "all",
              },
            ],
          },
          {
            id: "creative-split-follow-up-one-version-chosen",
            weight: 1,
            tone: "neutral",
            title: "一个版本得到更多支持",
            text: "结果没有让所有人兴奋，但理由足够清楚，作品可以继续向前。",
            effects: [
              {
                type: "storyTag",
                operation: "remove",
                tag: "创作分歧待复盘",
                target: "all",
              },
            ],
          },
        ],
      },
      {
        id: "creative-split-follow-up-nonnegotiables",
        label: "每个人只保留一个底线",
        hint: "缩小争论范围，再尝试完成最终编排。",
        outcomes: [
          {
            id: "creative-split-follow-up-one-person-withdraws",
            weight: 1,
            tone: "negative",
            title: "有人把底线说成了放弃",
            text: "方案勉强定下，但一名成员主动退出了后续编曲讨论。",
            effects: [
              {
                type: "status",
                target: "randomBandmate",
                direction: "worsen",
                steps: 1,
              },
              {
                type: "storyTag",
                operation: "remove",
                tag: "创作分歧待复盘",
                target: "all",
              },
            ],
          },
          {
            id: "creative-split-follow-up-workable-boundary",
            weight: 2,
            tone: "neutral",
            title: "边界变得可以执行",
            text: "没有人完全满意，但每个人都知道下一次排练要验证什么。",
            effects: [
              {
                type: "memberStat",
                target: "randomBandmate",
                stat: "belonging",
                amount: 1,
              },
              {
                type: "storyTag",
                operation: "remove",
                tag: "创作分歧待复盘",
                target: "all",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "old-venue-message",
    pool: "performance",
    title: "旧场地装修前的消息",
    text: "最早接纳过乐队的场地方准备停业装修。负责人翻到一张旧海报，问你们是否愿意在清场前再回来留下一点声音。",
    minMonth: 10,
    minPopularity: 10,
    minVenueLevel: 2,
    once: true,
    chainId: "old-venue-reunion",
    choices: [
      {
        id: "old-venue-message-return",
        label: "答应回去做一次特别演出",
        hint: "把这次邀请留进之后的排期。",
        outcomes: [
          {
            id: "old-venue-message-old-poster-found",
            weight: 2,
            tone: "positive",
            title: "旧海报重新贴回了门口",
            text: "负责人把当年的海报压平，旁边留出一块位置准备写上新的日期。",
            effects: [
              {
                type: "storyTag",
                operation: "add",
                tag: "旧场地回访待定",
                target: "leader",
              },
            ],
            nextEventId: "old-venue-return-night",
            nextEventDelayMonths: 1,
          },
          {
            id: "old-venue-message-date-pending",
            weight: 1,
            tone: "neutral",
            title: "日期仍在协调",
            text: "双方先确认了意愿，具体形式要等清场安排稳定后再决定。",
            effects: [
              {
                type: "storyTag",
                operation: "add",
                tag: "旧场地回访待定",
                target: "leader",
              },
            ],
            nextEventId: "old-venue-return-night",
            nextEventDelayMonths: 1,
          },
        ],
      },
      {
        id: "old-venue-message-send-memory",
        label: "先整理一份旧物和录音送回去",
        hint: "不立即承诺演出，先回应这段共同经历。",
        outcomes: [
          {
            id: "old-venue-message-damaged-tape",
            weight: 1,
            tone: "negative",
            title: "唯一的旧录音无法读取",
            text: "存放太久的录音出现损坏，修复工作耗掉了一个原本空闲的晚上。",
            effects: [
              {
                type: "status",
                target: "leader",
                direction: "worsen",
                steps: 1,
              },
              {
                type: "storyTag",
                operation: "add",
                tag: "旧场地回访待定",
                target: "leader",
              },
            ],
            nextEventId: "old-venue-return-night",
            nextEventDelayMonths: 2,
          },
          {
            id: "old-venue-message-box-delivered",
            weight: 2,
            tone: "neutral",
            title: "一只纸箱送回了后台",
            text: "旧票根、工作证和照片被整理好，负责人说装修前会再联系一次。",
            effects: [
              {
                type: "storyTag",
                operation: "add",
                tag: "旧场地回访待定",
                target: "leader",
              },
            ],
            nextEventId: "old-venue-return-night",
            nextEventDelayMonths: 2,
          },
        ],
      },
    ],
  },
  {
    id: "old-venue-return-night",
    pool: "performance",
    title: "门牌拆下前的最后一晚",
    text: "旧场地再次发来消息。之前的回应可能是演出计划，也可能只是一次关于旧物的往来，但清场前的这个晚上仍为乐队留出了一段时间。",
    minMonth: 11,
    minVenueLevel: 2,
    requiresTags: ["旧场地回访待定"],
    once: true,
    chainId: "old-venue-reunion",
    choices: [
      {
        id: "old-venue-return-night-old-set",
        label: "重新演奏早期歌单",
        hint: "让现在的阵容重新理解最初的声音。",
        outcomes: [
          {
            id: "old-venue-return-night-room-sings",
            weight: 2,
            tone: "positive",
            title: "旧房间记得这些歌",
            text: "台下有人接上了很久没唱过的歌词，新成员也第一次真正走进乐队的起点。",
            effects: [
              {
                type: "basePopularity",
                amount: 2,
                countsAsPublicActivity: true,
              },
              {
                type: "memberStat",
                target: "all",
                stat: "belonging",
                amount: 1,
              },
              {
                type: "storyTag",
                operation: "remove",
                tag: "旧场地回访待定",
                target: "leader",
              },
            ],
          },
          {
            id: "old-venue-return-night-small-crowd",
            weight: 1,
            tone: "neutral",
            title: "只有熟悉的人留下",
            text: "观众不多，散场后的合照却把过去和现在放进了同一个画面。",
            effects: [
              {
                type: "storyTag",
                operation: "remove",
                tag: "旧场地回访待定",
                target: "leader",
              },
            ],
          },
        ],
      },
      {
        id: "old-venue-return-night-new-material",
        label: "只演奏现在的新作品",
        hint: "用最新的声音向旧场地告别。",
        outcomes: [
          {
            id: "old-venue-return-night-room-resists",
            weight: 1,
            tone: "negative",
            title: "回忆和新歌没有立刻接上",
            text: "有人期待熟悉的旋律，现场在前半段显得格外安静。",
            effects: [
              {
                type: "status",
                target: "all",
                direction: "worsen",
                steps: 1,
              },
              {
                type: "storyTag",
                operation: "remove",
                tag: "旧场地回访待定",
                target: "leader",
              },
            ],
          },
          {
            id: "old-venue-return-night-new-chapter",
            weight: 2,
            tone: "neutral",
            title: "告别没有停在怀旧里",
            text: "最后一首新歌结束后，负责人说这间房能听见乐队已经走了多远。",
            effects: [
              {
                type: "basePopularity",
                amount: 1,
                countsAsPublicActivity: true,
              },
              {
                type: "storyTag",
                operation: "remove",
                tag: "旧场地回访待定",
                target: "leader",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "sponsor-revision-request",
    pool: "industry",
    title: "合作方发来的修改清单",
    text: "一项商业合作进入确认阶段，对方希望调整歌词、视觉和发布时间。每条要求单独看都不大，放在一起却开始改变作品原本的样子。",
    minMonth: 14,
    minPopularity: 30,
    minReleasedAlbums: 1,
    once: true,
    chainId: "commercial-pressure",
    choices: [
      {
        id: "sponsor-revision-request-boundary-meeting",
        label: "先开会确认不可修改的部分",
        hint: "把创作边界和交付目标写进确认记录。",
        outcomes: [
          {
            id: "sponsor-revision-request-mutual-list",
            weight: 2,
            tone: "positive",
            title: "双方各自删掉了几条要求",
            text: "合作仍能继续，乐队也保住了最核心的表达和署名方式。",
            effects: [
              {
                type: "memberStat",
                target: "all",
                stat: "belonging",
                amount: 1,
              },
              {
                type: "storyTag",
                operation: "add",
                tag: "商业边界待确认",
                target: "all",
              },
            ],
            nextEventId: "sponsor-release-review",
            nextEventDelayMonths: 1,
          },
          {
            id: "sponsor-revision-request-more-documents",
            weight: 1,
            tone: "neutral",
            title: "问题变成了更多确认文件",
            text: "分歧没有消失，但至少每项修改都需要留下明确记录。",
            effects: [
              {
                type: "storyTag",
                operation: "add",
                tag: "商业边界待确认",
                target: "all",
              },
            ],
            nextEventId: "sponsor-release-review",
            nextEventDelayMonths: 2,
          },
        ],
      },
      {
        id: "sponsor-revision-request-accept-all",
        label: "先全部接受以保住合作",
        hint: "优先确保项目按时上线。",
        outcomes: [
          {
            id: "sponsor-revision-request-band-silence",
            weight: 1,
            tone: "negative",
            title: "修改通过得太快",
            text: "合作方很满意，乐队群里却有人问这首作品最后还剩下多少自己的东西。",
            effects: [
              {
                type: "memberStat",
                target: "randomBandmate",
                stat: "belonging",
                amount: -2,
              },
              {
                type: "storyTag",
                operation: "add",
                tag: "商业边界待确认",
                target: "all",
              },
            ],
            nextEventId: "sponsor-release-review",
            nextEventDelayMonths: 1,
          },
          {
            id: "sponsor-revision-request-light-touch",
            weight: 2,
            tone: "neutral",
            title: "实际修改比清单温和",
            text: "执行版本没有完全偏离原作，但所有人仍想在公开前再看一次。",
            effects: [
              {
                type: "storyTag",
                operation: "add",
                tag: "商业边界待确认",
                target: "all",
              },
            ],
            nextEventId: "sponsor-release-review",
            nextEventDelayMonths: 1,
          },
        ],
      },
    ],
  },
  {
    id: "sponsor-release-review",
    pool: "industry",
    title: "公开前的最后一个版本",
    text: "合作方送来了即将公开的最终版本。前一次沟通可能留下了清晰共识，也可能只留下暂时妥协，但现在仍有一次全员确认的机会。",
    minMonth: 15,
    minPopularity: 35,
    requiresTags: ["商业边界待确认"],
    once: true,
    chainId: "commercial-pressure",
    choices: [
      {
        id: "sponsor-release-review-band-signoff",
        label: "让全员逐项确认后签字",
        hint: "宁愿稍慢，也让每个人知道作品如何被使用。",
        outcomes: [
          {
            id: "sponsor-release-review-clean-launch",
            weight: 2,
            tone: "positive",
            title: "合作按共同版本公开",
            text: "作品、署名和宣传口径都得到确认，结算也按约定进入乐队账户。",
            effects: [
              { type: "funds", amount: 5_000 },
              {
                type: "basePopularity",
                amount: 1,
                countsAsPublicActivity: true,
              },
              {
                type: "storyTag",
                operation: "remove",
                tag: "商业边界待确认",
                target: "all",
              },
            ],
          },
          {
            id: "sponsor-release-review-small-delay",
            weight: 1,
            tone: "neutral",
            title: "公开时间向后移动",
            text: "一次补充确认让项目晚了几天，但没有改变最终合作内容。",
            effects: [
              { type: "funds", amount: 3_000 },
              {
                type: "storyTag",
                operation: "remove",
                tag: "商业边界待确认",
                target: "all",
              },
            ],
          },
        ],
      },
      {
        id: "sponsor-release-review-deadline-first",
        label: "按截止时间直接通过",
        hint: "避免继续修改影响结算。",
        outcomes: [
          {
            id: "sponsor-release-review-visible-compromise",
            weight: 1,
            tone: "negative",
            title: "妥协被观众先听了出来",
            text: "合作顺利上线并完成结算，评论里却有人指出作品与乐队过去的表达明显不同。",
            effects: [
              { type: "funds", amount: 5_000 },
              {
                type: "memberStat",
                target: "all",
                stat: "belonging",
                amount: -1,
              },
              {
                type: "storyTag",
                operation: "add",
                tag: "商业妥协",
                target: "all",
              },
              {
                type: "storyTag",
                operation: "remove",
                tag: "商业边界待确认",
                target: "all",
              },
            ],
          },
          {
            id: "sponsor-release-review-ordinary-launch",
            weight: 2,
            tone: "neutral",
            title: "项目平稳上线",
            text: "没有出现新的争议，合作也没有带来超出预期的传播。",
            effects: [
              { type: "funds", amount: 4_000 },
              {
                type: "storyTag",
                operation: "remove",
                tag: "商业边界待确认",
                target: "all",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "bandmate-relocation-offer",
    pool: "life",
    title: "队友收到的外地机会",
    text: "一名队友收到一份外地工作机会。收入和生活都更稳定，但新的通勤距离会改变排练、演出和临时集合的方式。",
    minMonth: 16,
    minPopularity: 15,
    once: true,
    chainId: "member-life-choice",
    choices: [
      {
        id: "bandmate-relocation-offer-listen",
        label: "先听完对方对未来的打算",
        hint: "不替队友决定，再一起评估可行安排。",
        outcomes: [
          {
            id: "bandmate-relocation-offer-honest-plan",
            weight: 2,
            tone: "positive",
            title: "顾虑被完整说了出来",
            text: "对方没有把乐队当成需要隐瞒的负担，也愿意带着具体时间表继续讨论。",
            effects: [
              {
                type: "memberStat",
                target: "randomBandmate",
                stat: "belonging",
                amount: 2,
              },
              {
                type: "storyTag",
                operation: "add",
                tag: "成员生活安排待定",
                target: "all",
              },
            ],
            nextEventId: "bandmate-schedule-decision",
            nextEventDelayMonths: 2,
          },
          {
            id: "bandmate-relocation-offer-needs-time",
            weight: 1,
            tone: "neutral",
            title: "决定仍需要时间",
            text: "这次谈话没有结论，但对方承诺拿到完整安排后再和全员说明。",
            effects: [
              {
                type: "storyTag",
                operation: "add",
                tag: "成员生活安排待定",
                target: "all",
              },
            ],
            nextEventId: "bandmate-schedule-decision",
            nextEventDelayMonths: 2,
          },
        ],
      },
      {
        id: "bandmate-relocation-offer-demand-answer",
        label: "要求现在确认是否继续留队",
        hint: "优先消除未来排期的不确定性。",
        outcomes: [
          {
            id: "bandmate-relocation-offer-cornered",
            weight: 1,
            tone: "negative",
            title: "问题听起来像最后通牒",
            text: "对方没有立即退出，却把原本想分享的生活压力全部收了回去。",
            effects: [
              {
                type: "memberStat",
                target: "randomBandmate",
                stat: "belonging",
                amount: -2,
              },
              {
                type: "status",
                target: "randomBandmate",
                direction: "worsen",
                steps: 1,
              },
              {
                type: "storyTag",
                operation: "add",
                tag: "成员生活安排待定",
                target: "all",
              },
            ],
            nextEventId: "bandmate-schedule-decision",
            nextEventDelayMonths: 1,
          },
          {
            id: "bandmate-relocation-offer-stays-for-now",
            weight: 2,
            tone: "neutral",
            title: "对方暂时确认留队",
            text: "短期排练得到保证，长期安排仍要等工作地点和时间最终确定。",
            effects: [
              {
                type: "storyTag",
                operation: "add",
                tag: "成员生活安排待定",
                target: "all",
              },
            ],
            nextEventId: "bandmate-schedule-decision",
            nextEventDelayMonths: 1,
          },
        ],
      },
    ],
  },
  {
    id: "bandmate-schedule-decision",
    pool: "life",
    title: "写在日历上的新安排",
    text: "一段时间后，队友带回了更具体的生活安排。无论之前的谈话是否顺利，现实中的工作日期、通勤和演出计划现在都需要被放进同一张日历。",
    minMonth: 17,
    minPopularity: 20,
    requiresTags: ["成员生活安排待定"],
    once: true,
    chainId: "member-life-choice",
    choices: [
      {
        id: "bandmate-schedule-decision-three-month-plan",
        label: "重排未来三个月的工作节奏",
        hint: "用固定排练和远程准备减少临时冲突。",
        outcomes: [
          {
            id: "bandmate-schedule-decision-new-rhythm",
            weight: 2,
            tone: "positive",
            title: "乐队找到新的共同节奏",
            text: "见面次数减少了一些，但每次集合都有清楚目标，队友也不再需要反复道歉。",
            effects: [
              {
                type: "memberStat",
                target: "all",
                stat: "professional",
                amount: 1,
              },
              {
                type: "memberStat",
                target: "all",
                stat: "belonging",
                amount: 1,
              },
              {
                type: "storyTag",
                operation: "remove",
                tag: "成员生活安排待定",
                target: "all",
              },
            ],
          },
          {
            id: "bandmate-schedule-decision-workable-calendar",
            weight: 1,
            tone: "neutral",
            title: "日历勉强排得下",
            text: "计划谈不上轻松，但至少每个人都知道哪些日期不能再临时改变。",
            effects: [
              {
                type: "storyTag",
                operation: "remove",
                tag: "成员生活安排待定",
                target: "all",
              },
            ],
          },
        ],
      },
      {
        id: "bandmate-schedule-decision-band-vote",
        label: "让全员共同决定保留哪些计划",
        hint: "公开取舍排练、演出和个人生活安排。",
        outcomes: [
          {
            id: "bandmate-schedule-decision-unheard-minority",
            weight: 1,
            tone: "negative",
            title: "多数决定没有照顾所有人",
            text: "排期得到通过，一名成员却发现自己的现实困难始终没有进入讨论重点。",
            effects: [
              {
                type: "memberStat",
                target: "randomBandmate",
                stat: "belonging",
                amount: -1,
              },
              {
                type: "storyTag",
                operation: "remove",
                tag: "成员生活安排待定",
                target: "all",
              },
            ],
          },
          {
            id: "bandmate-schedule-decision-shared-tradeoff",
            weight: 2,
            tone: "neutral",
            title: "每个人都放弃了一部分安排",
            text: "未来几个月仍会忙乱，但取舍不再只由那名队友承担。",
            effects: [
              {
                type: "memberStat",
                target: "all",
                stat: "belonging",
                amount: 1,
              },
              {
                type: "storyTag",
                operation: "remove",
                tag: "成员生活安排待定",
                target: "all",
              },
            ],
          },
        ],
      },
    ],
  },
] as const satisfies readonly EventContent[];

export const EVENTS = [
  ...BASE_EVENTS,
  ...EVENT_SEEDS.map(createCatalogEvent),
  ...EVENT_CHAINS,
] as const satisfies readonly EventContent[];
