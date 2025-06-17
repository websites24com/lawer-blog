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
  const defaultFallback =
    imageType === 'avatar'
      ? '/uploads/avatars/default.jpg'
      : '/uploads/posts/default.jpg';

  // ⛑ Initial fallback logic (safe default)
  const resolveSrc = (value: string | null | undefined) =>
    value && value.trim() !== '' ? value : undefined;

  // ✅ Hold current image source in state
  const [imgSrc, setImgSrc] = useState<string>(
    resolveSrc(src) ?? resolveSrc(fallbackSrc) ?? defaultFallback
  );

  // ✅ Re-check when props change (e.g. Google avatar comes in)
  useEffect(() => {
    const newResolved =
      resolveSrc(src) ?? resolveSrc(fallbackSrc) ?? defaultFallback;
    setImgSrc(newResolved);
  }, [src, fallbackSrc]);

  // ✅ Check if the image is local (/uploads/)
  const isLocal = imgSrc.startsWith('/uploads/');

  const effectiveWrapperClass =
    wrapperClassName || (imageType === 'avatar' ? 'image-wrapper-avatar' : 'image-wrapper');

  const effectiveImageClass =
    className || (imageType === 'avatar' ? 'fallback-image-avatar' : 'fallback-image');

  return (
    <div className={effectiveWrapperClass}>
      <Image
        src={imgSrc}
        alt={alt}
        fill
        unoptimized={isLocal}
        // ✅ Only fallback to default if Google avatar fails
        onError={() => {
          if (imgSrc !== defaultFallback) {
            setImgSrc(defaultFallback);
          }
        }}
        className={effectiveImageClass}
      />
    </div>
  );
}
