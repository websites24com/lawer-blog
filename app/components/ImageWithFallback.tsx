'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';

type Props = {
  src: string | null;
  fallbackSrc?: string;
  imageType?: 'post' | 'avatar';
  alt: string;
  className?: string;
  wrapperClassName?: string;
};

export default function ImageWithFallback({
  src,
  fallbackSrc,
  imageType = 'post',
  alt,
  className,
  wrapperClassName,
}: Props) {
  // Default fallback based on image type
  const defaultFallback =
    imageType === 'avatar'
      ? '/uploads/avatars/default.jpg'
      : '/uploads/posts/default.jpg';

  // Clean helper for checking null or blank
  const resolveSrc = (value: string | null | undefined) =>
    value && value.trim() !== '' ? value : undefined;

  // Initial resolved image source
  const [imgSrc, setImgSrc] = useState<string>(
    resolveSrc(src) ?? resolveSrc(fallbackSrc) ?? defaultFallback
  );

  // Update imgSrc if props change (important for session avatars)
  useEffect(() => {
    const newResolved =
      resolveSrc(src) ?? resolveSrc(fallbackSrc) ?? defaultFallback;
    setImgSrc(newResolved);
  }, [src, fallbackSrc]);

  // Wrapper and image classes
  const effectiveWrapperClass =
    wrapperClassName || (imageType === 'avatar' ? 'image-wrapper-avatar' : 'image-wrapper');

  const effectiveImageClass =
    className || (imageType === 'avatar' ? 'fallback-image-avatar' : 'fallback-image');

  // Final render
  return (
    <div className={effectiveWrapperClass}>
      <Image
        src={imgSrc}
        alt={alt}
        fill
        className={effectiveImageClass}
        onError={() => {
          if (imgSrc !== defaultFallback) {
            setImgSrc(defaultFallback);
          }
        }}
      />
    </div>
  );
}
