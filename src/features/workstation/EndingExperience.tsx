import {
  ArrowCounterClockwiseIcon,
  CalendarBlankIcon,
  HouseIcon,
  MicrophoneStageIcon,
  MusicNotesIcon,
  StarIcon,
  UsersThreeIcon,
  VinylRecordIcon,
} from "@phosphor-icons/react";
import { useRef } from "react";
import { Button, Dialog, StatusBadge } from "../../components";
import type {
  EndingMemberSummary,
  EndingReason,
  GameState,
  MemberRole,
  MemberStatus,
  PerformanceRating,
  TimelineEntry,
} from "../../domain";
import "./ending-experience.css";

const ENDING_REASON_LABELS: Readonly<Record<EndingReason, string>> = {
  twentiethAnniversary: "乐队走过二十周年",
  memberBreakup: "成员决裂，乐队解散",
  debtBreakup: "债务危机，乐队解散",
  playerEnded: "队长决定结束乐队生涯",
  specialStory: "一段特殊经历为乐队画下句点",
};

const ROLE_LABELS: Readonly<Record<MemberRole, string>> = {
  leader: "队长兼主唱",
  leadGuitar: "主音吉他",
  bass: "贝斯",
  drums: "鼓手",
  keyboard: "键盘",
};

const MEMBER_STATUS_LABELS: Readonly<Record<MemberStatus, string>> = {
  excellent: "极佳",
  good: "良好",
  normal: "平稳",
  tired: "疲惫",
  awful: "低落",
};

const PERFORMANCE_RATING_LABELS: Readonly<
  Record<PerformanceRating, string>
> = {
  accident: "演出事故",
  barelyCompleted: "勉强完成",
  steady: "稳定发挥",
  crowdIgnited: "全场沸腾",
  legendary: "传奇现场",
};

const PERFORMANCE_SCORE: Readonly<Record<PerformanceRating, number>> = {
  accident: 0,
  barelyCompleted: 1,
  steady: 2,
  crowdIgnited: 3,
  legendary: 4,
};

const EMPTY_CLOSE = () => undefined;

interface MemberFinalView extends EndingMemberSummary {
  status: MemberStatus;
}

export interface EndingExperienceProps {
  game: GameState;
  onReturnHome: () => void;
  onRestart?: () => void;
}

function clampBelonging(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function fallbackMemberHeadline(belonging: number): string {
  if (belonging >= 80) return "仍把乐队视作最重要的归属";
  if (belonging >= 50) return "带着共同的记忆继续音乐生活";
  if (belonging >= 20) return "在分歧之后找到了自己的方向";
  return "告别漫长的拉扯，走向新的生活";
}

function belongingTone(belonging: number) {
  if (belonging >= 75) return "positive" as const;
  if (belonging >= 50) return "info" as const;
  if (belonging >= 25) return "warning" as const;
  return "danger" as const;
}

function endingReasonTone(reason: EndingReason | null) {
  if (reason === "twentiethAnniversary") return "positive" as const;
  if (reason === "specialStory") return "accent" as const;
  if (reason === "playerEnded") return "warning" as const;
  if (reason === "memberBreakup" || reason === "debtBreakup") {
    return "danger" as const;
  }
  return "neutral" as const;
}

function formatCareerMonth(month: number): string {
  if (!Number.isFinite(month)) return "月份未记录";
  const safeMonth = Math.max(0, Math.round(month));
  if (safeMonth === 0) return "组队之初";

  const year = Math.floor((safeMonth - 1) / 12) + 1;
  const monthInYear = ((safeMonth - 1) % 12) + 1;
  return `第 ${year} 年 ${monthInYear} 月`;
}

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return "0";
  return Math.round(value).toLocaleString("zh-CN");
}

