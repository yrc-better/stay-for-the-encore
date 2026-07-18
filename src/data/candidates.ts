import type {
  CandidateContent,
  PersonalityTag,
  RecruitableRole,
} from "./types";

const tag = (id: string, label: string): PersonalityTag => ({ id, label });

export const RECRUITABLE_ROLE_LABELS: Record<RecruitableRole, string> = {
  leadGuitar: "主音吉他",
  bass: "贝斯",
  drums: "鼓手",
  keyboard: "键盘",
};

export const CANDIDATES = [
  {
    id: "gu-yanchuan",
    role: "leadGuitar",
    name: "顾言川",
    age: 23,
    biography:
      "大学吉他社里与你搭档最多的人。毕业演出前的那个通宵，你们在空教室里把一段双吉他重新磨了十几遍，他至今还留着当时写满修改的谱子。",
    quote: "主音我来弹。你只管在该开口的时候，把那句话唱出来。",
    tags: [tag("perfectionist", "完美主义"), tag("reliable", "可靠")],
    stats: {
      professional: 72,
      creation: 58,
      performance: 48,
      heat: 31,
      belonging: 62,
    },
    portrait: {
      alt: "珊瑚红线稿绘制的戴眼镜青年顾言川头像",
      futureAssetPath: "/assets/portraits/candidates/gu-yanchuan.webp",
      available: true,
      placeholder: {
        background: "linear-gradient(145deg, #713d42, #1d1b24)",
        foreground: "#ffe3dc",
        monogram: "顾",
      },
      artDirection:
        "日系动画半身角色，男性，黑色短发，细黑框眼镜，深红色电吉他，神情专注，旧排练室背景",
    },
  },
  {
    id: "lin-jianxia",
    role: "leadGuitar",
    name: "林见夏",
    age: 22,
    biography:
      "你在一次校园乐队拼盘的后台认识了她。那晚主办方临时压缩换场时间，她抱着琴踩上舞台，只用第一个推弦就把散乱的观众重新拉到台前。",
    quote: "排练时可以挑错，上台以后就别回头看。",
    tags: [tag("stage-animal", "舞台疯子"), tag("straightforward", "直率")],
    stats: {
      professional: 60,
      creation: 44,
      performance: 72,
      heat: 56,
      belonging: 31,
    },
    portrait: {
      alt: "暖橙线稿绘制的高马尾青年林见夏头像",
      futureAssetPath: "/assets/portraits/candidates/lin-jianxia.webp",
      available: true,
      placeholder: {
        background: "linear-gradient(145deg, #aa5b33, #24181a)",
        foreground: "#fff0cf",
        monogram: "林",
      },
      artDirection:
        "日系动画半身角色，女性，深棕高马尾，白色电吉他，橙色舞台侧光，自信笑容，后台幕布背景",
    },
  },
  {
    id: "zhou-jibai",
    role: "leadGuitar",
    name: "周既白",
    age: 24,
    biography:
      "你们最初只是在小红书上互相评论效果器和编曲。后来他把你随手上传的一段旋律改成完整的双吉他织体，你们才约到线下排练室第一次见面。",
    quote: "一把吉他负责说话，另一把负责说那些没法说出口的。",
    tags: [tag("creative", "创作脑"), tag("sensitive", "细腻")],
    stats: {
      professional: 58,
      creation: 71,
      performance: 44,
      heat: 61,
      belonging: 35,
    },
    portrait: {
      alt: "青蓝线稿绘制的蓬松短发青年周既白头像",
      futureAssetPath: "/assets/portraits/candidates/zhou-jibai.webp",
      available: true,
      placeholder: {
        background: "linear-gradient(145deg, #416a75, #181d25)",
        foreground: "#dffaff",
        monogram: "周",
      },
      artDirection:
        "日系动画半身角色，男性，浅灰蓬松短发，宽松蓝灰外套，手扶效果器旋钮，冷色排练室灯光",
    },
  },
  {
    id: "xu-zhiyao",
    role: "bass",
    name: "许知遥",
    age: 23,
    biography:
      "与你同届，也是在吉他社待到最后一届的人。你毕业答辩最忙的那周，是她替你守着社团仓库，还临时抱起贝斯帮毕业演出补齐了阵容。",
    quote: "你先把歌写完。没人愿意守住的那一拍，我来守。",
    tags: [tag("easygoing", "随和"), tag("loyal", "念旧")],
    stats: {
      professional: 61,
      creation: 43,
      performance: 50,
      heat: 29,
      belonging: 74,
    },
    portrait: {
      alt: "青绿色线稿绘制的齐刘海短发青年许知遥头像",
      futureAssetPath: "/assets/portraits/candidates/xu-zhiyao.webp",
      available: true,
      placeholder: {
        background: "linear-gradient(145deg, #38706b, #172023)",
        foreground: "#d8fff3",
        monogram: "许",
      },
      artDirection:
        "日系动画半身角色，女性，利落黑色短发，湖蓝色贝斯，旧社团仓库与贴纸背景，温和表情",
    },
  },
  {
    id: "tang-wenzhou",
    role: "bass",
    name: "唐闻舟",
    age: 25,
    biography:
      "你常去的Livehouse里，他给三支不同的乐队做过临时贝斯手。一次散场后你们在门口聊了半小时，话题从音箱摆位一路聊到怎样让四拍听起来更重。",
    quote: "真正稳的节奏，不是听不见，是少了以后所有人都会发现。",
    tags: [tag("professional", "职业派"), tag("calm", "沉稳")],
    stats: {
      professional: 73,
      creation: 42,
      performance: 57,
      heat: 34,
      belonging: 51,
    },
    portrait: {
      alt: "琥珀色线稿绘制的微卷短发青年唐闻舟头像",
      futureAssetPath: "/assets/portraits/candidates/tang-wenzhou.webp",
      available: true,
      placeholder: {
        background: "linear-gradient(145deg, #695545, #1e1a1a)",
        foreground: "#f7e6ce",
        monogram: "唐",
      },
      artDirection:
        "日系动画半身角色，男性，深棕微卷短发，深色工装夹克，背着黑色五弦贝斯，Livehouse后门暖光",
    },
  },
  {
    id: "shen-anning",
    role: "bass",
    name: "沈安宁",
    age: 22,
    biography:
      "她在抖音上传的改编视频总能把贝斯线写成第二条旋律。你们互相合拍过几次片段，直到她发来一句“要不要把十五秒做成一整张专辑”。",
    quote: "低音不是背景。给我一点空间，我能让整首歌换一种走路方式。",
    tags: [tag("creative", "创作脑"), tag("social-savvy", "网感敏锐")],
    stats: {
      professional: 56,
      creation: 71,
      performance: 49,
      heat: 61,
      belonging: 28,
    },
    portrait: {
      alt: "紫色线稿绘制的长发青年沈安宁头像",
      futureAssetPath: "/assets/portraits/candidates/shen-anning.webp",
      available: true,
      placeholder: {
        background: "linear-gradient(145deg, #624b80, #1b1725)",
        foreground: "#f0dcff",
        monogram: "沈",
      },
      artDirection:
        "日系动画半身角色，女性，紫黑长发，颈挂监听耳机，银灰贝斯，手机补光灯与卧室录音角背景",
    },
  },
  {
    id: "wei-xingzhi",
    role: "drums",
    name: "魏行之",
    age: 24,
    biography:
      "大学时他是隔壁街舞社借来的鼓手，也常来吉他社帮忙校准节拍器。你们合作过几次社团汇演，他总能在所有人慌乱时把速度稳住。",
    quote: "快没有问题，慢也没有问题。先决定我们要往哪里走。",
    tags: [tag("disciplined", "自律"), tag("reliable", "可靠")],
    stats: {
      professional: 72,
      creation: 32,
      performance: 58,
      heat: 42,
      belonging: 56,
    },
    portrait: {
      alt: "冷灰线稿绘制的寸头青年魏行之头像",
      futureAssetPath: "/assets/portraits/candidates/wei-xingzhi.webp",
      available: true,
      placeholder: {
        background: "linear-gradient(145deg, #4d5965, #171b20)",
        foreground: "#e5edf5",
        monogram: "魏",
      },
      artDirection:
        "日系动画半身角色，男性，清爽寸头，灰色运动外套，肩搭鼓棒袋，姿态端正，大学礼堂后台",
    },
  },
  {
    id: "su-tang",
    role: "drums",
    name: "苏棠",
    age: 23,
    biography:
      "一次拼盘演出开场前，原定鼓手突然失联，是她从观众席下来临时救场。她只听了一遍Demo，就把最后两首歌打得像早已排练过很多次。",
    quote: "数拍子太慢了。你看我抬手，下一秒一起砸下去。",
    tags: [tag("stage-animal", "舞台疯子"), tag("bold", "大胆")],
    stats: {
      professional: 61,
      creation: 45,
      performance: 74,
      heat: 53,
      belonging: 31,
    },
    portrait: {
      alt: "红橙线稿绘制的短发青年苏棠头像",
      futureAssetPath: "/assets/portraits/candidates/su-tang.webp",
      available: true,
      placeholder: {
        background: "linear-gradient(145deg, #9a4437, #251719)",
        foreground: "#ffe0d1",
        monogram: "苏",
      },
      artDirection:
        "日系动画半身角色，女性，红棕短发，黑色无袖上衣，指间转鼓棒，强烈红橙舞台灯，神情张扬",
    },
  },
  {
    id: "han-zimo",
    role: "drums",
    name: "韩子墨",
    age: 22,
    biography:
      "你因为一条抖音鼓点拆解视频关注了他。后来你把自己的Demo发过去，他第二天就回了一版完整鼓轨，还顺手做了三种不同情绪的结尾。",
    quote: "节奏不是格子。只要情绪还在往前，拍子就有很多种答案。",
    tags: [tag("curious", "好奇心强"), tag("social-savvy", "网感敏锐")],
    stats: {
      professional: 57,
      creation: 63,
      performance: 50,
      heat: 70,
      belonging: 28,
    },
    portrait: {
      alt: "蓝色线稿绘制的戴监听设备青年韩子墨头像",
      futureAssetPath: "/assets/portraits/candidates/han-zimo.webp",
      available: true,
      placeholder: {
        background: "linear-gradient(145deg, #315d83, #151b25)",
        foreground: "#d9efff",
        monogram: "韩",
      },
      artDirection:
        "日系动画半身角色，男性，蓝黑自然卷，戴大型监听耳机，手持鼓刷，电脑鼓轨界面虚化背景",
    },
  },
  {
    id: "chen-xingyao",
    role: "keyboard",
    name: "陈星遥",
    age: 23,
    biography:
      "她与你同届，过去常从学校音乐厅搬一台旧合成器到吉他社排练。你写不下去的时候，她会先弹一组和弦，再问你那天到底想说什么。",
    quote: "别急着填满。给旋律留一点呼吸，它自己会告诉你下一步。",
    tags: [tag("empathetic", "善解人意"), tag("loyal", "念旧")],
    stats: {
      professional: 62,
      creation: 55,
      performance: 42,
      heat: 28,
      belonging: 73,
    },
    portrait: {
      alt: "青色线稿绘制的齐肩卷发青年陈星遥头像",
      futureAssetPath: "/assets/portraits/candidates/chen-xingyao.webp",
      available: true,
      placeholder: {
        background: "linear-gradient(145deg, #375d62, #172023)",
        foreground: "#dbfffb",
        monogram: "陈",
      },
      artDirection:
        "日系动画半身角色，女性，齐肩黑发，米白针织外套，手扶小型合成器，大学音乐厅柔和冷光",
    },
  },
  {
    id: "song-qinghe",
    role: "keyboard",
    name: "宋清和",
    age: 24,
    biography:
      "你在一次演出调音时认识了他。主办方的键盘临时失灵，他用现场仅剩的设备重做了整套音色，演出结束后还把参数清单发给了你。",
    quote: "设备会出问题，但声音不能没有方案。",
    tags: [tag("professional", "职业派"), tag("meticulous", "细致")],
    stats: {
      professional: 74,
      creation: 50,
      performance: 59,
      heat: 32,
      belonging: 47,
    },
    portrait: {
      alt: "冷蓝线稿绘制的深色短发青年宋清和头像",
      futureAssetPath: "/assets/portraits/candidates/song-qinghe.webp",
      available: true,
      placeholder: {
        background: "linear-gradient(145deg, #515868, #181b22)",
        foreground: "#e8ecff",
        monogram: "宋",
      },
      artDirection:
        "日系动画半身角色，男性，深灰短发，深色衬衫卷袖，手拿设备接线图，键盘与线材箱背景，冷静神情",
    },
  },
  {
    id: "lu-sixian",
    role: "keyboard",
    name: "陆思弦",
    age: 22,
    biography:
      "她在小红书上分享合成器音色和卧室编曲，你曾留言询问一段铺底的做法。几周后，她把你的练习室录音重新编成了一段像夜路一样延伸的前奏。",
    quote: "键盘不一定要被听见，但它可以改变整间房的颜色。",
    tags: [tag("creative", "创作脑"), tag("independent", "有主见")],
    stats: {
      professional: 58,
      creation: 72,
      performance: 45,
      heat: 63,
      belonging: 29,
    },
    portrait: {
      alt: "紫色线稿绘制的兜帽长发青年陆思弦头像",
      futureAssetPath: "/assets/portraits/candidates/lu-sixian.webp",
      available: true,
      placeholder: {
        background: "linear-gradient(145deg, #66508f, #191724)",
        foreground: "#eee2ff",
        monogram: "陆",
      },
      artDirection:
        "日系动画半身角色，女性，栗色长发，宽松黑色卫衣，身旁合成器旋钮发出紫蓝灯光，卧室编曲环境",
    },
  },
] as const satisfies readonly CandidateContent[];

export const CANDIDATES_BY_ROLE = {
  leadGuitar: CANDIDATES.filter(
    (candidate) => candidate.role === "leadGuitar",
  ),
  bass: CANDIDATES.filter((candidate) => candidate.role === "bass"),
  drums: CANDIDATES.filter((candidate) => candidate.role === "drums"),
  keyboard: CANDIDATES.filter((candidate) => candidate.role === "keyboard"),
} as const;
