import type { HTMLAttributes, ReactNode } from "react";
import { classNames } from "./classNames";

export type PanelVariant = "raised" | "inset" | "flat";

export interface PanelProps
  extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  as?: "section" | "article" | "aside" | "div";
  title?: ReactNode;
  eyebrow?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  footer?: ReactNode;
  variant?: PanelVariant;
  accent?: boolean;
  bodyClassName?: string;
}

export function Panel({
  as: Component = "section",
  title,
  eyebrow,
  description,
  action,
  footer,
  variant = "raised",
  accent = false,
  className,
  bodyClassName,
  children,
  ...elementProps
}: PanelProps) {
  const hasHeader = title || eyebrow || description || action;

  return (
    <Component
      {...elementProps}
      className={classNames("bb-panel", className)}
      data-variant={variant}
      data-accent={accent}
    >
      {hasHeader && (
        <header className="bb-panel__header">
          <div className="bb-panel__heading">
            {eyebrow && <p className="bb-panel__eyebrow">{eyebrow}</p>}
            {title && <h2 className="bb-panel__title">{title}</h2>}
            {description && (
              <p className="bb-panel__description">{description}</p>
            )}
          </div>
          {action}
        </header>
      )}
      <div className={classNames("bb-panel__body", bodyClassName)}>
        {children}
      </div>
      {footer && <footer className="bb-panel__footer">{footer}</footer>}
    </Component>
  );
}
