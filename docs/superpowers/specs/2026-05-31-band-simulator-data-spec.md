# 《乐队模拟器》数据规格附录

## 目的

本附录把产品设计转成第一版可实现、可测试、可调参的数据规格。这里的数字是 MVP 默认值，不是最终平衡。实现时应把数值放入独立配置，例如 `src/game/config/balance.ts`，避免散落在 UI 或行动函数里。

第一版数据目标：

- 能写明确断言的单元测试。
- 能支撑 4 个月的早期可玩内容。
- 能调出结局页并验证职业称号判定。
- 后续扩写事件、歌曲、专辑和长期寿命时不需要推翻模型。

## 第一版时间与内容量

第一版可玩时间段：

- `2027-05`：校园序章，毕业演出前一个月。
- `2027-06`：毕业后第一个月，乐队是否继续。
- `2027-07`：第一次稳定演出或 Demo 机会。
- `2027-08`：早期分歧节点，进入后续主线的开放结尾。

结局页在第一版中必须可调出，但不要求自然推进到寿命终点。入口包括：

- 开发预览按钮。
- 退役。
- 告别演出。
- 测试用寿命结束状态。

第一版最低内容量：

| 类型 | 最低数量 | 说明 |
| --- | ---: | --- |
| 出身路线开场 | 4 | 技术宅、创作型、舞台型、叛逆型各 1 个 |
| 月份主事件 | 4 | 每个可玩月份至少 1 个 |
| 成员关系事件 | 6 | 主唱、贝斯、鼓手各至少 2 个 |
| 作品链事件 | 4 | Riff、团体创作、录音、演出各至少 1 个 |
| 事业节点事件 | 4 | 合作、宣传、Livehouse、毕业后选择 |
| 行动反馈文本 | 32 | 16 个行动各至少 2 条反馈 |
| 结局评价模板 | 10 | 每个职业称号至少 1 条 |

## 数值范围

通用范围：

- 核心数值默认范围为 `0..100`。
- 体力范围为 `-60..100`，负数表示透支。
- 金钱和乐队资金最低为 `0`，不允许负债进入第一版。
- 关系范围为 `0..100`。
- 歌曲质量、录音质量、专辑评价范围为 `0..100`。

每月默认结算：

| 项目 | 默认规则 |
| --- | --- |
| 有效体力上限 | `100 - monthly.staminaCapPenalty` |
| 体力恢复 | 月初恢复到 `min(有效体力上限, 当前体力 + 80)` |
| 压力自然变化 | 压力大于 60 时月初健康 `-2` |
| 健康自然变化 | 健康低于 40 时，月初设置 `monthly.staminaCapPenalty = 10`；否则为 `0` |
| 月度计数 | 月初清空 `monthly.actionCounts` 和 `monthly.riskEventsThisMonth` |
| 名声衰减 | 第一版不做自然衰减 |
| 财富消耗 | 第一版不做固定生活费，避免早期惩罚过重 |

体力透支规则：

| 透支区间 | 后果 |
| --- | --- |
| `0..-19` | 行动允许，反馈提示疲劳，压力额外 `+2` |
| `-20..-39` | 压力额外 `+4`，健康 `-2`，负面事件权重 `+1` |
| `-40..-60` | 压力额外 `+8`，健康 `-5`，必须抽取一次风险反馈 |

## 初始数值

玩家核心数值：

| 出身路线 | 体力 | 技术 | 创作 | 舞台 | 健康 | 压力 | 名声 | 财富 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 技术宅 | 100 | 62 | 38 | 28 | 78 | 22 | 5 | 800 |
| 创作型 | 100 | 42 | 62 | 34 | 76 | 28 | 6 | 860 |
| 舞台型 | 100 | 38 | 36 | 62 | 74 | 32 | 10 | 700 |
| 叛逆型 | 100 | 45 | 46 | 48 | 70 | 38 | 8 | 650 |

乐队初始值：

| 项目 | 数值 |
| --- | ---: |
| 默契 | 52 |
| 作品质量 | 20 |
| 粉丝 | 18 |
| 口碑 | 12 |
| 乐队资金 | 1200 |

初始成员关系：

