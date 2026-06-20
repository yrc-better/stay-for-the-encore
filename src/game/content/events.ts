import type { GameEvent } from "../types";

export const EVENTS: GameEvent[] = [
  {
    id: "prologue.rehearsal_argument",
    title: "毕业演出前的排练争执",
    tags: ["prologue", "member", "songwriting"],
    category: "anchor",
    phase: "campus",
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
    id: "campus.random.rooftop_distortion",
    title: "教学楼天台的失真回声",
    tags: ["campus", "random", "inspiration"],
    category: "random",
    phase: "campus",
    rarity: "common",
    weight: 3,
    cooldownMonths: 2,
    repeatable: true,
    priority: 35,
    once: false,
    trigger: { flagsNone: ["prologue.rehearsalArgumentDone"] },
    body: "晚自习结束后，天台上只剩风声。你把效果器音量压低，意外找到一段适合毕业演出的前奏。",
    choices: [
      {
        id: "record_idea",
        label: "记下这段动机",
        effects: [
          { kind: "playerStat", key: "creativity", amount: 2 },
          { kind: "addRiff", riff: { titleSeed: "天台回声", quality: 20, styleTags: ["campus", "delay"], source: "event" } }
        ],
        feedback: {
          title: "风把噪音吹散",
          body: "你把那段旋律录进手机。音质很差，但它有一种毕业前夜才会出现的锋利。"
        }
      },
      {
        id: "keep_practicing",
        label: "继续练到保安来催",
        effects: [
          { kind: "playerStat", key: "technique", amount: 2 },
          { kind: "playerStat", key: "stress", amount: 2 }
        ],
        feedback: { title: "手指发麻", body: "你把同一段过门弹到几乎失去知觉。下楼时，整只手还在震。" }
      }
    ]
  },
  {
    id: "campus.anchor.graduation_show",
    title: "毕业演出",
    tags: ["campus", "anchor", "graduation", "performance"],
    category: "anchor",
    phase: "campus",
    priority: 95,
    once: true,
    trigger: { flagsAll: ["prologue.rehearsalArgumentDone"], flagsNone: ["campus.graduationShowDone"] },
    body: "礼堂的灯一排排亮起，校徽投在幕布上，像某种迟到的宣判。你们站在侧台等主持人念出乐队名，谁都没有说话；谢幕以前，这支乐队必须证明自己不只是毕业前的临时冲动。",
    choices: [
      {
        id: "step_on_stage",
        label: "登上毕业演出舞台",
        effects: [{ kind: "resolveGraduationShow" }],
        feedback: {
          title: "毕业演出结束",
          body: "最后一个和弦散进礼堂顶棚，灯光慢慢退下来。你们站成一排谢幕，掌声、失误、汗水和没说出口的以后，都在那几秒里变得真实。"
        }
      }
    ]
  },
  {
    id: "campus.random.club_room_key",
    title: "社团活动室的钥匙",
    tags: ["campus", "random", "rehearsal"],
    category: "random",
    phase: "campus",
    rarity: "common",
    weight: 2,
    cooldownMonths: 2,
    repeatable: false,
    priority: 32,
    once: false,
    trigger: {},
    body: "社团负责人把活动室钥匙塞给你，说毕业前这几天没人管，只要别把音箱烧了就行。",
    choices: [
      {
        id: "extra_rehearsal",
        label: "叫大家加练",
        effects: [
          { kind: "bandStat", key: "cohesion", amount: 3 },
          { kind: "bandStat", key: "workQuality", amount: 2 },
          { kind: "playerStat", key: "stress", amount: 2 }
        ],
        feedback: { title: "多出来的一晚", body: "这不是一次漂亮的排练，但至少每个人都知道副歌该从哪里进。" }
      },
      {
        id: "solo_tone_search",
        label: "一个人调音色",
        effects: [
          { kind: "playerStat", key: "creativity", amount: 2 },
          { kind: "bandStat", key: "cohesion", amount: -1 }
        ],
        feedback: { title: "音箱里的灰", body: "你找到一个很旧但很亮的音色。主唱后来问你为什么没叫他们。" }
      }
    ]
  },
  {
    id: "campus.random.secondhand_pedal",
    title: "二手效果器的低价消息",
    tags: ["campus", "random", "equipment"],
    category: "random",
    phase: "campus",
    rarity: "uncommon",
    weight: 1,
    cooldownMonths: 3,
    repeatable: false,
    priority: 28,
    once: false,
    trigger: { minPlayer: { wealth: 200 } },
    body: "同学群里有人急出一块旧 Delay，价格很低，但你这个月的钱本来已经不宽裕。",
    choices: [
      {
        id: "buy_pedal",
        label: "先买下来",
        effects: [
          { kind: "playerStat", key: "wealth", amount: -200 },
          { kind: "playerStat", key: "creativity", amount: 1 },
          {
            kind: "addHistory",
            entry: {
              type: "equipment",
              title: "买下第一块二手 Delay",
              description: "毕业演出前，你用半个月生活费买下一块有杂音的二手 Delay。",
              weight: 2,
              tags: ["equipment", "delay"]
            }
          }
        ],
        feedback: { title: "旋钮有点松", body: "它不稳定，但拖出来的尾音刚好能盖住你心里的慌。" }
      },
      {
        id: "save_money",
        label: "忍住不买",
        effects: [
          { kind: "playerStat", key: "stress", amount: -1 },
          { kind: "playerStat", key: "wealth", amount: 50 }
        ],
        feedback: { title: "钱还在", body: "你关掉聊天窗口，告诉自己演出不是靠一块效果器赢下来的。" }
      }
    ]
  },
  {
    id: "campus.random.route_technician_soldering_noise",
    title: "焊点松动的排练夜",
    tags: ["campus", "random", "route", "technician", "equipment"],
    category: "random",
    phase: "campus",
    routes: ["technician"],
    rarity: "common",
    weight: 2,
    cooldownMonths: 2,
    repeatable: true,
    priority: 30,
    once: false,
    trigger: {},
    body: "你的线材又开始接触不良。别人只听见噪音，你却已经开始判断是哪一个焊点在松。",
    choices: [
      {
        id: "fix_cable",
        label: "拆开线头重焊",
        effects: [
          { kind: "playerStat", key: "technique", amount: 2 },
          { kind: "bandStat", key: "funds", amount: -40 }
        ],
        feedback: { title: "噪音被按下去", body: "你把那根线救了回来。鼓手说你看起来比弹琴时还专注。" }
      },
      {
        id: "play_through_noise",
        label: "带着噪音继续练",
        effects: [
          { kind: "playerStat", key: "stage", amount: 1 },
          { kind: "playerStat", key: "stress", amount: 2 }
        ],
        feedback: { title: "噪音也进了歌里", body: "你没有停，反而把那阵杂音卡进了段落里。它粗糙，但很有攻击性。" }
      }
    ]
  },
  {
    id: "campus.random.route_writer_last_verse",
    title: "最后一版副歌",
    tags: ["campus", "random", "route", "writer", "songwriting"],
    category: "random",
    phase: "campus",
    routes: ["writer"],
    rarity: "common",
    weight: 2,
    cooldownMonths: 2,
    repeatable: true,
    priority: 30,
    once: false,
    trigger: {},
    body: "你半夜又把副歌推翻了一次。主唱回消息很慢，只发来一句：这次你确定了吗？",
    choices: [
      {
        id: "rewrite_chorus",
        label: "继续重写",
        effects: [
          { kind: "playerStat", key: "creativity", amount: 3 },
          { kind: "relationship", character: "vocal", amount: -2 },
          { kind: "playerStat", key: "stress", amount: 3 }
        ],
        feedback: { title: "纸面上更锋利", body: "你知道它更好了，也知道大家明天会因为它重新吵一遍。" }
      },
      {
        id: "lock_version",
        label: "锁定这一版",
        effects: [
          { kind: "bandStat", key: "workQuality", amount: 2 },
          { kind: "relationship", character: "vocal", amount: 1 }
        ],
        feedback: { title: "终于不再改", body: "你把文件名里的 final_final 删掉。至少今晚，它真的是最后一版。" }
      }
    ]
  },
  {
    id: "campus.random.route_performer_empty_stage",
    title: "空礼堂试音",
    tags: ["campus", "random", "route", "performer", "stage"],
    category: "random",
    phase: "campus",
    routes: ["performer"],
    rarity: "common",
    weight: 2,
    cooldownMonths: 2,
    repeatable: true,
    priority: 30,
    once: false,
    trigger: {},
    body: "礼堂还没开灯，你站到舞台边缘试了几个和弦。空座位比观众更像观众。",
    choices: [
      {
        id: "practice_entrance",
        label: "练习登场动作",
        effects: [
          { kind: "playerStat", key: "stage", amount: 3 },
          { kind: "playerStat", key: "stress", amount: 2 }
        ],
        feedback: { title: "灯还没亮", body: "你提前记住了舞台的距离。到时候至少不会被第一排吓住。" }
      },
      {
        id: "listen_to_room",
        label: "听礼堂的回声",
        effects: [
          { kind: "bandStat", key: "workQuality", amount: 1 },
          { kind: "playerStat", key: "creativity", amount: 1 }
        ],
        feedback: { title: "回声比想象中长", body: "你意识到那段延音不能弹太满，否则整首歌会糊成一团。" }
      }
    ]
  },
  {
    id: "campus.random.route_rebel_poster_argument",
    title: "海报上的名字顺序",
    tags: ["campus", "random", "route", "rebel", "conflict"],
    category: "random",
    phase: "campus",
    routes: ["rebel"],
    rarity: "common",
    weight: 2,
    cooldownMonths: 2,
    repeatable: true,
    priority: 30,
    once: false,
    trigger: {},
    body: "毕业演出的海报把你们乐队名印得很小，还把赞助商放在正中间。你看得火大。",
    choices: [
      {
        id: "cross_out_sponsor",
        label: "拿马克笔改海报",
        effects: [
          { kind: "playerStat", key: "fame", amount: 2 },
          { kind: "playerStat", key: "stress", amount: 3 },
          { kind: "relationship", character: "bass", amount: -2 }
        ],
        feedback: { title: "黑色笔迹很醒目", body: "路过的人都看见了。贝斯手提醒你，明天老师也会看见。" }
      },
      {
        id: "make_own_poster",
        label: "自己做一版海报",
        effects: [
          { kind: "playerStat", key: "creativity", amount: 2 },
          { kind: "bandStat", key: "fans", amount: 3 },
          { kind: "playerStat", key: "wealth", amount: -60 }
        ],
        feedback: { title: "复印店的夜班", body: "你做了一版更难看的海报，但至少它像你们自己的东西。" }
      }
    ]
  },
  {
    id: "campus.random.route_technician_pickup_height",
    title: "拾音器高度实验",
    tags: ["campus", "random", "route", "technician", "equipment"],
    category: "random",
    phase: "campus",
    routes: ["technician"],
    rarity: "common",
    weight: 2,
    cooldownMonths: 2,
    repeatable: true,
    priority: 29,
    once: false,
    trigger: {},
    body: "你蹲在排练室地上调拾音器高度。主唱听不出差别，但你知道副歌的颗粒感变清楚了。",
    choices: [
      {
        id: "measure_carefully",
        label: "仔细量完再锁螺丝",
        effects: [
          { kind: "playerStat", key: "technique", amount: 2 },
          { kind: "bandStat", key: "workQuality", amount: 1 }
        ],
        feedback: { title: "差一点点也算数", body: "你把每颗螺丝都拧到合适的位置。声音没有变贵，但变得更像你。" }
      },
      {
        id: "rush_back_to_song",
        label: "差不多就回去排练",
        effects: [
          { kind: "bandStat", key: "cohesion", amount: 1 },
          { kind: "playerStat", key: "stress", amount: -1 }
        ],
        feedback: { title: "别再拧了", body: "你终于放下螺丝刀。鼓手敲了四下，整首歌重新动起来。" }
      }
    ]
  },
  {
    id: "campus.random.route_technician_metronome_trap",
    title: "节拍器陷阱",
    tags: ["campus", "random", "route", "technician", "practice"],
    category: "random",
    phase: "campus",
    routes: ["technician"],
    rarity: "common",
    weight: 2,
    cooldownMonths: 2,
    repeatable: true,
    priority: 29,
    once: false,
    trigger: {},
    body: "你把节拍器开得很响，发现全队在副歌前会集体抢半拍。没人想承认，但每个人都听见了。",
    choices: [
      {
        id: "drill_timing",
        label: "强行抠节奏",
        effects: [
          { kind: "bandStat", key: "cohesion", amount: 2 },
          { kind: "playerStat", key: "stress", amount: 3 }
        ],
        feedback: { title: "半拍被追回来", body: "这段排练很枯燥，但副歌终于不再像有人从楼梯上摔下来。" }
      },
      {
        id: "keep_human_push",
        label: "保留一点抢拍感",
        effects: [
          { kind: "playerStat", key: "stage", amount: 1 },
          { kind: "relationship", character: "drums", amount: 2 }
        ],
        feedback: { title: "不完全准确", body: "鼓手说这才像现场。你关掉节拍器，决定让那一点危险留下。" }
      }
    ]
  },
  {
    id: "campus.random.route_writer_notebook_margin",
    title: "歌词本页边的和弦",
    tags: ["campus", "random", "route", "writer", "songwriting"],
    category: "random",
    phase: "campus",
    routes: ["writer"],
    rarity: "common",
    weight: 2,
    cooldownMonths: 2,
    repeatable: true,
    priority: 29,
    once: false,
    trigger: {},
    body: "主唱的歌词本摊在桌上，页边写着几组你没见过的和弦。它们不完整，但有一种很固执的情绪。",
    choices: [
      {
        id: "build_from_margin",
        label: "拿页边和弦发展一段",
        effects: [
          { kind: "playerStat", key: "creativity", amount: 2 },
          { kind: "relationship", character: "vocal", amount: 2 }
        ],
        feedback: { title: "页边开始发声", body: "主唱看见你用了那几组和弦，表情先是惊讶，然后慢慢松下来。" }
      },
      {
        id: "write_counterpart",
        label: "写一段反向旋律",
        effects: [
          { kind: "bandStat", key: "workQuality", amount: 2 },
          { kind: "playerStat", key: "stress", amount: 1 }
        ],
        feedback: { title: "旋律互相顶住", body: "你没有顺着歌词走，而是写了一条反向的线。它让整首歌不再只是倾诉。" }
      }
    ]
  },
  {
    id: "campus.random.route_writer_library_demo",
    title: "图书馆耳机里的 Demo",
    tags: ["campus", "random", "route", "writer", "demo"],
    category: "random",
    phase: "campus",
    routes: ["writer"],
    rarity: "common",
    weight: 2,
    cooldownMonths: 2,
    repeatable: true,
    priority: 29,
    once: false,
    trigger: {},
    body: "你在图书馆戴着一边耳机偷听昨晚的录音。环境很安静，歌里的问题反而更大声。",
    choices: [
      {
        id: "mark_problems",
        label: "标出所有问题",
        effects: [
          { kind: "bandStat", key: "workQuality", amount: 2 },
          { kind: "playerStat", key: "stress", amount: 2 }
        ],
        feedback: { title: "红笔停不下来", body: "你写了半页修改意见。看起来残酷，但至少问题终于有了名字。" }
      },
      {
        id: "trust_first_take",
        label: "保留第一遍的粗糙",
        effects: [
          { kind: "playerStat", key: "creativity", amount: 1 },
          { kind: "bandStat", key: "cohesion", amount: 1 }
        ],
        feedback: { title: "不修得太干净", body: "你删掉几条修改意见。那种摇晃感也许不是错误，而是你们现在的样子。" }
      }
    ]
  },
  {
    id: "campus.random.route_performer_microphone_line",
    title: "麦克风线前的一步",
    tags: ["campus", "random", "route", "performer", "stage"],
    category: "random",
    phase: "campus",
    routes: ["performer"],
    rarity: "common",
    weight: 2,
    cooldownMonths: 2,
    repeatable: true,
    priority: 29,
    once: false,
    trigger: {},
    body: "你发现舞台中央那根麦克风线会卡住脚。只要副歌时多跨一步，整个人就能站到灯里。",
    choices: [
      {
        id: "claim_front",
        label: "练习走到灯里",
        effects: [
          { kind: "playerStat", key: "stage", amount: 2 },
          { kind: "playerStat", key: "stress", amount: 1 }
        ],
        feedback: { title: "一步之差", body: "你记住了那一步。它没有改变音乐，但改变了你面对观众的位置。" }
      },
      {
        id: "leave_space_for_vocal",
        label: "把位置留给主唱",
        effects: [
          { kind: "relationship", character: "vocal", amount: 2 },
          { kind: "bandStat", key: "cohesion", amount: 1 }
        ],
        feedback: { title: "灯分给别人", body: "你退后半步。主唱没有说什么，但排练结束时主动问了你的音量。" }
      }
    ]
  },
  {
    id: "campus.random.route_performer_friend_audience",
    title: "提前到场的同学",
    tags: ["campus", "random", "route", "performer", "audience"],
    category: "random",
    phase: "campus",
    routes: ["performer"],
    rarity: "common",
    weight: 2,
    cooldownMonths: 2,
    repeatable: true,
    priority: 29,
    once: false,
    trigger: {},
    body: "几个同学提前溜进礼堂看你们试音。他们没有恶意，但你突然意识到台下真的会有人盯着你。",
    choices: [
      {
        id: "play_to_them",
        label: "把他们当成观众",
        effects: [
          { kind: "playerStat", key: "stage", amount: 2 },
          { kind: "bandStat", key: "fans", amount: 2 }
        ],
        feedback: { title: "第一排有了脸", body: "你朝他们弹完了那段 solo。有人笑了，也有人认真鼓掌。" }
      },
      {
        id: "ask_for_space",
        label: "请他们正式演出再来",
        effects: [
          { kind: "playerStat", key: "stress", amount: -2 },
          { kind: "relationship", character: "bass", amount: 1 }
        ],
        feedback: { title: "门重新关上", body: "礼堂又空了下来。贝斯手说，至少你知道自己什么时候需要安静。" }
      }
    ]
  },
  {
    id: "campus.random.route_rebel_teacher_warning",
    title: "老师的音量警告",
    tags: ["campus", "random", "route", "rebel", "conflict"],
    category: "random",
    phase: "campus",
    routes: ["rebel"],
    rarity: "common",
    weight: 2,
    cooldownMonths: 2,
    repeatable: true,
    priority: 29,
    once: false,
    trigger: {},
    body: "老师推开门，说你们的音量已经影响隔壁彩排。你看了一眼音箱，音量旋钮其实还能再往右。",
    choices: [
      {
        id: "turn_down",
        label: "先把音量降下来",
        effects: [
          { kind: "relationship", character: "bass", amount: 2 },
          { kind: "playerStat", key: "stress", amount: -1 }
        ],
        feedback: { title: "忍一口气", body: "你把音量拧低。不是服气，只是不想在演出前失去排练室。" }
      },
      {
        id: "push_louder",
        label: "最后一遍开更大声",
        effects: [
          { kind: "playerStat", key: "stage", amount: 2 },
          { kind: "playerStat", key: "stress", amount: 3 },
          { kind: "bandStat", key: "reputation", amount: 1 }
        ],
        feedback: { title: "墙也在震", body: "那一遍确实更有力。代价是你们被提前赶出了排练室。" }
      }
    ]
  },
  {
    id: "campus.random.route_rebel_setlist_cut",
    title: "被要求删掉的一首歌",
    tags: ["campus", "random", "route", "rebel", "setlist"],
    category: "random",
    phase: "campus",
    routes: ["rebel"],
    rarity: "common",
    weight: 2,
    cooldownMonths: 2,
    repeatable: true,
    priority: 29,
    once: false,
    trigger: {},
    body: "负责老师建议你们删掉最吵的那首歌，说毕业演出要照顾气氛。你知道那首才最像你们。",
    choices: [
      {
        id: "keep_noisy_song",
        label: "坚持保留",
        effects: [
          { kind: "playerStat", key: "fame", amount: 1 },
          { kind: "relationship", character: "vocal", amount: 1 },
          { kind: "playerStat", key: "stress", amount: 3 }
        ],
        feedback: { title: "歌单没有变短", body: "你们决定照原样演。主唱说，如果毕业都不能吵一次，以后更不会。" }
      },
      {
        id: "hide_riff_elsewhere",
        label: "把 Riff 藏进另一首",
        effects: [
          { kind: "playerStat", key: "creativity", amount: 2 },
          { kind: "bandStat", key: "workQuality", amount: 1 }
        ],
        feedback: { title: "没有真的删掉", body: "你把那段 Riff 偷偷塞进结尾。懂的人会听见，不懂的人只会觉得突然变脏了。" }
      }
    ]
  },
  {
    id: "career.first_livehouse_offer",
    title: "第一次 Livehouse 机会",
    tags: ["career", "livehouse"],
    category: "anchor",
    phase: "career",
    careerStages: ["early"],
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
  },
  {
    id: "career.fallback.first_open_stage",
    title: "开放舞台的保底名额",
    tags: ["career", "fallback", "livehouse", "performance"],
    category: "fallback",
    phase: "career",
    careerStages: ["early"],
    priority: 65,
    once: true,
    trigger: {
      months: ["2027-06", "2027-07", "2027-08"],
      flagsAll: ["campus.graduationShowDone"],
      flagsNone: ["career.hasLivehouseOffer", "career.firstLivehouseDone"]
    },
    body: "毕业演出没有立刻换来正式邀约，但周航在旧海报栏里看到一个开放舞台名额。没有后台，没有报酬，只有十分钟和一盏很低的灯。",
    choices: [
      {
        id: "play_open_stage",
        label: "先把十分钟演下来",
        effects: [
          { kind: "playerStat", key: "fame", amount: 3 },
          { kind: "bandStat", key: "fans", amount: 8 },
          { kind: "playerStat", key: "wealth", amount: 120 },
          { kind: "playerStat", key: "health", amount: -2 },
          { kind: "flag", key: "career.firstLivehouseDone", value: true },
          {
            kind: "addHistory",
            entry: {
              type: "performance",
              title: "第一次开放舞台",
              description: "毕业后的第一个正式夜晚，你们在开放舞台挤出十分钟。灯很低，但台下终于不全是同学。",
              weight: 2,
              tags: ["career", "livehouse", "first-stage"]
            }
          }
        ],
        feedback: {
          title: "灯低也要开声",
          body: "林夏握着话筒时有点发抖，唐野数拍比平时慢半秒。第一首歌结束后，角落里有两个人真的鼓了掌。"
        }
      },
      {
        id: "skip_open_stage",
        label: "暂时不接这种场",
        effects: [
          { kind: "bandStat", key: "workQuality", amount: 2 },
          { kind: "counter", key: "missedOpportunities", amount: 1 },
          { kind: "flag", key: "career.firstLivehouseDone", value: true }
        ],
        feedback: {
          title: "海报被雨泡皱",
          body: "你们说再等等。回去的路上，周航没有反对，只把那张湿掉的海报折进了琴包。"
        }
      }
    ]
  },
  {
    id: "career.random.open_mic_flyer",
    title: "地下酒吧的开放麦海报",
    tags: ["career", "random", "livehouse", "performance"],
    category: "random",
    phase: "career",
    careerStages: ["early"],
    rarity: "common",
    weight: 3,
    cooldownMonths: 2,
    repeatable: true,
    priority: 35,
    once: false,
    trigger: { flagsAll: ["campus.graduationShowDone"] },
    body: "便利店门口贴着一张手写开放麦海报，时间很晚，场地很小，但上面写着“原创乐队优先”。",
    choices: [
      {
        id: "take_open_mic",
        label: "报名试一场",
        effects: [
          { kind: "playerStat", key: "fame", amount: 2 },
          { kind: "bandStat", key: "fans", amount: 5 },
          { kind: "playerStat", key: "stress", amount: 2 }
        ],
        feedback: { title: "名字被念出来", body: "主持人念错了乐队名，但至少台下有人抬头。唐野说，下次要让他们记住。" }
      },
      {
        id: "ignore_flyer",
        label: "先不急着上台",
        effects: [
          { kind: "bandStat", key: "workQuality", amount: 1 },
          { kind: "playerStat", key: "stress", amount: -1 }
        ],
        feedback: { title: "海报留在墙上", body: "你们把这晚留给排练。林夏说，错过一次不算逃跑，但不能一直错过。" }
      }
    ]
  },
  {
    id: "career.random.basement_scene_invite",
    title: "地下排练室的拼场邀请",
    tags: ["career", "random", "scene", "rehearsal"],
    category: "random",
    phase: "career",
    careerStages: ["early"],
    rarity: "common",
    weight: 2,
    cooldownMonths: 2,
    repeatable: true,
    priority: 32,
    once: false,
    trigger: { flagsAll: ["campus.graduationShowDone"] },
    body: "隔壁排练室的乐队缺一个拼场对象。他们不认识你们，只说如果声音够真，就一起凑下一场。",
    choices: [
      {
        id: "join_scene_rehearsal",
        label: "去听一晚",
        effects: [
          { kind: "bandStat", key: "cohesion", amount: 2 },
          { kind: "bandStat", key: "fans", amount: 3 },
          { kind: "playerStat", key: "wealth", amount: -60 }
        ],
        feedback: { title: "地下室没有门牌", body: "那晚你们没赚到钱，但认识了两个愿意交换场次的人。周航说，这比传单有用。" }
      },
      {
        id: "stay_in_own_room",
        label: "留在自己的排练室",
        effects: [
          { kind: "bandStat", key: "workQuality", amount: 2 },
          { kind: "relationship", character: "bass", amount: -1 }
        ],
        feedback: { title: "墙外的鼓声", body: "你们继续打磨自己的歌。隔壁的鼓声透过墙传来，像另一条正在错过的路。" }
      }
    ]
  },
  {
    id: "career.random.poster_wall",
    title: "Livehouse 门口的海报墙",
    tags: ["career", "random", "promotion"],
    category: "random",
    phase: "career",
    careerStages: ["early"],
    rarity: "common",
    weight: 2,
    cooldownMonths: 2,
    repeatable: true,
    priority: 30,
    once: false,
    trigger: { flagsAll: ["campus.graduationShowDone"] },
    body: "一家 Livehouse 门口的海报墙还留着几个空位。贴上去不会立刻改变什么，但总比只在朋友圈里喊要真实。",
    choices: [
      {
        id: "print_posters",
        label: "花钱印一批海报",
        effects: [
          { kind: "playerStat", key: "wealth", amount: -80 },
          { kind: "bandStat", key: "fans", amount: 6 },
          { kind: "playerStat", key: "fame", amount: 1 }
        ],
        feedback: { title: "纸面上的乐队名", body: "海报被贴上墙的时候，林夏盯着看了很久。她说，这几个字第一次不像社团通知。" }
      },
      {
        id: "save_poster_money",
        label: "省下这笔钱",
        effects: [
          { kind: "playerStat", key: "wealth", amount: 40 },
          { kind: "playerStat", key: "stress", amount: -1 }
        ],
        feedback: { title: "空位还空着", body: "你们从海报墙前走过去。唐野回头看了一眼，但什么也没说。" }
      }
    ]
  },
  {
    id: "career.random.student_radio_demo_request",
    title: "校园电台的 Demo 征集",
    tags: ["career", "random", "demo", "media"],
    category: "random",
    phase: "career",
    careerStages: ["early"],
    rarity: "uncommon",
    weight: 1,
    cooldownMonths: 4,
    repeatable: false,
    priority: 34,
    once: false,
    trigger: { flagsAll: ["campus.graduationShowDone"], flagsNone: ["career.demoSentToRadio"], hasDemo: true },
    body: "毕业后，校园电台还在征集校友乐队的 Demo。听众不多，但这是第一次有人要你们留下可播放的版本。",
    choices: [
      {
        id: "send_demo",
        label: "把 Demo 投过去",
        effects: [
          { kind: "playerStat", key: "fame", amount: 3 },
          { kind: "bandStat", key: "fans", amount: 8 },
          { kind: "flag", key: "career.demoSentToRadio", value: true },
          {
            kind: "addHistory",
            entry: {
              type: "recording",
              title: "Demo 第一次被投递",
              description: "你们把第一版 Demo 发给校园电台。信箱提示发送成功时，排练室突然安静了一秒。",
              weight: 2,
              tags: ["career", "demo", "radio"]
            }
          }
        ],
        feedback: { title: "发送成功", body: "文件上传很慢。进度条走完以后，林夏说：现在它真的离开排练室了。" }
      },
      {
        id: "hold_demo",
        label: "再录得好一点",
        effects: [
          { kind: "bandStat", key: "workQuality", amount: 2 },
          { kind: "playerStat", key: "stress", amount: 2 }
        ],
        feedback: { title: "暂时不发", body: "你关掉邮件窗口。周航说可以再等等，但别等到没人记得这首歌。" }
      }
    ]
  },
  {
    id: "career.anchor.negotiated_street_show",
    title: "街角演出的许可",
    tags: ["career", "anchor", "street", "performance", "negotiated"],
    category: "anchor",
    phase: "career",
    priority: 58,
    once: false,
    cooldownMonths: 2,
    trigger: { flagsAll: ["campus.graduationShowDone"] },
    body: "你们沿着几家店问到傍晚，终于有一家唱片店愿意让门口的空地借给你们半小时。没有票房，没有后台，只有路人和一条随时会被城管打断的电源线。",
    choices: [
      {
        id: "play_street_set",
        label: "把半小时演满",
        effects: [
          { kind: "playerStat", key: "fame", amount: 2 },
          { kind: "bandStat", key: "fans", amount: 6 },
          { kind: "playerStat", key: "wealth", amount: 80 },
          { kind: "playerStat", key: "stress", amount: 2 },
          {
            kind: "addHistory",
            entry: {
              type: "performance",
              title: "街角演出",
              description: "你们在唱片店门口接上电源。有人停下，有人离开，但乐队第一次把城市街声也算进了节拍。",
              weight: 2,
              tags: ["career", "street", "performance"]
            }
          }
        ],
        feedback: {
          title: "路人停下脚步",
          body: "第一首歌时只有风吹过琴盒。第三首歌结束，有个陌生人问你们什么时候还有下一场。"
        }
      },
      {
        id: "save_for_room",
        label: "改成排练室试演",
        effects: [
          { kind: "bandStat", key: "workQuality", amount: 2 },
          { kind: "relationship", character: "drums", amount: -1 }
        ],
        feedback: { title: "电源线收回包里", body: "你们决定先不站到街上。唐野没有反对，只说总有一天歌要从门里出去。" }
      }
    ]
  },
  {
    id: "career.anchor.negotiated_livehouse_slot",
    title: "谈来的 Livehouse 档期",
    tags: ["career", "anchor", "livehouse", "performance", "negotiated"],
    category: "anchor",
    phase: "career",
    priority: 60,
    once: false,
    cooldownMonths: 3,
    trigger: { flagsAll: ["campus.graduationShowDone"] },
    body: "你把 Demo、现场片段和几张粗糙海报发给场地方。对方回得很慢，最后只给了一个周三深夜的档期，但那仍然是一扇门。",
    choices: [
      {
        id: "accept_late_slot",
        label: "接下深夜档",
        effects: [
          { kind: "playerStat", key: "fame", amount: 4 },
          { kind: "bandStat", key: "fans", amount: 12 },
          { kind: "bandStat", key: "reputation", amount: 2 },
          { kind: "playerStat", key: "wealth", amount: 180 },
          { kind: "playerStat", key: "health", amount: -2 },
          {
            kind: "addHistory",
            entry: {
              type: "performance",
              title: "深夜 Livehouse 档期",
              description: "你们谈来一场周三深夜的 Livehouse。灯亮得很晚，但这次门票上印着乐队名。",
              weight: 2,
              tags: ["career", "livehouse", "performance"]
            }
          }
        ],
        feedback: { title: "周三也有观众", body: "台下没有满，但留下的人都离舞台很近。林夏唱到副歌时，前排有人跟上了旋律。" }
      },
      {
        id: "ask_better_slot",
        label: "继续争取更好档期",
        effects: [
          { kind: "bandStat", key: "reputation", amount: 1 },
          { kind: "playerStat", key: "stress", amount: 3 },
          { kind: "counter", key: "missedOpportunities", amount: 1 }
        ],
        feedback: { title: "邮件还没回", body: "你们没有立刻答应。周航说可以谈，但别把每扇门都谈到关上。" }
      }
    ]
  },
  {
    id: "career.anchor.negotiated_commercial_show",
    title: "商演合同的下午",
    tags: ["career", "anchor", "commercial", "performance", "negotiated"],
    category: "anchor",
    phase: "career",
    priority: 62,
    once: false,
    cooldownMonths: 4,
    trigger: { flagsAll: ["campus.graduationShowDone"] },
    body: "一场品牌活动愿意付一笔体面的报酬，但歌单要短，音量要稳，结尾还要配合主持人念出赞助词。钱是真的，犹豫也是真的。",
    choices: [
      {
        id: "take_commercial_show",
        label: "接下商演",
        effects: [
          { kind: "playerStat", key: "wealth", amount: 650 },
          { kind: "bandStat", key: "funds", amount: 650 },
          { kind: "playerStat", key: "fame", amount: 3 },
          { kind: "bandStat", key: "fans", amount: 8 },
          { kind: "bandStat", key: "reputation", amount: -1 },
          { kind: "counter", key: "contractCompromises", amount: 1 },
          {
            kind: "addHistory",
            entry: {
              type: "performance",
              title: "第一场商演",
              description: "你们接下一场品牌活动。谢幕时掌声很整齐，回程车上也第一次不用算下个月棚费。",
              weight: 2,
              tags: ["career", "commercial", "performance"]
            }
          }
        ],
        feedback: { title: "掌声整齐得有点陌生", body: "这不是你们想象中的舞台，但钱到账时，所有人都沉默了几秒。现实也会打拍子。" }
      },
      {
        id: "keep_setlist_intact",
        label: "拒绝改歌单",
        effects: [
          { kind: "bandStat", key: "reputation", amount: 3 },
          { kind: "relationship", character: "vocal", amount: 2 },
          { kind: "playerStat", key: "stress", amount: 2 }
        ],
        feedback: { title: "歌单没有被删短", body: "你们没有签。林夏说她不反对赚钱，只是不想第一次被更多人听见时，唱的不像自己。" }
      }
    ]
  },
  {
    id: "career.anchor.negotiated_festival_slot",
    title: "谈下来的音乐节侧台",
    tags: ["career", "anchor", "festival", "performance", "negotiated"],
    category: "anchor",
    phase: "career",
    careerStages: ["rising", "mature", "late"],
    priority: 68,
    once: false,
    cooldownMonths: 8,
    trigger: {
      flagsAll: ["campus.graduationShowDone"],
      hasAlbum: true,
      minReleaseCriticalScore: 65,
      minPlayer: { fame: 28, technique: 50, stage: 45 },
      minBand: { workQuality: 55, reputation: 25, fans: 120 }
    },
    body: "你们带着专辑、媒体短评和几段现场录像去谈，最后换来音乐节侧台的下午时段。不是主舞台，但那片草地会有很多不认识你们的人。",
    choices: [
      {
        id: "play_festival_side_stage",
        label: "准备音乐节演出",
        effects: [
          { kind: "playerStat", key: "fame", amount: 8 },
          { kind: "bandStat", key: "fans", amount: 55 },
          { kind: "bandStat", key: "reputation", amount: 6 },
          { kind: "bandStat", key: "funds", amount: -300 },
          { kind: "playerStat", key: "health", amount: -4 },
          {
            kind: "addHistory",
            entry: {
              type: "performance",
              title: "音乐节侧台",
              description: "专辑把你们带到音乐节侧台。太阳还没落山，但草地上第一次出现了成片举起的手。",
              weight: 4,
              tags: ["career", "festival", "performance", "album"]
            }
          }
        ],
        feedback: { title: "草地上有人举手", body: "开场前你还能听见主舞台的低频。等到副歌响起，眼前这片草地终于只听你们。" }
      },
      {
        id: "hold_for_better_billing",
        label: "等更好的排位",
        effects: [
          { kind: "bandStat", key: "workQuality", amount: 3 },
          { kind: "bandStat", key: "reputation", amount: 1 },
          { kind: "counter", key: "missedOpportunities", amount: 1 }
        ],
        feedback: { title: "排位表上没有名字", body: "你们决定再等一轮。周航把邀请邮件归档，说下次要让他们主动把时间写得更晚。" }
      }
    ]
  },
  {
    id: "career.anchor.negotiated_tour_offer",
    title: "巡演合作的路线图",
    tags: ["career", "anchor", "tour", "performance", "negotiated"],
    category: "anchor",
    phase: "career",
    careerStages: ["rising", "mature", "late"],
    priority: 72,
    once: false,
    cooldownMonths: 10,
    trigger: {
      flagsAll: ["campus.graduationShowDone"],
      hasAlbum: true,
      minReleaseCriticalScore: 70,
      minPlayer: { fame: 42, technique: 55, stage: 55, health: 45 },
      minBand: { workQuality: 65, reputation: 38, fans: 350, funds: 800 }
    },
    body: "巡演合作方把城市、车程、预算和风险摊在桌上。专辑让这些地名第一次连成路线，也让你们必须决定这支乐队能不能离开熟悉的城市。",
    choices: [
      {
        id: "take_album_tour",
        label: "启动专辑巡演",
        effects: [
          { kind: "playerStat", key: "fame", amount: 12 },
          { kind: "bandStat", key: "fans", amount: 120 },
          { kind: "bandStat", key: "reputation", amount: 8 },
          { kind: "bandStat", key: "funds", amount: -700 },
          { kind: "playerStat", key: "health", amount: -8 },
          { kind: "relationship", character: "vocal", amount: 2 },
          { kind: "relationship", character: "bass", amount: 1 },
          { kind: "relationship", character: "drums", amount: 2 },
          {
            kind: "addHistory",
            entry: {
              type: "performance",
              title: "第一次专辑巡演",
              description: "你们把专辑带上路。每一座城市都让乐队名多一次被念出的机会，也让每个人更清楚继续的代价。",
              weight: 5,
              tags: ["career", "tour", "performance", "album"]
            }
          }
        ],
        feedback: { title: "城市连成一条线", body: "唐野在路线图上画圈，林夏数着休息日。你抱着琴，第一次觉得专辑不是终点，而是一张车票。" }
      },
      {
        id: "delay_tour",
        label: "推迟巡演",
        effects: [
          { kind: "bandStat", key: "funds", amount: 150 },
          { kind: "playerStat", key: "health", amount: 2 },
          { kind: "counter", key: "missedOpportunities", amount: 1 }
        ],
        feedback: { title: "路线图被折起来", body: "你们暂时没有上路。没人说这是放弃，但每个人都看见那些城市名在纸上暗了下去。" }
      }
    ]
  },
  {
    id: "career.random.street_corner_set",
    title: "地铁口的临时人潮",
    tags: ["career", "random", "street", "performance"],
    category: "random",
    phase: "career",
    rarity: "common",
    weight: 3,
    cooldownMonths: 2,
    repeatable: true,
    priority: 33,
    once: false,
    trigger: { flagsAll: ["campus.graduationShowDone"] },
    body: "雨停后的地铁口忽然有了人潮。唐野说器材就在车上，林夏看着你，像在等一个“现在就来”的眼神。",
    choices: [
      {
        id: "unpack_at_corner",
        label: "就在街角开演",
        effects: [
          { kind: "playerStat", key: "fame", amount: 2 },
          { kind: "bandStat", key: "fans", amount: 5 },
          { kind: "playerStat", key: "wealth", amount: 60 },
          { kind: "playerStat", key: "health", amount: -1 }
        ],
        feedback: { title: "雨水还在反光", body: "你们站在湿掉的地砖上开声。没有灯光，但每个停下的人都像一束临时追光。" }
      },
      {
        id: "keep_moving",
        label: "赶去排练",
        effects: [
          { kind: "bandStat", key: "workQuality", amount: 1 },
          { kind: "playerStat", key: "stress", amount: -1 }
        ],
        feedback: { title: "人潮从身后过去", body: "你们没有停下。贝斯包擦过一个路人的伞，像错过了一次很短的舞台。" }
      }
    ]
  },
  {
    id: "career.random.commercial_show_offer",
    title: "活动公司打来的电话",
    tags: ["career", "random", "commercial", "performance"],
    category: "random",
    phase: "career",
    rarity: "uncommon",
    weight: 1,
    cooldownMonths: 5,
    repeatable: true,
    priority: 38,
    once: false,
    trigger: {
      flagsAll: ["campus.graduationShowDone"],
      minPlayer: { fame: 18, stage: 35 },
      minBand: { fans: 80 }
    },
    body: "活动公司说他们在网上看过你们的现场片段，想请你们去一个商场中庭演出。报价不低，条件也不少。",
    choices: [
      {
        id: "accept_mall_stage",
        label: "接受中庭舞台",
        effects: [
          { kind: "playerStat", key: "wealth", amount: 500 },
          { kind: "bandStat", key: "funds", amount: 500 },
          { kind: "bandStat", key: "fans", amount: 10 },
          { kind: "bandStat", key: "reputation", amount: -1 },
          { kind: "counter", key: "contractCompromises", amount: 1 }
        ],
        feedback: { title: "中庭的回声", body: "扶梯旁的掌声来得很快也散得很快。你们赚到钱，也听见自己的歌被空间磨平了一点。" }
      },
      {
        id: "decline_mall_stage",
        label: "婉拒这次商演",
        effects: [
          { kind: "bandStat", key: "reputation", amount: 2 },
          { kind: "relationship", character: "bass", amount: -1 }
        ],
        feedback: { title: "报价留在短信里", body: "周航没有立刻说话。他理解这口气，但也清楚账本不会因为坚持而自动变轻。" }
      }
    ]
  },
  {
    id: "career.random.first_release_blog_review",
    title: "独立乐评博客的短评",
    tags: ["career", "random", "release", "media", "review"],
    category: "random",
    phase: "career",
    careerStages: ["early", "rising"],
    rarity: "uncommon",
    weight: 2,
    cooldownMonths: 6,
    repeatable: false,
    priority: 39,
    once: false,
    trigger: {
      flagsAll: ["campus.graduationShowDone"],
      minReleases: 1,
      minReleaseCriticalScore: 55
    },
    body: "你们的发行被一个独立乐评博客写进周末推荐。文章不长，甚至有几处理解错了歌词，但那是第一次有陌生人认真谈论你们的歌。",
    choices: [
      {
        id: "share_review",
        label: "公开转发这篇短评",
        effects: [
          { kind: "playerStat", key: "fame", amount: 3 },
          { kind: "bandStat", key: "fans", amount: 18 },
          { kind: "bandStat", key: "reputation", amount: 3 },
          {
            kind: "addHistory",
            entry: {
              type: "release",
              title: "第一次被乐评写到",
              description: "独立乐评博客把你们的发行写进周末推荐。那不是大奖，但足够让乐队名在陌生页面上停留一晚。",
              weight: 3,
              tags: ["career", "release", "media"]
            }
          }
        ],
        feedback: { title: "陌生人认真听了", body: "转发出去以后，评论慢慢出现。有人喜欢音色，有人嫌主歌太长，但他们都真的听了。" }
      },
      {
        id: "keep_working",
        label: "不转发，继续写歌",
        effects: [
          { kind: "bandStat", key: "workQuality", amount: 2 },
          { kind: "playerStat", key: "stress", amount: -1 }
        ],
        feedback: { title: "文章留在收藏夹", body: "你没有把它发出去。周航说，被看见很好，但下一首歌更重要。" }
      }
    ]
  },
  {
    id: "career.random.release_aftershow_offer",
    title: "发行后追加的拼场",
    tags: ["career", "random", "release", "livehouse", "performance"],
    category: "random",
    phase: "career",
    careerStages: ["early", "rising"],
    rarity: "common",
    weight: 2,
    cooldownMonths: 3,
    repeatable: true,
    priority: 37,
    once: false,
    trigger: {
      flagsAll: ["campus.graduationShowDone"],
      minReleases: 1,
      minBand: { reputation: 18 }
    },
    body: "发行之后，有乐队在后台私信你们，问要不要一起拼一场 Livehouse。对方说他们听过那首歌，觉得你们的声音适合放在同一晚。",
    choices: [
      {
        id: "take_aftershow_slot",
        label: "接下拼场",
        effects: [
          { kind: "playerStat", key: "fame", amount: 4 },
          { kind: "bandStat", key: "fans", amount: 18 },
          { kind: "bandStat", key: "reputation", amount: 2 },
          { kind: "playerStat", key: "health", amount: -2 }
        ],
        feedback: { title: "发行变成舞台", body: "那晚台下有人是因为发行来的。林夏唱第一句前，你听见有人小声说：就是他们。" }
      },
      {
        id: "skip_aftershow_slot",
        label: "先专心下一首",
        effects: [
          { kind: "bandStat", key: "workQuality", amount: 2 },
          { kind: "counter", key: "missedOpportunities", amount: 1 }
        ],
        feedback: { title: "私信没有继续", body: "你们把机会放到一边。唐野说没关系，但他还是反复看了几次对方的海报。" }
      }
    ]
  },
  {
    id: "career.random.release_commercial_pressure",
    title: "发行热度带来的商演报价",
    tags: ["career", "random", "release", "commercial", "pressure"],
    category: "random",
    phase: "career",
    careerStages: ["early", "rising", "mature"],
    rarity: "uncommon",
    weight: 1,
    cooldownMonths: 6,
    repeatable: true,
    priority: 40,
    once: false,
    trigger: {
      flagsAll: ["campus.graduationShowDone"],
      minReleases: 1,
      minReleaseSales: 500,
      minPlayer: { fame: 18 },
      minBand: { fans: 120 }
    },
    body: "发行数据刚有起色，一家活动公司就发来报价。他们不谈作品，只谈播放量、到场人数和能不能把副歌剪短给品牌口播让位。",
    choices: [
      {
        id: "accept_release_commercial_offer",
        label: "接下报价补资金",
        effects: [
          { kind: "playerStat", key: "wealth", amount: 700 },
          { kind: "bandStat", key: "funds", amount: 700 },
          { kind: "bandStat", key: "reputation", amount: -2 },
          { kind: "counter", key: "contractCompromises", amount: 1 }
        ],
        feedback: { title: "热度被换成现金", body: "钱很快到账。回程路上，周航说这能撑很久，林夏却一直没摘耳机。" }
      },
      {
        id: "protect_release_identity",
        label: "拒绝改编副歌",
        effects: [
          { kind: "bandStat", key: "reputation", amount: 3 },
          { kind: "relationship", character: "vocal", amount: 2 },
          { kind: "playerStat", key: "stress", amount: 3 }
        ],
        feedback: { title: "副歌没有让位", body: "你们拒绝了。压力没有消失，但至少那首歌还完整地站在那里。" }
      }
    ]
  },
  {
    id: "career.random.first_regular_fan",
    title: "第一个总在前排的人",
    tags: ["career", "random", "fan", "performance"],
    category: "random",
    phase: "career",
    careerStages: ["early", "rising"],
    rarity: "uncommon",
    weight: 2,
    cooldownMonths: 5,
    repeatable: false,
    priority: 38,
    once: false,
    trigger: {
      flagsAll: ["campus.graduationShowDone"],
      flagsNone: ["fan.firstRegularSeen"],
      minPlayer: { fame: 15 },
      minBand: { fans: 60, reputation: 15 }
    },
    body: "连续第三场，你在第一排看见同一张脸。对方没有喊得很大声，只是在每首歌结束后认真鼓掌，像是已经把你们当成某种约定。",
    choices: [
      {
        id: "remember_first_fan",
        label: "演后主动打招呼",
        effects: [
          { kind: "bandStat", key: "fans", amount: 18 },
          { kind: "playerStat", key: "fame", amount: 2 },
          { kind: "relationship", character: "vocal", amount: 1 },
          { kind: "flag", key: "fan.firstRegularSeen", value: true },
          {
            kind: "addHistory",
            entry: {
              type: "performance",
              title: "第一个固定听众",
              description: "你们第一次记住了一个总在前排的人。乐队开始不只是被路过的人听见。",
              weight: 3,
              tags: ["career", "fan", "performance"]
            }
          }
        ],
        feedback: { title: "前排有了名字", body: "对方说第一次听见你们是在雨后的街角。林夏笑了很久，因为那首歌当时其实唱错了一句。" }
      },
      {
        id: "keep_distance_from_fan",
        label: "保持距离继续收线",
        effects: [
          { kind: "bandStat", key: "fans", amount: 8 },
          { kind: "playerStat", key: "stress", amount: -1 },
          { kind: "flag", key: "fan.firstRegularSeen", value: true }
        ],
        feedback: { title: "掌声留在身后", body: "你没有过去。周航说被喜欢也是一种压力，但至少这次压力来自台下真的有人在等。" }
      }
    ]
  },
  {
    id: "career.random.fan_recording_clip",
    title: "被粉丝拍下的一段失误",
    tags: ["career", "random", "fan", "media", "performance"],
    category: "random",
    phase: "career",
    careerStages: ["early", "rising"],
    rarity: "uncommon",
    weight: 2,
    cooldownMonths: 6,
    repeatable: true,
    priority: 39,
    once: false,
    trigger: {
      flagsAll: ["campus.graduationShowDone"],
      minReleases: 1,
      minPlayer: { fame: 24 },
      minBand: { fans: 180, reputation: 25 }
    },
    body: "一段现场视频在小范围转开。镜头很晃，音质很糟，偏偏拍到了你进副歌前弹错的那一下，也拍到了整支乐队把它救回来的三秒。",
    choices: [
      {
        id: "own_the_mistake",
        label: "转发并承认那一下",
        effects: [
          { kind: "bandStat", key: "fans", amount: 24 },
          { kind: "bandStat", key: "reputation", amount: 2 },
          { kind: "playerStat", key: "stress", amount: 2 },
          { kind: "relationship", character: "drums", amount: 1 }
        ],
        feedback: { title: "失误也被听见", body: "评论里有人说最喜欢的反而是那三秒。唐野说，至少他们知道我们不是靠剪辑活着。" }
      },
      {
        id: "ask_to_remove_clip",
        label: "私信请求删除视频",
        effects: [
          { kind: "playerStat", key: "stress", amount: -2 },
          { kind: "bandStat", key: "reputation", amount: -1 },
          { kind: "relationship", character: "vocal", amount: -1 }
        ],
        feedback: { title: "视频消失了", body: "对方很快删掉了视频。林夏说她理解你，但也觉得那段被救回来的混乱很像现在的你们。" }
      }
    ]
  },
  {
    id: "career.rare.fan_chorus_moment",
    title: "副歌被观众先唱出来",
    tags: ["career", "rare", "fan", "performance", "release"],
    category: "rare",
    phase: "career",
    careerStages: ["early", "rising", "mature"],
    rarity: "rare",
    weight: 1,
    cooldownMonths: 10,
    repeatable: false,
    priority: 45,
    once: false,
    trigger: {
      flagsAll: ["campus.graduationShowDone"],
      flagsNone: ["fan.chorusMoment"],
      minReleases: 1,
      minReleaseCriticalScore: 65,
      minPlayer: { fame: 30 },
      minBand: { fans: 240, reputation: 30, workQuality: 55 }
    },
    body: "第二段副歌还没到，台下已经有人提前唱了出来。林夏愣了一拍，你的右手也差点慢下来，因为那句旋律第一次不是从舞台上开始。",
    choices: [
      {
        id: "let_crowd_sing",
        label: "把副歌交给观众",
        effects: [
          { kind: "playerStat", key: "fame", amount: 6 },
          { kind: "bandStat", key: "fans", amount: 70 },
          { kind: "bandStat", key: "reputation", amount: 5 },
          { kind: "relationship", character: "vocal", amount: 2 },
          { kind: "flag", key: "fan.chorusMoment", value: true },
          {
            kind: "addHistory",
            entry: {
              type: "performance",
              title: "观众唱出副歌",
              description: "有一晚，副歌在舞台开口前先从台下响起。乐队第一次确认歌已经离开自己。",
              weight: 5,
              tags: ["career", "fan", "performance", "release"]
            }
          }
        ],
        feedback: { title: "歌离开了舞台", body: "林夏把麦克风推向台下。那一刻你没有再想着弹得准不准，只觉得这首歌终于被更多人共同拥有。" }
      },
      {
        id: "play_louder_over_crowd",
        label: "把音墙推得更高",
        effects: [
          { kind: "playerStat", key: "stage", amount: 3 },
          { kind: "bandStat", key: "fans", amount: 35 },
          { kind: "playerStat", key: "stress", amount: 2 },
          { kind: "flag", key: "fan.chorusMoment", value: true }
        ],
        feedback: { title: "副歌被推高", body: "你把音量踩上去，像是还不习惯把歌交出去。台下仍然唱着，只是被更大的失真托了起来。" }
      }
    ]
  },
  {
    id: "career.random.label_a_and_r_email",
    title: "厂牌 A&R 的邮件",
    tags: ["career", "random", "label", "contract", "release"],
    category: "random",
    phase: "career",
    careerStages: ["early", "rising"],
    rarity: "uncommon",
    weight: 2,
    cooldownMonths: 8,
    repeatable: false,
    priority: 42,
    once: false,
    trigger: {
      flagsAll: ["campus.graduationShowDone"],
      flagsNone: ["label.aAndREmailReplied"],
      minReleases: 1,
      minReleaseCriticalScore: 65,
      minReleaseSales: 1200,
      minPlayer: { fame: 30 },
      minBand: { fans: 300, reputation: 35, workQuality: 60 }
    },
    body: "邮件标题很普通：想聊聊你们的下一步。署名来自一家不算大的独立厂牌。对方提到你们最近的发行、现场视频，也提到“更稳定的市场计划”。",
    choices: [
      {
        id: "reply_with_boundaries",
        label: "回复并先说清边界",
        effects: [
          { kind: "bandStat", key: "reputation", amount: 3 },
          { kind: "playerStat", key: "stress", amount: 2 },
          { kind: "relationship", character: "vocal", amount: 1 },
          { kind: "flag", key: "label.aAndREmailReplied", value: true }
        ],
        feedback: { title: "邮件被认真回了", body: "你写了很久，删掉几句太硬的话。周航说，能谈是好事，但第一封回信就要让对方知道你们不是空白合同。" }
      },
      {
        id: "send_stats_first",
        label: "先发数据和现场链接",
        effects: [
          { kind: "playerStat", key: "fame", amount: 3 },
          { kind: "bandStat", key: "fans", amount: 20 },
          { kind: "counter", key: "contractCompromises", amount: 1 },
          { kind: "flag", key: "label.aAndREmailReplied", value: true }
        ],
        feedback: { title: "数据排在最前面", body: "回信很快发出。林夏看完没有反对，只说别让这些数字替你们决定下一首歌该怎么写。" }
      }
    ]
  },
  {
    id: "career.rare.contract_terms_table",
    title: "合同条款摊在桌上",
    tags: ["career", "rare", "label", "contract", "pressure"],
    category: "rare",
    phase: "career",
    careerStages: ["rising", "mature"],
    rarity: "rare",
    weight: 1,
    cooldownMonths: 10,
    repeatable: false,
    priority: 47,
    once: false,
    trigger: {
      flagsAll: ["campus.graduationShowDone", "label.aAndREmailReplied"],
      flagsNone: ["label.contractTermsDiscussed"],
      minReleases: 1,
      minReleaseCriticalScore: 65,
      minPlayer: { fame: 34 },
      minBand: { fans: 320, reputation: 35 }
    },
    body: "厂牌的人把合同打印出来，预付款、发行周期、宣传义务和形象配合写得很整齐。那些字没有声音，却让排练室突然像会议室。",
    choices: [
      {
        id: "challenge_terms",
        label: "逐条谈回创作空间",
        effects: [
          { kind: "bandStat", key: "reputation", amount: 4 },
          { kind: "relationship", character: "bass", amount: 2 },
          { kind: "playerStat", key: "stress", amount: 4 },
          { kind: "flag", key: "label.contractTermsDiscussed", value: "protected_space" }
        ],
        feedback: { title: "空白处写满批注", body: "周航把每个模糊条款都圈出来。对方的笑容淡了一点，但林夏第一次觉得这张桌子没有完全压过你们。" }
      },
      {
        id: "accept_business_language",
        label: "先接受商业条件",
        effects: [
          { kind: "bandStat", key: "funds", amount: 900 },
          { kind: "playerStat", key: "fame", amount: 5 },
          { kind: "bandStat", key: "reputation", amount: -2 },
          { kind: "counter", key: "contractCompromises", amount: 2 },
          { kind: "flag", key: "label.contractTermsDiscussed", value: "business_first" }
        ],
        feedback: { title: "预付款很具体", body: "钱能解决很多眼前的问题，也把一些以后才会痛的东西写进了小字。唐野问，这算赢了吗。" }
      }
    ]
  },
  {
    id: "career.random.label_image_request",
    title: "宣传照里的干净版本",
    tags: ["career", "random", "label", "image", "pressure"],
    category: "random",
    phase: "career",
    careerStages: ["rising", "mature"],
    rarity: "uncommon",
    weight: 1,
    cooldownMonths: 7,
    repeatable: true,
    priority: 40,
    once: false,
    trigger: {
      flagsAll: ["campus.graduationShowDone", "label.aAndREmailReplied"],
      minPlayer: { fame: 32 },
      minBand: { fans: 300, reputation: 30 }
    },
    body: "对方建议重拍一组更“清楚”的宣传照：衣服统一一点，表情少一点疲惫，吉他上的贴纸最好别太抢眼。你听见自己在照片里被修剪。",
    choices: [
      {
        id: "shoot_clean_version",
        label: "拍一版更易传播的照片",
        effects: [
          { kind: "playerStat", key: "fame", amount: 4 },
          { kind: "bandStat", key: "fans", amount: 30 },
          { kind: "bandStat", key: "reputation", amount: -1 },
          { kind: "counter", key: "contractCompromises", amount: 1 }
        ],
        feedback: { title: "照片很亮", body: "成片确实更好看，也更不像排练室里的你们。林夏说至少眼神还在，周航说眼神不能当全部筹码。" }
      },
      {
        id: "keep_room_dust",
        label: "坚持在排练室拍",
        effects: [
          { kind: "bandStat", key: "reputation", amount: 3 },
          { kind: "relationship", character: "drums", amount: 1 },
          { kind: "playerStat", key: "stress", amount: 2 }
        ],
        feedback: { title: "灰尘也入镜", body: "照片里能看见墙皮和线材。它不够干净，却让唐野说了一句：这才像我们每周真正待着的地方。" }
      }
    ]
  },
  {
    id: "career.anchor.first_contract_decision",
    title: "第一份正式合约",
    tags: ["career", "anchor", "label", "contract"],
    category: "anchor",
    phase: "career",
    careerStages: ["rising", "mature"],
    priority: 76,
    once: true,
    trigger: {
      flagsAll: ["campus.graduationShowDone", "label.aAndREmailReplied", "label.contractTermsDiscussed"],
      flagsNone: ["label.firstContractResolved"],
      minReleases: 1,
      minReleaseCriticalScore: 65,
      minPlayer: { fame: 35 },
      minBand: { fans: 350, reputation: 35, workQuality: 60 }
    },
    body: "签字笔放在合同旁边，像一支太安静的指挥棒。你们终于走到第一份正式合约前：它能把歌带得更远，也会把每一次选择写进期限、预算和义务里。",
    choices: [
      {
        id: "sign_indie_deal",
        label: "签下独立厂牌合约",
        effects: [
          { kind: "bandStat", key: "funds", amount: 1800 },
          { kind: "playerStat", key: "fame", amount: 8 },
          { kind: "bandStat", key: "fans", amount: 120 },
          { kind: "bandStat", key: "reputation", amount: 4 },
          { kind: "playerStat", key: "stress", amount: 5 },
          { kind: "counter", key: "contractCompromises", amount: 1 },
          { kind: "flag", key: "label.firstContractResolved", value: "signed" },
          {
            kind: "addHistory",
            entry: {
              type: "contract",
              title: "签下第一份正式合约",
              description: "乐队签下第一份正式合约。它把更多门打开，也把每个人推到更清楚的代价前。",
              weight: 5,
              tags: ["career", "label", "contract"]
            }
          }
        ],
        feedback: { title: "名字落在纸上", body: "四个名字依次写下去。没有掌声，没有灯光，只有笔尖摩擦纸面的声音，像另一种登台。" }
      },
      {
        id: "stay_independent",
        label: "暂时保持独立发行",
        effects: [
          { kind: "bandStat", key: "reputation", amount: 6 },
          { kind: "bandStat", key: "funds", amount: -300 },
          { kind: "relationship", character: "vocal", amount: 2 },
          { kind: "relationship", character: "bass", amount: 1 },
          { kind: "flag", key: "label.firstContractResolved", value: "independent" },
          {
            kind: "addHistory",
            entry: {
              type: "contract",
              title: "拒绝第一份正式合约",
              description: "你们把第一份正式合约推了回去。门没有关死，但这一次乐队选择继续自己承担重量。",
              weight: 5,
              tags: ["career", "label", "contract", "independent"]
            }
          }
        ],
        feedback: { title: "笔没有落下", body: "你们把合同合上。出门时天已经黑了，林夏说今晚没有签成任何东西，但好像更知道自己要签什么。" }
      }
    ]
  },
  {
    id: "career.random.label_deadline_pressure",
    title: "厂牌排期上的红线",
    tags: ["career", "random", "label", "contract", "pressure", "release"],
    category: "random",
    phase: "career",
    careerStages: ["rising", "mature"],
    rarity: "uncommon",
    weight: 2,
    cooldownMonths: 8,
    repeatable: true,
    priority: 43,
    once: false,
    trigger: {
      flagsAll: ["campus.graduationShowDone"],
      flagValues: { "label.firstContractResolved": "signed" },
      minReleases: 1,
      minPlayer: { fame: 35 },
      minBand: { fans: 350, reputation: 35 }
    },
    body: "厂牌发来新的排期表，录音、物料、预热、上线日期都被排成一条没有停顿的线。它确实让下一步更清楚，也让每个人的呼吸变短。",
    choices: [
      {
        id: "meet_label_deadline",
        label: "按厂牌节点推进",
        effects: [
          { kind: "bandStat", key: "funds", amount: 500 },
          { kind: "bandStat", key: "fans", amount: 45 },
          { kind: "playerStat", key: "fame", amount: 4 },
          { kind: "playerStat", key: "stress", amount: 5 },
          { kind: "counter", key: "contractCompromises", amount: 1 },
          {
            kind: "addHistory",
            entry: {
              type: "contract",
              title: "按厂牌排期推进发行",
              description: "签约后，乐队第一次按外部排期推进发行。门被打开得更大，时间也开始被别人标注。",
              weight: 3,
              tags: ["career", "label", "contract", "release"]
            }
          }
        ],
        feedback: { title: "红线没有后退", body: "你们把排期贴在墙上。它让所有人都动了起来，也让唐野第一次说，节拍器好像不只在歌里。" }
      },
      {
        id: "renegotiate_deadline",
        label: "要求延期保住质量",
        effects: [
          { kind: "bandStat", key: "reputation", amount: 3 },
          { kind: "bandStat", key: "funds", amount: -200 },
          { kind: "playerStat", key: "stress", amount: 2 },
          { kind: "relationship", character: "vocal", amount: 1 }
        ],
        feedback: { title: "延期被写进邮件", body: "你们没有把歌塞进那个日期。厂牌没有立刻高兴，但林夏说，这至少证明合同还没有替你们唱歌。" }
      }
    ]
  },
  {
    id: "career.random.indie_distribution_scramble",
    title: "独立发行的奔波",
    tags: ["career", "random", "label", "independent", "release", "pressure"],
    category: "random",
    phase: "career",
    careerStages: ["rising", "mature"],
    rarity: "uncommon",
    weight: 2,
    cooldownMonths: 8,
    repeatable: true,
    priority: 42,
    once: false,
    trigger: {
      flagsAll: ["campus.graduationShowDone"],
      flagValues: { "label.firstContractResolved": "independent" },
      minReleases: 1,
      minPlayer: { fame: 32 },
      minBand: { fans: 280, reputation: 35 }
    },
    body: "没有厂牌排期以后，所有事情回到你们手里：上架、海报、场地沟通、媒体私信，还有一张永远算不完的预算表。",
    choices: [
      {
        id: "run_indie_campaign",
        label: "自己跑完整宣发",
        effects: [
          { kind: "bandStat", key: "fans", amount: 50 },
          { kind: "bandStat", key: "reputation", amount: 4 },
          { kind: "bandStat", key: "funds", amount: -350 },
          { kind: "playerStat", key: "stress", amount: 5 },
          { kind: "relationship", character: "bass", amount: 1 },
          {
            kind: "addHistory",
            entry: {
              type: "release",
              title: "独立发行继续推进",
              description: "拒绝合约后，乐队自己完成了一轮发行奔波。没有外部资源，但每一步都留下了自己的指纹。",
              weight: 3,
              tags: ["career", "independent", "release"]
            }
          }
        ],
        feedback: { title: "每封私信都自己发", body: "周航把表格拆成很多页，你们一项项填完。效率不漂亮，但每一个确认回复都像自己争来的舞台。" }
      },
      {
        id: "narrow_indie_release",
        label: "缩小发行范围",
        effects: [
          { kind: "bandStat", key: "fans", amount: 18 },
          { kind: "bandStat", key: "reputation", amount: 2 },
          { kind: "bandStat", key: "funds", amount: -120 },
          { kind: "playerStat", key: "stress", amount: -1 }
        ],
        feedback: { title: "发行半径变小", body: "你们少做了几件看起来应该做的事，把力气留给歌本身。唐野说，小一点也好，至少每一下都打在自己能听见的地方。" }
      }
    ]
  },
  {
    id: "career.random.family_reality_question",
    title: "家里问你到底靠什么生活",
    tags: ["career", "random", "life", "family", "pressure"],
    category: "random",
    phase: "career",
    careerStages: ["early", "rising"],
    rarity: "common",
    weight: 2,
    cooldownMonths: 6,
    repeatable: true,
    priority: 32,
    once: false,
    trigger: {
      flagsAll: ["campus.graduationShowDone"],
      maxPlayer: { wealth: 850 },
      minPlayer: { stress: 35 }
    },
    body: "电话那头问得很轻：你现在到底靠什么生活。背景里有碗筷声，你看着排练室账单，一时不知道该先解释梦想还是解释欠款。",
    choices: [
      {
        id: "answer_honestly",
        label: "坦白最近的收入和压力",
        effects: [
          { kind: "playerStat", key: "stress", amount: -2 },
          { kind: "playerStat", key: "wealth", amount: 120 },
          { kind: "bandStat", key: "cohesion", amount: 1 }
        ],
        feedback: { title: "电话没有立刻挂断", body: "你说得很慢，对方也听得很慢。现实没有被说服，但至少这一晚你不用假装一切都很稳。" }
      },
      {
        id: "hide_the_pressure",
        label: "说一切都还可以",
        effects: [
          { kind: "playerStat", key: "stress", amount: 4 },
          { kind: "playerStat", key: "fame", amount: 1 },
          { kind: "relationship", character: "bass", amount: -1 }
        ],
        feedback: { title: "谎话很顺", body: "你说最近还行，挂断后却不敢看周航摊开的账本。那句话没有骗过生活，只是暂时骗过了家里。" }
      }
    ]
  },
  {
    id: "career.random.rent_due_rehearsal_week",
    title: "房租到期的排练周",
    tags: ["career", "random", "life", "funds", "rehearsal"],
    category: "random",
    phase: "career",
    careerStages: ["early", "rising", "mature"],
    rarity: "common",
    weight: 2,
    cooldownMonths: 5,
    repeatable: true,
    priority: 34,
    once: false,
    trigger: {
      flagsAll: ["campus.graduationShowDone"],
      maxPlayer: { wealth: 700 }
    },
    body: "排练室租金和住处房租在同一周到期。音箱、琴包和转账提醒挤在一个屏幕上，谁都知道这不是靠热血就能调过去的频段。",
    choices: [
      {
        id: "take_extra_small_show",
        label: "临时接一场小活",
        effects: [
          { kind: "playerStat", key: "wealth", amount: 420 },
          { kind: "bandStat", key: "funds", amount: 260 },
          { kind: "playerStat", key: "health", amount: -2 },
          { kind: "playerStat", key: "stress", amount: 2 },
          { kind: "counter", key: "contractCompromises", amount: 1 }
        ],
        feedback: { title: "转账提醒安静了", body: "钱到账时你们都松了一口气。那场小活没人会记得，但它让下一次排练还可以发生。" }
      },
      {
        id: "cut_rehearsal_hours",
        label: "缩短本周排练时间",
        effects: [
          { kind: "bandStat", key: "funds", amount: 180 },
          { kind: "bandStat", key: "workQuality", amount: -2 },
          { kind: "playerStat", key: "stress", amount: -1 }
        ],
        feedback: { title: "少租两个小时", body: "你们提前关灯离开。门合上时，唐野敲了敲鼓包，像是在向没练完的部分道歉。" }
      }
    ]
  },
  {
    id: "career.random.day_job_night_rehearsal",
    title: "白天工作和夜里排练",
    tags: ["career", "random", "life", "health", "rehearsal"],
    category: "random",
    phase: "career",
    careerStages: ["early", "rising"],
    rarity: "common",
    weight: 2,
    cooldownMonths: 4,
    repeatable: true,
    priority: 33,
    once: false,
    trigger: {
      flagsAll: ["campus.graduationShowDone"],
      maxPlayer: { wealth: 900 },
      minPlayer: { stress: 30 }
    },
    body: "你白天做临时工作，夜里赶到排练室。第一首歌还没进副歌，手腕已经开始发酸，像身体比你更早知道今天已经太长。",
    choices: [
      {
        id: "push_through_night",
        label: "撑完整晚排练",
        effects: [
          { kind: "bandStat", key: "workQuality", amount: 3 },
          { kind: "playerStat", key: "wealth", amount: 180 },
          { kind: "playerStat", key: "health", amount: -4 },
          { kind: "playerStat", key: "stress", amount: 3 }
        ],
        feedback: { title: "夜被拉得很长", body: "排练是有效的，你也是真的累。林夏递水时没说教，只把下一遍的速度放慢了一点。" }
      },
      {
        id: "end_rehearsal_early",
        label: "提前停下保护手腕",
        effects: [
          { kind: "playerStat", key: "health", amount: 2 },
          { kind: "playerStat", key: "stress", amount: -2 },
          { kind: "bandStat", key: "workQuality", amount: -1 },
          { kind: "relationship", character: "drums", amount: 1 }
        ],
        feedback: { title: "今天先停", body: "唐野说少练一遍不会毁掉乐队，手毁掉才会。你第一次觉得停下也是一种技术。" }
      }
    ]
  },
  {
    id: "career.random.style_no_longer_us",
    title: "新歌不像你们了",
    tags: ["career", "random", "style", "songwriting", "conflict"],
    category: "random",
    phase: "career",
    careerStages: ["early", "rising", "mature"],
    rarity: "uncommon",
    weight: 2,
    cooldownMonths: 6,
    repeatable: true,
    priority: 37,
    once: false,
    trigger: {
      flagsAll: ["campus.graduationShowDone"],
      hasCompletedSong: true,
      minBand: { workQuality: 45 }
    },
    body: "新歌排到一半，周航说它很好，但不像你们。没有人立刻反驳，因为每个人都听见了那种陌生的顺滑。",
    choices: [
      {
        id: "follow_new_shape",
        label: "顺着陌生方向写下去",
        effects: [
          { kind: "playerStat", key: "creativity", amount: 3 },
          { kind: "bandStat", key: "workQuality", amount: 3 },
          { kind: "bandStat", key: "cohesion", amount: -1 },
          { kind: "flag", key: "style.transitionStarted", value: true },
          {
            kind: "advanceWork",
            amount: 12,
            qualityAmount: 3,
            tensionAmount: 2,
            styleTags: ["transition", "polished"]
          }
        ],
        feedback: { title: "陌生也有形状", body: "你们没有急着把它拉回原来的样子。那首歌变得更完整，也让排练室多了一点不知道怎么命名的紧张。" }
      },
      {
        id: "pull_back_to_old_sound",
        label: "把声音拉回原来的粗糙",
        effects: [
          { kind: "bandStat", key: "cohesion", amount: 2 },
          { kind: "bandStat", key: "reputation", amount: 1 },
          { kind: "playerStat", key: "stress", amount: 2 },
          {
            kind: "advanceWork",
            amount: 8,
            qualityAmount: 1,
            tensionAmount: -1,
            styleTags: ["raw", "familiar"]
          }
        ],
        feedback: { title: "旧声音被找回", body: "失真重新盖住那些太平整的部分。林夏说这样更像你们，但你听见还有一扇门被暂时关上。" }
      }
    ]
  },
  {
    id: "career.random.electronic_texture_trial",
    title: "电子音色第一次进排练室",
    tags: ["career", "random", "style", "experiment", "equipment"],
    category: "random",
    phase: "career",
    careerStages: ["rising", "mature"],
    rarity: "uncommon",
    weight: 1,
    cooldownMonths: 7,
    repeatable: true,
    priority: 38,
    once: false,
    trigger: {
      flagsAll: ["campus.graduationShowDone"],
      minPlayer: { creativity: 55 },
      minBand: { workQuality: 55 }
    },
    body: "朋友借来一台旧合成器。第一个音响起来时，唐野皱了皱眉，林夏却说它像城市凌晨三点还没关掉的霓虹灯。",
    choices: [
      {
        id: "layer_synth_under_guitar",
        label: "把它铺在吉他下面",
        effects: [
          { kind: "playerStat", key: "creativity", amount: 3 },
          { kind: "bandStat", key: "workQuality", amount: 2 },
          { kind: "relationship", character: "vocal", amount: 1 },
          {
            kind: "advanceWork",
            amount: 10,
            qualityAmount: 2,
            styleTags: ["synth", "night"]
          }
        ],
        feedback: { title: "霓虹贴着低频", body: "吉他没有被取代，只是多了一层冷光。周航说这不一定是背叛，可能只是城市终于进了歌里。" }
      },
      {
        id: "reject_synth_layer",
        label: "只留下吉他和鼓",
        effects: [
          { kind: "bandStat", key: "cohesion", amount: 1 },
          { kind: "bandStat", key: "reputation", amount: 2 },
          { kind: "playerStat", key: "creativity", amount: -1 }
        ],
        feedback: { title: "线又被拔掉", body: "合成器安静下来。唐野松了口气，但林夏把那段旋律哼了一遍，像是不想让它完全消失。" }
      }
    ]
  },
  {
    id: "career.random.guitar_wall_or_space",
    title: "吉他墙还是留白",
    tags: ["career", "random", "style", "guitar", "arrangement"],
    category: "random",
    phase: "career",
    careerStages: ["early", "rising", "mature"],
    rarity: "common",
    weight: 2,
    cooldownMonths: 5,
    repeatable: true,
    priority: 36,
    once: false,
    trigger: {
      flagsAll: ["campus.graduationShowDone"],
      hasCompletedSong: true,
      minPlayer: { technique: 45 }
    },
    body: "副歌可以被吉他墙推满，也可以留出一块空地给人声和鼓。你踩着效果器，突然意识到这不是音量问题，是乐队要把谁放到最前面。",
    choices: [
      {
        id: "build_guitar_wall",
        label: "把吉他墙推起来",
        effects: [
          { kind: "playerStat", key: "technique", amount: 2 },
          { kind: "bandStat", key: "workQuality", amount: 2 },
          { kind: "relationship", character: "vocal", amount: -1 },
          {
            kind: "advanceWork",
            amount: 9,
            qualityAmount: 2,
            styleTags: ["guitar-wall", "loud"]
          }
        ],
        feedback: { title: "墙立起来了", body: "声音很大，也很痛快。林夏说她还能唱出来，但你知道她是在和你的音量一起用力。" }
      },
      {
        id: "leave_space_in_chorus",
        label: "给副歌留出空地",
        effects: [
          { kind: "relationship", character: "vocal", amount: 2 },
          { kind: "bandStat", key: "cohesion", amount: 2 },
          { kind: "bandStat", key: "workQuality", amount: 1 },
          {
            kind: "advanceWork",
            amount: 9,
            qualityAmount: 1,
            styleTags: ["space", "vocal-forward"]
          }
        ],
        feedback: { title: "空出来的地方", body: "你少弹了几下，歌反而更清楚。那块留白不是退让，是让整支乐队一起呼吸。" }
      }
    ]
  },
  {
    id: "career.anchor.first_album_track_order",
    title: "第一张专辑的曲序",
    tags: ["career", "anchor", "album", "release", "songwriting"],
    category: "anchor",
    phase: "career",
    careerStages: ["rising", "mature"],
    priority: 74,
    once: true,
    trigger: {
      flagsAll: ["campus.graduationShowDone"],
      flagsNone: ["album.firstTrackOrderLocked"],
      minRecordings: 3,
      minBand: { workQuality: 60, reputation: 35 }
    },
    body: "几首歌终于摆在同一张桌上。曲序不是排序那么简单，它会决定这张专辑先伸出哪只手、在哪一刻露出伤口、最后把听众留在哪里。",
    choices: [
      {
        id: "sequence_by_story",
        label: "按故事走向排曲序",
        effects: [
          { kind: "bandStat", key: "workQuality", amount: 4 },
          { kind: "relationship", character: "vocal", amount: 2 },
          { kind: "playerStat", key: "stress", amount: 2 },
          { kind: "flag", key: "album.firstTrackOrderLocked", value: "story" },
          {
            kind: "addHistory",
            entry: {
              type: "release",
              title: "第一张专辑曲序定稿",
              description: "你们第一次按整张专辑思考这些歌。曲序把零散的夜晚排成了一条可以回头看的路。",
              weight: 4,
              tags: ["career", "album", "release"]
            }
          }
        ],
        feedback: { title: "歌有了前后", body: "开场曲落下去时，后面的歌像终于知道该往哪里走。林夏说这不是歌单，是一扇门。" }
      },
      {
        id: "sequence_by_impact",
        label: "把最强的歌放在前面",
        effects: [
          { kind: "playerStat", key: "fame", amount: 3 },
          { kind: "bandStat", key: "reputation", amount: 2 },
          { kind: "bandStat", key: "workQuality", amount: 2 },
          { kind: "flag", key: "album.firstTrackOrderLocked", value: "impact" }
        ],
        feedback: { title: "第一首必须抓住人", body: "你们选择先把门撞开。周航提醒，后面也要站得住，否则开场越强，空掉的地方越明显。" }
      }
    ]
  },
  {
    id: "career.random.studio_third_day",
    title: "棚里第三天",
    tags: ["career", "random", "album", "recording", "pressure"],
    category: "random",
    phase: "career",
    careerStages: ["rising", "mature"],
    rarity: "uncommon",
    weight: 2,
    cooldownMonths: 6,
    repeatable: true,
    priority: 40,
    once: false,
    trigger: {
      flagsAll: ["campus.graduationShowDone", "album.firstTrackOrderLocked"],
      minRecordings: 3,
      minBand: { workQuality: 58 }
    },
    body: "进棚第三天，耳机里的每个小失误都被放大。你开始分不清是音准真的偏了，还是你们已经听同一段听到失去判断。",
    choices: [
      {
        id: "keep_tracking",
        label: "继续追求更好的 take",
        effects: [
          { kind: "bandStat", key: "workQuality", amount: 4 },
          { kind: "playerStat", key: "stress", amount: 4 },
          { kind: "playerStat", key: "health", amount: -2 },
          { kind: "relationship", character: "drums", amount: -1 }
        ],
        feedback: { title: "再来一遍", body: "你们又录了三遍。最好的一遍也许真的更好，也许只是因为没人还有力气承认已经够了。" }
      },
      {
        id: "keep_human_take",
        label: "保留有呼吸的版本",
        effects: [
          { kind: "bandStat", key: "reputation", amount: 2 },
          { kind: "bandStat", key: "cohesion", amount: 2 },
          { kind: "playerStat", key: "stress", amount: -1 }
        ],
        feedback: { title: "不再磨平", body: "你们留下那一遍有点摇晃的录音。唐野说它不完美，但里面有人。" }
      }
    ]
  },
  {
    id: "career.rare.producer_cut_long_song",
    title: "制作人想删掉最长的歌",
    tags: ["career", "rare", "album", "producer", "songwriting"],
    category: "rare",
    phase: "career",
    careerStages: ["rising", "mature"],
    rarity: "rare",
    weight: 1,
    cooldownMonths: 10,
    repeatable: false,
    priority: 43,
    once: false,
    trigger: {
      flagsAll: ["campus.graduationShowDone", "album.firstTrackOrderLocked"],
      flagsNone: ["album.longSongDecision"],
      minRecordings: 3,
      minBand: { workQuality: 62, reputation: 38 }
    },
    body: "制作人建议删掉最长的那首歌。他说它不适合播放列表，也拖慢专辑节奏。你知道他说得不全错，但那首歌里有你们熬过最难的一段排练。",
    choices: [
      {
        id: "defend_long_song",
        label: "坚持保留长歌",
        effects: [
          { kind: "bandStat", key: "reputation", amount: 4 },
          { kind: "bandStat", key: "workQuality", amount: 2 },
          { kind: "relationship", character: "vocal", amount: 2 },
          { kind: "playerStat", key: "stress", amount: 3 },
          { kind: "flag", key: "album.longSongDecision", value: "kept" }
        ],
        feedback: { title: "最慢的歌留下了", body: "你们把它放在专辑中段。它可能会劝退一些人，但留下的人会听见这支乐队为什么还能站在一起。" }
      },
      {
        id: "cut_long_song",
        label: "接受删减换取集中度",
        effects: [
          { kind: "bandStat", key: "workQuality", amount: 4 },
          { kind: "playerStat", key: "fame", amount: 2 },
          { kind: "relationship", character: "vocal", amount: -2 },
          { kind: "counter", key: "contractCompromises", amount: 1 },
          { kind: "flag", key: "album.longSongDecision", value: "cut" }
        ],
        feedback: { title: "曲序短了一截", body: "删掉之后，专辑确实更利落。只是林夏在那晚之后，很久没有主动提过那首歌的名字。" }
      }
    ]
  },
  {
    id: "career.anchor.master_submitted_night",
    title: "母带交出去那晚",
    tags: ["career", "anchor", "album", "release"],
    category: "anchor",
    phase: "career",
    careerStages: ["rising", "mature"],
    priority: 73,
    once: true,
    trigger: {
      flagsAll: ["campus.graduationShowDone", "album.firstTrackOrderLocked"],
      flagsNone: ["album.masterSubmitted"],
      minRecordings: 3,
      minBand: { workQuality: 60 }
    },
    body: "导出进度条走得很慢。母带文件上传完以后，这张专辑就不再只是排练室、硬盘和争吵里的东西，它会被真正交出去。",
    choices: [
      {
        id: "submit_master",
        label: "提交最终母带",
        effects: [
          { kind: "bandStat", key: "reputation", amount: 4 },
          { kind: "playerStat", key: "fame", amount: 3 },
          { kind: "playerStat", key: "stress", amount: -2 },
          { kind: "flag", key: "album.masterSubmitted", value: true },
          {
            kind: "addHistory",
            entry: {
              type: "release",
              title: "第一张专辑母带提交",
              description: "母带上传完成。你们第一次把一整段时期封进同一个文件名里。",
              weight: 5,
              tags: ["career", "album", "release"]
            }
          }
        ],
        feedback: { title: "进度条走完", body: "没有人立刻说话。上传完成的提示音很轻，却像一扇门在身后合上，前面终于只剩等待。" }
      }
    ]
  },
  {
    id: "career.random.first_album_review",
    title: "首张专辑评价",
    tags: ["career", "random", "album", "release", "media", "review"],
    category: "random",
    phase: "career",
    careerStages: ["rising", "mature"],
    rarity: "uncommon",
    weight: 2,
    cooldownMonths: 8,
    repeatable: false,
    priority: 44,
    once: false,
    trigger: {
      flagsAll: ["campus.graduationShowDone"],
      flagsNone: ["album.firstReviewSeen"],
      hasAlbum: true,
      minReleaseCriticalScore: 65,
      minReleaseSales: 1000
    },
    body: "首张专辑的长评发出来了。里面有夸奖，也有几句刺得很准的批评。你们围着手机看，像在听一个陌生人替这几年写总结。",
    choices: [
      {
        id: "read_review_together",
        label: "全队一起读完",
        effects: [
          { kind: "bandStat", key: "reputation", amount: 5 },
          { kind: "bandStat", key: "fans", amount: 80 },
          { kind: "bandStat", key: "workQuality", amount: 2 },
          { kind: "flag", key: "album.firstReviewSeen", value: true }
        ],
        feedback: { title: "有人替你们总结", body: "读到最后，林夏把手机扣在桌上。她说这篇不全对，但至少证明这张专辑真的被完整听完了。" }
      },
      {
        id: "ignore_review_noise",
        label: "不让评价决定下一首",
        effects: [
          { kind: "playerStat", key: "stress", amount: -2 },
          { kind: "bandStat", key: "workQuality", amount: 3 },
          { kind: "bandStat", key: "reputation", amount: 1 },
          { kind: "flag", key: "album.firstReviewSeen", value: true }
        ],
        feedback: { title: "评论留在屏幕里", body: "你们没有继续刷新。唐野说评论不会帮忙数拍，下一首歌还是要自己进。" }
      }
    ]
  },
  {
    id: "career.random.old_song_rights_talk",
    title: "旧歌版权谈判",
    tags: ["career", "random", "legacy", "contract", "catalog"],
    category: "random",
    phase: "career",
    careerStages: ["mature", "late"],
    rarity: "uncommon",
    weight: 1,
    cooldownMonths: 12,
    repeatable: true,
    priority: 41,
    once: false,
    trigger: {
      flagsAll: ["campus.graduationShowDone"],
      minAnnualSummaries: 4,
      minLastYearFame: 52,
      minBand: { reputation: 55, fans: 800 }
    },
    body: "有人想买走几首旧歌的授权，用在一部城市纪录片里。报价不低，条款也不算坏，只是你突然发现，年轻时写下的东西已经成了可以被谈判的资产。",
    choices: [
      {
        id: "license_old_song_carefully",
        label: "限定范围授权",
        effects: [
          { kind: "bandStat", key: "funds", amount: 1200 },
          { kind: "bandStat", key: "reputation", amount: 2 },
          { kind: "relationship", character: "bass", amount: 1 },
          {
            kind: "addHistory",
            entry: {
              type: "contract",
              title: "旧歌完成限定授权",
              description: "你们第一次认真谈旧歌版权。那些曾经只为演出写下的段落，开始有了漫长的回声。",
              weight: 4,
              tags: ["career", "legacy", "catalog", "contract"]
            }
          }
        ],
        feedback: { title: "旧歌有了新去处", body: "周航把授权范围写得很清楚。钱会到账，歌也还留在你们手里，这像一次迟来的成熟。" }
      },
      {
        id: "reject_song_license",
        label: "拒绝这次授权",
        effects: [
          { kind: "bandStat", key: "reputation", amount: 3 },
          { kind: "bandStat", key: "funds", amount: -200 },
          { kind: "playerStat", key: "stress", amount: 2 }
        ],
        feedback: { title: "旧歌没有离开", body: "你们没有卖出那段旋律的使用权。林夏说这不是清高，只是有些歌暂时还不能被别人替你们解释。" }
      }
    ]
  },
  {
    id: "career.anchor.classic_catalog_tour",
    title: "经典巡演",
    tags: ["career", "anchor", "legacy", "tour", "catalog", "performance"],
    category: "anchor",
    phase: "career",
    careerStages: ["mature", "late"],
    priority: 76,
    once: false,
    cooldownMonths: 18,
    trigger: {
      flagsAll: ["campus.graduationShowDone"],
      hasAlbum: true,
      minAnnualSummaries: 5,
      minLastYearPerformances: 4,
      minLastYearFame: 55,
      minPlayer: { health: 40 },
      minBand: { reputation: 62, fans: 1000, funds: 1000 }
    },
    body: "巡演方案这次不是为了推广新专辑，而是围绕那些已经被反复点名的旧歌。海报上写着“经典曲目专场”，你第一次觉得这个词既像奖章，也像一根钉子。",
    choices: [
      {
        id: "play_classic_catalog",
        label: "启动经典曲目巡演",
        effects: [
          { kind: "playerStat", key: "fame", amount: 10 },
          { kind: "bandStat", key: "fans", amount: 180 },
          { kind: "bandStat", key: "reputation", amount: 8 },
          { kind: "bandStat", key: "funds", amount: 1600 },
          { kind: "playerStat", key: "health", amount: -6 },
          { kind: "flag", key: "legacy.classicCatalogTour", value: true },
          {
            kind: "addHistory",
            entry: {
              type: "performance",
              title: "经典曲目巡演",
              description: "你们把旧歌重新带上路。每座城市都在证明，过去没有完全过去。",
              weight: 6,
              tags: ["career", "legacy", "tour", "catalog"]
            }
          }
        ],
        feedback: { title: "旧歌重新上路", body: "台下很多人比当年更安静，却唱得更准。你们演的不是怀旧，而是在确认这些歌还会继续活着。" }
      },
      {
        id: "refuse_nostalgia_tour",
        label: "不把巡演做成怀旧",
        effects: [
          { kind: "bandStat", key: "workQuality", amount: 4 },
          { kind: "bandStat", key: "reputation", amount: 3 },
          { kind: "counter", key: "missedOpportunities", amount: 1 },
          { kind: "flag", key: "legacy.classicCatalogTour", value: "refused" }
        ],
        feedback: { title: "海报没有印下去", body: "你们拒绝了这个包装。唐野说旧歌当然重要，但不能让它们把下一首歌挤到门外。" }
      }
    ]
  },
  {
    id: "career.random.turning_producer",
    title: "转制作人",
    tags: ["career", "random", "legacy", "producer", "studio"],
    category: "random",
    phase: "career",
    careerStages: ["mature", "late"],
    rarity: "uncommon",
    weight: 1,
    cooldownMonths: 14,
    repeatable: false,
    priority: 40,
    once: false,
    trigger: {
      flagsAll: ["campus.graduationShowDone"],
      minAnnualSummaries: 5,
      minLastYearCriticalScore: 74,
      minPlayer: { creativity: 62 },
      minBand: { reputation: 58 }
    },
    body: "一支年轻乐队把粗糙的 Demo 发给你，请你帮他们做制作。你听见他们的紧张、笨拙和固执，也听见很多年前的排练室。",
    choices: [
      {
        id: "produce_young_band",
        label: "接下制作工作",
        effects: [
          { kind: "playerStat", key: "wealth", amount: 900 },
          { kind: "bandStat", key: "reputation", amount: 4 },
          { kind: "playerStat", key: "creativity", amount: 2 },
          { kind: "relationship", character: "vocal", amount: -1 },
          { kind: "flag", key: "legacy.producerStep", value: true }
        ],
        feedback: { title: "你坐到控制台后面", body: "你第一次不是为了自己的吉他音色调推子。对方进错拍时，你没有骂人，只想起当年唐野也这样笑过。" }
      },
      {
        id: "stay_inside_band",
        label: "暂时只做自己的乐队",
        effects: [
          { kind: "bandStat", key: "workQuality", amount: 3 },
          { kind: "relationship", character: "vocal", amount: 1 },
          { kind: "playerStat", key: "stress", amount: -1 }
        ],
        feedback: { title: "控制台还没换主人", body: "你婉拒了。林夏说不是每个邀请都要变成身份，至少现在你们还有自己的歌要写。" }
      }
    ]
  },
  {
    id: "career.rare.young_band_cover",
    title: "年轻乐队翻唱你们",
    tags: ["career", "rare", "legacy", "fan", "catalog"],
    category: "rare",
    phase: "career",
    careerStages: ["mature", "late"],
    rarity: "rare",
    weight: 1,
    cooldownMonths: 18,
    repeatable: false,
    priority: 45,
    once: false,
    trigger: {
      flagsAll: ["campus.graduationShowDone"],
      flagsNone: ["legacy.youngBandCoverSeen"],
      minAnnualSummaries: 6,
      minLastYearFame: 58,
      minBand: { reputation: 60, fans: 1200 }
    },
    body: "视频里，一支年轻乐队在很小的舞台上翻唱你们早年的歌。和弦弹得不完全对，速度也偏快，但副歌响起时，你几乎忘了那是你们写的。",
    choices: [
      {
        id: "share_cover_video",
        label: "转发并鼓励他们",
        effects: [
          { kind: "bandStat", key: "fans", amount: 120 },
          { kind: "bandStat", key: "reputation", amount: 5 },
          { kind: "playerStat", key: "fame", amount: 4 },
          { kind: "flag", key: "legacy.youngBandCoverSeen", value: true }
        ],
        feedback: { title: "歌被年轻地唱了一遍", body: "你转发后，对方在评论里连发了好几个感叹号。唐野说，原来我们也到了会把别人吓一跳的年纪。" }
      },
      {
        id: "keep_cover_private",
        label: "只在群里发给队友",
        effects: [
          { kind: "relationship", character: "vocal", amount: 2 },
          { kind: "relationship", character: "bass", amount: 2 },
          { kind: "relationship", character: "drums", amount: 2 },
          { kind: "playerStat", key: "stress", amount: -2 },
          { kind: "flag", key: "legacy.youngBandCoverSeen", value: true }
        ],
        feedback: { title: "群里安静了一会儿", body: "没人立刻回复。后来林夏发来一句：他们唱错的地方，居然和我们当年错得一样。" }
      }
    ]
  },
  {
    id: "career.anchor.comeback_old_faces",
    title: "复出第一排都是老面孔",
    tags: ["career", "anchor", "legacy", "comeback", "performance"],
    category: "anchor",
    phase: "career",
    careerStages: ["late"],
    priority: 78,
    once: true,
    trigger: {
      flagsAll: ["campus.graduationShowDone"],
      flagsNone: ["legacy.comebackOldFaces"],
      minAnnualSummaries: 8,
      minPlayer: { fame: 60, health: 35 },
      minBand: { reputation: 62, fans: 1400 }
    },
    body: "复出演出的门票没有想象中卖得快，但第一排出现了很多旧面孔：有人发福，有人带着孩子，有人还穿着十年前的乐队 T 恤。灯亮前，你突然明白他们等的不是完美，而是确认你们还会开声。",
    choices: [
      {
        id: "play_for_old_faces",
        label: "为这些老面孔开声",
        effects: [
          { kind: "playerStat", key: "fame", amount: 8 },
          { kind: "bandStat", key: "fans", amount: 160 },
          { kind: "bandStat", key: "reputation", amount: 8 },
          { kind: "relationship", character: "vocal", amount: 2 },
          { kind: "relationship", character: "bass", amount: 2 },
          { kind: "relationship", character: "drums", amount: 2 },
          { kind: "flag", key: "legacy.comebackOldFaces", value: true },
          {
            kind: "addHistory",
            entry: {
              type: "performance",
              title: "复出演出",
              description: "复出那晚，第一排都是老面孔。乐队没有回到过去，只是证明过去还在继续发声。",
              weight: 6,
              tags: ["career", "legacy", "comeback", "performance"]
            }
          }
        ],
        feedback: { title: "灯亮给老面孔", body: "第一首歌进副歌时，台下跟得比你们还稳。你突然意识到，有些观众不是留下来看你们年轻，而是留下来看你们继续。" }
      }
    ]
  },
  {
    id: "career.random.member_vocal_ownership_conflict",
    title: "主唱把歌词本合上",
    tags: ["career", "random", "member", "vocal", "conflict"],
    category: "random",
    phase: "career",
    careerStages: ["early", "rising"],
    rarity: "uncommon",
    weight: 2,
    cooldownMonths: 5,
    repeatable: true,
    priority: 41,
    once: false,
    trigger: {
      flagsAll: ["campus.graduationShowDone"],
      maxRelationship: { vocal: 35 },
      minPlayer: { stress: 45 }
    },
    body: "林夏在排练中途把歌词本合上。她说每次旋律被推到台前，最后承担眼神的人都是她，可每次决定方向时，她像只是来唱你写好的东西。",
    choices: [
      {
        id: "give_vocal_space",
        label: "把下一首交给她先开口",
        effects: [
          { kind: "relationship", character: "vocal", amount: 8 },
          { kind: "bandStat", key: "cohesion", amount: 3 },
          { kind: "bandStat", key: "workQuality", amount: 2 },
          { kind: "playerStat", key: "stress", amount: 2 },
          {
            kind: "addHistory",
            entry: {
              type: "member",
              title: "主唱争取创作空间",
              description: "林夏说清了自己不是只负责唱。你们让下一首歌先从她的旋律开始。",
              weight: 3,
              tags: ["career", "member", "vocal"]
            }
          }
        ],
        feedback: { title: "歌词本重新打开", body: "她没有立刻原谅你们，但重新翻开本子时，排练室里的空气终于动了一下。" }
      },
      {
        id: "defend_current_direction",
        label: "坚持现有方向",
        effects: [
          { kind: "relationship", character: "vocal", amount: -7 },
          { kind: "bandStat", key: "workQuality", amount: 3 },
          { kind: "playerStat", key: "stress", amount: 5 },
          {
            kind: "memberStatus",
            character: "vocal",
            status: "strained",
            note: "林夏仍然站在麦克风前，但她开始把真正想唱的旋律留在歌词本背面。"
          },
          { kind: "flag", key: "member.vocalOwnershipWound", value: true }
        ],
        feedback: { title: "歌继续往前走", body: "排练继续了，歌也更完整了。只是她唱副歌时，没有再看你一眼。" }
      }
    ]
  },
  {
    id: "career.random.member_bass_silent_balance",
    title: "贝斯手的沉默账本",
    tags: ["career", "random", "member", "bass", "risk"],
    category: "random",
    phase: "career",
    careerStages: ["early", "rising"],
    rarity: "uncommon",
    weight: 2,
    cooldownMonths: 5,
    repeatable: true,
    priority: 40,
    once: false,
    trigger: {
      flagsAll: ["campus.graduationShowDone"],
      maxRelationship: { bass: 38 },
      minPlayer: { stress: 40 }
    },
    body: "周航把这个月的棚费、车费和演出收入写在纸上，没有责备谁。沉默比吵架更重，像一杆秤终于倾斜到所有人都看得见。",
    choices: [
      {
        id: "balance_books_together",
        label: "一起把账算清楚",
        effects: [
          { kind: "relationship", character: "bass", amount: 7 },
          { kind: "bandStat", key: "funds", amount: 180 },
          { kind: "bandStat", key: "cohesion", amount: 2 },
          { kind: "playerStat", key: "stress", amount: -2 }
        ],
        feedback: { title: "秤暂时放平", body: "你们把账算到深夜。钱没有突然变多，但周航第一次把纸推到桌子中央，而不是自己收起来。" }
      },
      {
        id: "leave_bass_to_handle_it",
        label: "让他继续处理后勤",
        effects: [
          { kind: "relationship", character: "bass", amount: -6 },
          { kind: "bandStat", key: "funds", amount: 120 },
          { kind: "counter", key: "missedOpportunities", amount: 1 },
          {
            kind: "memberStatus",
            character: "bass",
            status: "strained",
            note: "周航还在按时出现，但他开始把真正的疲惫藏到最安静的地方。"
          },
          { kind: "flag", key: "member.bassCarriesTooMuch", value: true }
        ],
        feedback: { title: "账本合上", body: "周航点点头，把纸收回包里。你忽然意识到，他已经很久没有主动提过自己想弹什么了。" }
      }
    ]
  },
  {
    id: "career.random.member_drums_missed_rehearsal",
    title: "鼓手迟到的那一拍",
    tags: ["career", "random", "member", "drums", "pressure"],
    category: "random",
    phase: "career",
    careerStages: ["early", "rising"],
    rarity: "uncommon",
    weight: 2,
    cooldownMonths: 4,
    repeatable: true,
    priority: 39,
    once: false,
    trigger: {
      flagsAll: ["campus.graduationShowDone"],
      maxRelationship: { drums: 36 },
      minPlayer: { stress: 50 }
    },
    body: "唐野迟到了四十分钟。推门进来时他还在笑，但第一遍合奏刚起，你就听出鼓点散了。他比谁都先听出乐队有没有散掉，也比谁都怕自己成为那一下。",
    choices: [
      {
        id: "slow_rehearsal_down",
        label: "停下来问他怎么了",
        effects: [
          { kind: "relationship", character: "drums", amount: 8 },
          { kind: "bandStat", key: "cohesion", amount: 3 },
          { kind: "playerStat", key: "stress", amount: -2 },
          { kind: "bandStat", key: "workQuality", amount: -1 }
        ],
        feedback: { title: "节拍慢下来", body: "你们没有立刻继续练。唐野靠在鼓凳上说了很多废话，最后终于说到真正累的地方。" }
      },
      {
        id: "push_rehearsal_anyway",
        label: "先把排练推完",
        effects: [
          { kind: "relationship", character: "drums", amount: -6 },
          { kind: "bandStat", key: "workQuality", amount: 3 },
          { kind: "playerStat", key: "stress", amount: 4 },
          {
            kind: "memberStatus",
            character: "drums",
            status: "strained",
            note: "唐野仍然把每首歌推到拍子上，但笑声后面多了一层赶不上大家的慌。"
          },
          { kind: "flag", key: "member.drumsFallingBehind", value: true }
        ],
        feedback: { title: "鼓点追上了歌", body: "排练最后是完整的，但唐野收鼓时比平时慢。那一下迟到没有消失，只是被塞进下一次。" }
      }
    ]
  },
  {
    id: "career.rare.member_bass_temporary_leave",
    title: "贝斯盒留在门口",
    tags: ["career", "rare", "member", "bass", "leave"],
    category: "rare",
    phase: "career",
    careerStages: ["early", "rising"],
    rarity: "rare",
    weight: 2,
    cooldownMonths: 12,
    repeatable: false,
    priority: 44,
    once: false,
    trigger: {
      flagsAll: ["campus.graduationShowDone", "member.bassCarriesTooMuch"],
      flagsNone: ["member.bassTemporaryLeave", "member.bassReturnResolved"],
      memberStatus: { bass: "strained" },
      maxRelationship: { bass: 30 },
      minPlayer: { stress: 60 }
    },
    body: "排练前十分钟，周航把贝斯盒放在门口，没有开锁。他说自己不是要拆散乐队，只是已经分不清自己是在弹贝斯，还是在替所有人撑住生活。",
    choices: [
      {
        id: "give_bass_room_to_breathe",
        label: "让他先离开一阵",
        effects: [
          {
            kind: "memberStatus",
            character: "bass",
            status: "away",
            note: "周航把贝斯盒留在排练室门口，说自己需要先离开一阵。"
          },
          { kind: "bandStat", key: "cohesion", amount: -4 },
          { kind: "bandStat", key: "workQuality", amount: -3 },
          { kind: "playerStat", key: "stress", amount: 5 },
          { kind: "flag", key: "member.bassTemporaryLeave", value: true },
          {
            kind: "addHistory",
            entry: {
              type: "member",
              title: "贝斯手暂别",
              description: "周航把贝斯盒留在门口，乐队第一次听见低频真正空出来的声音。",
              weight: 4,
              tags: ["career", "member", "bass", "leave"]
            }
          }
        ],
        feedback: {
          title: "低频空了一格",
          body: "你没有拦他。门合上后，排练室里没有谁立刻说话。那不是一场退队宣言，更像一次迟来的求救。"
        }
      },
      {
        id: "promise_bass_real_change",
        label: "当面承诺重新分担",
        effects: [
          {
            kind: "memberStatus",
            character: "bass",
            status: "away",
            note: "周航答应给你们一次改变的机会，但他仍需要离开排练室一段时间。"
          },
          { kind: "relationship", character: "bass", amount: 3 },
          { kind: "bandStat", key: "cohesion", amount: -2 },
          { kind: "playerStat", key: "stress", amount: 3 },
          { kind: "flag", key: "member.bassTemporaryLeave", value: true },
          {
            kind: "addHistory",
            entry: {
              type: "member",
              title: "贝斯手要求改变",
              description: "周航没有把话说死。他暂时离开，也把是否继续的门槛留给你们。",
              weight: 4,
              tags: ["career", "member", "bass", "leave"]
            }
          }
        ],
        feedback: {
          title: "门没有关死",
          body: "他说会等你们给出真正的改变。那一刻你明白，分担不是一句道歉，而是以后每个月都要证明的事。"
        }
      }
    ]
  },
  {
    id: "career.rare.member_vocal_authorship_showdown",
    title: "副歌署名的那一行",
    tags: ["career", "rare", "member", "vocal", "authorship"],
    category: "rare",
    phase: "career",
    careerStages: ["early", "rising"],
    rarity: "rare",
    weight: 2,
    cooldownMonths: 10,
    repeatable: false,
    priority: 44,
    once: false,
    trigger: {
      flagsAll: ["campus.graduationShowDone", "member.vocalOwnershipWound"],
      flagsNone: ["member.vocalAuthorshipResolved"],
      memberStatus: { vocal: "strained" },
      maxRelationship: { vocal: 30 },
      minPlayer: { fame: 24 },
      minBand: { workQuality: 50 }
    },
    body: "一篇小乐评把你写成乐队唯一的创作核心。林夏没有在群里回复，只把下一版歌词截图发给你。副歌旁边多了一行字：旋律不是谁的附属品。",
    choices: [
      {
        id: "share_vocal_credit",
        label: "公开承认她的旋律主导",
        effects: [
          {
            kind: "memberStatus",
            character: "vocal",
            status: "active",
            note: "林夏重新把歌词本摊开在桌上，署名不再只是一句客套。"
          },
          { kind: "relationship", character: "vocal", amount: 9 },
          { kind: "bandStat", key: "cohesion", amount: 3 },
          { kind: "bandStat", key: "workQuality", amount: 2 },
          { kind: "flag", key: "member.vocalAuthorshipResolved", value: "shared_credit" },
          {
            kind: "addHistory",
            entry: {
              type: "member",
              title: "主唱获得创作署名",
              description: "林夏不再只是把旋律唱到台前，她的名字也留在了歌的核心位置。",
              weight: 4,
              tags: ["career", "member", "vocal", "authorship"]
            }
          }
        ],
        feedback: {
          title: "署名被重新写下",
          body: "你们把乐评转发出去，也把创作说明补完整。林夏没有说谢谢，只是在下一次排练前先唱出了新的副歌。"
        }
      },
      {
        id: "keep_guitarist_credit",
        label: "维持现有叙述",
        effects: [
          {
            kind: "memberStatus",
            character: "vocal",
            status: "strained",
            note: "林夏继续站在聚光灯前，但她开始把最锋利的旋律留给自己。"
          },
          { kind: "relationship", character: "vocal", amount: -7 },
          { kind: "bandStat", key: "cohesion", amount: -4 },
          { kind: "bandStat", key: "workQuality", amount: 3 },
          { kind: "playerStat", key: "fame", amount: 2 },
          { kind: "flag", key: "member.vocalAuthorshipResolved", value: "player_credit" },
          { kind: "flag", key: "member.vocalAuthorshipScar", value: true }
        ],
        feedback: {
          title: "光打在你身上",
          body: "外界继续把故事讲成吉他手的胜利。歌变得更锋利了，但林夏每次唱到副歌，像是在把一部分自己收回去。"
        }
      }
    ]
  },
  {
    id: "career.rare.member_drums_burnout_break",
    title: "鼓凳上的空白",
    tags: ["career", "rare", "member", "drums", "burnout"],
    category: "rare",
    phase: "career",
    careerStages: ["early", "rising"],
    rarity: "rare",
    weight: 2,
    cooldownMonths: 10,
    repeatable: false,
    priority: 43,
    once: false,
    trigger: {
      flagsAll: ["campus.graduationShowDone", "member.drumsFallingBehind"],
      flagsNone: ["member.drumsBurnoutResolved"],
      memberStatus: { drums: "strained" },
      maxRelationship: { drums: 30 },
      minPlayer: { stress: 65 }
    },
    body: "唐野坐在鼓凳上，鼓槌横在膝盖上。你们催了两遍，他才抬头说：我知道从哪里进，我只是突然不想再证明自己没拖后腿。",
    choices: [
      {
        id: "cancel_rehearsal_for_drums",
        label: "取消排练陪他缓一晚",
        effects: [
          {
            kind: "memberStatus",
            character: "drums",
            status: "active",
            note: "唐野重新找回了拍子，也知道自己可以在撑不住时停下来。"
          },
          { kind: "relationship", character: "drums", amount: 9 },
          { kind: "bandStat", key: "cohesion", amount: 3 },
          { kind: "bandStat", key: "workQuality", amount: -2 },
          { kind: "playerStat", key: "stress", amount: -4 },
          { kind: "flag", key: "member.drumsBurnoutResolved", value: "rested" },
          {
            kind: "addHistory",
            entry: {
              type: "member",
              title: "鼓手停下了一晚",
              description: "唐野没有被继续推着走。乐队少练了一晚，却多留住了一个人。",
              weight: 4,
              tags: ["career", "member", "drums", "burnout"]
            }
          }
        ],
        feedback: {
          title: "鼓声暂停",
          body: "排练室第一次因为一个人的沉默而停下来。唐野靠着墙坐了很久，最后说下次他会自己数四下。"
        }
      },
      {
        id: "push_drums_to_finish",
        label: "让他撑完这次排练",
        effects: [
          {
            kind: "memberStatus",
            character: "drums",
            status: "strained",
            note: "唐野把排练撑完了，但每一次数拍都像在和自己较劲。"
          },
          { kind: "relationship", character: "drums", amount: -7 },
          { kind: "bandStat", key: "workQuality", amount: 3 },
          { kind: "bandStat", key: "cohesion", amount: -3 },
          { kind: "playerStat", key: "health", amount: -3 },
          { kind: "playerStat", key: "stress", amount: 3 },
          { kind: "flag", key: "member.drumsBurnoutResolved", value: "pushed" },
          { kind: "flag", key: "member.drumsBurnoutScar", value: true }
        ],
        feedback: {
          title: "拍子追上了",
          body: "这一遍终于完整了。你们都听得出它很紧，也都装作那只是因为歌本来就该这么紧。"
        }
      }
    ]
  },
  {
    id: "career.fallback.member_bass_return_or_session",
    title: "没有贝斯的排练表",
    tags: ["career", "fallback", "member", "bass", "return"],
    category: "fallback",
    phase: "career",
    careerStages: ["early", "rising", "mature"],
    rarity: "common",
    weight: 1,
    cooldownMonths: 1,
    repeatable: false,
    priority: 43,
    once: false,
    trigger: {
      flagsAll: ["campus.graduationShowDone", "member.bassTemporaryLeave"],
      flagsNone: ["member.bassReturnResolved"],
      memberStatus: { bass: "away" }
    },
    body: "新的排练表贴在墙上，贝斯那一栏空着。林夏说不能假装什么都没发生，唐野把鼓槌转了半圈，问你们到底是在等周航回来，还是先让乐队继续往前走。",
    choices: [
      {
        id: "wait_for_bass_return",
        label: "等周航回来再合奏",
        effects: [
          {
            kind: "memberStatus",
            character: "bass",
            status: "active",
            note: "周航带着换好的弦回到排练室，这一次账本摊在所有人中间。"
          },
          { kind: "relationship", character: "bass", amount: 10 },
          { kind: "bandStat", key: "cohesion", amount: 4 },
          { kind: "bandStat", key: "workQuality", amount: 1 },
          { kind: "playerStat", key: "stress", amount: -3 },
          { kind: "flag", key: "member.bassReturnResolved", value: "returned" },
          {
            kind: "addHistory",
            entry: {
              type: "member",
              title: "贝斯手归队",
              description: "周航回到了排练室。贝斯声重新落下时，所有人都知道这不是回到从前。",
              weight: 4,
              tags: ["career", "member", "bass", "return"]
            }
          }
        ],
        feedback: {
          title: "贝斯声重新落下",
          body: "周航没有说漂亮话，只把线接上，试了一个音。那一下低频不响亮，却让整间排练室重新有了地面。"
        }
      },
      {
        id: "bring_session_bassist",
        label: "请临时贝斯手顶上",
        effects: [
          {
            kind: "memberStatus",
            character: "bass",
            status: "away",
            note: "周航仍在暂别，临时贝斯手阿岚顶上低频，让乐队先保持呼吸。"
          },
          { kind: "relationship", character: "bass", amount: -4 },
          { kind: "bandStat", key: "funds", amount: -450 },
          { kind: "bandStat", key: "workQuality", amount: 3 },
          { kind: "bandStat", key: "cohesion", amount: -2 },
          { kind: "flag", key: "member.sessionBassistJoined", value: true },
          { kind: "flag", key: "member.bassReturnResolved", value: "session" },
          {
            kind: "addHistory",
            entry: {
              type: "member",
              title: "临时贝斯手加入排练",
              description: "阿岚临时顶上低频，乐队继续前进，但周航留下的空位没有因此消失。",
              weight: 3,
              tags: ["career", "member", "bass", "session"]
            }
          }
        ],
        feedback: {
          title: "低频有人顶上",
          body: "阿岚学歌很快，也很客气。可每次她看向谱架，你都会想起周航以前从不需要那张纸。"
        }
      }
    ]
  },
  {
    id: "career.rare.album_producer_note",
    title: "制作人的深夜邮件",
    tags: ["career", "rare", "release", "album", "producer", "media"],
    category: "rare",
    phase: "career",
    careerStages: ["rising", "mature"],
    rarity: "rare",
    weight: 1,
    cooldownMonths: 10,
    repeatable: false,
    priority: 45,
    once: false,
    trigger: {
      flagsAll: ["campus.graduationShowDone"],
      hasReleaseType: "album",
      minReleaseCriticalScore: 75,
      minReleaseSales: 2000,
      minPlayer: { fame: 35 },
      minBand: { reputation: 40, fans: 400 }
    },
    body: "凌晨两点，一个你们只在唱片内页见过名字的制作人发来邮件。他没有夸销量，只说专辑里第三首和第六首之间藏着一支乐队真正的方向。",
    choices: [
      {
        id: "reply_to_producer",
        label: "认真回复并约见面",
        effects: [
          { kind: "bandStat", key: "workQuality", amount: 6 },
          { kind: "bandStat", key: "reputation", amount: 5 },
          { kind: "playerStat", key: "fame", amount: 4 },
          { kind: "playerStat", key: "stress", amount: 3 },
          {
            kind: "addHistory",
            entry: {
              type: "release",
              title: "专辑引来制作人",
              description: "一位制作人在深夜写来长信。专辑不只是卖出去了，它开始把更远的人带到你们面前。",
              weight: 4,
              tags: ["career", "album", "producer"]
            }
          }
        ],
        feedback: { title: "有人听见了结构", body: "你回信写了很久。对方听见的不只是歌，还有你们这些年一直绕不开的那个方向。" }
      },
      {
        id: "keep_album_self_contained",
        label: "暂时保持独立制作",
        effects: [
          { kind: "bandStat", key: "reputation", amount: 2 },
          { kind: "bandStat", key: "funds", amount: -200 },
          { kind: "relationship", character: "bass", amount: 1 }
        ],
        feedback: { title: "门没有完全关上", body: "你们礼貌回复，暂时不合作。周航说这是一次拒绝，也是一种确认。" }
      }
    ]
  },
  {
    id: "career.rare.festival_side_stage_invite",
    title: "音乐节侧台邀约",
    tags: ["career", "rare", "festival", "performance", "album", "media"],
    category: "rare",
    phase: "career",
    careerStages: ["rising", "mature", "late"],
    rarity: "rare",
    weight: 1,
    cooldownMonths: 10,
    repeatable: false,
    priority: 44,
    once: false,
    trigger: {
      flagsAll: ["campus.graduationShowDone"],
      hasAlbum: true,
      minReleaseCriticalScore: 65,
      minPlayer: { fame: 28, technique: 50, stage: 45 },
      minBand: { workQuality: 55, reputation: 25, fans: 120 }
    },
    body: "一篇专辑短评被音乐节策划转发。几天后，对方发来侧台邀约，说想看看这支在评论区被反复提到的乐队，现场到底能不能站住。",
    choices: [
      {
        id: "accept_festival_invite",
        label: "接下音乐节邀约",
        effects: [
          { kind: "playerStat", key: "fame", amount: 9 },
          { kind: "bandStat", key: "fans", amount: 60 },
          { kind: "bandStat", key: "reputation", amount: 7 },
          { kind: "playerStat", key: "health", amount: -4 },
          {
            kind: "addHistory",
            entry: {
              type: "performance",
              title: "被音乐节看见",
              description: "专辑评价把你们推到音乐节侧台。陌生观众从远处走近，像潮水终于摸到脚边。",
              weight: 4,
              tags: ["career", "festival", "performance", "album", "media"]
            }
          }
        ],
        feedback: { title: "侧台也有风", body: "你们不是海报上最大的名字，但当第一排跟着拍手时，那个下午突然变得很亮。" }
      },
      {
        id: "decline_festival_invite",
        label: "暂不接音乐节",
        effects: [
          { kind: "bandStat", key: "workQuality", amount: 3 },
          { kind: "playerStat", key: "stress", amount: 2 },
          { kind: "counter", key: "missedOpportunities", amount: 1 }
        ],
        feedback: { title: "邀约停在收件箱", body: "你们没有点下确认。林夏说下一次可以，但谁都知道下一次不会自动到来。" }
      }
    ]
  },
  {
    id: "career.rare.album_tour_invite",
    title: "专辑巡演邀约",
    tags: ["career", "rare", "tour", "performance", "album", "media"],
    category: "rare",
    phase: "career",
    careerStages: ["rising", "mature", "late"],
    rarity: "legendary",
    weight: 1,
    cooldownMonths: 12,
    repeatable: false,
    priority: 46,
    once: false,
    trigger: {
      flagsAll: ["campus.graduationShowDone"],
      hasAlbum: true,
      minReleaseCriticalScore: 70,
      minPlayer: { fame: 42, technique: 55, stage: 55, health: 45 },
      minBand: { workQuality: 65, reputation: 38, fans: 350, funds: 800 }
    },
    body: "巡演主办方说专辑的数据、现场反馈和媒体评价都够了，愿意帮你们串起几座城市。邀约像一张地图，也像一份体检报告。",
    choices: [
      {
        id: "accept_tour_invite",
        label: "接下巡演邀约",
        effects: [
          { kind: "playerStat", key: "fame", amount: 13 },
          { kind: "bandStat", key: "fans", amount: 130 },
          { kind: "bandStat", key: "reputation", amount: 9 },
          { kind: "bandStat", key: "funds", amount: -600 },
          { kind: "playerStat", key: "health", amount: -7 },
          {
            kind: "addHistory",
            entry: {
              type: "performance",
              title: "专辑被带上巡演路",
              description: "一次外部邀约把专辑带向几座城市。每晚的谢幕都像在问：这支乐队能不能撑到下一站。",
              weight: 5,
              tags: ["career", "tour", "performance", "album", "media"]
            }
          }
        ],
        feedback: { title: "下一站写在车票上", body: "路线确认后，排练室忽然显得很小。周航把预算表合上，说现在每首歌都要经得起路。" }
      },
      {
        id: "decline_tour_invite",
        label: "先守住本地演出",
        effects: [
          { kind: "bandStat", key: "funds", amount: 120 },
          { kind: "playerStat", key: "health", amount: 2 },
          { kind: "counter", key: "missedOpportunities", amount: 1 }
        ],
        feedback: { title: "地图没有展开", body: "你们把巡演往后推。鼓手开玩笑说省下了腰，但那张地图没有人舍得扔。" }
      }
    ]
  },
  {
    id: "career.anchor.rising_annual_review",
    title: "第一份真正的年度回声",
    tags: ["career", "anchor", "annual", "rising", "reflection"],
    category: "anchor",
    phase: "career",
    careerStages: ["rising"],
    rarity: "rare",
    weight: 1,
    cooldownMonths: 12,
    repeatable: false,
    priority: 67,
    once: true,
    trigger: {
      flagsAll: ["campus.graduationShowDone"],
      flagsNone: ["career.risingAnnualReviewDone"],
      minAnnualSummaries: 1,
      minLastYearReleases: 1,
      minLastYearPerformances: 3,
      minLastYearReleaseSales: 1200,
      minLastYearCriticalScore: 65,
      minLastYearFame: 35,
      maxLastYearHealthDebt: 18
    },
    body: "年初的排练室比平时安静。周航把上一年的发行、演出和开销列成一页纸，林夏在角落写下新的副歌。你们第一次不是靠一场演出证明自己，而是靠一整年留下的痕迹。",
    choices: [
      {
        id: "turn_year_into_plan",
        label: "把这一年写进下一张计划",
        effects: [
          { kind: "bandStat", key: "workQuality", amount: 4 },
          { kind: "bandStat", key: "reputation", amount: 3 },
          { kind: "playerStat", key: "stress", amount: 2 },
          { kind: "flag", key: "career.risingAnnualReviewDone", value: true },
          {
            kind: "addHistory",
            entry: {
              type: "event",
              title: "年度回声变成新计划",
              description: "乐队第一次认真回看完整的一年，并把那些发行、演出和疲惫写进下一阶段计划。",
              weight: 4,
              tags: ["career", "annual", "rising"]
            }
          }
        ],
        feedback: {
          title: "回声被写进计划",
          body: "那张纸没有让未来变轻，但它让未来第一次有了形状。你把日期圈起来，知道下一张作品不能只靠冲动完成。"
        }
      },
      {
        id: "slow_rising_pace",
        label: "先把节奏放慢",
        effects: [
          { kind: "playerStat", key: "health", amount: 3 },
          { kind: "relationship", character: "vocal", amount: 2 },
          { kind: "relationship", character: "bass", amount: 2 },
          { kind: "relationship", character: "drums", amount: 2 },
          { kind: "bandStat", key: "cohesion", amount: 2 },
          { kind: "flag", key: "career.risingAnnualReviewDone", value: true },
          {
            kind: "addHistory",
            entry: {
              type: "event",
              title: "上升期的第一次减速",
              description: "年度总结让你们承认，继续往前不等于每个月都把自己推到极限。",
              weight: 3,
              tags: ["career", "annual", "rising", "health"]
            }
          }
        ],
        feedback: {
          title: "排练表空出一格",
          body: "你们删掉一个并不必要的通宵。唐野说少练一晚不会毁掉乐队，周航第一次没有反驳。"
        }
      }
    ]
  },
  {
    id: "career.random.rising_media_profile",
    title: "年度榜单边上的侧写",
    tags: ["career", "random", "annual", "rising", "media"],
    category: "random",
    phase: "career",
    careerStages: ["rising"],
    rarity: "uncommon",
    weight: 2,
    cooldownMonths: 8,
    repeatable: false,
    priority: 42,
    once: false,
    trigger: {
      flagsAll: ["campus.graduationShowDone"],
      minAnnualSummaries: 1,
      minLastYearReleaseSales: 1500,
      minLastYearCriticalScore: 65,
      minLastYearFame: 35
    },
    body: "一家媒体把你们放进年度回顾的侧栏。不是封面，不是年度最佳，只是一段说你们“终于开始像一支能走远的乐队”的短评。",
    choices: [
      {
        id: "accept_media_profile",
        label: "接受采访补上故事",
        effects: [
          { kind: "playerStat", key: "fame", amount: 4 },
          { kind: "bandStat", key: "reputation", amount: 4 },
          { kind: "bandStat", key: "fans", amount: 35 },
          { kind: "playerStat", key: "stress", amount: 2 }
        ],
        feedback: {
          title: "故事被问出口",
          body: "采访的人问你们这一年最重要的时刻。你差点说销量，最后却说起某个雨天的街角演出。"
        }
      },
      {
        id: "let_profile_pass",
        label: "只转发榜单不受访",
        effects: [
          { kind: "bandStat", key: "workQuality", amount: 2 },
          { kind: "playerStat", key: "stress", amount: -1 }
        ],
        feedback: {
          title: "名字留在侧栏",
          body: "你们没有把故事讲得太满。那段侧写安静地躺在页面上，像一张还没有兑掉的票。"
        }
      }
    ]
  },
  {
    id: "career.anchor.mature_catalog_crossroads",
    title: "曲库开始反过来要求你们",
    tags: ["career", "anchor", "annual", "mature", "catalog"],
    category: "anchor",
    phase: "career",
    careerStages: ["mature"],
    rarity: "rare",
    weight: 1,
    cooldownMonths: 18,
    repeatable: false,
    priority: 66,
    once: true,
    trigger: {
      flagsAll: ["campus.graduationShowDone"],
      flagsNone: ["career.matureCatalogCrossroadsDone"],
      minAnnualSummaries: 3,
      minLastYearReleases: 2,
      minLastYearPerformances: 4,
      minLastYearReleaseSales: 4500,
      minLastYearCriticalScore: 75,
      minLastYearFame: 55,
      maxLastYearHealthDebt: 18,
      minBand: { reputation: 55, fans: 800 }
    },
    body: "厂牌、场地方和媒体不再只问你们下一首歌是什么。他们开始问旧歌版权、专场结构、精选发行和更长的合作周期。成熟期不是掌声变大，而是每一首旧歌都开始反过来要求你们负责。",
    choices: [
      {
        id: "organize_catalog_for_long_run",
        label: "整理曲库并规划长期发行",
        effects: [
          { kind: "bandStat", key: "reputation", amount: 6 },
          { kind: "bandStat", key: "fans", amount: 120 },
          { kind: "bandStat", key: "workQuality", amount: 3 },
          { kind: "playerStat", key: "stress", amount: 3 },
          { kind: "flag", key: "career.matureCatalogCrossroadsDone", value: true },
          {
            kind: "addHistory",
            entry: {
              type: "release",
              title: "曲库进入长期规划",
              description: "你们开始像经营一段漫长关系那样整理曲库，旧歌不再只是过去的证明。",
              weight: 5,
              tags: ["career", "annual", "mature", "catalog"]
            }
          }
        ],
        feedback: {
          title: "旧歌被重新编号",
          body: "你们把每首歌的版本、录音和现场改动排成表。那一刻你明白，成熟不是有更多歌，而是愿意为每首歌的以后负责。"
        }
      },
      {
        id: "reject_catalog_pressure",
        label: "拒绝回头，只写新歌",
        effects: [
          { kind: "playerStat", key: "creativity", amount: 4 },
          { kind: "bandStat", key: "workQuality", amount: 5 },
          { kind: "relationship", character: "vocal", amount: 1 },
          { kind: "playerStat", key: "stress", amount: 5 },
          { kind: "flag", key: "career.matureCatalogCrossroadsDone", value: true }
        ],
        feedback: {
          title: "旧歌没有拦住你",
          body: "你把整理表推到一边，重新拿起吉他。林夏笑了一下，说这很像你，也很危险。"
        }
      }
    ]
  },
  {
    id: "career.random.mature_catalog_audit",
    title: "曲库审计的下午",
    tags: ["career", "random", "annual", "mature", "catalog"],
    category: "random",
    phase: "career",
    careerStages: ["mature"],
    rarity: "uncommon",
    weight: 2,
    cooldownMonths: 8,
    repeatable: true,
    priority: 41,
    once: false,
    trigger: {
      flagsAll: ["campus.graduationShowDone"],
      minAnnualSummaries: 1,
      minLastYearPerformances: 3,
      minLastYearReleaseSales: 3000,
      minLastYearCriticalScore: 70,
      minPlayer: { fame: 45 },
      minBand: { reputation: 45 }
    },
    body: "一个下午，你们把旧歌的现场版本、录音版本和未发行版本全翻出来。每个文件名都像一段被省略的年份。",
    choices: [
      {
        id: "clean_catalog_versions",
        label: "整理版本和现场编排",
        effects: [
          { kind: "bandStat", key: "workQuality", amount: 3 },
          { kind: "bandStat", key: "reputation", amount: 2 },
          { kind: "relationship", character: "bass", amount: 2 }
        ],
        feedback: {
          title: "文件夹终于安静",
          body: "周航把版本号改得很清楚。旧歌没有变新，但它们终于不再像散落一地的线。"
        }
      },
      {
        id: "mine_old_demo_for_new_song",
        label: "从旧 Demo 里挖一段新动机",
        effects: [
          { kind: "playerStat", key: "creativity", amount: 3 },
          { kind: "addRiff", riff: { titleSeed: "旧版本的反光", quality: 35, styleTags: ["catalog", "mature"], source: "event" } }
        ],
        feedback: {
          title: "旧失误长出新枝",
          body: "你在一个废弃 Demo 的尾巴里听见一段从前没注意过的和弦。它像旧年份递来的回信。"
        }
      }
    ]
  },
  {
    id: "career.anchor.late_legacy_question",
    title: "有人开始问这支乐队会留下什么",
    tags: ["career", "anchor", "annual", "late", "legacy"],
    category: "anchor",
    phase: "career",
    careerStages: ["late"],
    rarity: "legendary",
    weight: 1,
    cooldownMonths: 24,
    repeatable: false,
    priority: 65,
    once: true,
    trigger: {
      flagsAll: ["campus.graduationShowDone"],
      flagsNone: ["career.lateLegacyQuestionDone"],
      minAnnualSummaries: 10,
      minLastYearPerformances: 2,
      minLastYearFame: 65,
      minBand: { reputation: 65 }
    },
    body: "一个做专题的记者问：如果明天不再演了，你们希望别人记住什么？问题落在桌上，比任何报价都重。你看向林夏、周航和唐野，突然发现很多年已经变成了彼此脸上的细节。",
    choices: [
      {
        id: "hold_anniversary_show",
        label: "办一场周年专场",
        effects: [
          { kind: "playerStat", key: "fame", amount: 7 },
          { kind: "bandStat", key: "fans", amount: 180 },
          { kind: "bandStat", key: "reputation", amount: 5 },
          { kind: "playerStat", key: "health", amount: -5 },
          { kind: "relationship", character: "vocal", amount: 2 },
          { kind: "relationship", character: "bass", amount: 2 },
          { kind: "relationship", character: "drums", amount: 2 },
          { kind: "flag", key: "career.lateLegacyQuestionDone", value: "anniversary_show" },
          {
            kind: "addHistory",
            entry: {
              type: "performance",
              title: "周年专场",
              description: "多年以后，你们用一场专场回答了乐队会留下些什么。谢幕很长，像把很多年重新数了一遍。",
              weight: 6,
              tags: ["career", "late", "legacy", "performance"]
            }
          }
        ],
        feedback: {
          title: "谢幕很长",
          body: "返场时，台下有人唱错歌词，也有人哭。你忽然觉得留下来的不是某一首歌，而是这些人在某一年真的需要过你们。"
        }
      },
      {
        id: "answer_with_next_record",
        label: "把答案留给下一张专辑",
        effects: [
          { kind: "bandStat", key: "workQuality", amount: 6 },
          { kind: "bandStat", key: "reputation", amount: 2 },
          { kind: "playerStat", key: "stress", amount: 2 },
          { kind: "flag", key: "career.lateLegacyQuestionDone", value: "next_record" }
        ],
        feedback: {
          title: "问题没有被说完",
          body: "你没有回答记者。回到排练室后，你把吉他接上线。唐野数了四下，像很多年前第一次排练那样。"
        }
      }
    ]
  },
  {
    id: "career.random.late_anniversary_request",
    title: "老场地方的周年邀请",
    tags: ["career", "random", "annual", "late", "anniversary", "performance"],
    category: "random",
    phase: "career",
    careerStages: ["late"],
    rarity: "rare",
    weight: 1,
    cooldownMonths: 12,
    repeatable: true,
    priority: 40,
    once: false,
    trigger: {
      flagsAll: ["campus.graduationShowDone"],
      minAnnualSummaries: 8,
      minLastYearPerformances: 2,
      minLastYearFame: 55,
      minBand: { reputation: 55 }
    },
    body: "很早以前给过你们拼场的 Livehouse 要办周年夜，负责人问你们愿不愿意回来压轴。那条消息后面附着一张旧海报，乐队名还印得很小。",
    choices: [
      {
        id: "return_to_old_livehouse",
        label: "回到那间老场地",
        effects: [
          { kind: "playerStat", key: "fame", amount: 4 },
          { kind: "bandStat", key: "fans", amount: 70 },
          { kind: "bandStat", key: "reputation", amount: 3 },
          { kind: "relationship", character: "drums", amount: 2 },
          {
            kind: "addHistory",
            entry: {
              type: "performance",
              title: "回到老 Livehouse",
              description: "你们回到早年拼场的地方压轴。海报上的名字终于变大，但后台的味道没有变。",
              weight: 4,
              tags: ["career", "late", "anniversary", "performance"]
            }
          }
        ],
        feedback: {
          title: "海报上的名字变大了",
          body: "后台还是窄，墙还是潮。只是这一次，年轻乐队在门口等你们下台，像当年你们等别人那样。"
        }
      },
      {
        id: "send_younger_band",
        label: "把位置让给年轻乐队",
        effects: [
          { kind: "bandStat", key: "reputation", amount: 4 },
          { kind: "relationship", character: "bass", amount: 2 },
          { kind: "counter", key: "missedOpportunities", amount: 1 }
        ],
        feedback: {
          title: "位置让出去了",
          body: "你们推荐了另一支刚起步的乐队。周航说，这不算错过，只是终于轮到你们把门推开一点。"
        }
      }
    ]
  },
  {
    id: "career.fallback.health_warning",
    title: "身体先听见了",
    tags: ["career", "fallback", "health", "warning"],
    category: "fallback",
    phase: "career",
    rarity: "rare",
    weight: 1,
    cooldownMonths: 1,
    repeatable: false,
    priority: 99,
    once: false,
    trigger: {
      flagsAll: ["campus.graduationShowDone"],
      flagsNone: ["career.healthWarningResolved", "career.healthCollapseResolved"],
      maxPlayer: { health: 35 },
      minPlayer: { stress: 70 }
    },
    body: "返场前，你的手指先停了一下。不是忘谱，是身体比脑子更早听见了危险。林夏把水递过来，周航盯着行程表，唐野没有敲倒数，只问你一句：今晚之后，还要继续这样排下去吗？",
    choices: [
      {
        id: "pause_after_warning",
        label: "停掉接下来的演出",
        effects: [
          { kind: "playerStat", key: "health", amount: 10 },
          { kind: "playerStat", key: "stress", amount: -18 },
          { kind: "counter", key: "missedOpportunities", amount: 1 },
          { kind: "flag", key: "career.healthWarningResolved", value: "paused" },
          {
            kind: "addHistory",
            entry: {
              type: "event",
              title: "健康预警：暂停日程",
              description: "身体在终局前先敲了一次门。你们停掉后续安排，把乐队从危险边缘拉回来。",
              weight: 4,
              tags: ["career", "health", "warning"]
            }
          }
        ],
        feedback: {
          title: "日程被按下暂停",
          body: "周航把接下来的安排一条条划掉。房间里没人欢呼，但你第一次觉得沉默不是失败，而是在把命从舞台边缘拉回来。"
        }
      },
      {
        id: "push_through_warning",
        label: "继续撑完这场",
        effects: [
          { kind: "playerStat", key: "health", amount: -6 },
          { kind: "playerStat", key: "stress", amount: 6 },
          { kind: "flag", key: "career.healthWarningResolved", value: "ignored" },
          {
            kind: "addHistory",
            entry: {
              type: "event",
              title: "健康预警：继续硬撑",
              description: "身体已经发出警告，但你还是决定把今晚撑完。那一步把乐队推向更白的灯。",
              weight: 4,
              tags: ["career", "health", "warning", "collapse"]
            }
          }
        ],
        feedback: {
          title: "台阶变得很远",
          body: "你说没事，然后站起来。后台到舞台只有十几步，可每一步都像从身体里借来的。唐野终于开始数拍，声音却很低。"
        }
      }
    ]
  },
  {
    id: "career.fallback.health_collapse",
    title: "后台白光",
    tags: ["career", "fallback", "health", "collapse", "ending"],
    category: "fallback",
    phase: "career",
    rarity: "legendary",
    weight: 1,
    cooldownMonths: 1,
    repeatable: false,
    priority: 98,
    once: false,
    trigger: {
      flagsAll: ["campus.graduationShowDone"],
      flagsNone: ["career.healthCollapseResolved"],
      maxPlayer: { health: 25 },
      minPlayer: { stress: 80 }
    },
    body: "返场前的走廊突然变得很长。耳鸣盖过了观众的喊声，白色顶灯在你眼前晃开，救护车的声音从场馆后门钻进来。林夏握着你的拨片，周航第一次没有看预算表，唐野站在门口，像怕一数拍你就会继续往台上走。",
    choices: [
      {
        id: "let_ambulance_leave",
        label: "让救护车开走",
        effects: [
          { kind: "counter", key: "healthCrises", amount: 1 },
          { kind: "flag", key: "career.healthCollapseResolved", value: "ambulance" },
          {
            kind: "addHistory",
            entry: {
              type: "event",
              title: "健康崩溃：后台白光",
              description: "你在返场前被送上救护车。掌声没有消失，只是被白色顶灯和急促脚步声隔在门外。",
              weight: 6,
              tags: ["career", "health", "collapse", "ending"]
            }
          }
        ],
        feedback: {
          title: "灯从头顶退远",
          body: "车门合上时，场馆里的低频还在震。你第一次没有伸手去摸琴，只听见林夏在外面说：够了，这次真的够了。"
        },
        endingTrigger: "healthCollapse"
      },
      {
        id: "cancel_everything_after_tonight",
        label: "取消今晚之后的所有安排",
        effects: [
          { kind: "counter", key: "healthCrises", amount: 1 },
          { kind: "bandStat", key: "reputation", amount: 1 },
          { kind: "flag", key: "career.healthCollapseResolved", value: "cancelled" },
          {
            kind: "addHistory",
            entry: {
              type: "event",
              title: "健康崩溃：取消后续安排",
              description: "你们取消了之后所有安排。那不是输给身体，而是终于承认身体也是乐队的一部分。",
              weight: 6,
              tags: ["career", "health", "collapse", "ending"]
            }
          }
        ],
        feedback: {
          title: "日程表被划空",
          body: "周航把接下来的城市一个个划掉。唐野没有开玩笑，林夏把水递给你，像把那句没说出口的别硬撑也一起递过来。"
        },
        endingTrigger: "healthCollapse"
      }
    ]
  },
  {
    id: "career.fallback.breakup_warning",
    title: "沉默占满排练室",
    tags: ["career", "fallback", "breakup", "member", "warning"],
    category: "fallback",
    phase: "career",
    rarity: "rare",
    weight: 1,
    cooldownMonths: 1,
    repeatable: false,
    priority: 99,
    once: false,
    trigger: {
      flagsAll: ["campus.graduationShowDone"],
      flagsNone: ["career.breakupWarningResolved", "career.bandBreakupResolved"],
      maxRelationship: { vocal: 30, bass: 30, drums: 30 }
    },
    body: "今天没有人先数拍。林夏把歌词本合上，周航把调音器放回包里，唐野低头拧着鼓钥匙。你们还没有说解散，但排练室已经先替你们空了一半。",
    choices: [
      {
        id: "talk_before_breakup",
        label: "把话摊开说",
        effects: [
          { kind: "bandStat", key: "cohesion", amount: 4 },
          { kind: "relationship", character: "vocal", amount: 8 },
          { kind: "relationship", character: "bass", amount: 8 },
          { kind: "relationship", character: "drums", amount: 8 },
          { kind: "flag", key: "career.breakupWarningResolved", value: "talked" },
          {
            kind: "addHistory",
            entry: {
              type: "member",
              title: "解散预警：把话摊开",
              description: "你们在真正解散前把话说开。裂痕还在，但至少没有让沉默替所有人做决定。",
              weight: 4,
              tags: ["career", "breakup", "member", "warning"]
            }
          }
        ],
        feedback: {
          title: "话终于落地",
          body: "没人立刻原谅谁，但每个人都把最硬的那句话说出了口。排练没有变好，可下一拍终于还有人愿意数。"
        }
      },
      {
        id: "let_silence_continue",
        label: "继续各自收拾",
        effects: [
          { kind: "bandStat", key: "cohesion", amount: -6 },
          { kind: "relationship", character: "vocal", amount: -5 },
          { kind: "relationship", character: "bass", amount: -5 },
          { kind: "relationship", character: "drums", amount: -5 },
          { kind: "flag", key: "career.breakupWarningResolved", value: "silent" },
          {
            kind: "addHistory",
            entry: {
              type: "member",
              title: "解散预警：沉默继续",
              description: "你们谁也没有把话说开。每个人都在收拾自己的东西，像已经提前离开了同一首歌。",
              weight: 4,
              tags: ["career", "breakup", "member", "warning"]
            }
          }
        ],
        feedback: {
          title: "沉默继续加重",
          body: "线缆一根根被卷好，声音却没有被收回来。你看着他们各自低头，知道这间排练室已经很难再装下同一支乐队。"
        }
      }
    ]
  },
  {
    id: "career.fallback.band_breakup",
    title: "最后一次排练",
    tags: ["career", "fallback", "breakup", "member", "ending"],
    category: "fallback",
    phase: "career",
    rarity: "legendary",
    weight: 1,
    cooldownMonths: 1,
    repeatable: false,
    priority: 97,
    once: false,
    trigger: {
      flagsAll: ["campus.graduationShowDone"],
      flagsNone: ["career.bandBreakupResolved"],
      maxRelationship: { vocal: 24, bass: 24, drums: 24 }
    },
    body: "排练室里没有人愿意先数拍。林夏把麦克风线绕好，周航的贝斯已经放进琴包，唐野坐在鼓凳上看着地面。你们都知道不是某一次争吵毁掉了乐队，而是太多次没有被好好接住的沉默，终于挤满了这间房。",
    choices: [
      {
        id: "say_breakup_out_loud",
        label: "把解散说出口",
        effects: [
          { kind: "bandStat", key: "cohesion", amount: -8 },
          { kind: "flag", key: "career.bandBreakupResolved", value: "spoken" },
          {
            kind: "addHistory",
            entry: {
              type: "member",
              title: "乐队解散：最后一次排练",
              description: "你们在排练室里承认乐队已经走不下去。没有摔门，只有谁也没有再数下一拍。",
              weight: 6,
              tags: ["career", "breakup", "member", "ending"]
            }
          }
        ],
        feedback: {
          title: "没有人再数拍",
          body: "话说出口以后，房间反而安静下来。林夏点点头，周航把钥匙推到桌边，唐野最后摸了一下镲片边缘。"
        },
        endingTrigger: "bandBreakup"
      },
      {
        id: "leave_keys_on_amp",
        label: "把钥匙留在音箱上",
        effects: [
          { kind: "bandStat", key: "cohesion", amount: -6 },
          { kind: "flag", key: "career.bandBreakupResolved", value: "keys" },
          {
            kind: "addHistory",
            entry: {
              type: "member",
              title: "乐队解散：钥匙留在音箱上",
              description: "你把排练室钥匙留在音箱上。门合上以后，那些没排完的歌再也没有等到同一个节拍。",
              weight: 6,
              tags: ["career", "breakup", "member", "ending"]
            }
          }
        ],
        feedback: {
          title: "钥匙留在音箱上",
          body: "你没有再争最后一句。钥匙碰到音箱外壳时发出很轻的一声，轻到像这支乐队终于承认自己已经散了。"
        },
        endingTrigger: "bandBreakup"
      }
    ]
  },
  {
    id: "career.fallback.retirement_night",
    title: "退役前夜",
    tags: ["career", "fallback", "retirement", "ending"],
    category: "fallback",
    phase: "career",
    rarity: "legendary",
    weight: 1,
    cooldownMonths: 1,
    repeatable: false,
    priority: 90,
    once: false,
    trigger: {
      flagsAll: ["campus.graduationShowDone", "career.retirementRequested"],
      flagsNone: ["career.retirementResolved"]
    },
    body: "排练室只剩一盏安全灯。琴盒摊开在脚边，旧拨片、断弦和写满和弦的纸条散在桌上。林夏没有催你，周航把钥匙放到音箱上，唐野最后一次轻敲军鼓边缘。退役不是一行状态，而是你要亲手把这段声音收好。",
    choices: [
      {
        id: "put_guitar_in_case",
        label: "把琴放回琴盒",
        effects: [
          { kind: "playerStat", key: "health", amount: 2 },
          { kind: "playerStat", key: "stress", amount: -4 },
          { kind: "relationship", character: "vocal", amount: 1 },
          { kind: "relationship", character: "bass", amount: 1 },
          { kind: "relationship", character: "drums", amount: 1 },
          { kind: "flag", key: "career.retirementResolved", value: "case" },
          {
            kind: "addHistory",
            entry: {
              type: "event",
              title: "退役前夜：琴盒扣上",
              description: "你在排练室里把琴放回琴盒。不是逃走，而是承认这一段路已经被完整唱过。",
              weight: 5,
              tags: ["career", "retirement", "ending"]
            }
          }
        ],
        feedback: {
          title: "琴盒扣上",
          body: "锁扣合上的声音比想象中轻。林夏把最后一张歌词折好，周航关掉电源，唐野没有说再见，只在门口等你一起下楼。"
        },
        endingTrigger: "retirement"
      },
      {
        id: "leave_setlist_for_bandmates",
        label: "把歌单留给队友",
        effects: [
          { kind: "bandStat", key: "reputation", amount: 2 },
          { kind: "relationship", character: "vocal", amount: 2 },
          { kind: "relationship", character: "bass", amount: 2 },
          { kind: "relationship", character: "drums", amount: 2 },
          { kind: "flag", key: "career.retirementResolved", value: "setlist" },
          {
            kind: "addHistory",
            entry: {
              type: "event",
              title: "退役前夜：歌单留在桌上",
              description: "你把最后一份歌单留给队友。那些歌不会替你继续，但会替你证明曾经一起响过。",
              weight: 5,
              tags: ["career", "retirement", "band", "ending"]
            }
          }
        ],
        feedback: {
          title: "歌单留在桌上",
          body: "歌名按演出的顺序排好，像一串被擦亮的年份。你没有再改任何一个转调，只在页脚写下：后面的拍子，你们来数。"
        },
        endingTrigger: "retirement"
      }
    ]
  },
  {
    id: "career.fallback.farewell_show",
    title: "告别演出",
    tags: ["career", "fallback", "farewell", "performance", "ending"],
    category: "fallback",
    phase: "career",
    rarity: "legendary",
    weight: 1,
    cooldownMonths: 1,
    repeatable: false,
    priority: 90,
    once: false,
    trigger: {
      flagsAll: ["campus.graduationShowDone", "career.farewellShowRequested"],
      flagsNone: ["career.farewellShowResolved"]
    },
    body: "最后一场演出的海报贴在后台门口，纸边已经被潮气卷起。林夏一遍遍确认歌单，周航把预算表收进琴包，唐野坐在鼓凳上没有转鼓槌。你们都知道，今晚的每一次停顿都会被记成告别的一部分。",
    choices: [
      {
        id: "play_catalog_in_years",
        label: "按年份唱完旧歌",
        effects: [
          { kind: "playerStat", key: "fame", amount: 4 },
          { kind: "bandStat", key: "fans", amount: 90 },
          { kind: "bandStat", key: "reputation", amount: 4 },
          { kind: "relationship", character: "vocal", amount: 2 },
          { kind: "relationship", character: "bass", amount: 2 },
          { kind: "relationship", character: "drums", amount: 2 },
          { kind: "flag", key: "career.farewellShowResolved", value: "catalog" },
          {
            kind: "addHistory",
            entry: {
              type: "performance",
              title: "告别演出：旧歌按年份唱完",
              description: "你们把旧歌按年份排开。每一首歌都像一段被重新点亮的路，最后在谢幕里合上。",
              weight: 6,
              tags: ["career", "farewell", "performance", "legacy", "catalog"]
            }
          }
        ],
        feedback: {
          title: "最后一首旧歌",
          body: "旧歌一首接一首被唱完，台下有人跟着数年份。最后一个副歌响起时，你听见不止一个人在哭，也听见自己终于没有抢拍。"
        },
        endingTrigger: "farewell"
      },
      {
        id: "leave_with_new_song",
        label: "把新歌留到最后",
        effects: [
          { kind: "playerStat", key: "creativity", amount: 3 },
          { kind: "bandStat", key: "workQuality", amount: 4 },
          { kind: "bandStat", key: "reputation", amount: 3 },
          { kind: "playerStat", key: "stress", amount: 2 },
          { kind: "flag", key: "career.farewellShowResolved", value: "new_song" },
          {
            kind: "addHistory",
            entry: {
              type: "performance",
              title: "告别演出：最后唱了新歌",
              description: "告别演出的最后，你们没有回头，而是唱了一首没人听过的新歌。",
              weight: 6,
              tags: ["career", "farewell", "performance", "legacy", "songwriting"]
            }
          }
        ],
        feedback: {
          title: "没人听过的最后一首",
          body: "台下起初很安静，因为没人会唱。到第二段副歌，林夏把麦克风推向观众，像把还没发生的以后也交给了他们。"
        },
        endingTrigger: "farewell"
      }
    ]
  }
];
