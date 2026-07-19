import {
  ArrowRightIcon,
  CalendarBlankIcon,
  CampfireIcon,
  ChatsCircleIcon,
  CheckIcon,
  ClockCountdownIcon,
  CoffeeIcon,
  CurrencyCnyIcon,
  FloppyDiskIcon,
  GearSixIcon,
  GuitarIcon,
  HouseIcon,
  LightningIcon,
  ListChecksIcon,
  MapPinIcon,
  MegaphoneIcon,
  MicrophoneStageIcon,
  MusicNotesIcon,
  PaperPlaneTiltIcon,
  QuestionIcon,
  ReceiptIcon,
  StarHalfIcon,
  StarIcon,
  UserFocusIcon,
  UsersThreeIcon,
  VinylRecordIcon,
  WalletIcon,
  WarningCircleIcon,
  WaveformIcon,
} from "@phosphor-icons/react";
import {
  useCallback,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type Dispatch,
  type FormEvent,
  type ReactNode,
  type SetStateAction,
} from "react";
import {
  AttributeMeter,
  ArtworkImage,
  Button,
  Dialog,
  Feedback,
  Panel,
  PortraitPlaceholder,
  StatusBadge,
  Tabs,
  Toast,
  ToastRegion,
} from "../../components";
import { ACTIONS, BAND_ACTIONS, PERSONAL_ACTIONS } from "../../data/actions";
import {
  ALBUM_COVER_VARIANTS,
  LEGACY_PORTRAITS,
  OPENING_ARTWORK,
  portraitArtwork,
  resolveAlbumCover,
  type ArtworkResource,
} from "../../data/artwork";
import { PLAYER_AVATARS } from "../../data/avatars";
import { CANDIDATES } from "../../data/candidates";
import { GENRES } from "../../data/genres";
import { NAME_SUGGESTIONS } from "../../data/nameSuggestions";
import type { PortraitResource } from "../../data/types";
import { LEVEL_ONE_VENUES } from "../../data/venues";
import {
  countMonthOpportunities,
  MonthOpportunityDialog,
} from "../../app/MonthOpportunityDialog";
import {
  selectBandAttributes,
  selectPlayer,
  selectTeammates,
  type ActionCommand,
  type ActionFeedback,
  type ActionId,
  type EffectRecord,
  type GameState,
  type Member,
  type MemberStatKey,
  type MemberStatus,
  type PerformancePlan,
} from "../../domain";
import { useGameStore } from "../../store";
import {
  CareerManagementPanel,
  CareerPerformancePanel,
} from "./CareerPanels";
import { EndingExperience } from "./EndingExperience";
import {
  createFeedbackSubmissionId,
  GAME_FEEDBACK_CATEGORIES,
  GAME_FEEDBACK_MESSAGE_MAX_LENGTH,
  GAME_FEEDBACK_MESSAGE_MIN_LENGTH,
  submitGameFeedback,
  type GameFeedbackCategory,
  type GameFeedbackContext,
} from "./feedback";
import "./workstation.css";

type WorkstationPage =
  | "overview"
  | "members"
  | "albums"
  | "performances"
  | "management";

type WorkstationDialog =
  | "rules"
  | "personalTraining"
  | "bandTraining"
  | "album"
  | "abandonAlbum"
  | "endMonth"
  | "history"
  | "settings"
  | "opportunities"
  | "dynamics"
  | "actionResult"
  | null;

type WorkstationAction = (typeof ACTIONS)[number];

interface GameFeedbackDraft {
  category: GameFeedbackCategory;
  message: string;
  submissionId: string | null;
  submittedAt: string | null;
  context: GameFeedbackContext | null;
}

interface GameFeedbackStatus {
  phase: "idle" | "submitting" | "success";
  activeSubmissionId: string | null;
  fieldError: string | null;
  formError: string | null;
}

const INITIAL_GAME_FEEDBACK_STATUS: GameFeedbackStatus = {
  phase: "idle",
  activeSubmissionId: null,
  fieldError: null,
  formError: null,
};

const MEMBER_STAT_LABELS: Readonly<Record<MemberStatKey, string>> = {
  professional: "专业",
  creativity: "创作",
  performance: "表现",
  popularity: "热度",
  belonging: "归属感",
};

const ROLE_LABELS: Readonly<Record<Member["role"], string>> = {
  leader: "队长、吉他手兼主唱",
  leadGuitar: "主音吉他",
  bass: "贝斯",
  drums: "鼓手",
  keyboard: "键盘",
};

const STATUS_LABELS: Readonly<Record<MemberStatus, string>> = {
  excellent: "极佳",
  good: "良好",
  normal: "普通",
  tired: "疲惫",
  awful: "糟糕",
};

const EQUIPMENT_LABELS = {
  starter: "入门",
  advanced: "进阶",
  professional: "专业",
  top: "顶级",
} as const;

const ACTION_ICONS: Readonly<Record<ActionId, ReactNode>> = {
  personalTraining: <UserFocusIcon size={20} weight="duotone" />,
  social: <ChatsCircleIcon size={20} weight="duotone" />,
  partTime: <WalletIcon size={20} weight="duotone" />,
  rest: <CoffeeIcon size={20} weight="duotone" />,
  bandTraining: <LightningIcon size={20} weight="duotone" />,
  rehearsal: <MusicNotesIcon size={20} weight="duotone" />,
  albumProduction: <VinylRecordIcon size={20} weight="duotone" />,
  performance: <MicrophoneStageIcon size={20} weight="duotone" />,
  promotion: <MegaphoneIcon size={20} weight="duotone" />,
  teamBuilding: <CampfireIcon size={20} weight="duotone" />,
};

const PERSONAL_TRAINING_STATS: readonly MemberStatKey[] = [
  "professional",
  "creativity",
  "performance",
  "popularity",
  "belonging",
];

const BAND_TRAINING_STATS: readonly MemberStatKey[] = [
  "professional",
  "creativity",
  "performance",
  "popularity",
  "belonging",
];

const ENDING_REASON_LABELS = {
  twentiethAnniversary: "乐队走过二十周年",
  memberBreakup: "成员决裂，乐队解散",
  debtBreakup: "债务危机，乐队解散",
  playerEnded: "队长决定结束乐队生涯",
  specialStory: "一段特殊经历为乐队画下句点",
} as const;

function formatCurrency(value: number): string {
  const sign = value < 0 ? "-" : "";
  return `${sign}¥${Math.abs(Math.round(value)).toLocaleString("zh-CN")}`;
}

function formatNumber(value: number): string {
  return Math.round(value).toLocaleString("zh-CN");
}

function statusTone(
  status: MemberStatus,
): "neutral" | "positive" | "warning" | "danger" {
  if (status === "excellent" || status === "good") return "positive";
  if (status === "tired") return "warning";
  if (status === "awful") return "danger";
  return "neutral";
}

function albumPhase(progress: number): string {
  if (progress < 40) return "创作";
  if (progress < 70) return "编曲与排练";
  if (progress < 100) return "录音";
  return "等待发行";
}

function feedbackTone(
  feedback: ActionFeedback,
): "positive" | "warning" | "info" {
  if (feedback.extra.kind === "positive") return "positive";
  if (feedback.extra.kind === "negative") return "warning";
  return "info";
}

function performanceRisk(game: GameState): {
  label: string;
  tone: "positive" | "warning" | "danger";
} {
  const attributes = selectBandAttributes(game);
  const readiness =
    attributes.musicianship * 0.4 +
    attributes.stagecraft * 0.4 +
    attributes.teamSpirit * 0.2;

  if (readiness >= 45) return { label: "稳妥", tone: "positive" };
  if (readiness >= 32) return { label: "有风险", tone: "warning" };
  return { label: "很难", tone: "danger" };
}

function stars(quality: number | null): ReactNode {
  if (quality === null) {
    return <span className="ws-stars__pending">尚未成型</span>;
  }

  const fullStars = Math.floor(quality);
  const hasHalf = quality % 1 !== 0;

  return (
    <span
      className="ws-stars"
      aria-label={`${quality} 星`}
      title={`${quality} 星`}
    >
      {Array.from({ length: fullStars }, (_, index) => (
        <StarIcon key={`full-${index}`} size={15} weight="fill" />
      ))}
      {hasHalf && <StarHalfIcon size={15} weight="fill" />}
      <span className="ws-stars__value">{quality.toFixed(1)}</span>
    </span>
  );
}

function effectLabel(effect: EffectRecord, game: GameState): string {
  const labels: Record<string, string> = {
    professional: "专业",
    creativity: "创作",
    performance: "表现",
    popularity: "热度",
    belonging: "归属感",
    status: "状态",
    funds: "资金",
    basePopularity: "基础人气",
    albumProgress: "专辑进度",
  };
  const target = game.members.find((member) => member.id === effect.target);
  const prefix = target ? `${target.name} ` : "";
  return `${prefix}${labels[effect.label] ?? effect.label}`;
}

function effectValue(effect: EffectRecord): string {
  const sign = effect.amount > 0 ? "+" : "";
  if (effect.unit === "currency") {
    return `${effect.amount > 0 ? "+" : ""}${formatCurrency(effect.amount)}`;
  }
  if (effect.unit === "progress") {
    return `${sign}${effect.amount}%`;
  }
  if (effect.unit === "level") {
    return `${sign}${effect.amount}级`;
  }
  return `${sign}${effect.amount}`;
}

function actionCostLabel(actionId: ActionId): string {
  if (actionId === "promotion" || actionId === "teamBuilding") {
    return "1 AP + ¥1,000";
  }
  if (actionId === "performance") return "2-3 AP";
  if (actionId === "albumProduction") return "1-2 AP";
  return "1 AP";
}