| 成员 | 技术宅 | 创作型 | 舞台型 | 叛逆型 |
| --- | ---: | ---: | ---: | ---: |
| 主唱 | 48 | 46 | 58 | 42 |
| 贝斯 | 56 | 54 | 50 | 48 |
| 鼓手 | 50 | 48 | 56 | 45 |

初始装备：

| 槽位 | 默认装备 | 效果 |
| --- | --- | --- |
| 吉他 | 二手 Jazzmaster | 创作行动反馈可出现噪音、另类、失真标签 |
| 效果器 | Overdrive / Chorus / Delay | 写 Riff 和录音可生成 `drive`、`chorus`、`delay` 风格标签 |
| 音箱 | 练习室共用 Combo | `recordingQuality: -2`，`performanceStability: 0` |

## 行动平衡表

所有行动都必须生成反馈。`主要变化` 是无随机时的基础值；随机浮动可在实现中限制为 `-1..+1`。

### 个人行动

| 行动 | 体力 | 条件 | 主要变化 | 风险与产物 |
| --- | ---: | --- | --- | --- |
| 练琴 | -15 | 无 | 技术 `+3`，压力 `+2` | 透支时健康额外 `-1` |
| 写 Riff | -18 | 无 | 创作 `+2`，压力 `+2` | 新增 Riff，质量 `18..32` |
| 研究风格 | -12 | 财富 `>=150` | 创作 `+1`，财富 `-150` | 新增或强化 1 个风格标签 |
| 打工 | -22 | 无 | 财富 `+450`，压力 `+3` | 健康 `-1` |
| 休息 | 0 | 无 | 体力 `+25`，压力 `-8`，健康 `+2` | 本月最多获得 2 次完整收益 |
| 社交 | -12 | 无 | 目标成员关系 `+5`，名声 `+1` | 20% 概率触发人脉事件 |
| 逛乐器店 | -10 | 无 | 压力 `-1` | 生成装备报价或试琴事件 |
| 自我突破 | -35 | 压力 `>=20` | 选择一项：技术/创作/舞台 `+6` | 压力 `+10`，健康 `-4`，高风险反馈 |

### 乐队行动

| 行动 | 体力 | 条件 | 主要变化 | 风险与产物 |
| --- | ---: | --- | --- | --- |
| 排练 | -25 | 有目标作品时提升作品；无作品时只提升乐队状态 | 默契 `+4`，目标 `Work.rehearsal +15`，舞台 `+1` | 压力 `+3`；无目标作品时 rehearsal 不变 |
| 团体创作 | -30 | 至少 1 个 Riff 或当前草稿 | 目标 `Work.completion +35`，已有草稿 `Work.quality +8`，乐队作品质量 `+4`，默契 `+1` | 无草稿时按公式初始化草稿质量；可能产生创作权冲突 |
| 录音 | -35 | 至少 1 首 `stage = "song"` 且 `rehearsal >= 30`，乐队资金 `>=300` | 乐队资金 `-300`，名声 `+3` | 生成 Demo 或录音成果 |
| 演出 | -40 | 有演出机会或当前月份主事件允许 | 名声 `+6`，财富 `+300`，粉丝 `+10`，舞台 `+2` | 健康 `-3`，透支时可能演出事故 |
| 成员谈话 | -12 | 指定目标成员 | 目标关系 `+7`，压力 `-2` | 关系低于 35 时可能先触发冲突 |
| 宣传 | -18 | 财富 `>=100` 或乐队资金 `>=100` | 名声 `+4`，粉丝 `+8` | 资金 `-100`，压力 `+2` |
| 谈合作 | -20 | 名声 `>=10` 或有人脉事件 | 生成合作事件 | 关系/口碑低时可能出现苛刻合约 |
| 休整 | 0 | 无 | 默契 `+2`，压力 `-6`，健康 `+2` | 本月最多获得 1 次完整收益 |

行动次数限制通过 `monthly.actionCounts[actionId]` 记录。`休息` 的 actionId 为 `rest`，每月最多 2 次完整收益；`休整` 的 actionId 为 `band_rest`，每月最多 1 次完整收益。超过次数后仍可点击，但只生成低收益反馈，避免玩家用 0 体力行动无限恢复。

