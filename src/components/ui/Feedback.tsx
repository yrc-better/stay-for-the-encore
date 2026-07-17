import type { ReactNode } from "react";
import {
  CheckCircleIcon,
  InfoIcon,
  SparkleIcon,
  WarningCircleIcon,
  XIcon,
  XCircleIcon
} from "@phosphor-icons/react";
import { Button } from "./Button";
import type { StatusTone } from "./StatusBadge";
import { classNames } from "./classNames";

export interface FeedbackChange {
  label: ReactNode;
  value: ReactNode;
  direction?: "up" | "down" | "neutral";
}

export interface FeedbackProps {
  title: ReactNode;
  description?: ReactNode;
  tone?: StatusTone;
  icon?: ReactNode;
  changes?: FeedbackChange[];
  action?: ReactNode;
  role?: "status" | "alert";
  className?: string;
}

export interface ToastProps extends Omit<FeedbackProps, "action"> {
  onDismiss?: () => void;
  dismissLabel?: string;
}

function feedbackIcon(tone: StatusTone): ReactNode {
  const iconProps = { size: 20, weight: "fill" as const, "aria-hidden": true };

  switch (tone) {
    case "accent":
      return <SparkleIcon {...iconProps} />;
    case "positive":
      return <CheckCircleIcon {...iconProps} />;
    case "warning":
      return <WarningCircleIcon {...iconProps} />;
    case "danger":
      return <XCircleIcon {...iconProps} />;
    default:
      return <InfoIcon {...iconProps} />;
  }
}

export function Feedback({
  title,
  description,
  tone = "info",
  icon,
  changes,
  action,
  role,
  className
}: FeedbackProps) {
  return (
    <div
      className={classNames("bb-feedback", className)}
      data-tone={tone}
      role={role}
    >
      <span className="bb-feedback__icon">
        {icon ?? feedbackIcon(tone)}
      </span>
      <div className="bb-feedback__content">
        <p className="bb-feedback__title">{title}</p>
        {description && (
          <p className="bb-feedback__description">{description}</p>
        )}
        {changes && changes.length > 0 && (
          <ul className="bb-feedback__changes">
            {changes.map((change, index) => (
              <li
                className="bb-feedback__change"
                data-direction={change.direction ?? "neutral"}
                key={index}
              >
                <span>{change.label}</span>
                <span className="bb-feedback__change-value">
                  {change.value}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      {action && <div className="bb-feedback__action">{action}</div>}
    </div>
  );
}

export function Toast({
  onDismiss,
  dismissLabel = "关闭通知",
  tone = "info",
  ...feedbackProps
}: ToastProps) {
  return (
    <Feedback
      {...feedbackProps}
      tone={tone}
      role={tone === "danger" ? "alert" : "status"}
      action={
        onDismiss ? (
          <Button
            variant="ghost"
            size="sm"
            icon={<XIcon size={16} weight="bold" aria-hidden="true" />}
            iconOnly
            aria-label={dismissLabel}
            onClick={onDismiss}
          />
        ) : undefined
      }
    />
  );
}

export interface ToastRegionProps {
  children: ReactNode;
  label?: string;
  className?: string;
}

export function ToastRegion({
  children,
  label = "通知",
  className
}: ToastRegionProps) {
  return (
    <div
      className={classNames("bb-toast-region", className)}
      role="region"
      aria-label={label}
      aria-live="polite"
    >
      {children}
    </div>
  );
}
