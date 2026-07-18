import {
  CalendarBlankIcon,
  CheckIcon,
  ClockCountdownIcon,
  FloppyDiskIcon,
  GuitarIcon,
  LightningIcon,
  MapPinIcon,
  MegaphoneIcon,
  MicrophoneStageIcon,
  ReceiptIcon,
  StarIcon,
  VinylRecordIcon,
  WalletIcon,
  WarningCircleIcon,
  WaveformIcon,
  XCircleIcon,
} from "@phosphor-icons/react";
import { useState, type ReactNode } from "react";
import { ArtworkImage, Button, Panel, StatusBadge } from "../../components";
import { VENUE_ARTWORK } from "../../data/artwork";
import {
  CAREER_VENUE_LEVELS,
  EQUIPMENT_CATALOG,
} from "../../data/career";
import {
  estimatePerformanceRisk,
  selectAbsoluteMonth,
  selectBandAttributes,
  type EquipmentSlot,
  type EquipmentTier,
  type GameState,
  type PerformancePlan,
  type PerformanceRating,
} from "../../domain";
import { useGameStore } from "../../store";
import "./career-panels.css";

const RATING_LABELS: Readonly<Record<PerformanceRating, string>> = {
  accident: "演出事故",
  barelyCompleted: "勉强完成",
  steady: "稳定发挥",
  crowdIgnited: "全场沸腾",
  legendary: "传奇现场",
};

const EQUIPMENT_TIER_LABELS: Readonly<Record<EquipmentTier, string>> = {
  starter: "入门",
  advanced: "进阶",
  professional: "专业",
  top: "顶级",
};

const EQUIPMENT_TIER_ORDER: readonly EquipmentTier[] = [
  "starter",
  "advanced",
  "professional",
  "top",
];

const EQUIPMENT_SLOT_ICONS: Readonly<Record<EquipmentSlot, ReactNode>> = {
  guitar: <GuitarIcon size={22} weight="duotone" aria-hidden="true" />,
  pedals: <WaveformIcon size={22} weight="duotone" aria-hidden="true" />,
  amplifier: <MegaphoneIcon size={22} weight="duotone" aria-hidden="true" />,
};

function formatCurrency(value: number): string {
  const sign = value < 0 ? "-" : "";
  return `${sign}¥${Math.abs(value).toLocaleString("zh-CN")}`;
}

function formatSigned(value: number): string {
  return `${value > 0 ? "+" : ""}${value}`;
}

function riskTone(label: "稳妥" | "有风险" | "很难") {
  if (label === "稳妥") return "positive" as const;
  if (label === "有风险") return "warning" as const;
  return "danger" as const;
}

function ratingTone(rating: PerformanceRating) {
  if (rating === "legendary" || rating === "crowdIgnited") {
    return "positive" as const;
  }
  if (rating === "accident") return "danger" as const;
  if (rating === "barelyCompleted") return "warning" as const;
  return "info" as const;
}

function invitationPlan(
  invitation: GameState["month"]["performanceInvitations"][number],
): PerformancePlan {
  return {
    kind: "invited",
    invitationId: invitation.id,
    venueId: invitation.venueId,
    venueLevel: invitation.venueLevel,
    fee: invitation.fee,
    basePopularity: invitation.basePopularity,
    actionPointCost: invitation.actionPointCost,
    title: invitation.title,
  };
}

function selfOrganizedPlan(
  venue: (typeof CAREER_VENUE_LEVELS)[number],
): PerformancePlan | null {
  if (!venue.selfHosted.available) return null;

  return {
    kind: "selfOrganized",
    venueId: venue.id,
    venueLevel: venue.level,
    fee: venue.selfHosted.stableRevenue,
    basePopularity: venue.basePopularityGain,
    upfrontCost: venue.selfHosted.upfrontCost,
    actionPointCost: venue.actionPointCost,
    title: `${venue.name}自主演出`,
  };
}