所有恢复体力的效果都以有效体力上限为封顶，即 `100 - monthly.staminaCapPenalty`。健康低于 40 时，休息也不能把体力恢复到 90 以上。

## 最快出 Demo 路径验算

第一版应保证玩家不透支也能在 4 个月内做出第一份 Demo。下面用默认恢复规则验证核心循环可达。

| 月份 | 行动 | 月末结果 |
| --- | --- | --- |
| `2027-05` | 写 Riff `-18`，团体创作 `-30` | 体力 `52`，获得 Riff，创建草稿 `completion = 35`，`quality` 约 `42..56` |
| `2027-06` | 团体创作 `-30` | 月初体力回到 `100`，草稿 `completion = 70`，`quality +8` |
| `2027-07` | 团体创作 `-30`，排练 `-25`，排练 `-25` | 草稿 `completion = 105` 后转为歌曲，`quality +8`，`rehearsal = 30`，体力 `20` |
| `2027-08` | 录音 `-35` | 月初体力回到 `100`，乐队资金从 `1200` 到 `900`，生成第一份 Demo，录音质量约 `43..50` |

这条路径不依赖随机事件，不需要透支，也不消耗玩家个人财富。玩家如果选择透支或获得剧情加成，可以更早完成 Demo；如果分心打工、社交或演出，则 Demo 会延后。

## TypeScript 数据模型

这些接口是实现起点，可按代码需要拆分文件。

```ts
export type RouteId = "technician" | "writer" | "performer" | "rebel";
export type MonthId = `${number}-${string}`;

export type PlayerStatKey =
  | "stamina"
  | "technique"
  | "creativity"
  | "stage"
  | "health"
  | "stress"
  | "fame"
  | "wealth";

export type BandStatKey =
  | "cohesion"
  | "workQuality"
  | "fans"
  | "reputation"
  | "funds";

export type DerivedModifierKey =
  | "recordingQuality"
  | "performanceStability"
  | "riffQuality"
  | "styleDiscovery";

export type EquipmentModifierKey =
  | PlayerStatKey
  | BandStatKey
  | DerivedModifierKey;

export type CharacterId = "vocal" | "bass" | "drums";

export interface SaveGame {
  version: 1;
  createdAt: string;
  updatedAt: string;
  state: GameState;
}

export interface GameState {
  month: MonthId;
  route: RouteId;
  player: Record<PlayerStatKey, number>;
  band: Record<BandStatKey, number>;
  relationships: Record<CharacterId, number>;
  equipment: EquipmentLoadout;
  monthly: MonthlyState;
  counters: GameCounters;
  flags: Record<string, boolean | number | string>;
  riffs: Riff[];
  works: Work[];
  recordings: Recording[];
  releases: Release[];
  history: HistoryEntry[];
  queuedEvents: string[];
}

export interface MonthlyState {
  actionCounts: Record<string, number>;
  staminaCapPenalty: number;
  riskEventsThisMonth: number;
}

export interface GameCounters {
  overdraftActions: number;
  missedOpportunities: number;
  healthCrises: number;
  iconicPerformances: number;
  contractCompromises: number;
}

export interface EquipmentLoadout {
  guitar: EquipmentItem;
  pedals: EquipmentItem[];
  amp: EquipmentItem;
}

export interface EquipmentItem {
  id: string;
  name: string;
  tags: string[];
  modifiers?: Partial<Record<EquipmentModifierKey, number>>;
}
```

`monthly` 是月度瞬时状态，进入下个月时重置。`counters` 是跨生涯统计，服务结局判定和长期履历。

装备派生修正规则：

```text
equipmentBonus.recordingQuality =
  clamp(sum(loadout item modifiers.recordingQuality), -10, 15)

equipmentBonus.performanceStability =
  clamp(sum(loadout item modifiers.performanceStability), -10, 15)
```

`recordingQuality` 进入录音质量公式。`performanceStability` 不直接显示为数值，只影响演出事故概率和演出反馈。

## 效果模型

行动和事件选项都产出 `Effect[]`，由统一结算函数处理。

