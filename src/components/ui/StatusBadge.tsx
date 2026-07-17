import type { ReactNode } from "react";
import {
  CheckCircleIcon,
  InfoIcon,
  MinusCircleIcon,
  SparkleIcon,
  WarningCircleIcon,
  XCircleIcon
} from "@phosphor-icons/react";
import { classNames } from "./classNames";

export type StatusTone =
  | "neutral"
  | "accent"
  | "positive"
  | "warning"
  | "danger"
  | "info";

export interface StatusBadgeProps {
  children: ReactNode;
  tone?: StatusTone;
  icon?: ReactNode;
  showIcon?: boolean;
  className?: string;
}

function defaultIcon(tone: StatusTone): ReactNode {
  const iconProps = { size: 14, weight: "bold" as const, "aria-hidden": true };

  switch (tone) {
    case "accent":
      return <SparkleIcon {...iconProps} />;
    case "positive":
      return <CheckCircleIcon {...iconProps} />;
    case "warning":
      return <WarningCircleIcon {...iconProps} />;
    case "danger":
      return <XCircleIcon {...iconProps} />;
    case "info":
      return <InfoIcon {...iconProps} />;
    default:
      return <MinusCircleIcon {...iconProps} />;
  }
}

export function StatusBadge({
  children,
  tone = "neutral",
  icon,
  showIcon = true,
  className
}: StatusBadgeProps) {
  return (
    <span
      className={classNames("bb-status", className)}
      data-tone={tone}
    >
      {showIcon && (icon ?? defaultIcon(tone))}
      <span>{children}</span>
    </span>
  );
}
