import type { CSSProperties, ReactNode } from "react";
import { classNames } from "./classNames";

export type AttributeTone =
  | "accent"
  | "positive"
  | "warning"
  | "danger"
  | "neutral";

export interface AttributeMeterProps {
  label: ReactNode;
  value: number;
  min?: number;
  max?: number;
  tone?: AttributeTone;
  size?: "compact" | "regular";
  description?: ReactNode;
  hideValue?: boolean;
  valueFormatter?: (value: number) => ReactNode;
  ariaValueText?: string;
  ariaLabel?: string;
  className?: string;
}

type MeterStyle = CSSProperties & {
  "--bb-meter-ratio": number;
};

export function AttributeMeter({
  label,
  value,
  min = 0,
  max = 100,
  tone = "accent",
  size = "regular",
  description,
  hideValue = false,
  valueFormatter = (currentValue) => Math.round(currentValue),
  ariaValueText,
  ariaLabel,
  className
}: AttributeMeterProps) {
  const safeMax = max > min ? max : min + 1;
  const clampedValue = Math.min(safeMax, Math.max(min, value));
  const ratio = (clampedValue - min) / (safeMax - min);
  const style: MeterStyle = { "--bb-meter-ratio": ratio };

  return (
    <div
      className={classNames("bb-attribute", className)}
      data-tone={tone}
      data-size={size}
    >
      <div className="bb-attribute__header">
        <span className="bb-attribute__label">{label}</span>
        {!hideValue && (
          <span className="bb-attribute__value">
            {valueFormatter(clampedValue)}
          </span>
        )}
      </div>
      <div
        className="bb-attribute__track"
        role="progressbar"
        aria-label={ariaLabel ?? (typeof label === "string" ? label : undefined)}
        aria-valuemin={min}
        aria-valuemax={safeMax}
        aria-valuenow={clampedValue}
        aria-valuetext={ariaValueText}
      >
        <span className="bb-attribute__fill" style={style} />
      </div>
      {description && (
        <p className="bb-attribute__description">{description}</p>
      )}
    </div>
  );
}