```ts
export type Effect =
  | { kind: "playerStat"; key: PlayerStatKey; amount: number }
  | { kind: "bandStat"; key: BandStatKey; amount: number }
  | { kind: "relationship"; character: CharacterId; amount: number }
  | { kind: "flag"; key: string; value: boolean | number | string }
  | { kind: "counter"; key: keyof GameCounters; amount: number }
  | { kind: "addRiff"; riff: Omit<Riff, "id" | "createdAt"> }
  | {
      kind: "advanceWork";
      workId?: string;
      amount: number;
      qualityAmount?: number;
      rehearsalAmount?: number;
      sourceRiffId?: string;
      authorship?: Work["authorship"];
      tensionAmount?: number;
      styleTags?: string[];
    }
  | { kind: "addRecording"; recording: Omit<Recording, "id" | "createdAt"> }
  | { kind: "addRelease"; release: Omit<Release, "id" | "month"> }
  | { kind: "addHistory"; entry: Omit<HistoryEntry, "id" | "month"> }
  | { kind: "queueEvent"; eventId: string };

export interface ActionResult {
  effects: Effect[];
  feedback: Feedback;
}

export interface Feedback {
  title: string;
  body: string;
  memberReactions?: Partial<Record<CharacterId, string>>;
  followUpEventId?: string;
}
```

## 事件模型

```ts
export interface GameEvent {
  id: string;
  title: string;
  tags: string[];
  priority: number;
  once: boolean;
  trigger: EventTrigger;
  body: string;
  choices: EventChoice[];
}

export interface EventTrigger {
  months?: MonthId[];
  flagsAll?: string[];
  flagsNone?: string[];
  minPlayer?: Partial<Record<PlayerStatKey, number>>;
  maxPlayer?: Partial<Record<PlayerStatKey, number>>;
  minBand?: Partial<Record<BandStatKey, number>>;
  minRelationship?: Partial<Record<CharacterId, number>>;
  hasRiff?: boolean;
  hasCompletedSong?: boolean;
  hasDemo?: boolean;
  minRecordings?: number;
  randomWeight?: number;
}

export interface EventChoice {
  id: string;
  label: string;
  requirements?: EventTrigger;
  effects: Effect[];
  feedback: Feedback;
}
```

事件选择原则：

- 每个事件至少 2 个选项。
- 关键剧情事件推荐 3 个选项。
- 选项文本不只写数值收益，要表现角色立场。
- 隐藏标记统一进入 `flags`，命名采用 `domain.detail`，例如 `songwriting.vocalConflict1`。
- 演出机会、人脉和合作机会优先用 flags 表达，例如 `career.hasLivehouseOffer`、`network.hasContact`、`contract.hasLabelIntro`。
- `hasDemo` 表示 `recordings.some(recording => recording.type === "demo")`；`minRecordings` 表示 `recordings.length` 至少达到指定数量。

## 事件样例

### 毕业演出前的排练争执

```ts
export const rehearsalArgument: GameEvent = {
  id: "prologue.rehearsal_argument",
  title: "毕业演出前的排练争执",
  tags: ["prologue", "member", "songwriting"],
  priority: 100,
  once: true,
  trigger: { months: ["2027-05"], flagsNone: ["prologue.rehearsalArgumentDone"] },
  body:
    "主唱认为新歌副歌应该更直接，你却觉得那会毁掉整首歌的阴影感。鼓手开始烦躁，贝斯手没有表态。",
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
        body:
          "你把那段刺耳的和弦又弹了一遍。主唱没有再争，但排练室的空气明显冷了下去。",
        memberReactions: { vocal: "他觉得你把歌看得比乐队更重。" }
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
      feedback: {
        title: "暂时达成一致",
        body:
          "你把副歌改得更直接，只留下间奏里最锋利的两小节。歌变得完整了一点，也普通了一点。"
      }
    },
    {
      id: "late_rehearsal",
      label: "要求全队排练到深夜",
      effects: [
        { kind: "playerStat", key: "stamina", amount: -25 },
        { kind: "bandStat", key: "workQuality", amount: 4 },
        { kind: "bandStat", key: "cohesion", amount: -1 },
        { kind: "playerStat", key: "stress", amount: 4 },
        { kind: "flag", key: "prologue.rehearsalArgumentDone", value: true }
      ],
      feedback: {
        title: "凌晨两点的版本",
        body:
          "你们终于弹出了一个能上台的版本。没人欢呼，只有鼓棒落在地上的声音。"
      }
    }
  ]
};
```