function resolveMembers(game: GameState): MemberFinalView[] {
  const summaries = game.endingSummary?.memberSummaries ?? [];
  const summaryById = new Map(
    summaries.map((member) => [member.memberId, member]),
  );
  const seenIds = new Set<string>();
  const members: MemberFinalView[] = game.members.slice(0, 5).map((member) => {
    const summary = summaryById.get(member.id);
    const belonging = clampBelonging(
      summary?.belonging ?? member.stats.belonging,
    );
    seenIds.add(member.id);

    return {
      memberId: member.id,
      name: summary?.name.trim() || member.name,
      role: summary?.role ?? member.role,
      headline:
        summary?.headline.trim() || fallbackMemberHeadline(belonging),
      belonging,
      status: member.status,
    };
  });

  for (const summary of summaries) {
    if (members.length >= 5 || seenIds.has(summary.memberId)) continue;
    const belonging = clampBelonging(summary.belonging);
    members.push({
      ...summary,
      name: summary.name.trim() || "未署名成员",
      headline:
        summary.headline.trim() || fallbackMemberHeadline(belonging),
      belonging,
      status: "normal",
    });
  }

  return members;
}

function selectRepresentativeAlbum(game: GameState) {
  const preferredId = game.endingSummary?.representativeAlbumId;
  const preferred = preferredId
    ? game.releasedAlbums.find((album) => album.id === preferredId)
    : undefined;
  if (preferred) return preferred;

  return [...game.releasedAlbums].sort(
    (left, right) =>
      right.quality - left.quality ||
      right.listeners - left.listeners ||
      left.releasedInMonth - right.releasedInMonth,
  )[0];
}

function selectKeyPerformance(game: GameState) {
  const preferredId = game.endingSummary?.keyPerformanceId;
  const preferred = preferredId
    ? game.performanceRecords.find((record) => record.id === preferredId)
    : undefined;
  if (preferred) return preferred;

  return [...game.performanceRecords].sort(
    (left, right) =>
      right.venueLevel * 10 +
        PERFORMANCE_SCORE[right.rating] -
        (left.venueLevel * 10 + PERFORMANCE_SCORE[left.rating]) ||
      left.month - right.month,
  )[0];
}

function selectTimeline(history: readonly TimelineEntry[]): TimelineEntry[] {
  const meaningful = history.filter(
    (entry) => entry.type !== "action" && entry.type !== "month",
  );
  const source = meaningful.length > 0 ? meaningful : history;
  const ordered = source
    .map((entry, index) => ({ entry, index }))
    .sort(
      (left, right) =>
        left.entry.month - right.entry.month || left.index - right.index,
    )
    .map(({ entry }) => entry);

  if (ordered.length <= 6) return ordered;
  return [ordered[0], ...ordered.slice(-5)];
}

function fallbackBiography(game: GameState): string {
  const years = Math.max(
    1,
    Math.ceil(Math.max(1, game.calendar.completedMonths) / 12),
  );
  return `${game.band.name}共同走过了${years}年。这个旧版本存档没有保留完整的结局摘要，以下回顾根据仍可读取的生涯记录整理。`;
}