function actionPreviewLines(action: WorkstationAction): string[] {
  const lines: string[] = [];
  const costOptions = "costOptions" in action ? action.costOptions : undefined;

  if (
    costOptions &&
    (action.id === "albumProduction" || action.id === "performance")
  ) {
    costOptions.forEach((option) => {
      const optionState =
        "statePreview" in option && option.statePreview
          ? `，${option.statePreview}`
          : "";
      lines.push(`${option.label}：${option.effectPreview}${optionState}`);
    });
  }

  lines.push(...action.fixedEffectPreview);

  if ("statePreview" in action && action.statePreview) {
    lines.push(action.statePreview);
  }

  return [...new Set(lines)];
}

function actionButtonLabel(
  actionId: ActionId,
  game: GameState,
): string {
  if (game.month.usedActions.includes(actionId)) return "本月已执行";
  const minimumCost = actionId === "performance" ? 2 : 1;
  if (game.month.actionPointsRemaining < minimumCost) return "行动点不足";
  if (
    (actionId === "promotion" || actionId === "teamBuilding") &&
    game.band.funds < 1_000
  ) {
    return "资金不足";
  }
  if (
    actionId === "albumProduction" &&
    game.activeAlbum?.progress === 100 &&
    game.band.funds < 5_000
  ) {
    return "发行资金不足";
  }
  return actionId === "albumProduction" || actionId === "performance"
    ? "安排"
    : "执行";
}

function actionIsDisabled(actionId: ActionId, game: GameState): boolean {
  return (
    game.status !== "active" ||
    actionButtonLabel(actionId, game) !==
      (actionId === "albumProduction" || actionId === "performance"
        ? "安排"
        : "执行")
  );
}

function BandAttributeList({ game }: { game: GameState }) {
  const attributes = selectBandAttributes(game);
  const values = [
    ["创作力", attributes.creativity],
    ["演奏力", attributes.musicianship],
    ["舞台力", attributes.stagecraft],
    ["人气", attributes.popularity],
    ["团魂", attributes.teamSpirit],
  ] as const;

  return (
    <div className="ws-attribute-list">
      {values.map(([label, value]) => (
        <AttributeMeter
          key={label}
          label={label}
          value={value}
          size="compact"
        />
      ))}
      <div className="ws-funds-row">
        <span>资金</span>
        <strong
          className="bb-mono-number"
          data-negative={attributes.funds < 0}
        >
          {formatCurrency(attributes.funds)}
        </strong>
      </div>
    </div>
  );
}

function MemberStatusBadge({ member }: { member: Member }) {
  return (
    <StatusBadge tone={statusTone(member.status)}>
      {STATUS_LABELS[member.status]}
    </StatusBadge>
  );
}

function memberPortraitResource(member: Member): PortraitResource | undefined {
  return member.isPlayer
    ? PLAYER_AVATARS.find((avatar) => avatar.id === member.avatarId)?.portrait
    : CANDIDATES.find(
        (candidate) =>
          candidate.id === member.avatarId || candidate.id === member.id,
      )?.portrait;
}

function memberPortraitArtwork(member: Member): ArtworkResource | undefined {
  const resource = memberPortraitResource(member);
  if (resource?.available) {
    return portraitArtwork(resource, "(max-width: 720px) 18vw, 96px");
  }
  const legacyId = member.avatarId || member.id;
  return Object.hasOwn(LEGACY_PORTRAITS, legacyId)
    ? LEGACY_PORTRAITS[legacyId as keyof typeof LEGACY_PORTRAITS]
    : undefined;
}

function WorkstationPortrait({
  member,
  size,
}: {
  member: Member;
  size: "md" | "lg";
}) {
  const resource = memberPortraitResource(member);
  const artwork = memberPortraitArtwork(member);

  return (
    <PortraitPlaceholder
      name={member.name}
      size={size}
      src={artwork?.src}
      srcSet={artwork?.srcSet}
      sizes={artwork?.sizes}
      objectPosition={artwork?.focalPoint}
      alt={artwork?.alt ?? resource?.alt ?? member.name}
      fallback={resource?.placeholder}
      statusTone={statusTone(member.status)}
      statusLabel={STATUS_LABELS[member.status]}
    />
  );
}

function PlayerCard({ player }: { player: Member }) {
  return (
    <section className="ws-player-card" aria-labelledby="ws-player-title">
      <div className="ws-player-card__identity">
        <WorkstationPortrait member={player} size="lg" />
        <div>
          <p className="ws-section-kicker">你的档案</p>
          <h2 id="ws-player-title">{player.name}</h2>
          <p>{ROLE_LABELS[player.role]}</p>
          <MemberStatusBadge member={player} />
        </div>
      </div>
      <div className="ws-player-stats">
        {(Object.keys(MEMBER_STAT_LABELS) as MemberStatKey[]).map((stat) => (
          <AttributeMeter
            key={stat}
            label={MEMBER_STAT_LABELS[stat]}
            value={player.stats[stat]}
            size="compact"
            tone={stat === "belonging" ? "positive" : "accent"}
          />
        ))}
      </div>
    </section>
  );
}

