import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import { classNames } from "./classNames";

export interface PortraitPlaceholderProps {
  name: string;
  src?: string;
  alt?: string;
  size?: "sm" | "md" | "lg" | "xl";
  statusTone?: "neutral" | "positive" | "warning" | "danger";
  statusLabel?: string;
  fallback?: {
    background: string;
    foreground: string;
    monogram?: string;
  };
  className?: string;
}

type PortraitStyle = CSSProperties & {
  "--bb-portrait-background"?: string;
  "--bb-portrait-foreground"?: string;
};

function initialsFromName(name: string): string {
  const cleanedName = name.trim();

  if (!cleanedName) {
    return "?";
  }

  const words = cleanedName.split(/\s+/);
  if (words.length > 1) {
    return words
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  }

  return Array.from(cleanedName).slice(0, 2).join("").toUpperCase();
}

export function PortraitPlaceholder({
  name,
  src,
  alt,
  size = "md",
  statusTone,
  statusLabel,
  fallback,
  className
}: PortraitPlaceholderProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const initials = useMemo(() => initialsFromName(name), [name]);

  useEffect(() => {
    setImageFailed(false);
  }, [src]);

  const hasImage = Boolean(src) && !imageFailed;
  const style: PortraitStyle | undefined = fallback
    ? {
        "--bb-portrait-background": fallback.background,
        "--bb-portrait-foreground": fallback.foreground,
      }
    : undefined;

  return (
    <span
      className={classNames("bb-portrait", className)}
      data-size={size}
      style={style}
      role="img"
      aria-label={alt ?? name}
    >
      {hasImage ? (
        <img
          className="bb-portrait__image"
          src={src}
          alt=""
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span className="bb-portrait__fallback" aria-hidden="true">
          {fallback?.monogram ?? initials}
        </span>
      )}
      {statusTone && (
        <span
          className="bb-portrait__marker"
          data-tone={statusTone}
          title={statusLabel}
          aria-label={statusLabel}
        />
      )}
    </span>
  );
}
