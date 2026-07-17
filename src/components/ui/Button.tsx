import {
  forwardRef,
  type ButtonHTMLAttributes,
  type ReactNode
} from "react";
import { CircleNotchIcon } from "@phosphor-icons/react";
import { classNames } from "./classNames";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  iconPosition?: "start" | "end";
  iconOnly?: boolean;
  fullWidth?: boolean;
  loading?: boolean;
  loadingLabel?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      children,
      className,
      variant = "secondary",
      size = "md",
      icon,
      iconPosition = "start",
      iconOnly = false,
      fullWidth = false,
      loading = false,
      loadingLabel = "处理中",
      disabled,
      type = "button",
      ...buttonProps
    },
    ref
  ) {
    const visualIcon = loading ? (
      <CircleNotchIcon
        className="bb-button__spinner"
        size={18}
        weight="bold"
        aria-hidden="true"
      />
    ) : (
      icon
    );

    return (
      <button
        {...buttonProps}
        ref={ref}
        type={type}
        className={classNames("bb-button", className)}
        data-variant={variant}
        data-size={size}
        data-full-width={fullWidth}
        data-icon-only={iconOnly}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
      >
        {iconPosition === "start" && visualIcon}
        {!iconOnly && (
          <span className="bb-button__label">
            {loading ? loadingLabel : children}
          </span>
        )}
        {iconPosition === "end" && visualIcon}
        {iconOnly && loading && (
          <span className="bb-sr-only">{loadingLabel}</span>
        )}
      </button>
    );
  }
);
