import {
  useEffect,
  useState,
  type CSSProperties,
  type ImgHTMLAttributes,
  type ReactNode,
} from "react";
import type { ArtworkResource } from "../../data/artwork";
import { classNames } from "./classNames";

export interface ArtworkImageProps
  extends Omit<
    ImgHTMLAttributes<HTMLImageElement>,
    "src" | "srcSet" | "sizes" | "alt" | "width" | "height" | "children"
  > {
  artwork: ArtworkResource;
  className?: string;
  imageClassName?: string;
  decorative?: boolean;
  fallback?: ReactNode;
  eager?: boolean;
  sizes?: string;
}

export function ArtworkImage({
  artwork,
  className,
  imageClassName,
  decorative = false,
  fallback,
  eager = false,
  sizes,
  style,
  ...imageProps
}: ArtworkImageProps) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [artwork.src]);

  const imageStyle: CSSProperties = {
    objectPosition: artwork.focalPoint,
    ...style,
  };

  return (
    <span
      className={classNames("bb-artwork", className)}
      data-failed={imageFailed || undefined}
      role={decorative ? undefined : "img"}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : artwork.alt}
    >
      {!imageFailed ? (
        <img
          {...imageProps}
          className={classNames("bb-artwork__image", imageClassName)}
          src={artwork.src}
          srcSet={artwork.srcSet}
          sizes={sizes ?? artwork.sizes}
          alt=""
          width={artwork.width}
          height={artwork.height}
          loading={eager ? "eager" : "lazy"}
          fetchPriority={eager ? "high" : "auto"}
          decoding="async"
          style={imageStyle}
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span className="bb-artwork__fallback" aria-hidden="true">
          {fallback ?? (decorative ? null : "插图暂不可用")}
        </span>
      )}
    </span>
  );
}