function performanceDisabledReason(
  game: GameState,
  plan: PerformancePlan,
): string | null {
  if (game.status !== "active") return "乐队生涯已经结束";
  if (game.month.usedActions.includes("performance")) {
    return "本月已经执行过演出行动";
  }
  if (
    game.month.actionPointsRemaining <
    (plan.actionPointCost ?? 2)
  ) {
    return "本月剩余行动点不足";
  }
  if (plan.venueLevel > game.band.unlockedVenueLevel) {
    return "该级别场地尚未解锁";
  }
  if ((plan.upfrontCost ?? 0) > game.band.funds) {
    return "公共资金不足以支付前期投入";
  }
  return null;
}

function PlanRisk({
  game,
  plan,
}: {
  game: GameState;
  plan: PerformancePlan;
}) {
  const risk = estimatePerformanceRisk(game, plan);

  return (
    <div className="career-risk" data-tone={riskTone(risk.label)}>
      <span>当前计划风险</span>
      <StatusBadge tone={riskTone(risk.label)}>{risk.label}</StatusBadge>
      <span className="career-risk__difference">
        预计差值 {formatSigned(risk.difference)}
      </span>
    </div>
  );
}

function RouteCondition({
  met,
  children,
}: {
  met: boolean;
  children: ReactNode;
}) {
  return (
    <li data-met={met}>
      <span className="career-condition__icon" aria-hidden="true">
        {met ? (
          <CheckIcon size={13} weight="bold" />
        ) : (
          <XCircleIcon size={13} weight="bold" />
        )}
      </span>
      <span>{children}</span>
    </li>
  );
}

export interface CareerPerformancePanelProps {
  game: GameState;
  onPerform: (plan: PerformancePlan) => void;
  onMessage: (message: string) => void;
}

