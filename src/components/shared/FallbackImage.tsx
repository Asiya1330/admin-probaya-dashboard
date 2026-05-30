"use client";

import Image, { type ImageProps } from "next/image";
import { useState, type JSX } from "react";

import { cn } from "@/lib/utils";

export const FALLBACK_IMAGE_SRC = "/dummy-image.jpg";

const isValidImageSrc = (src: string | null | undefined): src is string => {
  if (!src) {
    return false;
  }

  const trimmed = src.trim();
  if (!trimmed || trimmed === "null" || trimmed === "undefined") {
    return false;
  }

  return true;
};

type FallbackImageProps = Omit<ImageProps, "src" | "alt"> & {
  src: string | null | undefined;
  alt: string;
  fallbackSrc?: string;
};

type FallbackImageInnerProps = Omit<FallbackImageProps, "src" | "fallbackSrc"> & {
  primarySrc: string;
  startsWithFallback: boolean;
  fallbackSrc: string;
};

const FallbackImageInner = ({
  primarySrc,
  startsWithFallback,
  fallbackSrc,
  alt,
  className,
  onError,
  ...props
}: FallbackImageInnerProps): JSX.Element => {
  const [useFallback, setUseFallback] = useState(startsWithFallback);
  const displaySrc = useFallback ? fallbackSrc : primarySrc;

  const handleError = (
    event: React.SyntheticEvent<HTMLImageElement, Event>,
  ): void => {
    if (!useFallback) {
      setUseFallback(true);
    }
    onError?.(event);
  };

  return (
    <Image
      {...props}
      src={displaySrc}
      alt={alt}
      className={cn(className)}
      unoptimized={props.unoptimized ?? displaySrc === fallbackSrc}
      onError={handleError}
    />
  );
};

export const FallbackImage = ({
  src,
  alt,
  fallbackSrc = FALLBACK_IMAGE_SRC,
  ...props
}: FallbackImageProps): JSX.Element => {
  const primarySrc = isValidImageSrc(src) ? src : fallbackSrc;

  return (
    <FallbackImageInner
      key={primarySrc}
      primarySrc={primarySrc}
      startsWithFallback={!isValidImageSrc(src)}
      fallbackSrc={fallbackSrc}
      alt={alt}
      {...props}
    />
  );
};