### 团体创作冲突

触发条件：`hasRiff: true`，月份不早于 `2027-06`。

关键分支：

- 把 Riff 交给全队发展：团体默契 `+3`，作品进度 `+35`，主唱关系 `+2`。
- 坚持自己主导：创作 `+3`，作品进度 `+25`，主唱关系 `-4`，写入 `songwriting.creditConflict1`。
- 让主唱重写旋律：作品进度 `+30`，主唱关系 `+4`，歌曲作者标记偏向共同创作。

### 第一次 Livehouse 机会

触发条件：名声 `>=10` 或 Demo 数量 `>=1`。

关键分支：

- 接受低报酬演出：名声 `+6`，粉丝 `+12`，财富 `+200`，健康 `-3`。
- 要求更好条件：若口碑 `>=18`，乐队资金 `+500`；否则机会取消，压力 `+4`。
- 暂缓演出继续打磨：作品质量 `+3`，成员关系根据性格变化，写入错过机会履历。

## 作品状态机

作品链路：

```text
Riff -> SongDraft -> Song -> Recording -> Release
```

数据模型：

```ts
export interface Riff {
  id: string;
  createdAt: MonthId;
  titleSeed: string;
  quality: number;
  styleTags: string[];
  source: "write_riff" | "event" | "equipment";
}

export interface Work {
  id: string;
  title: string;
  stage: "draft" | "song";
  sourceRiffIds: string[];
  completion: number;
  quality: number;
  rehearsal: number;
  styleTags: string[];
  authorship: "player_led" | "shared" | "vocal_led" | "fragmented";
  tension: number;
}

export interface Recording {
  id: string;
  createdAt: MonthId;
  workId: string;
  type: "demo" | "single" | "album_track";
  quality: number;
  rawness: number;
  released: boolean;
}

export interface Release {
  id: string;
  month: MonthId;
  type: "demo" | "single" | "ep" | "album";
  title: string;
  recordingIds: string[];
  sales: number;
  criticalScore: number;
  fameImpact: number;
  awards: string[];
}

export interface HistoryEntry {
  id: string;
  month: MonthId;
  type:
    | "event"
    | "performance"
    | "recording"
    | "release"
    | "contract"
    | "award"
    | "equipment"
    | "member";
  title: string;
  description: string;
  weight: number;
  tags: string[];
}
```

状态推进规则：

- `写 Riff` 新增 `Riff`，默认质量为 `18..32`，受创作、装备和风格事件影响。
- `团体创作` 可用 Riff 创建 `SongDraft`，初始 `completion = 35`；若已有草稿，则推进 `completion +35`。
- 创建草稿时，`Work.quality = clamp(avg(sourceRiff.quality) + player.creativity * 0.25 + band.cohesion * 0.10 + equipmentBonus.riffQuality, 0, 100)`。
- 推进已有草稿时，`Work.quality +8`，并限制在 `0..100`。
- 草稿 `completion >= 100` 时变为 `Song`，`completion` 封顶为 `100`。
- `排练` 提升目标 `Work.rehearsal +15`。排练可作用于 `draft` 或 `song`，草稿转为歌曲时保留 rehearsal。
- `录音` 要求至少一首 `Song`，且 `rehearsal >= 30`。
- 第一版中 `录音` 默认生成 `demo` 类型的 `Recording`，`released = false`。若有合约或未来扩展的发行事件，才会生成 `Release` 或 `single`。
- 第一版自然流程不产出 `Release`；`addRelease` 仅用于结局预览、测试注入和后续发行系统。依赖 `totalSales` 的称号在 v1 自然流程中不会自然达成。

录音质量默认公式：

```text
recordingQuality =
  work.quality * 0.45 +
  work.rehearsal * 0.25 +
  player.technique * 0.15 +
  band.cohesion * 0.10 +
  equipmentBonus.recordingQuality
```