export function EndingExperience({
  game,
  onReturnHome,
  onRestart,
}: EndingExperienceProps) {
  const returnHomeRef = useRef<HTMLButtonElement>(null);
  const summary = game.endingSummary;
  const reason = summary?.reason ?? game.endingReason;
  const reasonLabel = reason
    ? ENDING_REASON_LABELS[reason]
    : "这段乐队生涯已经结束";
  const title = summary?.title.trim() || "乐队生涯档案";
  const biography = summary?.biography.trim() || fallbackBiography(game);
  const tags = Array.from(
    new Set(
      (summary?.tags ?? [])
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0),
    ),
  ).slice(0, 2);
  const visibleTags =
    tags.length > 0 ? tags : ["旧档迁移", "生涯回顾"];
  const members = resolveMembers(game);
  const representativeAlbum = selectRepresentativeAlbum(game);
  const keyPerformance = selectKeyPerformance(game);
  const timeline = selectTimeline(game.history);

  return (
    <Dialog
      open
      onClose={EMPTY_CLOSE}
      closeOnBackdrop={false}
      showCloseButton={false}
      initialFocusRef={returnHomeRef}
      title={`${game.band.name}生涯档案`}
      description="一段由排练、作品、舞台与选择共同写下的记录。"
      size="xl"
      className="ending-experience"
      footer={
        <div className="ending-experience__actions">
          {onRestart && (
            <Button
              variant="secondary"
              icon={
                <ArrowCounterClockwiseIcon
                  size={18}
                  weight="bold"
                  aria-hidden="true"
                />
              }
              onClick={onRestart}
            >
              重新组建乐队
            </Button>
          )}
          <Button
            ref={returnHomeRef}
            variant="primary"
            icon={<HouseIcon size={18} weight="bold" aria-hidden="true" />}
            onClick={onReturnHome}
          >
            返回首页
          </Button>
        </div>
      }
    >
      <article className="ending-experience__poster">
        <header className="ending-experience__hero">
          <div className="ending-experience__hero-copy">
            <span className="ending-experience__kicker">FINAL RECORD</span>
            <p className="ending-experience__band-name">{game.band.name}</p>
            <h3>{title}</h3>
            <div
              className="ending-experience__tags"
              aria-label="结局标签"
            >
              {visibleTags.map((tag) => (
                <StatusBadge key={tag} tone="accent" showIcon={false}>
                  {tag}
                </StatusBadge>
              ))}
            </div>
          </div>

          <div className="ending-experience__hero-record" aria-hidden="true">
            <VinylRecordIcon size={78} weight="thin" />
            <span>END</span>
          </div>

          <dl className="ending-experience__hero-meta">
            <div>
              <dt>结束原因</dt>
              <dd>
                <StatusBadge
                  tone={endingReasonTone(reason)}
                  showIcon={false}
                >
                  {reasonLabel}
                </StatusBadge>
              </dd>
            </div>
            <div>
              <dt>生涯长度</dt>
              <dd>{formatNumber(game.calendar.completedMonths)} 个月</dd>
            </div>
            <div>
              <dt>留下作品</dt>
              <dd>{formatNumber(game.releasedAlbums.length)} 张专辑</dd>
            </div>
            <div>
              <dt>完成演出</dt>
              <dd>{formatNumber(game.performanceRecords.length)} 场</dd>
            </div>
          </dl>
        </header>

        <section
          className="ending-experience__biography"
          aria-labelledby="ending-biography-title"
        >
          <div className="ending-experience__section-heading">
            <MusicNotesIcon size={20} weight="duotone" aria-hidden="true" />
            <div>
              <span>CAREER NOTES</span>
              <h3 id="ending-biography-title">生涯小传</h3>
            </div>
          </div>
          <p>{biography}</p>
        </section>

        <div className="ending-experience__spotlights">
          <section
            className="ending-experience__spotlight"
            aria-labelledby="ending-album-title"
          >
            <div className="ending-experience__section-heading">
              <VinylRecordIcon
                size={20}
                weight="duotone"
                aria-hidden="true"
              />
              <div>
                <span>ESSENTIAL ALBUM</span>
                <h3 id="ending-album-title">代表专辑</h3>
              </div>
            </div>
            {representativeAlbum ? (
              <div className="ending-experience__feature-card">
                <div
                  className="ending-experience__feature-mark"
                  aria-hidden="true"
                >
                  <VinylRecordIcon size={42} weight="thin" />
                </div>
                <div>
                  <strong>《{representativeAlbum.title}》</strong>
                  <p>{formatCareerMonth(representativeAlbum.releasedInMonth)}</p>
                  <ul aria-label="代表专辑数据">
                    <li>
                      <StarIcon size={14} weight="fill" aria-hidden="true" />
                      {representativeAlbum.quality.toFixed(1)} 星
                    </li>
                    <li>
                      {formatNumber(representativeAlbum.listeners)} 次首发收听
                    </li>
                  </ul>
                </div>
              </div>
            ) : (
              <p className="ending-experience__empty">
                没有留下正式专辑，但排练室里的声音仍被成员记得。
              </p>
            )}
          </section>

          <section
            className="ending-experience__spotlight"
            aria-labelledby="ending-performance-title"
          >
            <div className="ending-experience__section-heading">
              <MicrophoneStageIcon
                size={20}
                weight="duotone"
                aria-hidden="true"
              />
              <div>
                <span>DEFINING SHOW</span>
                <h3 id="ending-performance-title">关键演出</h3>
              </div>
            </div>
            {keyPerformance ? (
              <div className="ending-experience__feature-card">
                <div
                  className="ending-experience__feature-mark"
                  aria-hidden="true"
                >
                  <MicrophoneStageIcon size={42} weight="thin" />
                </div>
                <div>
                  <strong>{keyPerformance.title}</strong>
                  <p>{formatCareerMonth(keyPerformance.month)}</p>
                  <ul aria-label="关键演出数据">
                    <li>{keyPerformance.venueLevel} 级场地</li>
                    <li>
                      {PERFORMANCE_RATING_LABELS[keyPerformance.rating]}
                    </li>
                  </ul>
                </div>
              </div>
            ) : (
              <p className="ending-experience__empty">
                没有宏大的舞台，只有许多真实的排练与选择。
              </p>
            )}
          </section>
        </div>

        <section
          className="ending-experience__members"
          aria-labelledby="ending-members-title"
        >
          <div className="ending-experience__section-heading">
            <UsersThreeIcon size={20} weight="duotone" aria-hidden="true" />
            <div>
              <span>FINAL LINEUP</span>
              <h3 id="ending-members-title">五名成员最终状态</h3>
            </div>
          </div>
          <ol
            className="ending-experience__member-grid"
            aria-label="五名成员最终状态"
          >
            {members.map((member) => (
              <li
                key={member.memberId}
                className="ending-experience__member-card"
              >
                <header>
                  <span
                    className="ending-experience__member-initial"
                    aria-hidden="true"
                  >
                    {member.name.slice(0, 1) || "乐"}
                  </span>
                  <div>
                    <strong>{member.name}</strong>
                    <span>{ROLE_LABELS[member.role]}</span>
                  </div>
                </header>
                <p>{member.headline}</p>
                <div className="ending-experience__member-state">
                  <StatusBadge
                    tone={belongingTone(member.belonging)}
                    showIcon={false}
                  >
                    归属感 {member.belonging}
                  </StatusBadge>
                  <span>状态 {MEMBER_STATUS_LABELS[member.status]}</span>
                </div>
                <div
                  className="ending-experience__belonging"
                  role="meter"
                  aria-label={`${member.name}归属感`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={member.belonging}
                >
                  <span style={{ width: `${member.belonging}%` }} />
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section
          className="ending-experience__timeline-section"
          aria-labelledby="ending-timeline-title"
        >
          <div className="ending-experience__section-heading">
            <CalendarBlankIcon
              size={20}
              weight="duotone"
              aria-hidden="true"
            />
            <div>
              <span>SELECTED MOMENTS</span>
              <h3 id="ending-timeline-title">精选时间线</h3>
            </div>
          </div>
          {timeline.length > 0 ? (
            <ol className="ending-experience__timeline">
              {timeline.map((entry, index) => (
                <li key={`${entry.id}-${index}`}>
                  <div className="ending-experience__timeline-date">
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <time>{formatCareerMonth(entry.month)}</time>
                  </div>
                  <div className="ending-experience__timeline-copy">
                    <strong>{entry.title}</strong>
                    <p>{entry.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="ending-experience__empty">
              这份旧档案没有保留可读取的时间线。
            </p>
          )}
        </section>
      </article>
    </Dialog>
  );
}