export function CareerPerformancePanel({
  game,
  onPerform,
  onMessage,
}: CareerPerformancePanelProps) {
  const currentMonth = selectAbsoluteMonth(game);
  const attributes = selectBandAttributes(game);
  const roundedPopularity = Math.round(attributes.popularity);
  const invitedPlans = game.month.performanceInvitations.map((invitation) => ({
    invitation,
    plan: invitationPlan(invitation),
  }));
  const selfHostedVenues = CAREER_VENUE_LEVELS.filter(
    (venue) => venue.level <= 3,
  );
  const records = [...game.performanceRecords].reverse();

  function submitPlan(plan: PerformancePlan) {
    const disabledReason = performanceDisabledReason(game, plan);
    if (disabledReason) {
      onMessage(disabledReason);
      return;
    }

    onPerform(plan);
  }

  return (
    <div className="career-stack" data-genre={game.band.genre}>
      <header className="career-page-heading">
        <div>
          <p className="career-kicker">LIVE DESK</p>
          <h2>演出与场地成长</h2>
          <p>
            邀请在月初写入当前存档。每张卡片都按具体场地、设备、状态和演出方式计算风险。
          </p>
        </div>
        <div className="career-page-heading__status">
          <StatusBadge tone="accent">
            已解锁 {game.band.unlockedVenueLevel} 级场地
          </StatusBadge>
          <span>综合人气 {roundedPopularity}</span>
        </div>
      </header>

      <section aria-labelledby="career-invitations-title">
        <div className="career-section-heading">
          <div>
            <p className="career-kicker">MONTHLY INVITATIONS</p>
            <h3 id="career-invitations-title">本月持久化邀请</h3>
          </div>
          <StatusBadge tone={invitedPlans.length > 0 ? "info" : "neutral"}>
            {invitedPlans.length} 项
          </StatusBadge>
        </div>

        {invitedPlans.length === 0 ? (
          <div className="career-empty">
            <MicrophoneStageIcon size={24} weight="duotone" aria-hidden="true" />
            <div>
              <strong>本月没有收到正式演出邀请</strong>
              <p>可以查看下方已解锁的自主演出方案。</p>
            </div>
          </div>
        ) : (
          <div className="career-card-grid">
            {invitedPlans.map(({ invitation, plan }) => {
              const disabledReason = performanceDisabledReason(game, plan);
              const expired = invitation.expiresAtMonth < currentMonth;

              return (
                <article className="career-offer-card" key={invitation.id}>
                  <div className="career-offer-card__topline">
                    <StatusBadge tone="accent">
                      {invitation.venueLevel} 级邀请
                    </StatusBadge>
                    <span>
                      <ClockCountdownIcon
                        size={14}
                        weight="bold"
                        aria-hidden="true"
                      />
                      第 {invitation.expiresAtMonth} 月截止
                    </span>
                  </div>
                  <ArtworkImage
                    artwork={VENUE_ARTWORK[invitation.venueLevel]}
                    className="career-venue-art career-venue-art--offer"
                  />
                  <div className="career-offer-card__title">
                    <span className="career-offer-card__icon">
                      <MicrophoneStageIcon
                        size={25}
                        weight="duotone"
                        aria-hidden="true"
                      />
                    </span>
                    <div>
                      <h4>{invitation.title}</h4>
                      <p>
                        <MapPinIcon
                          size={14}
                          weight="bold"
                          aria-hidden="true"
                        />
                        {invitation.venueName}
                      </p>
                    </div>
                  </div>
                  <dl className="career-metrics">
                    <div>
                      <dt>固定报酬</dt>
                      <dd>{formatCurrency(invitation.fee)}</dd>
                    </div>
                    <div>
                      <dt>行动点</dt>
                      <dd>{invitation.actionPointCost} AP</dd>
                    </div>
                    <div>
                      <dt>基础人气</dt>
                      <dd>+{invitation.basePopularity}</dd>
                    </div>
                    <div>
                      <dt>场地难度</dt>
                      <dd>{invitation.difficulty}</dd>
                    </div>
                  </dl>
                  <PlanRisk game={game} plan={plan} />
                  <Button
                    variant="primary"
                    fullWidth
                    icon={
                      <LightningIcon
                        size={17}
                        weight="bold"
                        aria-hidden="true"
                      />
                    }
                    onClick={() => submitPlan(plan)}
                    disabled={Boolean(disabledReason) || expired}
                    title={expired ? "邀请已经过期" : disabledReason ?? undefined}
                    aria-label={`接受${invitation.title}`}
                  >
                    {expired ? "邀请已过期" : "接受并演出"}
                  </Button>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <Panel
        title="五级场地路线"
        eyebrow="VENUE LADDER"
        description="场地解锁永久保留。当前条件用于解释下一阶段还缺少什么。"
        accent
        bodyClassName="career-route-panel"
      >
        <ol className="career-route">
          {CAREER_VENUE_LEVELS.map((venue) => {
            const unlocked = venue.level <= game.band.unlockedVenueLevel;
            const milestoneMet =
              venue.unlock.requiredExcellentPerformanceLevel === null ||
              (venue.unlock.requiredExcellentPerformanceLevel === 3
                ? game.performanceMilestones.excellentLevel3
                : game.performanceMilestones.excellentLevel4);

            return (
              <li
                className="career-route__stop"
                data-unlocked={unlocked}
                key={venue.id}
              >
                <div className="career-route__marker">
                  <span>{venue.level}</span>
                </div>
                <ArtworkImage
                  artwork={VENUE_ARTWORK[venue.level]}
                  className="career-venue-art career-venue-art--route"
                  decorative
                  sizes="(max-width: 48rem) calc(100vw - 7rem), 128px"
                />
                <div className="career-route__content">
                  <div>
                    <h4>{venue.name}</h4>
                    <StatusBadge tone={unlocked ? "positive" : "neutral"}>
                      {unlocked ? "已永久解锁" : "尚未解锁"}
                    </StatusBadge>
                  </div>
                  <p>{venue.unlock.description}</p>
                  <ul className="career-conditions">
                    <RouteCondition
                      met={roundedPopularity >= venue.unlock.minPopularity}
                    >
                      综合人气 {venue.unlock.minPopularity}
                    </RouteCondition>
                    <RouteCondition
                      met={
                        game.releasedAlbums.length >=
                        venue.unlock.minReleasedAlbums
                      }
                    >
                      已发行专辑 {venue.unlock.minReleasedAlbums} 张
                    </RouteCondition>
                    {venue.unlock.requiredExcellentPerformanceLevel !== null && (
                      <RouteCondition met={milestoneMet}>
                        优秀
                        {venue.unlock.requiredExcellentPerformanceLevel}
                        级演出里程碑
                      </RouteCondition>
                    )}
                  </ul>
                </div>
              </li>
            );
          })}
        </ol>
      </Panel>

      <section aria-labelledby="career-self-hosted-title">
        <div className="career-section-heading">
          <div>
            <p className="career-kicker">SELF HOSTED</p>
            <h3 id="career-self-hosted-title">一至三级自主演出</h3>
          </div>
          <span className="career-section-note">
            风险高一级，人气收益提高 20%
          </span>
        </div>
        <div className="career-card-grid">
          {selfHostedVenues.map((venue) => {
            const plan = selfOrganizedPlan(venue);
            if (!plan) return null;
            const disabledReason = performanceDisabledReason(game, plan);
            const unlocked = venue.level <= game.band.unlockedVenueLevel;

            return (
              <article
                className="career-self-card"
                data-locked={!unlocked}
                key={venue.id}
              >
                <ArtworkImage
                  artwork={VENUE_ARTWORK[venue.level]}
                  className="career-venue-art career-venue-art--self"
                />
                <div className="career-self-card__header">
                  <span>{venue.level}</span>
                  <div>
                    <h4>{venue.name}</h4>
                    <p>{unlocked ? "当前可安排" : venue.unlock.description}</p>
                  </div>
                </div>
                <dl className="career-metrics">
                  <div>
                    <dt>前期投入</dt>
                    <dd>{formatCurrency(plan.upfrontCost ?? 0)}</dd>
                  </div>
                  <div>
                    <dt>稳定预计回款</dt>
                    <dd>{formatCurrency(plan.fee)}</dd>
                  </div>
                  <div>
                    <dt>行动点</dt>
                    <dd>{plan.actionPointCost} AP</dd>
                  </div>
                  <div>
                    <dt>人气基础</dt>
                    <dd>+{plan.basePopularity}</dd>
                  </div>
                </dl>
                <PlanRisk game={game} plan={plan} />
                <Button
                  variant={unlocked ? "secondary" : "ghost"}
                  fullWidth
                  icon={
                    <ReceiptIcon
                      size={17}
                      weight="bold"
                      aria-hidden="true"
                    />
                  }
                  onClick={() => submitPlan(plan)}
                  disabled={Boolean(disabledReason)}
                  title={disabledReason ?? undefined}
                  aria-label={`安排${venue.name}自主演出`}
                >
                  {unlocked ? "投入并举办" : "场地未解锁"}
                </Button>
              </article>
            );
          })}
        </div>
      </section>

      <Panel
        title="结构化演出履历"
        eyebrow="LIVE ARCHIVE"
        description="评价、收益、投入、人气变化与优秀演出里程碑均从结算记录读取。"
        bodyClassName="career-history-panel"
      >
        {records.length === 0 ? (
          <div className="career-empty career-empty--compact">
            <StarIcon size={22} weight="duotone" aria-hidden="true" />
            <div>
              <strong>还没有正式演出记录</strong>
              <p>完成第一次演出后，现场结果会保存在这里。</p>
            </div>
          </div>
        ) : (
          <div className="career-performance-history">
            {records.map((record) => (
              <article key={record.id}>
                <ArtworkImage
                  artwork={VENUE_ARTWORK[record.venueLevel]}
                  className="career-venue-art career-venue-art--history"
                  decorative
                  sizes="(max-width: 48rem) calc(100vw - 3rem), 88px"
                />
                <div className="career-performance-history__date">
                  <span>第 {record.month} 月</span>
                  <strong>{record.venueLevel} 级</strong>
                </div>
                <div className="career-performance-history__main">
                  <div>
                    <h4>{record.title}</h4>
                    <StatusBadge tone={ratingTone(record.rating)}>
                      {RATING_LABELS[record.rating]}
                    </StatusBadge>
                    {record.excellent && (
                      <StatusBadge tone="accent">优秀演出</StatusBadge>
                    )}
                  </div>
                  <p>
                    {record.kind === "invited" ? "受邀演出" : "自主演出"}
                    ，结算差值 {formatSigned(record.difference)}
                  </p>
                </div>
                <dl className="career-performance-history__numbers">
                  <div>
                    <dt>演出报酬</dt>
                    <dd>{formatCurrency(record.grossPayment)}</dd>
                  </div>
                  <div>
                    <dt>前期投入</dt>
                    <dd>{formatCurrency(record.upfrontCost)}</dd>
                  </div>
                  <div>
                    <dt>净收益</dt>
                    <dd>{formatCurrency(record.netPayment)}</dd>
                  </div>
                  <div>
                    <dt>人气</dt>
                    <dd>{formatSigned(record.popularityChange)}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

function financialStatus(game: GameState): {
  label: string;
  tone: "positive" | "warning" | "danger";
} {
  if (game.financialCrisis.active) {
    return {
      label: `财务危机剩余 ${game.financialCrisis.monthsRemaining} 个月`,
      tone: "danger",
    };
  }
  if (game.band.funds < -10_000) {
    return { label: "债务压力", tone: "danger" };
  }
  if (game.band.funds < 0) {
    return { label: "资金紧张", tone: "warning" };
  }
  return { label: "账户正常", tone: "positive" };
}

function equipmentOption(slot: EquipmentSlot, tier: EquipmentTier) {
  return EQUIPMENT_CATALOG.find(
    (option) => option.slot === slot && option.tier === tier,
  );
}

export interface CareerManagementPanelProps {
  game: GameState;
  onMessage: (message: string) => void;
  onSave: () => void;
  onEndCareer?: () => void;
}

export function CareerManagementPanel({
  game,
  onMessage,
  onSave,
  onEndCareer,
}: CareerManagementPanelProps) {
  const acceptCommercialOffer = useGameStore(
    (state) => state.acceptCommercialOffer,
  );
  const declineCommercialOffer = useGameStore(
    (state) => state.declineCommercialOffer,
  );
  const signContract = useGameStore((state) => state.signContract);
  const declineContractOffer = useGameStore(
    (state) => state.declineContractOffer,
  );
  const buyEquipment = useGameStore((state) => state.buyEquipment);
  const sellEquipment = useGameStore((state) => state.sellEquipment);
  const endCareer = useGameStore((state) => state.endCareer);
  const [confirmingEnd, setConfirmingEnd] = useState(false);
  const status = financialStatus(game);
  const currentMonth = selectAbsoluteMonth(game);
  const equipmentSlots = Object.keys(game.equipment) as EquipmentSlot[];

  function reportMutation(
    result:
      | ReturnType<typeof acceptCommercialOffer>
      | ReturnType<typeof buyEquipment>,
  ) {
    if (!result) {
      onMessage("当前没有可操作的游戏状态。");
      return;
    }
    onMessage(result.ok ? result.message : result.error);
  }

  function finishCareer() {
    if (onEndCareer) {
      onEndCareer();
    } else {
      endCareer();
    }
    setConfirmingEnd(false);
    onMessage("乐队生涯已主动结束。");
  }

  return (
    <div className="career-stack" data-genre={game.band.genre}>
      <header className="career-page-heading">
        <div>
          <p className="career-kicker">MANAGEMENT DESK</p>
          <h2>经营、合约与设备</h2>
          <p>所有收入和支出进入公共账户。商业与设备操作不消耗行动点。</p>
        </div>
        <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
      </header>

      <div className="career-management-summary">
        <Panel
          title="公共账户"
          eyebrow="BAND FUNDS"
          accent
          footer={
            <div className="career-panel-footer">
              <span>每月固定运营费</span>
              <strong>{formatCurrency(1_000)}</strong>
            </div>
          }
        >
          <div className="career-balance">
            <span>当前余额</span>
            <strong>{formatCurrency(game.band.funds)}</strong>
            <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
          </div>
          <dl className="career-account-details">
            <div>
              <dt>连续负余额</dt>
              <dd>{game.financialCrisis.consecutiveNegativeMonths} 个月</dd>
            </div>
            <div>
              <dt>恢复目标</dt>
              <dd>余额回到 ¥0 以上</dd>
            </div>
          </dl>
          {game.financialCrisis.active && (
            <div className="career-crisis-note" role="alert">
              <WarningCircleIcon
                size={20}
                weight="fill"
                aria-hidden="true"
              />
              <p>
                到期仍未恢复将触发债务解散。付费行动和设备购买仍要求当前余额足够。
              </p>
            </div>
          )}
        </Panel>

        <Panel
          title="发行状态"
          eyebrow="RECORD CONTRACT"
          bodyClassName="career-contract-status"
        >
          {game.activeContract ? (
            <>
              <div className="career-contract-title">
                <span className="career-offer-card__icon">
                  <VinylRecordIcon
                    size={24}
                    weight="duotone"
                    aria-hidden="true"
                  />
                </span>
                <div>
                  <StatusBadge tone="accent">合约生效中</StatusBadge>
                  <h3>{game.activeContract.title}</h3>
                </div>
              </div>
              <dl className="career-account-details">
                <div>
                  <dt>发行义务</dt>
                  <dd>
                    {game.activeContract.albumsDelivered}/
                    {game.activeContract.albumsRequired} 张
                  </dd>
                </div>
                <div>
                  <dt>截止月份</dt>
                  <dd>第 {game.activeContract.deadlineMonth} 月</dd>
                </div>
                <div>
                  <dt>制作成本</dt>
                  <dd>
                    {Math.round(
                      game.activeContract.productionCostMultiplier * 100,
                    )}
                    %
                  </dd>
                </div>
                <div>
                  <dt>乐队分成</dt>
                  <dd>
                    {Math.round(game.activeContract.revenueShare * 100)}%
                  </dd>
                </div>
              </dl>
              <p className="career-contract-deadline">
                <ClockCountdownIcon
                  size={16}
                  weight="bold"
                  aria-hidden="true"
                />
                距离截止还有{" "}
                {Math.max(0, game.activeContract.deadlineMonth - currentMonth)}
                {" "}个月。违约将返还签约金并降低基础人气。
              </p>
            </>
          ) : (
            <div className="career-independent">
              <StatusBadge tone="positive">独立发行</StatusBadge>
              <h3>乐队保留 100% 发行回款</h3>
              <p>当前没有生效中的唱片合约，也没有发行期限。</p>
            </div>
          )}
        </Panel>
      </div>

      <section aria-labelledby="career-commercial-title">
        <div className="career-section-heading">
          <div>
            <p className="career-kicker">COMMERCIAL OFFERS</p>
            <h3 id="career-commercial-title">商业合作</h3>
          </div>
          <span className="career-section-note">接受或拒绝均不消耗 AP</span>
        </div>
        {game.month.commercialOffers.length === 0 ? (
          <div className="career-empty career-empty--compact">
            <ReceiptIcon size={22} weight="duotone" aria-hidden="true" />
            <div>
              <strong>本月没有商业合作</strong>
              <p>机会会根据人气、专辑和生涯阶段出现。</p>
            </div>
          </div>
        ) : (
          <div className="career-card-grid">
            {game.month.commercialOffers.map((offer) => (
              <article className="career-offer-card" key={offer.id}>
                <div className="career-offer-card__topline">
                  <StatusBadge tone="info">商业机会</StatusBadge>
                  <span>第 {offer.expiresAtMonth} 月截止</span>
                </div>
                <h4>{offer.title}</h4>
                <p className="career-offer-card__description">
                  {offer.description}
                </p>
                <dl className="career-metrics">
                  <div>
                    <dt>合作收入</dt>
                    <dd>{formatCurrency(offer.payout)}</dd>
                  </div>
                  <div>
                    <dt>基础人气</dt>
                    <dd>{formatSigned(offer.popularityGain)}</dd>
                  </div>
                  <div>
                    <dt>全员归属感</dt>
                    <dd>{formatSigned(offer.belongingChange)}</dd>
                  </div>
                </dl>
                <div className="career-button-row">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() =>
                      reportMutation(acceptCommercialOffer(offer.id))
                    }
                    disabled={
                      game.status !== "active" ||
                      offer.expiresAtMonth < currentMonth
                    }
                    aria-label={`接受${offer.title}`}
                  >
                    接受合作
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      reportMutation(declineCommercialOffer(offer.id))
                    }
                    disabled={
                      game.status !== "active" ||
                      offer.expiresAtMonth < currentMonth
                    }
                    aria-label={`拒绝${offer.title}`}
                  >
                    婉拒
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="career-contract-offers-title">
        <div className="career-section-heading">
          <div>
            <p className="career-kicker">LABEL OFFERS</p>
            <h3 id="career-contract-offers-title">厂牌邀约</h3>
          </div>
          {game.activeContract && (
            <StatusBadge tone="warning">已有合约，不能重复签约</StatusBadge>
          )}
        </div>
        {game.month.contractOffers.length === 0 ? (
          <div className="career-empty career-empty--compact">
            <VinylRecordIcon size={22} weight="duotone" aria-hidden="true" />
            <div>
              <strong>本月没有新的厂牌邀约</strong>
              <p>已发行作品和综合人气会影响厂牌出现。</p>
            </div>
          </div>
        ) : (
          <div className="career-card-grid">
            {game.month.contractOffers.map((offer) => (
              <article className="career-contract-offer" key={offer.id}>
                <div>
                  <StatusBadge
                    tone={offer.kind === "majorLabel" ? "accent" : "info"}
                  >
                    {offer.kind === "majorLabel" ? "大型唱片公司" : "小型厂牌"}
                  </StatusBadge>
                  <h4>{offer.title}</h4>
                </div>
                <dl className="career-metrics">
                  <div>
                    <dt>签约金</dt>
                    <dd>{formatCurrency(offer.signingBonus)}</dd>
                  </div>
                  <div>
                    <dt>期限</dt>
                    <dd>{offer.durationMonths} 个月</dd>
                  </div>
                  <div>
                    <dt>发行义务</dt>
                    <dd>{offer.albumsRequired} 张</dd>
                  </div>
                  <div>
                    <dt>邀约截止</dt>
                    <dd>第 {offer.expiresAtMonth} 月</dd>
                  </div>
                </dl>
                <p className="career-contract-warning">
                  未按时发行需要返还签约金，并降低基础人气。
                </p>
                <div className="career-button-row">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => reportMutation(signContract(offer.id))}
                    disabled={
                      game.status !== "active" ||
                      Boolean(game.activeContract) ||
                      offer.expiresAtMonth < currentMonth
                    }
                    aria-label={`签署${offer.title}`}
                  >
                    签署合约
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      reportMutation(declineContractOffer(offer.id))
                    }
                    disabled={
                      game.status !== "active" ||
                      offer.expiresAtMonth < currentMonth
                    }
                    aria-label={`拒绝${offer.title}`}
                  >
                    继续观望
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <Panel
        title="主角设备链"
        eyebrow="EQUIPMENT"
        description="三个槽位独立升级。换装自动按旧设备原价 50% 折价，出售后恢复入门设备。"
        bodyClassName="career-equipment-grid"
      >
        {equipmentSlots.map((slot) => {
          const currentTier = game.equipment[slot];
          const current = equipmentOption(slot, currentTier);
          if (!current) return null;
          const currentIndex = EQUIPMENT_TIER_ORDER.indexOf(currentTier);
          const nextTier = EQUIPMENT_TIER_ORDER[currentIndex + 1] as
            | Exclude<EquipmentTier, "starter">
            | undefined;
          const next = nextTier ? equipmentOption(slot, nextTier) : undefined;
          const tradeIn = Math.round(current.price * 0.5);
          const amountDue = next ? next.price - tradeIn : 0;
          const refund = Math.round(current.price * 0.5);

          return (
            <article className="career-equipment-card" key={slot}>
              <div className="career-equipment-card__heading">
                <span>{EQUIPMENT_SLOT_ICONS[slot]}</span>
                <div>
                  <p>{current.slotLabel}</p>
                  <h4>{current.displayName}</h4>
                </div>
                <StatusBadge tone="accent">
                  {EQUIPMENT_TIER_LABELS[currentTier]}
                </StatusBadge>
              </div>
              <dl className="career-equipment-bonuses">
                <div>
                  <dt>专辑判定</dt>
                  <dd>+{current.hiddenModifiers.albumCheckBonus}</dd>
                </div>
                <div>
                  <dt>演出判定</dt>
                  <dd>+{current.hiddenModifiers.performanceCheckBonus}</dd>
                </div>
                <div>
                  <dt>训练判定</dt>
                  <dd>+{current.hiddenModifiers.trainingCheckBonus}</dd>
                </div>
              </dl>
          {next && nextTier ? (
                <div className="career-upgrade-preview">
                  <span>下一档</span>
                  <strong>{next.displayName}</strong>
                  <small>
                    标价 {formatCurrency(next.price)}，旧设备折价{" "}
                    {formatCurrency(tradeIn)}
                  </small>
                  <Button
                    variant="primary"
                    size="sm"
                    fullWidth
                    onClick={() =>
                      reportMutation(buyEquipment(slot, nextTier))
                    }
                    disabled={
                      game.status !== "active" || game.band.funds < amountDue
                    }
                    title={
                      game.band.funds < amountDue
                        ? "公共资金不足"
                        : undefined
                    }
                    aria-label={`将${current.slotLabel}升级到${next.tierLabel}`}
                  >
                    换装，实付 {formatCurrency(amountDue)}
                  </Button>
                </div>
              ) : (
                <div className="career-top-tier">
                  <StarIcon size={18} weight="fill" aria-hidden="true" />
                  已达到顶级设备
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                fullWidth
                onClick={() => reportMutation(sellEquipment(slot))}
                disabled={currentTier === "starter" || game.status !== "active"}
                aria-label={`出售当前${current.slotLabel}`}
              >
                {currentTier === "starter"
                  ? "入门设备不可出售"
                  : `出售并回款 ${formatCurrency(refund)}`}
              </Button>
            </article>
          );
        })}
      </Panel>

      <div className="career-management-actions">
        <Panel
          title="本地存档"
          eyebrow="SAVE"
          description="每满 12 个月会自动保存，也可以随时覆盖当前唯一存档。"
          variant="inset"
          action={
            <Button
              size="sm"
              icon={
                <FloppyDiskIcon
                  size={17}
                  weight="bold"
                  aria-hidden="true"
                />
              }
              onClick={onSave}
            >
              手动保存
            </Button>
          }
        >
          <p className="career-action-copy">
            <WalletIcon size={18} weight="duotone" aria-hidden="true" />
            存档保存在当前浏览器中，刷新后可以继续。
          </p>
        </Panel>

        <Panel
          title="主动结束生涯"
          eyebrow="CAREER CONTROL"
          description="结束后会根据真实专辑、演出、成员和资金生成最终总结。"
          variant="inset"
          action={
            !confirmingEnd ? (
              <Button
                variant="danger"
                size="sm"
                icon={
                  <WarningCircleIcon
                    size={17}
                    weight="bold"
                    aria-hidden="true"
                  />
                }
                onClick={() => setConfirmingEnd(true)}
                disabled={game.status !== "active"}
              >
                结束生涯
              </Button>
            ) : undefined
          }
        >
          {confirmingEnd ? (
            <div className="career-end-confirmation" role="alert">
              <WarningCircleIcon
                size={22}
                weight="fill"
                aria-hidden="true"
              />
              <div>
                <strong>确认立即结束当前乐队生涯吗？</strong>
                <p>这个操作会进入正式结局，之后不能继续当前月份。</p>
              </div>
              <div className="career-button-row">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={finishCareer}
                >
                  确认结束
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmingEnd(false)}
                >
                  继续经营
                </Button>
              </div>
            </div>
          ) : (
            <p className="career-action-copy">
              <CalendarBlankIcon
                size={18}
                weight="duotone"
                aria-hidden="true"
              />
              当前为第 {currentMonth} 月，最长生涯为 240 个月。
            </p>
          )}
        </Panel>
      </div>
    </div>
  );
}