结果四舍五入并限制在 `0..100`。

全局风格标签集合：

```text
releasedWorks =
  works referenced by recordings where recording.released === true

globalStyleTags =
  unique([
    ...works.styleTags,
    ...releasedWorks.styleTags
  ])
```

结局判定使用 `globalStyleTags.size` 判断实验和转型路线。装备标签不直接计入全局风格标签，但可以影响 Riff 和 Work 生成出的风格标签。UI 不需要在主界面展示这个集合，只用于事件触发、作品生成和结局评分。

## 称号判定

结局称号使用评分表，不写成散乱条件链。

流程：

1. 为每个称号计算 `score`。
2. 不满足 `requiredAll` / `requiredAny` 的称号不可选。
3. 选择最高分称号。
4. 分数相同则比较 `priority`。
5. 允许生成一个主称号和一个副评价，但第一版 UI 只必须显示主称号。

```ts
export interface EndingTitleRule {
  id: string;
  label: string;
  priority: number;
  requiredAll?: EndingRequirement[];
  requiredAny?: EndingRequirement[][];
  weights: EndingWeight[];
}

export type EndingRequirement =
  | { kind: "playerMin"; key: PlayerStatKey; value: number }
  | { kind: "playerMax"; key: PlayerStatKey; value: number }
  | { kind: "anyPlayerMin"; keys: PlayerStatKey[]; value: number }
  | { kind: "bandMin"; key: BandStatKey; value: number }
  | { kind: "relationshipAvgMin"; value: number }
  | { kind: "counterMin"; key: keyof GameCounters; value: number }
  | { kind: "uniqueStyleTagsMin"; value: number }
  | { kind: "totalSalesMin"; value: number }
  | { kind: "totalSalesMax"; value: number }
  | { kind: "historyTagMin"; tag: string; count: number }
  | { kind: "flag"; key: string; value?: boolean | number | string };

export type EndingWeight =
  | { kind: "player"; key: PlayerStatKey; weight: number }
  | { kind: "band"; key: BandStatKey; weight: number }
  | { kind: "relationshipAverage"; weight: number }
  | { kind: "counter"; key: keyof GameCounters; weight: number }
  | { kind: "uniqueStyleTags"; weight: number }
  | { kind: "totalSales"; weight: number }
  | { kind: "recordingQualityMax"; weight: number }
  | { kind: "releaseCriticalScoreMax"; weight: number }
  | { kind: "historyTag"; tag: string; weight: number }
  | { kind: "flag"; key: string; weight: number };
```

评分公式：

```text
normalizedTotalSales = clamp(totalSales / 1000, 0, 100)
maxRecordingQuality = max(recordings.quality) or 0 when no recordings
maxReleaseCriticalScore = max(releases.criticalScore) or 0 when no releases

score =
  sum(playerStat * weight) +
  sum(bandStat * weight) +
  relationshipAverage * weight +
  sum(counterValue * 10 * weight) +
  uniqueStyleTags.size * 10 * weight +
  normalizedTotalSales * weight +
  maxRecordingQuality * weight +
  maxReleaseCriticalScore * weight +
  sum(historyEntriesWithTag * 10 * weight) +
  sum(matchedFlag ? 25 * weight : 0)
```

所有称号先检查 `requiredAll` 和 `requiredAny`。`requiredAll` 必须全部满足；`requiredAny` 中至少一组条件全部满足即可。不满足必要条件时，称号不参与排序。参与排序后，分数最高者成为主称号；分数相同则 `priority` 高者优先。

统计字段来源：

| 字段 | 写入时机 |
| --- | --- |
| `counters.overdraftActions` | 行动结算后体力小于 0 时 `+1` |
| `counters.missedOpportunities` | 玩家拒绝或谈崩演出、合约、录音机会时 `+1` |
| `counters.healthCrises` | 健康降到 `25` 以下，或触发健康危机事件时 `+1` |
| `counters.iconicPerformances` | 演出事件获得名场面反馈时 `+1` |
| `counters.contractCompromises` | 接受明显牺牲创作或成员关系的商业合同时 `+1` |
| `totalSales` | 从 `releases.sales` 求和，不单独存储 |

