import {
  ArrowRightIcon,
  ClockCountdownIcon,
  CurrencyCnyIcon,
  EnvelopeOpenIcon,
  MicrophoneStageIcon,
  ReceiptIcon,
  VinylRecordIcon,
} from "@phosphor-icons/react";
import { Button, Dialog, StatusBadge } from "../components";
import type { GameState } from "../domain";

interface MonthOpportunityDialogProps {
  game: GameState;
  open: boolean;
  onClose: () => void;
  required?: boolean;
}

function formatCurrency(value: number): string {
  return `¥${Math.round(value).toLocaleString("zh-CN")}`;
}

export function countMonthOpportunities(game: GameState): number {
  return (
    game.month.performanceInvitations.length +
    game.month.commercialOffers.length +
    game.month.contractOffers.length
  );
}

export function MonthOpportunityDialog({
  game,
  open,
  onClose,
  required = false,
}: MonthOpportunityDialogProps) {
  const opportunityCount = countMonthOpportunities(game);
  const hasOpportunities = opportunityCount > 0;

  return (
    <Dialog
      open={open}
      onClose={required ? () => undefined : onClose}
      closeOnBackdrop={!required}
      showCloseButton={!required}
      title="本月机会"
      description={`第 ${game.calendar.year} 年 ${game.calendar.month} 月，机会台共收到 ${opportunityCount} 条新消息。`}
      size="lg"
      footer={
        <Button
          variant="primary"
          icon={<ArrowRightIcon size={18} weight="bold" aria-hidden="true" />}
          iconPosition="end"
          onClick={onClose}
        >
          {required ? "收下消息" : "返回工作台"}
        </Button>
      }
    >
      <div className="month-opportunity">
        <div className="month-opportunity__story">
          <EnvelopeOpenIcon size={24} weight="duotone" aria-hidden="true" />
          <p>
            {hasOpportunities
              ? "排练结束后，几条新消息同时亮了起来。有人想听你们登台，也有人开始认真谈合作。"
              : "排练室外依然安静，这个月没有新的邀约。你们可以把时间留给排练、创作和自己的计划。"}
          </p>
        </div>

        {hasOpportunities && (
          <div className="month-opportunity__list">
            {game.month.performanceInvitations.map((invitation) => (
              <article key={invitation.id}>
                <span className="month-opportunity__icon">
                  <MicrophoneStageIcon
                    size={21}
                    weight="duotone"
                    aria-hidden="true"
                  />
                </span>
                <div>
                  <div className="month-opportunity__heading">
                    <h3>{invitation.title}</h3>
                    <StatusBadge tone="accent">演出邀请</StatusBadge>
                  </div>
                  <p>
                    {invitation.venueName}发来正式邀约，固定报酬{" "}
                    {formatCurrency(invitation.fee)}，需要{" "}
                    {invitation.actionPointCost} 个行动点。
                  </p>
                  <small>前往“演出”查看现场风险与完整回报。</small>
                </div>
              </article>
            ))}

            {game.month.commercialOffers.map((offer) => (
              <article key={offer.id}>
                <span className="month-opportunity__icon">
                  <ReceiptIcon
                    size={21}
                    weight="duotone"
                    aria-hidden="true"
                  />
                </span>
                <div>
                  <div className="month-opportunity__heading">
                    <h3>{offer.title}</h3>
                    <StatusBadge tone="info">商业合作</StatusBadge>
                  </div>
                  <p>
                    {offer.description} 合作款为 {formatCurrency(offer.payout)}
                    。
                  </p>
                  <small>前往“经营”确认收益与关系影响。</small>
                </div>
              </article>
            ))}

            {game.month.contractOffers.map((offer) => (
              <article key={offer.id}>
                <span className="month-opportunity__icon">
                  <VinylRecordIcon
                    size={21}
                    weight="duotone"
                    aria-hidden="true"
                  />
                </span>
                <div>
                  <div className="month-opportunity__heading">
                    <h3>{offer.title}</h3>
                    <StatusBadge tone="warning">厂牌邀约</StatusBadge>
                  </div>
                  <p>
                    签约金 {formatCurrency(offer.signingBonus)}，合约期{" "}
                    {offer.durationMonths} 个月，需要交付{" "}
                    {offer.albumsRequired} 张专辑。
                  </p>
                  <small>前往“经营”阅读条款后再决定是否签约。</small>
                </div>
              </article>
            ))}
          </div>
        )}

        {game.activeContract && (
          <div className="month-opportunity__contract">
            <ClockCountdownIcon
              size={20}
              weight="duotone"
              aria-hidden="true"
            />
            <div>
              <strong>履约提醒</strong>
              <p>
                {game.activeContract.title}将在第{" "}
                {game.activeContract.deadlineMonth} 月截止，已经交付{" "}
                {game.activeContract.albumsDelivered}/
                {game.activeContract.albumsRequired} 张专辑。
              </p>
            </div>
            <CurrencyCnyIcon size={18} weight="duotone" aria-hidden="true" />
          </div>
        )}
      </div>
    </Dialog>
  );
}