function ActionCard({
  action,
  game,
  onActivate,
}: {
  action: (typeof ACTIONS)[number];
  game: GameState;
  onActivate: (actionId: ActionId) => void;
}) {
  const disabled = actionIsDisabled(action.id, game);
  const previewLines = actionPreviewLines(action);

  return (
    <article className="ws-action-card" data-used={game.month.usedActions.includes(action.id)}>
      <div className="ws-action-card__icon" aria-hidden="true">
        {ACTION_ICONS[action.id]}
      </div>
      <div className="ws-action-card__copy">
        <div className="ws-action-card__title-row">
          <h4>{action.label}</h4>
          <span>{actionCostLabel(action.id)}</span>
        </div>
        <p>{action.description}</p>
        <div className="ws-action-card__effects" aria-label="固定结果">
          {previewLines.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </div>
      </div>
      <Button
        size="sm"
        variant={action.id === "performance" ? "primary" : "secondary"}
        disabled={disabled}
        onClick={() => onActivate(action.id)}
      >
        {actionButtonLabel(action.id, game)}
      </Button>
    </article>
  );
}

function ActionSection({
  title,
  description,
  actions,
  game,
  onActivate,
}: {
  title: string;
  description: string;
  actions: readonly (typeof ACTIONS)[number][];
  game: GameState;
  onActivate: (actionId: ActionId) => void;
}) {
  return (
    <section className="ws-action-section">
      <header className="ws-action-section__header">
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
      </header>
      <div className="ws-action-list">
        {actions.map((action) => (
          <ActionCard
            key={action.id}
            action={action}
            game={game}
            onActivate={onActivate}
          />
        ))}
      </div>
    </section>
  );
}

function OverviewPage({
  game,
  onActivateAction,
}: {
  game: GameState;
  onActivateAction: (actionId: ActionId) => void;
}) {
  const activeAlbum = game.activeAlbum;
  const hasReleasedAlbum = game.releasedAlbums.length > 0;

  return (
    <div className="ws-page-stack">
      <section className="ws-overview-brief">
        <ArtworkImage
          artwork={OPENING_ARTWORK.firstRehearsal}
          className="ws-overview-brief__art"
          decorative
        />
        <div>
          <p className="ws-section-kicker">本月重点</p>
          <h2>
            {activeAlbum
              ? `继续完成《${activeAlbum.workingTitle}》`
              : hasReleasedAlbum
                ? "安排下一次公开活动"
                : "完成第一次演出，开始积累履历"}
          </h2>
          <p>
            每月只有三个行动点。同一个行动当月只能安排一次，未使用的行动点会在月末帮助主角恢复状态。
          </p>
        </div>
        <div className="ws-overview-brief__ledger">
          <span>本月公开活动</span>
          <strong>{game.month.hadPublicActivity ? "已完成" : "尚未完成"}</strong>
          <span>连续沉寂</span>
          <strong>{game.band.publicInactivityMonths} 个月</strong>
          <span>月末运营费</span>
          <strong>{formatCurrency(1_000)}</strong>
        </div>
      </section>

      <ActionSection
        title="个人行动"
        description="只影响主角本人，收入仍会进入乐队公共账户。"
        actions={PERSONAL_ACTIONS}
        game={game}
        onActivate={onActivateAction}
      />
      <ActionSection
        title="乐队行动"
        description="推进成员培养、专辑、演出和公众活动。"
        actions={BAND_ACTIONS}
        game={game}
        onActivate={onActivateAction}
      />
    </div>
  );
}

function MemberCard({
  member,
  onTrain,
  trainingDisabled,
  trainingButtonLabel,
}: {
  member: Member;
  onTrain: (memberId: string) => void;
  trainingDisabled: boolean;
  trainingButtonLabel: string;
}) {
  return (
    <article className="ws-member-card">
      <header>
        <WorkstationPortrait member={member} size="md" />
        <div>
          <h3>{member.name}</h3>
          <p>{ROLE_LABELS[member.role]}</p>
          <div className="ws-member-card__badges">
            <MemberStatusBadge member={member} />
            {member.traits.slice(0, 2).map((trait) => (
              <StatusBadge key={trait} showIcon={false}>
                {trait}
              </StatusBadge>
            ))}
          </div>
        </div>
      </header>
      <p className="ws-member-card__bio">{member.biography}</p>
      <div className="ws-member-stat-grid">
        {(Object.keys(MEMBER_STAT_LABELS) as MemberStatKey[]).map((stat) => (
          <div key={stat}>
            <span>{MEMBER_STAT_LABELS[stat]}</span>
            <strong className="bb-mono-number">{member.stats[stat]}</strong>
          </div>
        ))}
      </div>
      <blockquote>“{member.quote}”</blockquote>
      {!member.isPlayer && (
        <Button
          size="sm"
          variant="secondary"
          icon={<LightningIcon size={16} weight="bold" />}
          onClick={() => onTrain(member.id)}
          disabled={trainingDisabled}
        >
          {trainingButtonLabel}
        </Button>
      )}
    </article>
  );
}

function MembersPage({
  game,
  onTrain,
}: {
  game: GameState;
  onTrain: (memberId: string) => void;
}) {
  const trainingDisabled = actionIsDisabled("bandTraining", game);
  const trainingButtonLabel = trainingDisabled
    ? actionButtonLabel("bandTraining", game)
    : "安排训练";

  return (
    <div className="ws-page-stack">
      <header className="ws-page-heading">
        <div>
          <p className="ws-section-kicker">固定阵容</p>
          <h2>五个人，一直走到最后</h2>
          <p>成员不会被替换。状态影响临时发挥，归属感决定这支乐队能否继续维持。</p>
        </div>
        <StatusBadge tone="info">
          {game.members.length} 名正式成员
        </StatusBadge>
      </header>
      <div className="ws-member-grid">
        {game.members.map((member) => (
          <MemberCard
            key={member.id}
            member={member}
            onTrain={onTrain}
            trainingDisabled={trainingDisabled}
            trainingButtonLabel={trainingButtonLabel}
          />
        ))}
      </div>
    </div>
  );
}

function HistoryDialog({
  game,
  onClose,
}: {
  game: GameState;
  onClose: () => void;
}) {
  const history = [...game.history].reverse();

  return (
    <Dialog
      open
      onClose={onClose}
      title="乐队生涯履历"
      description="从成立、行动、专辑到现场，已经发生的经历都会保存在这里。"
      size="lg"
      footer={<Button onClick={onClose}>关闭履历</Button>}
    >
      {history.length === 0 ? (
        <div className="ws-empty-line">乐队还没有留下可记录的经历。</div>
      ) : (
        <div className="ws-career-history">
          {history.map((entry) => (
            <article key={entry.id}>
              <div>
                <span>第 {entry.month} 月</span>
                <StatusBadge tone="neutral" showIcon={false}>
                  {entry.type === "album"
                    ? "专辑"
                    : entry.type === "performance"
                      ? "演出"
                      : entry.type === "milestone"
                        ? "里程碑"
                        : entry.type === "month"
                          ? "月度"
                          : entry.type === "event"
                            ? "事件"
                            : entry.type === "contract"
                              ? "合约"
                              : entry.type === "commercial"
                                ? "商业"
                                : entry.type === "equipment"
                                  ? "设备"
                                  : "行动"}
                </StatusBadge>
              </div>
              <section>
                <h3>{entry.title}</h3>
                <p>{entry.description}</p>
              </section>
            </article>
          ))}
        </div>
      )}
    </Dialog>
  );
}

function AlbumProgress({ game }: { game: GameState }) {
  const album = game.activeAlbum;
  if (!album) {
    return (
      <div className="ws-empty-state">
        <VinylRecordIcon size={38} weight="duotone" />
        <h3>还没有正在制作的专辑</h3>
        <p>第一次执行“制作专辑”时，会自动建立一张新专辑并推进10%或20%的进度。</p>
      </div>
    );
  }

  return (
    <div className="ws-album-progress">
      <div className="ws-album-cover ws-album-cover--working">
        <WaveformIcon size={42} weight="duotone" />
        <span>制作中</span>
      </div>
      <div className="ws-album-progress__body">
        <div className="ws-album-progress__title">
          <div>
            <p className="ws-section-kicker">{albumPhase(album.progress)}</p>
            <h3>{album.workingTitle}</h3>
          </div>
          {stars(album.quality)}
        </div>
        <div
          className="ws-progress"
          role="progressbar"
          aria-label="专辑制作进度"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={album.progress}
        >
          <span
            style={{ "--ws-progress": `${album.progress}%` } as CSSProperties}
          />
        </div>
        <div className="ws-album-checkpoints">
          {[40, 70, 100].map((checkpoint) => (
            <span
              key={checkpoint}
              data-complete={album.progress >= checkpoint}
            >
              <CheckIcon size={13} weight="bold" />
              {checkpoint}%
            </span>
          ))}
        </div>
        <p>
          当前进度 {album.progress}%。达到40%后出现初始质量，70%和100%会分别检查演奏与团队状态。
        </p>
      </div>
    </div>
  );
}

function AlbumsPage({
  game,
  onProduce,
  onAbandon,
}: {
  game: GameState;
  onProduce: () => void;
  onAbandon: () => void;
}) {
  return (
    <div className="ws-page-stack">
      <Panel
        title="当前专辑"
        eyebrow="制作台"
        action={
          <div className="ws-panel-action-row">
            {game.activeAlbum && (
              <Button
                size="sm"
                variant="danger"
                onClick={onAbandon}
                disabled={game.status !== "active"}
              >
                放弃专辑
              </Button>
            )}
            <Button
              size="sm"
              variant="primary"
              icon={<VinylRecordIcon size={16} weight="bold" />}
              onClick={onProduce}
              disabled={actionIsDisabled("albumProduction", game)}
            >
              {game.activeAlbum?.progress === 100 ? "发行专辑" : "推进制作"}
            </Button>
          </div>
        }
      >
        <AlbumProgress game={game} />
      </Panel>

      <section>
        <header className="ws-page-heading ws-page-heading--compact">
          <div>
            <p className="ws-section-kicker">发行履历</p>
            <h2>已经留下的作品</h2>
          </div>
          <span className="bb-mono-number">
            {game.releasedAlbums.length} 张
          </span>
        </header>
        {game.releasedAlbums.length === 0 ? (
          <div className="ws-empty-line">第一张专辑发行后，会在这里保存星级、收听和收益。</div>
        ) : (
          <div className="ws-discography">
            {[...game.releasedAlbums].reverse().map((album) => {
              const artwork = resolveAlbumCover(album.coverId);
              return (
                <article key={album.id}>
                  {artwork ? (
                    <ArtworkImage
                      artwork={artwork}
                      className="ws-album-cover ws-album-cover--released"
                    />
                  ) : (
                    <div className="ws-album-cover ws-album-cover--released">
                      <VinylRecordIcon size={28} weight="fill" />
                    </div>
                  )}
                  <div>
                    <h3>{album.title}</h3>
                    {stars(album.quality)}
                    <p>第 {album.releasedInMonth} 个月发行</p>
                  </div>
                  <dl>
                    <div>
                      <dt>首发收听</dt>
                      <dd>{formatNumber(album.listeners)}</dd>
                    </div>
                    <div>
                      <dt>净收益</dt>
                      <dd>{formatCurrency(album.netRevenue)}</dd>
                    </div>
                  </dl>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function invitationPlan(
  venue: (typeof LEVEL_ONE_VENUES)[number],
  index: number,
): PerformancePlan {
  const [minimum, maximum] = venue.invitationFeeRange;
  const fee = Math.round(
    minimum + ((maximum - minimum) * (index + 1)) / (LEVEL_ONE_VENUES.length + 1),
  );
  return {
    kind: "invited",
    venueLevel: 1,
    fee,
    basePopularity: venue.basePopularityGain,
    actionPointCost: 2,
    title: `${venue.name}邀请演出`,
  };
}

function selfOrganizedPlan(
  venue: (typeof LEVEL_ONE_VENUES)[number],
): PerformancePlan {
  return {
    kind: "selfOrganized",
    venueLevel: 1,
    fee: venue.selfHosted.stableRevenue,
    basePopularity: venue.basePopularityGain,
    upfrontCost: venue.selfHosted.upfrontCost,
    actionPointCost: 2,
    title: `${venue.name}自主演出`,
  };
}

function PerformancesPage({
  game,
  onSelectPerformance,
}: {
  game: GameState;
  onSelectPerformance: (selectionId: string) => void;
}) {
  const risk = performanceRisk(game);
  const performanceHistory = game.history
    .filter((entry) => entry.type === "performance" || entry.type === "milestone")
    .filter((entry) => entry.title.includes("演出") || entry.title.includes("现场"))
    .slice(-6)
    .reverse();

  return (
    <div className="ws-page-stack">
      <header className="ws-page-heading">
        <div>
          <p className="ws-section-kicker">本月邀请</p>
          <h2>一级场地正在等回复</h2>
          <p>受邀演出报酬稳定。自主演出需要先付场租，但能获得更多人气。</p>
        </div>
        <StatusBadge tone={risk.tone}>当前风险：{risk.label}</StatusBadge>
      </header>

      <div className="ws-venue-grid">
        {LEVEL_ONE_VENUES.map((venue, index) => {
          const plan = invitationPlan(venue, index);
          return (
            <article className="ws-venue-card" key={venue.id}>
              <div
                className="ws-venue-card__poster"
                style={{ "--ws-poster-accent": venue.posterAccent } as CSSProperties}
              >
                <MicrophoneStageIcon size={28} weight="duotone" />
                <span>{venue.kind}</span>
              </div>
              <div className="ws-venue-card__body">
                <div>
                  <h3>{venue.name}</h3>
                  <p className="ws-venue-card__district">
                    <MapPinIcon size={14} weight="bold" />
                    {venue.district}
                  </p>
                </div>
                <p>{venue.description}</p>
                <dl>
                  <div>
                    <dt>固定报酬</dt>
                    <dd>{formatCurrency(plan.fee)}</dd>
                  </div>
                  <div>
                    <dt>行动点</dt>
                    <dd>2 AP</dd>
                  </div>
                </dl>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => onSelectPerformance(`invite:${venue.id}`)}
                  disabled={actionIsDisabled("performance", game)}
                >
                  选择此邀请
                </Button>
              </div>
            </article>
          );
        })}
      </div>

      <Panel
        variant="inset"
        title="自主演出"
        description={`支付 ${formatCurrency(LEVEL_ONE_VENUES[0].selfHosted.upfrontCost)} 场租，在没有合适邀请时主动推进乐队。`}
        action={
          <Button
            size="sm"
            onClick={() =>
              onSelectPerformance(`self:${LEVEL_ONE_VENUES[0].id}`)
            }
            disabled={
              actionIsDisabled("performance", game) ||
              game.band.funds < LEVEL_ONE_VENUES[0].selfHosted.upfrontCost
            }
          >
            安排自主演出
          </Button>
        }
      >
        <div className="ws-self-show">
          <span>场地：{LEVEL_ONE_VENUES[0].name}</span>
          <span>稳定发挥预计回款：{formatCurrency(LEVEL_ONE_VENUES[0].selfHosted.stableRevenue)}</span>
          <span>人气收益：同级受邀演出的120%</span>
        </div>
      </Panel>

      <section>
        <header className="ws-page-heading ws-page-heading--compact">
          <div>
            <p className="ws-section-kicker">现场履历</p>
            <h2>最近的演出记录</h2>
          </div>
        </header>
        {performanceHistory.length === 0 ? (
          <div className="ws-empty-line">还没有正式演出。第一次现场会成为乐队的重要起点。</div>
        ) : (
          <div className="ws-history-list">
            {performanceHistory.map((entry) => (
              <article key={entry.id}>
                <span>第 {entry.month} 月</span>
                <div>
                  <h3>{entry.title}</h3>
                  <p>{entry.description}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function EquipmentLine({
  icon,
  label,
  tier,
}: {
  icon: ReactNode;
  label: string;
  tier: keyof typeof EQUIPMENT_LABELS;
}) {
  return (
    <div className="ws-equipment-line">
      <span className="ws-equipment-line__icon">{icon}</span>
      <span>{label}</span>
      <strong>{EQUIPMENT_LABELS[tier]}设备</strong>
    </div>
  );
}

function ManagementPage({
  game,
  onSave,
  saveMessage,
}: {
  game: GameState;
  onSave: () => void;
  saveMessage: string | null;
}) {
  const fundsTone =
    game.band.funds < -10_000
      ? "danger"
      : game.band.funds < 0
        ? "warning"
        : "positive";

  return (
    <div className="ws-page-stack">
      <div className="ws-management-grid">
        <Panel
          title="公共账户"
          eyebrow="资金"
          accent
          footer={
            <div className="ws-panel-footer-row">
              <span>每月固定运营费</span>
              <strong>{formatCurrency(1_000)}</strong>
            </div>
          }
        >
          <div className="ws-balance">
            <span>当前余额</span>
            <strong className="bb-mono-number">
              {formatCurrency(game.band.funds)}
            </strong>
            <StatusBadge tone={fundsTone}>
              {game.financialCrisis.active
                ? `财务危机剩余 ${game.financialCrisis.monthsRemaining} 个月`
                : game.band.funds < 0
                  ? "资金紧张"
                  : "账户正常"}
            </StatusBadge>
          </div>
        </Panel>

        <Panel title="发行状态" eyebrow="合作">
          <div className="ws-contract">
            <StatusBadge tone="accent">独立发行</StatusBadge>
            <h3>乐队保留全部发行回款</h3>
            <p>当前没有生效中的唱片合约。商业合作和厂牌邀约会在后续事件系统中出现。</p>
          </div>
        </Panel>
      </div>

      <Panel
        title="主角设备"
        eyebrow="器材"
        description="设备只影响主角在专辑和演出中的隐藏判定，不改变永久属性。"
      >
        <div className="ws-equipment-list">
          <EquipmentLine
            icon={<GuitarIcon size={21} weight="duotone" />}
            label="电吉他"
            tier={game.equipment.guitar}
          />
          <EquipmentLine
            icon={<WaveformIcon size={21} weight="duotone" />}
            label="效果器"
            tier={game.equipment.pedals}
          />
          <EquipmentLine
            icon={<MegaphoneIcon size={21} weight="duotone" />}
            label="音箱"
            tier={game.equipment.amplifier}
          />
        </div>
      </Panel>

      <Panel
        variant="inset"
        title="存档"
        description="每满12个月会自动保存一次，也可以随时覆盖当前唯一存档。"
        action={
          <Button
            size="sm"
            icon={<FloppyDiskIcon size={16} weight="bold" />}
            onClick={onSave}
          >
            手动保存
          </Button>
        }
      >
        <p className="ws-save-message">
          {saveMessage ?? "存档保存在当前浏览器中。开始新游戏时会要求确认覆盖。"}
        </p>
      </Panel>
    </div>
  );
}

function FeedbackCard({
  feedback,
  game,
}: {
  feedback: ActionFeedback;
  game: GameState;
}) {
  return (
    <Feedback
      tone={feedbackTone(feedback)}
      title={feedback.title}
      description={feedback.messages.join(" ")}
      changes={feedback.effects.map((effect) => ({
        label: effectLabel(effect, game),
        value: effectValue(effect),
        direction:
          effect.amount > 0 ? "up" : effect.amount < 0 ? "down" : "neutral",
      }))}
    />
  );
}

function ActionResultDialog({
  feedback,
  game,
  onContinue,
}: {
  feedback: ActionFeedback;
  game: GameState;
  onContinue: () => void;
}) {
  const changesTitleId = useId();

  return (
    <Dialog
      open
      onClose={() => undefined}
      closeOnBackdrop={false}
      showCloseButton={false}
      title={feedback.title}
      description={`行动结果，消耗 ${feedback.actionPointsSpent} 个行动点。`}
      size="md"
      footer={
        <Button
          variant="primary"
          icon={<ArrowRightIcon size={18} weight="bold" aria-hidden="true" />}
          iconPosition="end"
          onClick={onContinue}
        >
          继续本月
        </Button>
      }
    >
      <div className="ws-action-result" data-tone={feedbackTone(feedback)}>
        <div className="ws-action-result__story">
          <span aria-hidden="true">{ACTION_ICONS[feedback.actionId]}</span>
          <div>
            {feedback.messages.map((message, index) => (
              <p key={`${feedback.actionId}-story-${index}`}>{message}</p>
            ))}
          </div>
        </div>

        <section
          className="ws-action-result__changes"
          aria-labelledby={changesTitleId}
        >
          <div>
            <h3 id={changesTitleId}>状态变化</h3>
            <span>{feedback.effects.length} 项</span>
          </div>
          {feedback.effects.length > 0 ? (
            <ul>
              {feedback.effects.map((effect, index) => (
                <li
                  key={`${effect.target}-${effect.label}-${index}`}
                  data-direction={
                    effect.amount > 0
                      ? "up"
                      : effect.amount < 0
                        ? "down"
                        : "neutral"
                  }
                >
                  <span>{effectLabel(effect, game)}</span>
                  <strong>{effectValue(effect)}</strong>
                </li>
              ))}
            </ul>
          ) : (
            <p className="ws-action-result__unchanged">没有额外数值变化。</p>
          )}
        </section>
      </div>
    </Dialog>
  );
}

function MonthDynamicsDialog({
  game,
  lastError,
  lastMonthSummary,
  onClose,
}: {
  game: GameState;
  lastError: string | null;
  lastMonthSummary: ReturnType<typeof useGameStore.getState>["lastMonthSummary"];
  onClose: () => void;
}) {
  return (
    <Dialog
      open
      onClose={onClose}
      title="本月动态"
      description={`第 ${game.calendar.year} 年 ${game.calendar.month} 月，回看已经发生的行动与状态变化。`}
      size="lg"
      footer={
        <Button variant="primary" onClick={onClose}>
          返回工作台
        </Button>
      }
    >
      <div className="ws-dynamics-dialog">
        {lastError && (
          <Feedback
            tone="danger"
            role="alert"
            title="最近一次行动未完成"
            description={lastError}
          />
        )}

        {lastMonthSummary && game.month.feedback.length === 0 && (
          <Feedback
            tone="info"
            title={`第 ${lastMonthSummary.completedMonth} 个月已结算`}
            description={[
              `扣除运营费 ${formatCurrency(lastMonthSummary.operatingCost)}，月末余额 ${formatCurrency(lastMonthSummary.fundsAfterSettlement)}。`,
              lastMonthSummary.contractMessage,
              lastMonthSummary.newVenueLevel
                ? `永久解锁 ${lastMonthSummary.newVenueLevel} 级场地。`
                : null,
            ]
              .filter(Boolean)
              .join(" ")}
          />
        )}

        {game.month.feedback.length > 0 ? (
          <div className="ws-dynamics-dialog__list">
            {[...game.month.feedback].reverse().map((feedback, index) => (
              <FeedbackCard
                key={`${feedback.actionId}-${index}`}
                feedback={feedback}
                game={game}
              />
            ))}
          </div>
        ) : (
          <div className="ws-dynamics__empty">
            <ListChecksIcon size={30} weight="duotone" aria-hidden="true" />
            <p>这个月还没有执行行动。</p>
          </div>
        )}
      </div>
    </Dialog>
  );
}

function MonthRail({
  game,
  onOpenOpportunities,
  onOpenDynamics,
  onEndMonth,
}: {
  game: GameState;
  onOpenOpportunities: () => void;
  onOpenDynamics: () => void;
  onEndMonth: () => void;
}) {
  const opportunityCount = countMonthOpportunities(game);
  const crises = [
    ...(game.activeContract
      ? [
          {
            id: "contract",
            title: "合约交付",
            detail: `第 ${game.activeContract.deadlineMonth} 月截止，已交付 ${game.activeContract.albumsDelivered}/${game.activeContract.albumsRequired} 张`,
          },
        ]
      : []),
    ...(game.financialCrisis.active
      ? [
          {
            id: "financial",
            title: "财务危机",
            detail: `剩余 ${game.financialCrisis.monthsRemaining} 个月`,
          },
        ]
      : []),
    ...game.belongingCrises.map((crisis) => ({
      id: crisis.memberId,
      title: `${game.members.find((member) => member.id === crisis.memberId)?.name ?? "成员"}决裂危机`,
      detail: `剩余 ${crisis.monthsRemaining} 个月`,
    })),
  ];

  return (
    <aside className="ws-month-rail" aria-label="本月动态">
      <Panel
        title={`第 ${game.calendar.year} 年 ${game.calendar.month} 月`}
        eyebrow="本月安排"
        accent
      >
        <div className="ws-ap-block">
          <div className="ws-ap-block__header">
            <span>行动点</span>
            <strong className="bb-mono-number">
              {game.month.actionPointsRemaining}/3
            </strong>
          </div>
          <div
            className="ws-ap-pips"
            role="img"
            aria-label={`剩余 ${game.month.actionPointsRemaining} 个行动点`}
          >
            {[0, 1, 2].map((index) => (
              <span
                key={index}
                data-active={index < game.month.actionPointsRemaining}
              />
            ))}
          </div>
          <p>同一种行动每月只能执行一次。</p>
        </div>
      </Panel>

      <section className="ws-month-shortcuts" aria-label="月度消息">
        <button type="button" onClick={onOpenOpportunities}>
          <span className="ws-month-shortcuts__icon" aria-hidden="true">
            <MicrophoneStageIcon size={19} weight="duotone" />
          </span>
          <span>
            <small>机会台</small>
            <strong>本月机会</strong>
          </span>
          <StatusBadge tone={opportunityCount > 0 ? "accent" : "neutral"}>
            {opportunityCount} 条
          </StatusBadge>
        </button>
        <button type="button" onClick={onOpenDynamics}>
          <span className="ws-month-shortcuts__icon" aria-hidden="true">
            <ListChecksIcon size={19} weight="duotone" />
          </span>
          <span>
            <small>即时反馈</small>
            <strong>本月动态</strong>
          </span>
          <StatusBadge
            tone={game.month.feedback.length > 0 ? "info" : "neutral"}
          >
            {game.month.feedback.length} 条
          </StatusBadge>
        </button>
      </section>

      {crises.length > 0 && (
        <Panel title="限期处理" eyebrow="危机" variant="inset">
          <div className="ws-crisis-list">
            {crises.map((crisis) => (
              <div key={crisis.id}>
                <WarningCircleIcon size={18} weight="fill" />
                <span>
                  <strong>{crisis.title}</strong>
                  <small>{crisis.detail}</small>
                </span>
              </div>
            ))}
          </div>
        </Panel>
      )}

      <div className="ws-month-rail__footer">
        <div>
          <span>月末将扣除</span>
          <strong>{formatCurrency(1_000)}</strong>
        </div>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          icon={<CalendarBlankIcon size={19} weight="bold" />}
          onClick={onEndMonth}
          disabled={game.status !== "active"}
        >
          结束本月
        </Button>
      </div>
    </aside>
  );
}

function TrainingDialog({
  kind,
  game,
  selectedMemberId,
  selectedStat,
  onMemberChange,
  onStatChange,
  onClose,
  onConfirm,
  error,
}: {
  kind: "personal" | "band";
  game: GameState;
  selectedMemberId: string;
  selectedStat: MemberStatKey;
  onMemberChange: (memberId: string) => void;
  onStatChange: (stat: MemberStatKey) => void;
  onClose: () => void;
  onConfirm: () => void;
  error: string | null;
}) {
  const teammates = selectTeammates(game);
  const statOptions =
    kind === "personal" ? PERSONAL_TRAINING_STATS : BAND_TRAINING_STATS;
  const actionId: ActionId =
    kind === "personal" ? "personalTraining" : "bandTraining";
  const confirmDisabled =
    actionIsDisabled(actionId, game) ||
    (kind === "band" && !selectedMemberId);
  const confirmLabel = confirmDisabled
    ? actionButtonLabel(actionId, game)
    : "确认训练";

  return (
    <Dialog
      open
      onClose={onClose}
      title={kind === "personal" ? "安排个人训练" : "安排成员训练"}
      description={
        kind === "personal"
          ? "选择主角本月重点练习的一项能力。"
          : "选择一名队友和一项需要补强的能力。"
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button
            variant="primary"
            onClick={onConfirm}
            disabled={confirmDisabled}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="ws-form">
        {error && (
          <Feedback
            tone="danger"
            role="alert"
            title="训练未完成"
            description={error}
          />
        )}
        {kind === "band" && (
          <label>
            <span>训练成员</span>
            <select
              value={selectedMemberId}
              onChange={(event) => onMemberChange(event.target.value)}
            >
              {teammates.map((member) => (
                <option value={member.id} key={member.id}>
                  {member.name}（{ROLE_LABELS[member.role]}）
                </option>
              ))}
            </select>
          </label>
        )}
        <fieldset>
          <legend>训练属性</legend>
          <div className="ws-choice-grid">
            {statOptions.map((stat) => (
              <label
                className="ws-choice"
                data-selected={selectedStat === stat}
                key={stat}
              >
                <input
                  type="radio"
                  name="training-stat"
                  value={stat}
                  checked={selectedStat === stat}
                  onChange={() => onStatChange(stat)}
                />
                <span>{MEMBER_STAT_LABELS[stat]}</span>
                <small>固定提升 +2</small>
              </label>
            ))}
          </div>
        </fieldset>
      </div>
    </Dialog>
  );
}

function AlbumDialog({
  game,
  title,
  coverId,
  onTitleChange,
  onCoverChange,
  onClose,
  onProduce,
}: {
  game: GameState;
  title: string;
  coverId: string;
  onTitleChange: (title: string) => void;
  onCoverChange: (coverId: string) => void;
  onClose: () => void;
  onProduce: (mode: "normal" | "concentrated" | "release") => void;
}) {
  const album = game.activeAlbum;
  const readyToRelease = album?.progress === 100;
  const recording = (album?.progress ?? 0) >= 70;
  const suggestions = NAME_SUGGESTIONS[game.band.genre].albumNames.slice(0, 4);

  return (
    <Dialog
      open
      onClose={onClose}
      size={readyToRelease ? "lg" : "md"}
      title={readyToRelease ? "发行专辑" : "制作专辑"}
      description={
        readyToRelease
          ? "确认名称和封面后，专辑会进行一次性首发结算。"
          : `当前阶段：${albumPhase(album?.progress ?? 0)}。`
      }
    >
      {readyToRelease ? (
        <div className="ws-release-form">
          <label>
            <span>专辑名称</span>
            <input
              value={title}
              maxLength={24}
              onChange={(event) => onTitleChange(event.target.value)}
            />
          </label>
          <div className="ws-suggestions">
            {suggestions.map((suggestion) => (
              <button
                type="button"
                key={suggestion}
                onClick={() => onTitleChange(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
          <fieldset>
            <legend>选择封面</legend>
            <div className="ws-cover-grid">
              {ALBUM_COVER_VARIANTS.map((cover) => {
                const resolvedId = `${game.band.genre}-${cover.id}`;
                const artwork = resolveAlbumCover(resolvedId);
                return (
                  <label
                    className="ws-cover-choice"
                    data-selected={coverId === resolvedId}
                    key={cover.id}
                  >
                    <input
                      type="radio"
                      name="album-cover"
                      checked={coverId === resolvedId}
                      onChange={() => onCoverChange(resolvedId)}
                    />
                    {artwork ? (
                      <ArtworkImage
                        artwork={artwork}
                        className="ws-cover-choice__art"
                        decorative
                      />
                    ) : (
                      <span>
                        <VinylRecordIcon size={30} weight="fill" />
                      </span>
                    )}
                    <strong>{cover.label}</strong>
                  </label>
                );
              })}
            </div>
          </fieldset>
          <div className="ws-release-preview">
            <span>最终质量 {stars(album.quality)}</span>
            <span>发行费用 {formatCurrency(5_000)}</span>
          </div>
          <div className="ws-dialog-actions">
            <Button variant="ghost" onClick={onClose}>
              取消
            </Button>
            <Button
              variant="primary"
              onClick={() => onProduce("release")}
              disabled={!title.trim() || !coverId || game.band.funds < 5_000}
            >
              正式发行
            </Button>
          </div>
        </div>
      ) : (
        <div className="ws-production-options">
          {!album && (
            <label>
              <span>工作名称</span>
              <input
                value={title}
                maxLength={24}
                onChange={(event) => onTitleChange(event.target.value)}
                placeholder="未命名专辑"
              />
            </label>
          )}
          <button
            type="button"
            onClick={() => onProduce("normal")}
            disabled={
              game.month.actionPointsRemaining < 1 ||
              (recording && game.band.funds < 3_000)
            }
          >
            <span>
              <strong>普通制作</strong>
              <small>推进10%，不额外消耗全员状态</small>
            </span>
            <span>
              1 AP
              {recording ? ` + ${formatCurrency(3_000)}` : ""}
            </span>
          </button>
          <button
            type="button"
            onClick={() => onProduce("concentrated")}
            disabled={
              game.month.actionPointsRemaining < 2 ||
              (recording && game.band.funds < 6_000)
            }
          >
            <span>
              <strong>集中制作</strong>
              <small>推进20%，全员状态下降一级</small>
            </span>
            <span>
              2 AP
              {recording ? ` + ${formatCurrency(6_000)}` : ""}
            </span>
          </button>
        </div>
      )}
    </Dialog>
  );
}

function PerformanceDialog({
  game,
  selectionId,
  onSelectionChange,
  onClose,
  onConfirm,
}: {
  game: GameState;
  selectionId: string;
  onSelectionChange: (selectionId: string) => void;
  onClose: () => void;
  onConfirm: (plan: PerformancePlan) => void;
}) {
  const risk = performanceRisk(game);
  const options = [
    ...LEVEL_ONE_VENUES.map((venue, index) => ({
      id: `invite:${venue.id}`,
      label: `${venue.name}邀请`,
      detail: `固定报酬 ${formatCurrency(invitationPlan(venue, index).fee)}`,
      plan: invitationPlan(venue, index),
    })),
    {
      id: `self:${LEVEL_ONE_VENUES[0].id}`,
      label: `${LEVEL_ONE_VENUES[0].name}自主演出`,
      detail: `先付场租 ${formatCurrency(LEVEL_ONE_VENUES[0].selfHosted.upfrontCost)}`,
      plan: selfOrganizedPlan(LEVEL_ONE_VENUES[0]),
    },
  ];
  const selected = options.find((option) => option.id === selectionId) ?? options[0];
  const insufficientFunds =
    (selected.plan.upfrontCost ?? 0) > game.band.funds;

  return (
    <Dialog
      open
      onClose={onClose}
      title="安排本月演出"
      description="演出会消耗2个行动点，并使全员状态下降一级。"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button
            variant="primary"
            onClick={() => onConfirm(selected.plan)}
            disabled={insufficientFunds || game.month.actionPointsRemaining < 2}
          >
            确认演出
          </Button>
        </>
      }
    >
      <div className="ws-form">
        <div className="ws-performance-readiness">
          <span>当前现场风险</span>
          <StatusBadge tone={risk.tone}>{risk.label}</StatusBadge>
        </div>
        <fieldset>
          <legend>选择演出</legend>
          <div className="ws-performance-options">
            {options.map((option) => (
              <label
                key={option.id}
                data-selected={selected.id === option.id}
              >
                <input
                  type="radio"
                  name="performance-plan"
                  value={option.id}
                  checked={selected.id === option.id}
                  onChange={() => onSelectionChange(option.id)}
                />
                <span>
                  <strong>{option.label}</strong>
                  <small>{option.detail}</small>
                </span>
                <span>2 AP</span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>
    </Dialog>
  );
}

function RulesDialog({ onClose }: { onClose: () => void }) {
  return (
    <Dialog
      open
      onClose={onClose}
      title="工作站规则"
      description="这里列出每个月最常用的经营规则。"
      size="lg"
      footer={<Button onClick={onClose}>知道了</Button>}
    >
      <div className="ws-rules-grid">
        <section>
          <LightningIcon size={22} weight="duotone" />
          <h3>每月三个行动点</h3>
          <p>所有个人行动和乐队行动共享行动点，同一种行动当月只能安排一次。</p>
        </section>
        <section>
          <CalendarBlankIcon size={22} weight="duotone" />
          <h3>月末自动结算</h3>
          <p>队友状态自然恢复一级，扣除运营费，并处理沉寂、人气与危机期限。</p>
        </section>
        <section>
          <VinylRecordIcon size={22} weight="duotone" />
          <h3>一张专辑一张专辑发行</h3>
          <p>同一时间只能制作一张专辑，达到100%后需要另用一次行动正式发行。</p>
        </section>
        <section>
          <UsersThreeIcon size={22} weight="duotone" />
          <h3>阵容始终固定</h3>
          <p>五名成员不会被替换。归属感归零后会进入六个月的关系修复期限。</p>
        </section>
      </div>
    </Dialog>
  );
}

function EndingDialog({
  game,
  onReturnHome,
}: {
  game: GameState;
  onReturnHome?: () => void;
}) {
  const attributes = selectBandAttributes(game);
  const reason = game.endingReason
    ? ENDING_REASON_LABELS[game.endingReason]
    : "这段乐队生涯已经结束";

  return (
    <Dialog
      open
      onClose={() => undefined}
      closeOnBackdrop={false}
      showCloseButton={false}
      title="乐队生涯告一段落"
      description={reason}
      size="md"
      footer={
        <Button
          variant="primary"
          onClick={onReturnHome}
          disabled={!onReturnHome}
        >
          返回首页
        </Button>
      }
    >
      <div className="ws-ending-summary">
        <section>
          <span>乐队</span>
          <strong>{game.band.name}</strong>
        </section>
        <section>
          <span>已发行专辑</span>
          <strong>{game.releasedAlbums.length} 张</strong>
        </section>
        <section>
          <span>最终人气</span>
          <strong>{Math.round(attributes.popularity)}</strong>
        </section>
        <section>
          <span>最终资金</span>
          <strong>{formatCurrency(attributes.funds)}</strong>
        </section>
      </div>
    </Dialog>
  );
}

function SettingsDialog({
  game,
  feedbackDraft,
  feedbackStatus,
  saveMessage,
  onFeedbackDraftChange,
  onFeedbackStatusChange,
  onSave,
  onEndCareer,
  onClose,
}: {
  game: GameState;
  feedbackDraft: GameFeedbackDraft;
  feedbackStatus: GameFeedbackStatus;
  saveMessage: string | null;
  onFeedbackDraftChange: Dispatch<SetStateAction<GameFeedbackDraft>>;
  onFeedbackStatusChange: Dispatch<SetStateAction<GameFeedbackStatus>>;
  onSave: () => void;
  onEndCareer: () => void;
  onClose: () => void;
}) {
  const [confirmingEnd, setConfirmingEnd] = useState(false);
  const [feedbackWebsite, setFeedbackWebsite] = useState("");
  const feedbackCategoryId = useId();
  const feedbackMessageId = useId();
  const feedbackHelperId = useId();
  const feedbackFieldErrorId = useId();
  const feedbackMessageRef = useRef<HTMLTextAreaElement>(null);

  function finishCareer() {
    onEndCareer();
    onClose();
  }

  function resetFeedbackStatus() {
    onFeedbackStatusChange((currentStatus) =>
      currentStatus.phase === "submitting"
        ? currentStatus
        : INITIAL_GAME_FEEDBACK_STATUS,
    );
  }

  async function handleFeedbackSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (feedbackStatus.phase === "submitting") {
      return;
    }

    const message = feedbackDraft.message.trim();

    if (
      message.length < GAME_FEEDBACK_MESSAGE_MIN_LENGTH ||
      message.length > GAME_FEEDBACK_MESSAGE_MAX_LENGTH
    ) {
      onFeedbackStatusChange({
        phase: "idle",
        activeSubmissionId: null,
        formError: null,
        fieldError: `请填写 ${GAME_FEEDBACK_MESSAGE_MIN_LENGTH} 到 ${GAME_FEEDBACK_MESSAGE_MAX_LENGTH} 个字符的反馈。`,
      });
      feedbackMessageRef.current?.focus();
      return;
    }

    const submissionIdentity =
      feedbackDraft.submissionId &&
      feedbackDraft.submittedAt &&
      feedbackDraft.context
        ? {
            submissionId: feedbackDraft.submissionId,
            submittedAt: feedbackDraft.submittedAt,
            context: feedbackDraft.context,
          }
        : {
            submissionId: createFeedbackSubmissionId(),
            submittedAt: new Date().toISOString(),
            context: {
              bandName: game.band.name,
              genre: game.band.genre,
              year: game.calendar.year,
              month: game.calendar.month,
            },
          };

    if (
      !feedbackDraft.submissionId ||
      !feedbackDraft.submittedAt ||
      !feedbackDraft.context
    ) {
      onFeedbackDraftChange({
        ...feedbackDraft,
        ...submissionIdentity,
      });
    }

    onFeedbackStatusChange({
      phase: "submitting",
      activeSubmissionId: submissionIdentity.submissionId,
      fieldError: null,
      formError: null,
    });

    try {
      await submitGameFeedback({
        ...submissionIdentity,
        category: feedbackDraft.category,
        message,
        website: feedbackWebsite,
      });
      onFeedbackDraftChange((currentDraft) =>
        currentDraft.submissionId === submissionIdentity.submissionId
          ? {
              category: currentDraft.category,
              message: "",
              submissionId: null,
              submittedAt: null,
              context: null,
            }
          : currentDraft,
      );
      setFeedbackWebsite("");
      onFeedbackStatusChange((currentStatus) =>
        currentStatus.activeSubmissionId === submissionIdentity.submissionId
          ? {
              phase: "success",
              activeSubmissionId: null,
              fieldError: null,
              formError: null,
            }
          : currentStatus,
      );
    } catch (error) {
      onFeedbackStatusChange((currentStatus) =>
        currentStatus.activeSubmissionId === submissionIdentity.submissionId
          ? {
              phase: "idle",
              activeSubmissionId: null,
              fieldError: null,
              formError:
                error instanceof Error
                  ? error.message
                  : "反馈暂时未能送达，请稍后再试。",
            }
          : currentStatus,
      );
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title="设置"
      description="管理存档、乐队生涯和游戏反馈。"
      size="md"
      closeLabel="关闭设置"
    >
      <div className="ws-settings-list" data-genre={game.band.genre}>
        <section className="ws-settings-item ws-settings-item--feedback">
          <span className="ws-settings-item__icon" aria-hidden="true">
            <ChatsCircleIcon size={22} weight="duotone" />
          </span>
          <div className="ws-settings-item__copy">
            <h3>游戏反馈</h3>
            <p>遇到问题或有玩法建议，写下来后直接提交给开发者。</p>
          </div>

          <form
            className="ws-feedback-form"
            onSubmit={handleFeedbackSubmit}
            noValidate
          >
            <label htmlFor={feedbackCategoryId}>
              <span>反馈类型</span>
              <select
                id={feedbackCategoryId}
                value={feedbackDraft.category}
                disabled={feedbackStatus.phase === "submitting"}
                onChange={(event) => {
                  onFeedbackDraftChange({
                    ...feedbackDraft,
                    category: event.target.value as GameFeedbackCategory,
                    submissionId: null,
                    submittedAt: null,
                    context: null,
                  });
                  resetFeedbackStatus();
                }}
              >
                {GAME_FEEDBACK_CATEGORIES.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
              </select>
            </label>

            <label htmlFor={feedbackMessageId}>
              <span>反馈内容</span>
              <textarea
                ref={feedbackMessageRef}
                id={feedbackMessageId}
                value={feedbackDraft.message}
                rows={5}
                maxLength={GAME_FEEDBACK_MESSAGE_MAX_LENGTH}
                disabled={feedbackStatus.phase === "submitting"}
                aria-describedby={`${feedbackHelperId}${
                  feedbackStatus.fieldError ? ` ${feedbackFieldErrorId}` : ""
                }`}
                aria-invalid={
                  feedbackStatus.fieldError ? "true" : undefined
                }
                placeholder="例如：演出收益偏低，希望场地解锁节奏更顺畅。"
                onChange={(event) => {
                  onFeedbackDraftChange({
                    ...feedbackDraft,
                    message: event.target.value,
                    submissionId: null,
                    submittedAt: null,
                    context: null,
                  });
                  resetFeedbackStatus();
                }}
              />
            </label>

            <input
              className="ws-feedback-honeypot"
              type="text"
              name="website"
              value={feedbackWebsite}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              onChange={(event) => setFeedbackWebsite(event.target.value)}
            />

            <div className="ws-feedback-form__meta" id={feedbackHelperId}>
              <span>
                内容和当前乐队进度会通过 Resend 邮件服务发送，不会公开展示，请勿填写个人敏感信息。
              </span>
              <span
                aria-label={`反馈字符数：${feedbackDraft.message.length} / ${GAME_FEEDBACK_MESSAGE_MAX_LENGTH}`}
              >
                {feedbackDraft.message.length} /{" "}
                {GAME_FEEDBACK_MESSAGE_MAX_LENGTH}
              </span>
            </div>

            {feedbackStatus.fieldError && (
              <p
                className="ws-feedback-form__message"
                id={feedbackFieldErrorId}
                role="alert"
                data-tone="danger"
              >
                {feedbackStatus.fieldError}
              </p>
            )}

            {feedbackStatus.formError && (
              <p
                className="ws-feedback-form__message"
                role="alert"
                data-tone="danger"
              >
                {feedbackStatus.formError}
              </p>
            )}

            {feedbackStatus.phase === "success" && (
              <p
                className="ws-feedback-form__message"
                role="status"
                data-tone="positive"
              >
                反馈已送达，谢谢你帮我们把游戏做得更好。
              </p>
            )}

            <div className="ws-feedback-form__actions">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                loading={feedbackStatus.phase === "submitting"}
                loadingLabel="正在提交"
                icon={
                  <PaperPlaneTiltIcon
                    size={16}
                    weight="bold"
                    aria-hidden="true"
                  />
                }
              >
                提交反馈
              </Button>
            </div>
          </form>
        </section>

        <section className="ws-settings-item">
          <span className="ws-settings-item__icon" aria-hidden="true">
            <FloppyDiskIcon size={22} weight="duotone" />
          </span>
          <div className="ws-settings-item__copy">
            <h3>本地存档</h3>
            <p>每满 12 个月自动保存一次，也可以随时覆盖当前唯一存档。</p>
            <small role={saveMessage ? "status" : undefined}>
              {saveMessage ?? "存档保存在当前浏览器中，刷新后可以继续。"}
            </small>
          </div>
          <Button
            className="ws-settings-item__action"
            size="sm"
            icon={
              <FloppyDiskIcon
                size={16}
                weight="bold"
                aria-hidden="true"
              />
            }
            onClick={onSave}
          >
            手动保存
          </Button>
        </section>

        <section className="ws-settings-item" data-tone="danger">
          <span className="ws-settings-item__icon" aria-hidden="true">
            <WarningCircleIcon size={22} weight="duotone" />
          </span>
          <div className="ws-settings-item__copy">
            <h3>主动结束生涯</h3>
            <p>根据真实专辑、演出、成员和资金生成最终总结。</p>
          </div>
          {!confirmingEnd && (
            <Button
              className="ws-settings-item__action"
              variant="danger"
              size="sm"
              onClick={() => setConfirmingEnd(true)}
              disabled={game.status !== "active"}
            >
              主动结束
            </Button>
          )}
          {confirmingEnd && (
            <div className="ws-settings-confirmation" role="alert">
              <div>
                <strong>确认立即结束当前乐队生涯吗？</strong>
                <p>进入正式结局后，当前月份不能继续操作。</p>
              </div>
              <div className="ws-settings-confirmation__actions">
                <Button
                  variant="ghost"
                  size="sm"
                  autoFocus
                  onClick={() => setConfirmingEnd(false)}
                >
                  继续经营
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={finishCareer}
                >
                  确认结束
                </Button>
              </div>
            </div>
          )}
        </section>
      </div>
    </Dialog>
  );
}

export interface WorkstationProps {
  onOpenRules?: () => void;
  onReturnHome?: () => void;
}

export function Workstation({
  onOpenRules,
  onReturnHome,
}: WorkstationProps = {}) {
  const game = useGameStore((state) => state.game);
  const lastMonthSummary = useGameStore((state) => state.lastMonthSummary);
  const lastError = useGameStore((state) => state.lastError);
  const performAction = useGameStore((state) => state.performAction);
  const endMonth = useGameStore((state) => state.endMonth);
  const manualSave = useGameStore((state) => state.manualSave);
  const abandonAlbum = useGameStore((state) => state.abandonAlbum);
  const endCareer = useGameStore((state) => state.endCareer);
  const clearSavedGame = useGameStore((state) => state.clearSavedGame);
  const clearCurrentGame = useGameStore((state) => state.clearCurrentGame);

  const [page, setPage] = useState<WorkstationPage>("overview");
  const [dialog, setDialog] = useState<WorkstationDialog>(null);
  const [trainingMemberId, setTrainingMemberId] = useState("");
  const [trainingStat, setTrainingStat] =
    useState<MemberStatKey>("professional");
  const [albumTitle, setAlbumTitle] = useState("");
  const [albumCoverId, setAlbumCoverId] = useState("");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [feedbackDraft, setFeedbackDraft] = useState<GameFeedbackDraft>({
    category: "suggestion",
    message: "",
    submissionId: null,
    submittedAt: null,
    context: null,
  });
  const [feedbackStatus, setFeedbackStatus] =
    useState<GameFeedbackStatus>(INITIAL_GAME_FEEDBACK_STATUS);
  const [careerMessage, setCareerMessage] = useState<string | null>(null);
  const [actionResult, setActionResult] = useState<ActionFeedback | null>(null);
  const [inlineTrainingError, setInlineTrainingError] = useState<string | null>(
    null,
  );
  const closeDialog = useCallback(() => setDialog(null), []);

  const genre = useMemo(
    () => GENRES.find((item) => item.id === game?.band.genre),
    [game?.band.genre],
  );

  if (!game) {
    return (
      <main className="ws-empty-workstation">
        <Panel title="后台工作站尚未启用" accent>
          <p>完成乐队命名后，这里会显示成员、行动、专辑、演出和经营信息。</p>
        </Panel>
      </main>
    );
  }

  const currentGame = game;
  const player = selectPlayer(game);
  const teammates = selectTeammates(game);

  function runAction(command: ActionCommand, showTrainingError = false) {
    const result = performAction(command);
    if (result?.ok) {
      setInlineTrainingError(null);
      setCareerMessage(null);
      setActionResult(result.feedback);
      setDialog("actionResult");
      return;
    }

    if (showTrainingError) {
      setInlineTrainingError(result?.error.message ?? "训练未能完成，请稍后重试。");
    } else {
      setDialog("dynamics");
    }
  }

  function openAlbumDialog() {
    const defaultTitle =
      currentGame.activeAlbum?.workingTitle ??
      NAME_SUGGESTIONS[currentGame.band.genre].albumNames[0] ??
      "未命名专辑";
    setAlbumTitle(defaultTitle);
    setAlbumCoverId(
      `${currentGame.band.genre}-${ALBUM_COVER_VARIANTS[0].id}`,
    );
    setDialog("album");
  }

  function openBandTraining(memberId?: string) {
    setInlineTrainingError(null);
    setTrainingMemberId(memberId ?? teammates[0]?.id ?? "");
    setTrainingStat("professional");
    setDialog("bandTraining");
  }

  function activateAction(actionId: ActionId) {
    switch (actionId) {
      case "personalTraining":
        setInlineTrainingError(null);
        setTrainingStat("professional");
        setDialog("personalTraining");
        break;
      case "bandTraining":
        openBandTraining();
        break;
      case "albumProduction":
        openAlbumDialog();
        break;
      case "performance":
        setPage("performances");
        break;
      case "social":
      case "partTime":
      case "rest":
      case "rehearsal":
      case "promotion":
      case "teamBuilding":
        runAction({ type: actionId });
        break;
    }
  }

  function handleSave() {
    const result = manualSave();
    setCareerMessage(null);
    setSaveMessage(result.ok ? "当前进度已保存。" : result.error);
  }

  function handleCareerPerformance(plan: PerformancePlan) {
    const result = performAction({ type: "performance", plan });
    if (!result) {
      setCareerMessage("当前没有可操作的游戏状态。");
      return;
    }
    if (result.ok) {
      setCareerMessage(null);
      setActionResult(result.feedback);
      setDialog("actionResult");
      return;
    }
    setCareerMessage(result.error.message);
  }

  function handleOpenRules() {
    if (onOpenRules) {
      onOpenRules();
      return;
    }
    setDialog("rules");
  }

  const pageItems = [
    {
      id: "overview",
      label: "总览",
      icon: <HouseIcon size={17} weight="bold" />,
      content: (
        <OverviewPage game={game} onActivateAction={activateAction} />
      ),
    },
    {
      id: "members",
      label: "成员",
      icon: <UsersThreeIcon size={17} weight="bold" />,
      badge: game.members.length,
      content: <MembersPage game={game} onTrain={openBandTraining} />,
    },
    {
      id: "albums",
      label: "专辑",
      icon: <VinylRecordIcon size={17} weight="bold" />,
      badge: game.releasedAlbums.length,
      content: (
        <div className="ws-page-stack">
          {careerMessage && (
            <Feedback
              tone="info"
              title="专辑制作台"
              description={careerMessage}
            />
          )}
          <AlbumsPage
            game={game}
            onProduce={openAlbumDialog}
            onAbandon={() => setDialog("abandonAlbum")}
          />
        </div>
      ),
    },
    {
      id: "performances",
      label: "演出",
      icon: <MicrophoneStageIcon size={17} weight="bold" />,
      content: (
        <div className="ws-page-stack">
          {careerMessage && (
            <Feedback
              tone="info"
              title="现场调度"
              description={careerMessage}
            />
          )}
          <CareerPerformancePanel
            game={game}
            onPerform={handleCareerPerformance}
            onMessage={setCareerMessage}
          />
        </div>
      ),
    },
    {
      id: "management",
      label: "经营",
      icon: <ReceiptIcon size={17} weight="bold" />,
      content: (
        <div className="ws-page-stack">
          {(careerMessage || saveMessage) && (
            <Feedback
              tone="info"
              title="经营台消息"
              description={careerMessage ?? saveMessage ?? ""}
            />
          )}
          <CareerManagementPanel
            game={game}
            onMessage={setCareerMessage}
          />
        </div>
      ),
    },
  ];

  return (
    <main className="ws-root" data-genre={game.band.genre}>
      <header className="ws-topbar">
        <div className="ws-topbar__brand">
          <span className="ws-topbar__mark">
            <GuitarIcon size={22} weight="fill" />
          </span>
          <div>
            <p>乐队后台工作站</p>
            <h1>{game.band.name}</h1>
          </div>
        </div>
        <div className="ws-topbar__meta">
          <StatusBadge tone="accent">
            {genre?.label ?? game.band.genre}
          </StatusBadge>
          <span>
            成立第 {game.calendar.year} 年
            <small>第 {game.calendar.month} 月</small>
          </span>
        </div>
        <div className="ws-topbar__actions">
          {onReturnHome && (
            <Button
              variant="ghost"
              size="sm"
              icon={<HouseIcon size={17} weight="bold" />}
              onClick={onReturnHome}
            >
              返回首页
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            icon={<QuestionIcon size={17} weight="bold" />}
            onClick={handleOpenRules}
          >
            规则
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={<GearSixIcon size={17} weight="bold" />}
            aria-haspopup="dialog"
            aria-expanded={dialog === "settings"}
            onClick={() => setDialog("settings")}
          >
            设置
          </Button>
        </div>
      </header>

      {saveMessage && (
        <ToastRegion label="存档状态">
          <Toast
            tone={saveMessage === "当前进度已保存。" ? "positive" : "danger"}
            title={saveMessage}
            onDismiss={() => setSaveMessage(null)}
          />
        </ToastRegion>
      )}

      <div className="ws-shell">
        <aside className="ws-band-rail" aria-label="乐队档案">
          <Panel
            title={game.band.name}
            eyebrow="乐队档案"
            description={`${genre?.englishLabel ?? game.band.genre}，成立于毕业后的第一个月。`}
            accent
          >
            <BandAttributeList game={game} />
          </Panel>
          <PlayerCard player={player} />
          <Button
            className="ws-history-button"
            variant="secondary"
            fullWidth
            icon={<ListChecksIcon size={17} weight="bold" />}
            onClick={() => setDialog("history")}
          >
            乐队履历
          </Button>
          <Panel title="随身设备" variant="inset">
            <div className="ws-quick-gear">
              <span>
                <GuitarIcon size={16} weight="duotone" />
                {EQUIPMENT_LABELS[game.equipment.guitar]}吉他
              </span>
              <span>
                <WaveformIcon size={16} weight="duotone" />
                {EQUIPMENT_LABELS[game.equipment.pedals]}效果器
              </span>
              <span>
                <MegaphoneIcon size={16} weight="duotone" />
                {EQUIPMENT_LABELS[game.equipment.amplifier]}音箱
              </span>
            </div>
          </Panel>
        </aside>

        <section className="ws-main-column" aria-label="工作区">
          <Tabs
            ariaLabel="乐队工作区"
            value={page}
            onValueChange={(value) => setPage(value as WorkstationPage)}
            items={pageItems}
            className="ws-tabs"
            panelClassName="ws-tabs__panel"
          />
        </section>

        <MonthRail
          game={game}
          onOpenOpportunities={() => setDialog("opportunities")}
          onOpenDynamics={() => setDialog("dynamics")}
          onEndMonth={() => setDialog("endMonth")}
        />
      </div>

      {dialog === "rules" && <RulesDialog onClose={() => setDialog(null)} />}
      {dialog === "history" && (
        <HistoryDialog game={game} onClose={() => setDialog(null)} />
      )}
      {dialog === "opportunities" && (
        <MonthOpportunityDialog
          game={game}
          open
          onClose={() => setDialog(null)}
        />
      )}
      {dialog === "dynamics" && (
        <MonthDynamicsDialog
          game={game}
          lastError={lastError}
          lastMonthSummary={lastMonthSummary}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog === "actionResult" && actionResult && (
        <ActionResultDialog
          feedback={actionResult}
          game={game}
          onContinue={() => {
            setActionResult(null);
            setDialog(null);
          }}
        />
      )}
      {dialog === "settings" && (
        <SettingsDialog
          game={game}
          feedbackDraft={feedbackDraft}
          feedbackStatus={feedbackStatus}
          saveMessage={saveMessage}
          onFeedbackDraftChange={setFeedbackDraft}
          onFeedbackStatusChange={setFeedbackStatus}
          onSave={handleSave}
          onEndCareer={() => {
            endCareer();
          }}
          onClose={closeDialog}
        />
      )}

      {dialog === "personalTraining" && (
        <TrainingDialog
          kind="personal"
          game={game}
          selectedMemberId={player.id}
          selectedStat={trainingStat}
          onMemberChange={() => undefined}
          onStatChange={setTrainingStat}
          onClose={() => {
            setInlineTrainingError(null);
            setDialog(null);
          }}
          onConfirm={() =>
            runAction(
              { type: "personalTraining", stat: trainingStat },
              true,
            )
          }
          error={inlineTrainingError}
        />
      )}

      {dialog === "bandTraining" && (
        <TrainingDialog
          kind="band"
          game={game}
          selectedMemberId={trainingMemberId}
          selectedStat={trainingStat}
          onMemberChange={setTrainingMemberId}
          onStatChange={setTrainingStat}
          onClose={() => {
            setInlineTrainingError(null);
            setDialog(null);
          }}
          onConfirm={() =>
            runAction(
              {
                type: "bandTraining",
                memberId: trainingMemberId,
                stat: trainingStat,
              },
              true,
            )
          }
          error={inlineTrainingError}
        />
      )}

      {dialog === "album" && (
        <AlbumDialog
          game={game}
          title={albumTitle}
          coverId={albumCoverId}
          onTitleChange={setAlbumTitle}
          onCoverChange={setAlbumCoverId}
          onClose={() => setDialog(null)}
          onProduce={(mode) =>
            runAction({
              type: "albumProduction",
              mode,
              title: albumTitle,
              coverId: mode === "release" ? albumCoverId : undefined,
            })
          }
        />
      )}

      {dialog === "abandonAlbum" && game.activeAlbum && (
        <Dialog
          open
          onClose={() => setDialog(null)}
          title="放弃当前专辑"
          description={`确认停止制作《${game.activeAlbum.workingTitle}》吗？已经投入的进度不会保留。`}
          footer={
            <>
              <Button variant="ghost" onClick={() => setDialog(null)}>
                继续制作
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  const result = abandonAlbum();
                  setCareerMessage(
                    result?.ok
                      ? result.message
                      : result?.error ?? "当前专辑无法放弃。",
                  );
                  setDialog(null);
                }}
              >
                确认放弃
              </Button>
            </>
          }
        >
          <p className="ws-dialog-warning">
            放弃后可以立即开始一张新专辑，但当前进度与已支付的录音成本无法恢复。
          </p>
        </Dialog>
      )}

      {dialog === "endMonth" && (
        <Dialog
          open
          onClose={() => setDialog(null)}
          title="结束本月"
          description="确认后会立即进行月末结算，无法撤回。"
          footer={
            <>
              <Button variant="ghost" onClick={() => setDialog(null)}>
                继续安排
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  endMonth();
                  setDialog(null);
                }}
              >
                确认结算
              </Button>
            </>
          }
        >
          <div className="ws-month-confirm">
            <div>
              <LightningIcon size={20} weight="duotone" />
              <span>
                <strong>剩余行动点</strong>
                <small>
                  {game.month.actionPointsRemaining} 点，将用于主角状态恢复
                </small>
              </span>
            </div>
            <div>
              <CurrencyCnyIcon size={20} weight="duotone" />
              <span>
                <strong>固定运营费</strong>
                <small>{formatCurrency(1_000)}</small>
              </span>
            </div>
            <div>
              <ClockCountdownIcon size={20} weight="duotone" />
              <span>
                <strong>队友自然恢复</strong>
                <small>四名队友状态自动恢复一级</small>
              </span>
            </div>
          </div>
        </Dialog>
      )}
      {game.status === "ended" && (
        <EndingExperience
          game={game}
          onReturnHome={() => onReturnHome?.()}
          onRestart={() => {
            clearSavedGame();
            clearCurrentGame();
            onReturnHome?.();
          }}
        />
      )}
    </main>
  );
}

export default Workstation;