第一版称号规则：

| 称号 | 必要条件 | 默认权重 | 优先级 |
| --- | --- | --- | ---: |
| 技术宗师 | 技术 `>=80` | `technique 1.4`，`recordingQualityMax 0.5`，`historyTag:professionalPraise 0.8` | 80 |
| 吉他英雄 | 舞台 `>=80` | `stage 1.3`，`fans 0.5`，`iconicPerformances 1.0`，`historyTag:livehouse 0.4` | 80 |
| 声音塑造者 | 创作 `>=78` | `creativity 1.4`，`workQuality 0.7`，`releaseCriticalScoreMax 0.6`，`uniqueStyleTags 0.5` | 85 |
| 乐队灵魂 | 平均成员关系 `>=72` | `relationshipAverage 1.4`，`cohesion 0.8`，`historyTag:reconciliation 0.8` | 75 |
| 地下传奇 | 口碑 `>=70` 且 `totalSales <= 5000` | `reputation 1.3`，`historyTag:livehouse 0.8`，`historyTag:indie 0.8`，`contractCompromises -0.4` | 70 |
| 白金巨星 | `totalSales >= 50000` 或财富 `>=50000` | `totalSales 1.2`，`wealth 0.7`，`historyTag:award 0.8`，`fame 0.7` | 65 |
| 实验先锋 | `globalStyleTags.size >= 4` | `uniqueStyleTags 1.5`，`historyTag:experimental 0.8`，`releaseCriticalScoreMax 0.4` | 70 |
| 燃烧的传说 | `overdraftActions >= 6` 或 `healthCrises >= 2` | `overdraftActions 1.0`，`healthCrises 1.2`，`historyTag:conflict 0.7`，`iconicPerformances 0.8` | 95 |
| 无名匠人 | 名声 `<40` 且技术或创作 `>=65` | `technique 0.8`，`creativity 0.8`，`fame -0.5`，`historyTag:craft 0.7` | 40 |
| 失落天才 | 技术、创作或舞台任一 `>=70`，且 `missedOpportunities >= 2` | `missedOpportunities 1.2`，`historyTag:missedChance 0.8`，`technique 0.4`，`creativity 0.4`，`stage 0.4` | 90 |

第一版如果自然流程数据不足，结局预览入口可以注入测试状态，但必须走同一套判定函数。

## 存档版本

第一版存档必须带版本号：

```ts
export const SAVE_VERSION = 1;
```

读取策略：

- `version === 1`：正常读取。
- 缺少 `version`：视为不兼容旧存档，提示用户重开或清除。
- `version > SAVE_VERSION`：提示当前版本过旧，避免破坏未来存档。

写入策略：

- 每次确认反馈后写入。
- 进入下个月后写入。
- 结局生成后写入。

## 实现验收

实现开始前，至少应能从本附录直接写出这些测试断言：

- 创作型开局的创作为 `62`，压力为 `28`。
- 练琴消耗 `15` 体力并提升 `3` 技术。
- 体力为 `-25` 时继续行动会造成额外压力和健康损失。
- 写 Riff 会新增一个 `Riff`。
- 团体创作能创建或推进 `Work`，每次推进 `completion +35`。
- 新草稿的 `Work.quality` 按 Riff、创作、默契和装备公式初始化；继续团体创作会让 `Work.quality +8`。
- `completion >= 100` 的草稿会转成完成歌曲。
- 排练能让目标 `Work.rehearsal +15`。
- 录音要求完成歌曲和 `rehearsal >= 30`。
- 每个行动结果都有 `feedback`。
- `EventTrigger.hasDemo` 能识别至少一条 demo 录音，`minRecordings` 能识别录音数量。
- `advanceWork` 能更新 `authorship`、`tension` 和 `styleTags`。
- `advanceWork.rehearsalAmount` 能更新目标 `Work.rehearsal`。
- 存档包含 `version: 1`。
- `monthly.actionCounts` 会限制休息和休整的完整收益次数，并在新月份重置。
- 装备的 `recordingQuality` 修正会进入录音质量公式。
- 结局称号由评分表产生，不依赖 UI 状态。
