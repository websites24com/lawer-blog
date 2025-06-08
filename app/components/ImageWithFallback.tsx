'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';

type Props = {
  src: string | null;
  fallbackSrc?: string;
  imageType?: 'post' | 'avatar'; // Default: 'bike'
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
    imageType === 'avatar' ? '/uploads/avatars/default.jpg' : '/uploads/posts/default.jpg';

  const resolvedInitial = src && src.trim() !== '' ? src : fallbackSrc || defaultFallback;
  const [imgSrc, setImgSrc] = useState(resolvedInitial);

  useEffect(() => {
    setImgSrc(src && src.trim() !== '' ? src : fallbackSrc || defaultFallback);
  }, [src, fallbackSrc, defaultFallback]);

  // Apply your custom SCSS classes by default
  const effectiveWrapperClass =
    wrapperClassName || (imageType === 'avatar' ? 'image-wrapper-avatar' : 'image-wrapper');

  const effectiveImageClass =
    className || (imageType === 'avatar' ? 'fallback-image-avatar' : 'fallback-image');

  return (
    <div className={effectiveWrapperClass}>
      <Image
        src={imgSrc}
        alt={alt}
        onError={() => setImgSrc(fallbackSrc || defaultFallback)}
        className={effectiveImageClass}
        fill
      />
    </div>
  );
}
