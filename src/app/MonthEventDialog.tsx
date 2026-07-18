import { useMemo, useState } from "react";
import {
  ArrowRightIcon,
  CalendarDotsIcon,
  CurrencyCnyIcon,
  HeartIcon,
  InfoIcon,
  SparkleIcon,
  TrendDownIcon,
  TrendUpIcon,
} from "@phosphor-icons/react";
import { ArtworkImage, Button, Dialog, StatusBadge } from "../components";
import { EVENTS, resolveEventArtwork } from "../data";
import type { EventContent, EventEffect, EventOutcome } from "../data/types";
import type { GameState } from "../domain";
import { useGameStore } from "../store";

interface MonthEventDialogProps {
  game: GameState;
}

function outcomeTone(tone: EventOutcome["tone"]) {
  if (tone === "positive") return "positive" as const;
  if (tone === "negative") return "danger" as const;
  return "info" as const;
}

function effectSummary(effect: EventEffect): string {
  switch (effect.type) {
    case "funds": {
      const sign = effect.amount > 0 ? "+" : effect.amount < 0 ? "-" : "";
      return `资金 ${sign}¥${Math.abs(effect.amount).toLocaleString("zh-CN")}`;
    }
    case "basePopularity":
      return `基础人气 ${effect.amount >= 0 ? "+" : ""}${effect.amount}`;
    case "memberStat": {
      const labels = {
        professional: "专业",
        creation: "创作",
        performance: "表现",
        heat: "热度",
        belonging: "归属感",
      };
      return `${labels[effect.stat]} ${effect.amount >= 0 ? "+" : ""}${
        effect.amount
      }`;
    }
    case "status":
      return `状态${effect.direction === "improve" ? "恢复" : "下降"} ${
        effect.steps
      } 级`;
    case "storyTag":
      return `${effect.operation === "add" ? "获得" : "解除"}剧情标签`;
  }
}

function eventIcon(event: EventContent) {
  if (event.pool === "life") {
    return <CalendarDotsIcon size={22} weight="duotone" aria-hidden="true" />;
  }
  if (event.pool === "member" || event.pool === "album") {
    return <HeartIcon size={22} weight="duotone" aria-hidden="true" />;
  }
  if (event.pool === "equipment") {
    return <InfoIcon size={22} weight="duotone" aria-hidden="true" />;
  }
  return <SparkleIcon size={22} weight="duotone" aria-hidden="true" />;
}

export function MonthEventDialog({ game }: MonthEventDialogProps) {
  const resolveEvent = useGameStore((state) => state.resolveEvent);
  const [resolvedOutcome, setResolvedOutcome] = useState<EventOutcome | null>(
    null,
  );
  const [resolvedEvent, setResolvedEvent] = useState<EventContent | null>(null);

  const event = useMemo(
    () => EVENTS.find((item) => item.id === game.pendingEvent) ?? null,
    [game.pendingEvent],
  );

  const displayEvent = event ?? resolvedEvent;
  const artwork = displayEvent ? resolveEventArtwork(displayEvent) : null;

  if (!displayEvent && !resolvedOutcome) {
    return null;
  }

  function choose(
    currentEvent: EventContent,
    choice: EventContent["choices"][number],
  ) {
    const result = resolveEvent({
      eventId: currentEvent.id,
      choiceId: choice.id,
    });
    if (result?.ok) {
      const outcome = choice.outcomes.find(
        (item) => item.id === result.record.outcomeId,
      );
      if (outcome) {
        setResolvedEvent(currentEvent);
        setResolvedOutcome(outcome);
      }
    }
  }

  return (
    <Dialog
      open
      onClose={() => undefined}
      closeOnBackdrop={false}
      showCloseButton={false}
      title={resolvedOutcome ? resolvedOutcome.title : event?.title}
      description={
        resolvedOutcome
          ? "选择已经产生结果。本事件不消耗行动点。"
          : "月初事件"
      }
      size="md"
      footer={
        resolvedOutcome ? (
          <Button
            variant="primary"
            icon={<ArrowRightIcon size={18} weight="bold" aria-hidden="true" />}
            iconPosition="end"
            onClick={() => {
              setResolvedOutcome(null);
              setResolvedEvent(null);
            }}
          >
            继续本月
          </Button>
        ) : undefined
      }
    >
      {artwork && (
        <ArtworkImage artwork={artwork} className="month-event__art" />
      )}
      {resolvedOutcome ? (
        <div className="month-event-result">
          <div className="month-event-result__headline">
            {resolvedOutcome.tone === "positive" ? (
              <TrendUpIcon size={24} weight="duotone" aria-hidden="true" />
            ) : resolvedOutcome.tone === "negative" ? (
              <TrendDownIcon size={24} weight="duotone" aria-hidden="true" />
            ) : (
              <InfoIcon size={24} weight="duotone" aria-hidden="true" />
            )}
            <p>{resolvedOutcome.text}</p>
          </div>
          <div className="month-event-effects">
            {resolvedOutcome.effects.length > 0 ? (
              resolvedOutcome.effects.map((effect, index) => (
                <StatusBadge
                  key={`${effect.type}-${index}`}
                  tone={outcomeTone(resolvedOutcome.tone)}
                  icon={
                    effect.type === "funds" ? (
                      <CurrencyCnyIcon size={14} aria-hidden="true" />
                    ) : undefined
                  }
                >
                  {effectSummary(effect)}
                </StatusBadge>
              ))
            ) : (
              <StatusBadge tone="neutral">没有数值变化</StatusBadge>
            )}
          </div>
        </div>
      ) : event ? (
        <div className="month-event">
          <div className="month-event__story">
            <span className="month-event__icon">{eventIcon(event)}</span>
            <p>{event.text}</p>
          </div>
          <div className="month-event__choices">
            {event.choices.map((choice) => (
              <button
                type="button"
                className="month-event-choice"
                key={choice.id}
                onClick={() => choose(event, choice)}
              >
                <strong>{choice.label}</strong>
                <span>{choice.hint}</span>
                <ArrowRightIcon size={17} weight="bold" aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </Dialog>
  );
}
